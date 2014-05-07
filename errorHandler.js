/*global window, console, document */
/*jslint todo: true */
(function () {
    "use strict";
    if (window.errorHandler) {
        console.log("You have loaded errorHandler.js more than once!  Only load it once for performance gains..");
    }
    //internal variables

        //guard function that prevents either stack traces, screenshots, and/or submissions to server
    var guard,
        //base url to submit the error to
        submitErrorUrl,
        //array of request headers to go along with the error submission
        submitErrorRequestHeaders,
        //url to load html2canvas.js
        html2canvasUrl,
        //url to load stacktrace.js
        stacktraceUrl,
        //whether or not the error handler will execute at window.onerror.  You can configure
        //the error handler to only handle errors when you explicitly call window.errorHandler.report()
        setupWindowOnError,
        //whether or not the error handler tool is setup.
        isSetup,
        //whether or not the error handler has been setup for window.onerror
        windowOnErrorIsSetup,
        //array of previously encountered errors
        encounteredErrors = [];

    /**
     * Helper function that determines whether or not the specified value is 
     * actually a value by checking if that it's not undefined nor null
     * @param {object} value to check
     * @returns Whether or not the value is actually a value
     */
    function isValue(value) {
        return value !== "undefined" && value !== null;
    }

    /**
     * Use stacktrace.js to get the stack trace for an error object.
     * @method getStackTrace
     * @param {object} error object that does not contain a stack property
     * @return {object} error object with a stack property that is a string
     *            representation of what printStackTrace() returned.
     */
    function getStackTrace(errorObj) {
        var stackTrace = window.printStackTrace();
        errorObj.stack = stackTrace.join("\n");
        return errorObj;
    }

    /**
     * Leverage html2canvas to take a screenshot of the page
     * @method takeScreenshot
     * @param {object} error object without a screenshot property
     * @param {function} callback to be executed.  It will receive an
     *           error object with a screenshot property if the screenshot 
     *           succeeded and an error object with out a screenshot property
     *           if the screenshot failed.
     */
    function takeScreenshot(errorObj, callback) {
        window.html2canvas(document.body, {
            onrendered: function (canvas) {
                try {
                    errorObj.screenshot = canvas.toDataURL("image/png");
                    callback(errorObj);
                } catch (e) {
                    console.log("Error in error handler!");
                    console.log(e);
                    callback(errorObj);
                }
            }
        });
    }

    /**
     * Serialize an error object to a query string.
     * @method serializeToQueryString
     */
    function serializeToQueryString(errorObj) {
        var str = [],
            //We know an error object typically has many of the following properties so we explicitly
            //check for them.  Truthfully, we're only doing this because I noticed that sometimes 
            //for (p in errorObj) didn't pick up on the stack property.  I guess google chrome 
            //treats the stack property a bit differently than most properties.
            knownProperties = ["stack"],
            i,
            p;

        //Append non known properties.
        for (p in errorObj) {
            if (errorObj.hasOwnProperty(p) && knownProperties.indexOf(p) === -1) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(errorObj[p]));
            }
        }

        //Append known properties
        for (i = 0; i < knownProperties.length; i += 1) {
            p = knownProperties[i];
            if (isValue(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(errorObj[p]));
            }
        }
        return str.join("&");
    }

    /**
     * Submit the error object to the server.  It uses the url and headers provided
     * when the error handler was configured.
     * @method submiterror
     * @param {object} error object to submit.
     */
    function submitError(errorObj) {
        var http = new window.XMLHttpRequest(), i;
        if (!submitErrorUrl) {
            console.log(errorObj);
        }
        http.open("POST", submitErrorUrl, true);
        if (submitErrorRequestHeaders) {
            for (i = 0; i < submitErrorRequestHeaders.length; i += 1) {
                http.setRequestHeader(submitErrorRequestHeaders[i].bstrHeader, submitErrorRequestHeaders[i].bstrValue);
            }
        }
        //Send the proper header information along with the request
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
        http.send(serializeToQueryString(errorObj));
    }

    /**
     * Add a script tag on the page to load a script.  Then execute the callback when the 
     * script has loaded
     * @method scriptTag
     * @param {string} url for the script
     * @param {function} callback to execute after the script loads
     */
    function scriptTag(url, callback) {
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = url;
        s.async = false;

        s.onreadystatechange = s.onload = function () {
            try {
                var state = s.readyState;
                if (!callback.done && (!state || /loaded|complete/.test(state))) {
                    callback.done = true;
                    callback();
                }
            } catch (e) {
                console.log("Error in error handler!");
                console.log(e);
            }
        };
        // use body if available. more safe in IE
        (document.body || document.head).appendChild(s);
    }

    /**
     * Construct an error object so from the provided information.  It's nice to construct
     * an error object so we can handle the data in a standard form.
     * @method constructErrorObject
     * @param {string} error message
     * @param {string} url of current page
     * @param {int} line number of error
     * @param {int} column number of error
     * @param {object} error object to be merged if you already have an error object
     */
    function constructErrorObject(errorMsg, url, lineNumber, columnNumber, errorObj) {
        var errObj = { };
        //Boolean, Number, and String objects are converted to the 
        //corresponding primitive values during stringification, 
        //in accord with the traditional conversion semantics.            
        if (["number", "string", "boolean"].indexOf(typeof errorObj) !== -1) {
            errorMsg = errorObj;
        } else {
            errObj = errorObj;
            errorMsg = errorObj.message || errorMsg;
            url = errObj.url || url;
            lineNumber = errObj.lineNumber || lineNumber;
            columnNumber = errObj.columnNumber || columnNumber;
        }
        if (isValue(errorMsg)) {
            errObj.message = errorMsg;
        }
        if (isValue(url)) {
            errObj.url = url;
        }
        if (isValue(lineNumber)) {
            errObj.lineNumber = lineNumber;
        }
        if (isValue(columnNumber)) {
            errObj.columnNumber = columnNumber;
        }
        return errObj;
    }

    /**
     * Push error handler message to the error object.
     * @method pushErrorHandlerMessage
     * @param {object} error object
     * @param {string} message to append to the error handler messages
     */
    function pushErrorHandlerMessage(errorObj, message) {
        if (!errorObj.errorHandlerMessages) {
            errorObj.errorHandlerMessages = [];
        }
        errorObj.errorHandlerMessages.push(message);
    }

    /**
     * Validate the guard so we don't have any invalid states. This is a conservative approach that 
     * may skip retrieving a stack trace, taking a screenshot, or sending the error to the server
     * if the appropriate urls haven't been provided for stacktrace.js, html2canvas.js, or error 
     * submissions.  Also, we may skip tasks depending on whether or not the error is being reported
     * via errorHandler.report() or being handled in window.onerror.
     * @method validateGuard
     * @param {object} guard object to validate
     * @param {bool} Whether or not this error is reported via errorHandler.report()
     * @param {object} error object
     */
    function validateGuard(guardObj, isReport, errorObj) {
        var validGuardObj = {
            retrieveStackTrace: guardObj.retrieveStacktrace,
            takeScreenshot: guardObj.takeScreenshot,
            submitError: guardObj.submitError
        };
        //validate retrieveStackTrace
        if (guardObj.retrieveStacktrace && !stacktraceUrl) {
            validGuardObj.retrieveStacktrace = false;
            pushErrorHandlerMessage(errorObj, "Could not retrieve stack trace because you did not provide a url to retrieve stacktrace.js");
        } else if (guardObj.retrieveStacktrace && !isReport) {
            validGuardObj.retrieveStacktrace = false;
            pushErrorHandlerMessage(errorObj, "Could not retrieve stack trace because this error is handled with window.onerror which can't produce a good stack trace.");
        } else if (guardObj.retrieveStacktrace && !window.printStackTrace) {
            validGuardObj.retrieveStacktrace = false;
            pushErrorHandlerMessage(errorObj, "Could not retrieve stack trace because stacktrace.js was not loaded before we hit the error.");
        }

        //validate submitError
        if (guardObj.submitError && !submitErrorUrl) {
            validGuardObj.submitError = false;
            pushErrorHandlerMessage(errorObj, "Could not submit the error to a server because you did not provide a url to submit the error to.");
        }

        //validate takeScreenshot
        if (guardObj.takeScreenshot && !html2canvasUrl) {
            validGuardObj.takeScreenshot = false;
            pushErrorHandlerMessage(errorObj, "Could not take a screenshot because you did not provide a url to retireve html2canvas.js");
        } else if (guardObj.takeScreenshot && !validGuardObj.submitError) {
            validGuardObj.takeScreenshot = false;
            pushErrorHandlerMessage(errorObj, "We do not take a screenshot if you're not going to submit the error to a server.");
        }
        return validGuardObj;
    }

    /**
     * Helper function to get the count of errors within the past x number of seconds
     * @method countNumErrorsWith
     * @param {int} Number of seconds to look for errors in
     */
    function countNumErrorsWithin(seconds) {
        var i, now = Date.now(), threshold = now - (seconds * 1000);
        for (i = encounteredErrors.length - 1; i >= 0; i -= 1) {
            if (encounteredErrors[i].timestamp > threshold) {
                break;
            }
        }
        return i + 1;
    }

    /**
     * Create a default guard object.  It will try to retieve a stacktrace, take a screenshot
     * and submit the error unless we've encountered more than 5 errors in the last second or
     * if we've encountered more than 20 errors total.
     * @method defaultGuard
     */
    function defaultGuard(errorObj) {
        var recentErrorCountThreshold = 5,
            seconds = 1,
            recentErrorsCount = countNumErrorsWithin(seconds);
        if (recentErrorsCount > recentErrorCountThreshold || encounteredErrors.length > 20) {
            return {
                retrieveStacktrace: false,
                takeScreenshot: false,
                submitError: false
            };
        }
        return {
            //we don't need to retrieve the stack trace if we already have one
            retrieveStacktrace: !!(errorObj.stack),
            takeScreenshot: true,
            submitError: true
        };
    }

    /**
     * Handle an error given standard inputs of the error object and guard object
     * @method handleErrorInternal
     * @param {object} error object containing standard + additional information 
     *           about the error
     * @param {object} guard object
     */
    function handleErrorInternal(errorObj, guardObj) {
        try {
            if (guardObj.retrieveStacktrace && !window.printStackTrace) {
                //retrieve the stacktrace.js script before handling the error.

                //TODO Fix bug where we don't get the stack trace we want when
                //the stacktrace.js script was not preloaded.  We don't get the
                //stack trace we want because the trace starts at the callback
                //that is executed when after the script loads.
                scriptTag(stacktraceUrl, function () {
                    handleErrorInternal(errorObj, guardObj);
                });
                return;
            }
            if (guardObj.takeScreenshot && !window.html2canvas) {
                //retrieve the html2canvas.js script before handling the error.                
                scriptTag(html2canvasUrl, function () {
                    handleErrorInternal(errorObj, guardObj);
                });
                return;
            }
            if (guardObj.retrieveStacktrace) {
                errorObj = getStackTrace(errorObj);
            }
            if (guardObj.takeScreenshot) {
                //we submit the error after we've taken the screenshot by
                //submitting the error in the callback.
                takeScreenshot(errorObj, function (errorObj) {
                    if (guardObj.submitError) {
                        submitError(errorObj);
                    }
                    //log the error to the console at the end of the handling
                    console.log(errorObj);
                });
            //we can just call submit error if we're not taking a screenshot
            } else {
                if (guardObj.submitError) {
                    submitError(errorObj);
                }
                //log the error to the console at the end of the handling
                console.log(errorObj);
            }
        } catch (e) {
            console.log("Error in error handler!");
            console.log(e);
        }
    }

    /**
     * Main entry point for handling an error.  First construct an error object and guard object.
     * Then append the error to encountered errors and handle the error.
     * @method handleError
     * @param {string} error message
     * @param {string} url to page the error was hit on
     * @param {int} line number the error was hit on
     * @param {int} column number the error was hit on
     * @param {object} objec that contains information about the error
     * @param {bool} whether or not the error was created via errorHandler.report()
     */
    function handleError(errorMsg, url, lineNumber, columnNumber, errorObj, isReport) {
        try {
            var errObj = constructErrorObject(errorMsg, url, lineNumber, columnNumber, errorObj),
                guardObj = guard(errObj, encounteredErrors, isReport),
                validatedGuardObj = validateGuard(guardObj, isReport, errObj);
            encounteredErrors.push({ timestamp: Date.now(), error: errObj });
            handleErrorInternal(errObj, validatedGuardObj);
        } catch (e) {
            console.log("Error in error handler!");
            console.log(e);
        }
    }

    /**
     * Configure the window.onerror function
     * @method configureOnError
     */
    function configureOnError() {
        var previousOnError = window.onerror;
        window.onerror = function (errorMsg, url, lineNumber, columnNumber, errorObj) {
            if (typeof previousOnError === "function") {
                previousOnError(errorMsg, url, lineNumber, columnNumber, errorObj);
            }
            if (setupWindowOnError) {
                handleError(errorMsg, url, lineNumber, columnNumber, errorObj, /*isReport*/false);
            }
        };
        windowOnErrorIsSetup = true;
    }

    /**
     * Report an error.
     * @param {object} Error object with properties that contain information about the error.
     *           In general we expect to a subset of the following properties: message, url, lineNumber, 
     *        columnNumber, stack.  But you can place whatever properties you want on the 
     *        error object.
     */
    function report(errorObj) {
        if (!isSetup) {
            throw new Error("Error handling not set up!  Please use window.errorHandler.configure to configure your error handler before you report errors.");
        }
        //First argument is errorMsg.  (JSLint doesn't like it when you have a comment
        //between the method call opening parenthesis and the first argument :(
        handleError(null, /*url*/window.location.href, /*lineNumber*/null, /*columnNumber*/null, errorObj, /*isReport*/true);
    }

    /**
     * Configure the error handler.  This includes setting up the internal properties (e.g. guard, submitErrorUrl,
     * html2canvasUrl, etc.) and setting up window.onerror.
     * @param {object} Configuration object for the error handler.  The configuration object is expected to have 
     *           the following properties:
     *           submitErrorUrl: Optionally a url where you want to submit the error to a server.  If you provide a submitErrorUrl
     *                           and your guard specifies that the error should be submitted, then the error handler will submit
     *                           a post request which can contain query string parameters message, url, lineNumber, 
     *                          columnNumber, stack, screenshot + other custom properties you add to an error object when using
     *                          errorHandler.report()
     *        submitErrorRequestHeaders: Extra request headers to send along with your error submissions
     *        html2canvasUrl: Optionally a url to retrieve the html2canvas.js script if you want to take screenshots
     *        stacktraceurl: Optionally a url to retrieve the stacktrace.js script if you want to gather stack traces
     *        setupWindowOnError: Whether or not you want to setup window on error.  Alternatively, you can just manuall
     *                              call errorHandler.report
     *        guard: Function which that takes in the current error object, an array of previously encountered errors, and whether or 
     *                 not the error was generated by calling errorHandler.report().  Given this information, the guard function returns
     *                 an object which specifies whether or not we should get a stack trace using stacktrace.js, take a screenshot using
     *                 html2canvas.js, and/or submit an error to the server.  The object returned should have the following structure:
     *                 { retrieveStacktrace: false, takeScreenshot: false, submitError: false }.  Note: taking a screenshot can be particuraly
     *                 computationally intensive.  If you do not specify a guard function, we'll use a default will try to retieve a stacktrace, 
     *                 take a screenshot and submit the error unless we've encountered more than 5 errors in the last second or if we've 
     *                 encountered more than 20 errors total.  We'll try to do none of the mentioned actions if any either of the two 
     *                 conditions is hit.
     */
    function configure(config) {
        if (!config.submitErrorUrl) {
            console.log("Please provide a error handler url if you want to send errors to your server.");
        }
        if (!config.html2canvasUrl) {
            console.log("Please provide a url to html2canvas if your want to include a screenshot of the page when your report or handle thrown errors.");
        }
        if (!config.stacktraceUrl) {
            console.log("Please provide a url to stacktrace.js if you want to include a stack trace when your report errors in all browsers.");
        }

        guard = config.guard || defaultGuard;
        submitErrorUrl = config.submitErrorUrl;
        submitErrorRequestHeaders = config.submitErrorRequestHeaders;
        html2canvasUrl = config.html2canvasUrl;
        stacktraceUrl = config.stacktraceUrl;
        setupWindowOnError = config.setupWindowOnError;
        isSetup = true;

        if (!windowOnErrorIsSetup && setupWindowOnError) {
            configureOnError();
        }
    }

    //publicly exposed object
    window.errorHandler = {
        configure: configure,
        report: report
    };
}());