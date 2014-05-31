/*global window, console, document */
(function () {
    "use strict";
    
    var ArgumentException, InvalidOperationException, NotImplementedException, handler, exceptions, utilities, _handlerScope;
    
    utilities = {
         /**
          * Add a script tag on the page to load a script.  Then execute the callback when the 
          * script has loaded.
          * @function scriptTag
          * @param {string} url for the script
          * @param {function} optional callback to execute after the script loads
          */
        scriptTag: function scriptTag(url, callback) {
            var s = document.createElement('script');
            s.type = 'text/javascript';
            s.src = url;
            s.async = false;

            s.onreadystatechange = s.onload = function () {
                try {
                    var state = s.readyState;
                    if (callback && !callback.done && (!state || /loaded|complete/.test(state))) {
                        callback.done = true;
                        callback();
                    }
                } catch (e) {
                    console.log("Error in exceptions.js!");
                    console.log(e);
                }
            };
            // use body if available. more safe in IE
            (document.body || document.head).appendChild(s);
        },
        /**
         * Get the name of a function
         * @function functionName
         * @param {function} function
         */
        functionName: function (fun) {
            var ret = fun.toString();
            ret = ret.substr('function '.length);
            ret = ret.substr(0, ret.indexOf('('));
            return ret;
        }
    };
    
    /**
     * Options for an exception.  Options include retrieving a stacktrace, printing a screenshot,
     * posting a serialized JSON representation of an exception to a specified url when the
     * exception is reported, and/or excecuting a callback that recieves the exception when
     * the exception is reported.
     * @constructor
     */
    function Options() {
        if (!(this instanceof Options)) {
            return new Options();
        }
        this._stacktrace = false;
        this._screenshot = false;
        this._post = false;
        this._callback = false;
    }
    
    Options.prototype = {
        /**
         * Get or set the retrieve stacktrace option.
         * @param {bool} return the current option if undefined.  Enable the stacktrace option
         *        if enable is true.  Disable the stacktrace option if enable is false.
         * @return Options object if enable is defined, value of the stacktrace option if 
         *         enable is not defined.
         */
        stacktrace: function (enable) {
            if (enable !== undefined) {
                this._stacktrace = Boolean(enable);
                return this;
            }
            return this._stacktrace;
        },
        /**
         * Get or set the take screenshot option.
         * @param {bool} return the current option if undefined.  Enable the screenshot option
         *        if enable is true.  Disable the screenshot option if enable is false.
         * @return Options object if enable is defined, value of the screenshot option if 
         *         enable is not defined.
         */
        screenshot: function (enable) {
            if (enable !== undefined) {
                this._screenshot = Boolean(enable);
                return this;
            }
            return this._screenshot;
        },
        /**
         * Get or set the retrieve stacktrace option.
         * @param {bool} return the current option if undefined.  Enable the stacktrace option
         *        if enable is true.  Disable the stacktrace option if enable is false.
         * @return Options object if enable is defined, value of the stacktrace option if 
         *         enable is not defined.
         */
        post: function (enable) {
            if (enable !== undefined) {
                this._post = Boolean(enable);
                return this;
            }
            return this._post;
        },
        /**
         * Get or set the execute handler callback option.
         * @param {bool} return the current option if undefined.  Enable the callback option
         *        if enable is true.  Disable the callback option if enable is false.
         * @return Options object if enable is defined, value of the callback option if 
         *         enable is not defined.
         */
        callback: function (enable) {
            if (enable !== undefined) {
                this._callback = Boolean(enable);
                return this;
            }
            return this._callback;
        },
        /**
         * Toggle all options according to the enable parameter
         * @param {bool} enable all options if true.  Disable all options if false.
         * @return Options object
         */
        toggleAll: function (enable) {
            return this.stacktrace(enable)
                .screenshot(enable)
                .post(enable)
                .callback(enable);
        }
    };
    
    /**
     * Create a custom exception
     * @param {object} config object for creating an exception
     *        exception - constructor for the custom exception
     *        baseException - exception that the custom exception inherits from
     *        defaultType - {string} default type of the exception
     *        defaultOptionsFunc - {function} function that receives an Options
     *            object as a parameter and returns that options object with
     *            the default options enabled or disabled.
     */
    function createCustomException(config) {
        createCustomException._mixStaticFunctions(config.exception);
        createCustomException._inherits(
            config.exception, 
            config.baseException);
        createCustomException._setupDefaults(
            config.exception,
            config.baseException,
            config.defaultType, 
            config.defaultOptionsFunc);
        return config.exception;
    }
    
    createCustomException._createThrowIf = function (exception) {
        var defaultMessage = utilities.functionName(exception);
        return function throwIf(condition, message) {
            if (condition) {
                var except = new exception(message || defaultMessage);
                throw except;
            }
        };
    };
    
    createCustomException._createReportIf = function (exception) {
        var defaultMessage = utilities.functionName(exception);            
        return function reportIf(condition, message) {
            if (condition) {
                var except = new exception(message || defaultMessage);
                except.report();
            }
        };
    };
    
    createCustomException._createDefaultType = function (exception) {
        return function defaultType(type) {
            if (type) {
                exception._defaultType = type;
                return exception;
            }
            return exception._defaultType;
        };
    };
    
    createCustomException._createDefaultOptions = function (exception) {
        return function defaultOptionsFunc(optionsFunc){
            if (optionsFunc) {
                exception._defaultOptionsFunc = optionsFunc;
                return exception;
            }
            return exception._defaultOptionsFunc;
        };
    };
    
    createCustomException._mixStaticFunctions = function (exception) {
        var creators = {
            throwIf: createCustomException._createThrowIf(exception),
            reportIf: createCustomException._createReportIf(exception),
            defaultType: createCustomException._createDefaultType(exception),
            defaultOptionsFunc: createCustomException._createDefaultOptions(exception)
        }, 
            staticFunction;
        for (staticFunction in creators) {
            if (!exception[staticFunction]) {
                exception[staticFunction] = creators[staticFunction];
            }
        }
    };
    
    createCustomException._inherits = function(sub, base) {
        sub.prototype = Object.create(base.prototype);
        sub.prototype.constructor = sub;
    };
    
    createCustomException._setupDefaults = function (sub, base, defaultType, defaultOptionsFunc) {
        sub.defaultType(defaultType || base.defaultType());
        sub.defaultOptionsFunc(defaultOptionsFunc || base.defaultOptionsFunc());
    };
    
    /**
     * Exception is the base Exception class that wraps an error and provides extra
     * functionality that the native Error class does not provide.  The Exception class
     * can be extended to create custom exceptions with the exceptions.createCustomException.
     * @Constructor
     * @param {string|Error} create an Exception with an Error object or error message.  This
     *        constructor will create a new Error(message) if you pass in a message or simply
     *        use the provided Error as the underlying Error it wraps.
     * @param {Object} optional config object
     *        type - {string} provide a type to override the default exception type.  Type is
     *               purely used for reporting purposes.  No functionality pivots off of type.
     *        innerException - {Exception} Exceptions are recursive, so you can create an inner
     *                         exception that is wrapped by the current exception.
     *        data - {object} - Provide any information you want to associate with this Exception.
     *               You'll notice a screenshot property is added to the data object when the screenshot
     *               option is enabled for this Exception.  Also, browser and browser version properties
     *               are added to the data object.
     *        optionsFunc - {function} - Provide a function that takes in an Options object and returns
     *                      that Options object with enabled or disabled options.  The received options
     *                      object will be Options object returned from the defaultOptionsFunc for the 
     *                      exception.  In most cases, the defaultOptionsFunc returns an Options object
     *                      with all options enabled.
     *        
     */
    function Exception(message, config) {
        try {
            if (!(this instanceof Exception)) {
                return new Exception(config);
            }
            var defaultOptions = this.constructor.defaultOptionsFunc()(new Options());
            
            this._error = (message instanceof Error) ? message : new Error(message);
            config = config || {};
            this._type = config.type || this.constructor.defaultType();        
            this._stacktrace = null;
            this._innerException = config.innerException || null;
            this._data = config.data || {};
            this._options = config.optionsFunc ? config.optionsFunc(defaultOptions) : defaultOptions;
            this._guardedOptions = exceptions.handler.guard()._restrict(this._options, this);
            
            this._listeners = [];
            
            if (this._guardedOptions.stacktrace()) {
                this._stacktrace = this._retrieveStacktrace();
            }
            if (this._guardedOptions.screenshot()) {
                this._takeScreenshot();
            }
        }
        catch (e) {
            this._screenshotComplete = true;
            console.log("Error in exceptions.js:");
            console.log(e);
        }
    }
    //static functions
    createCustomException._mixStaticFunctions(Exception);
    
    //member functions
    Exception.prototype = {
        /**
         * Get the inner Exception
         * @method
         */
        innerException: function () {
            return this._innerException;
        },
        /**
         * Get the stacktrace
         * @method
         */
        stacktrace: function () {
            return this._stacktrace;
        },
        /**
         * Get the data object
         * @method
         */
        data: function () {
            return this._data;
        },
        /**
         * Get the options
         * @method
         */
        options: function () {
            return this._options;
        },
        /**
         * Get the type
         * @method
         */
        type: function () {
            return this._type;
        },
        /**
         * Get the underlying Error
         * @method
         */
        error: function () {
            return this._error;
        },
        /**
         * Get the error message
         * @method
         */
        message: function () {
            return this.error().message;
        },
        /**
         * Report the exception (without throwing it).  Reporting an exception involves
         * making a post request with a serialized exception object if the post option is
         * enabled and/or executing a callback if the callback option is enabled.  The post
         * request uses the url returned from exception.handler.postUrl() and headers returned
         * from exception.handler.postHeaders().  It will not make a post request if no url
         * is specified.  The callback will execute the function returned from 
         * exceptions.handlers.callback and will not execute the callback if no function is 
         * specified.
         *
         *
         */
        report: function () {
            try {
                if (!this._screenshotComplete && this._guardedOptions.screenshot()) {
                    this._listeners.push(this._report);
                }
                else {
                    this._report();
                }
            }
            catch (e) {
                console.log("Error in exceptions.js:");
                console.log(e);
            }
        },
        /**
         * Convert an Exception into a simple object.  This is useful for serialization.
         * @return {object} - {
         *         type: type,
         *         message: message,
         *         stacktrace: stacktrace,
         *         data: data,
         *         innerException: inner exception,
         *         error: underlying error
         */
        toSimpleObject: function () {
            var simpleObject = {
                type: this.type(),
                message: this.message(),
                stacktrace: this.stacktrace(),
                data: this.data(),
                innerException: this.innerException() ? this.innerException().toSimpleObject() : null,
                error: this.error()
            };
            return simpleObject;
        },
        /**
         * Convert an simple exception object created from toSimpleObject into a JSON string.
         * @return {string} JSON string representation of the error.
        */
        toJSONString: function () {
            var simpleObject = this.toSimpleObject();
            return JSON.stringify(simpleObject);
        },        
        _report: function () {
            if (this._guardedOptions.post()) {
                this._post();
            }
            if (this._guardedOptions.callback()) {
                this._callback();
            }
            handler._pushReportedException(this);
            console.log("Exception reported:");
            console.log(this);
        },
        _retrieveStacktrace: function () {
            var stack = this.error().stack;
            if (stack) {
                return this.error().stack;
            }
            if (window.printStackTrace) {
                return window.printStackTrace().join("\n");
            }
            if (!handler._attemptedToLoadStacktraceJs) {
                handler.loadStacktraceJs();
            }
            return "Unable to retrieve stacktrace";
        },
        _takeScreenshot: function() {
            var callback, self = this;
            
            if (!window.html2canvas && !handler._attemptedToLoadHtml2Canvas) {
                handler.loadHtml2Canvas(function () {
                    self._takeScreenshot();
                });
            }
            else if (!window.html2canvas) {
                this._screenshotComplete = true;
            }
            else {
                callback = function (canvas) {
                    this.data().screenshot = canvas.toDataURL("image/png");
                    this._screenshotComplete = true;
                    for (var i in this._listeners) {
                        this._listeners[i].call(self);
                    }
                };
                window.html2canvas(document.body, {
                    onrendered: function (canvas) {
                        try {
                            callback.call(self, canvas);
                        } catch (e) {
                            this._screenshotComplete = true;                            
                            console.log("Error in exceptions.js:");
                            console.log(e);
                        }
                    }
                });
            }
        },
        _post: function () {
            var http = new window.XMLHttpRequest(), 
                postHeaders = exceptions.handler.postHeaders(),
                jsonString = this.toJSONString(),
                i;
            http.open("POST", exceptions.handler.postUrl(), true);
            if (postHeaders) {
                for (i = 0; i < postHeaders.length; i += 1) {
                    http.setRequestHeader(postHeaders[i].bstrHeader, postHeaders[i].bstrValue);
                }
            }
            //Send the proper header information along with the request
            http.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
            http.send("exception=" + encodeURIComponent(jsonString));
        },
        _callback: function () {
            var callback = exceptions.handler.callback();
            callback(this);
        },
        constructor: Exception
    };
    
    //setup
    Exception.defaultType("Exception");
    Exception.defaultOptionsFunc(function (o) {
        return o.toggleAll(true);
    });
    
    /**
     * ArgumentException is an exception that inherits from Exception with a default type: "ArgumentException."
     * Use ArgumentException to throw or report invalid arguments.
     * @constructor
     */
    ArgumentException = createCustomException({ 
        exception: function ArgumentException(message, config) {
            if (!(this instanceof ArgumentException)) {
                return new ArgumentException(message, config);
            }
            Exception.call(this, config);
        },
        baseException: Exception, 
        defaultType: "ArgumentException"
    });
    
    /**
     * InvalidOperationException is an exception that inherits from Exception with a default type: "InvalidOperationException."
     * Use InvalidOperationException to throw or report invalid operations.
     * @constructor
     */
    InvalidOperationException = createCustomException({ 
        exception: function InvalidOperationException(message, config) {
            if (!(this instanceof InvalidOperationException)) {
                return new InvalidOperationException(message, config);
            }
            Exception.call(this, config);
        },
        baseException: Exception,
        defaultType: "InvalidOperationException"
    });

    InvalidOperationException.shouldNeverGetHere = function () {
        throw new InvalidOperationException("Should never get here.");
    };
    
    /**
     * NotImplementedException is an exception that inherits from Exception with a default type: "NotImplementedException."
     * Use NotImplementedException to throw or report attemps of executed code that is not implemented.
     * @constructor
     */
    NotImplementedException = createCustomException({ 
        exception: function NotImplementedException(message, config) {
            if (!(this instanceof NotImplementedException)) {
                return new NotImplementedException(message, config);
            }
            Exception.call(this, config);
        },
        baseException: Exception,
        defaultType: "NotImplementedException"
    });

    NotImplementedException.shouldNeverGetHere = function () {
        throw new NotImplementedException("Should never get here.");
    };
    
    /**
     * Performing exception operations can be expensive or superfluous sometimes.  For example, you may not want to take
     * a screenshot of your page if you've hit 10 errors in a row because it could cause noticable performance errors.
     * Specify a guard with exceptions.handler.guard() to disable Exception options you do not wish to perform.
     */
    function Guard() {
        if (!(this instanceof Guard)) {
            return new Guard();
        }
        this._restrictions = [];
    }
    
    Guard.prototype = {
        _restrictByAvailableOptions: function (o, exception) {
            if (!exception.error().stack && !exceptions.handler.stacktraceUrl()){
                o.stacktrace(false);
            }
            if (!exceptions.handler.html2canvasUrl()){
                o.screenshot(false);
            }
            if (!exceptions.handler.postUrl()){
                o.post(false);
            }
            if (!exceptions.handler.callback()){
                o.callback(false);
            }
            return o;
        },
        /**
         * Disable Exception options if the exception reported count threshold has been exceeded.  
         * See handler.reportedExceptions for more information about how we defined a reported exception. 
         * @param {int} - Threshold that must not be exceed lest you'll disable Exception options.
         * @param {int} - Last number of seconds for which we care to count exceptions.  If not
         *        specified, we'll use the total number of exceptions reported since the exception
         *        handler was setup.
         * @param {function} - function that enables/disables and returns the options if the 
         *        exception threshold has been exceeded.  If not specified, we'll disable all
         *        options for the Exception.  You'll likely only want to disable options in this
         *        function
         */
        restrictByExceptionsCount: function (count, seconds, optionsFunc) {
            var restrictFunc = function (o) {
                var exceptionsCount = handler.retrieveReportedExceptionsCount(seconds);
                if (exceptionsCount > count) {
                    o = optionsFunc ? optionsFunc(o) : function (o) { return o.toggleAll(false); };
                }
                return o;
            };
            this._restrictions.push(restrictFunc);
            return this;
        },
        /**
         * Disable Exception options with a specified restriction function.  Note: see
         * window.handler.retrieveReportedExceptionsCount and window.handler.reportedExceptions 
         * for a convient utilities.
         * @param {function} Function that disables Exception options and returns the options object.
         *        The function will receive two parameters: the current options for the Exception and
         *        the Exception itself.  It should return the provided 
         */
        restrictBy: function (restrictFunc) {
            this._restrictions.push(restrictFunc);
            return this;
        },
        _restrict: function (o, exception) {
            for(var i in this._restrictions) {
                this._restrictions[i](o, exception);
            }
            this._restrictByAvailableOptions(o, exception);
            return o;
        }
    };
    
    _handlerScope = {
        none: 0,
        exceptions: 1,
        all: 2
    };
    
    /**
     * Handler as exposed by exceptions.handler.  The handler is responsible for handling errors thrown that
     * hit window.onerror and specifying global configurations including the stacktrace.js url, html2canvas.js url,
     * post url (to make a post request when an error is reported), post headers, callback (function executed when
     * an error is reported).
     */
    handler = {
        _guard: null,
        _postUrl: null,
        _postHeaders: null,
        _html2canvasUrl: null,
        _stacktraceUrl: null,
        _callback: null,
        _isSetup: false,
        _scope: _handlerScope.all,
        _reportedExceptions: [],
        
        /**
         * Scope options for the handler.  Options are none, exceptions, and all.  Setting the scope to none signals that the handler
         * won't handle anything in window.onerror.  Setting the scope to exceptions signals that the handler
         * will handle only thrown Exceptions, nothing else that is thrown.  Setting the scope to all signals that
         * the handler will handle everything in window.onerror.
         */
        scopeObject: _handlerScope,
        
        /**
         * Get or set the scope of the handler when executed in window.onerror.  Scope refers to handler.scopeObject
         * which has three options: none, exceptions, and all.  Setting the scope to none signals that the handler
         * won't handle anything in window.onerror.  Setting the scope to exceptions signals that the handler
         * will handle only thrown Exceptions, nothing else that is thrown.  Setting the scope to all signals that
         * the handler will handle everything in window.onerror.
         * @param {int} Set the handler scope if specified.  Use window.handler.scopeObject.
         * @return The handler if scope is defined, value of the handler scope is not defined.
         */
        scope: function (scope) {
            if (scope !== undefined) {
                handler._scope = scope;
                return handler;
            }
            return handler._scope;
        },
        
        /**
         * Get or set a guard that will be used to restrict Exception options.
         * @param {function} Function that receives one parameter: Guard and should return
         *        the received Guard.
         * @return The handler if guardFunc is defined.  Handler's guard if guardFunc is not defined.
         */
        guard: function (guardFunc) {
            if (guardFunc) {
                handler._guard = guardFunc(new Guard());
                return this;
            }
            else {
                return handler._guard;
            }
        },

        /**
         * Get or set url that pulls html2canvas.js.
         * @param {string} url to html2canvas.js
         * @return Handler if html2canvasUrl is defined.  Url to html2canvas.js if the html2canvasUrl is not defined.
         */
        html2canvasUrl: function (html2canvasUrl) {
            if (html2canvasUrl) {
                handler._html2canvasUrl = html2canvasUrl;
                return handler;
            }
            else {
                return handler._html2canvasUrl;
            }
        },
        
        /**
         * Get or set url that pulls stacktrace.js.
         * @param {string} url to stacktrace.js
         * @return Handler if stacktraceUrl is defined.  Url to stacktrace.js if stacktraceUrl is not defined.
         */
        stacktraceUrl: function (stacktraceUrl) {
            if (stacktraceUrl) {
                handler._stacktraceUrl = stacktraceUrl;
                return handler;
            }
            else {
                return handler._stacktraceUrl;
            }
        },
        
        /**
         * Get or set url used to post the serialized exception when reported.
         * @param {string} post request url
         * @return Handler if postUrl is defined.  Url for post request if postUrl is not defined.
         */
        postUrl: function (postUrl) {
            if (postUrl) {
                handler._postUrl = postUrl;
                return handler;
            }
            else {
                return handler._postUrl;
            }
        },
        
        /**
         * Get or set HTTP headers used to post the serialized exception when reported.
         * @param {array} Array of objects with the form { bstrHeader: "header", bstrValue: "value" }
         * @return Handler if postHeaders is defined.  Post headers for post request if postHeaders is not defined.
         */
        postHeaders: function (postHeaders) {
            if (postHeaders) {
                handler._postHeaders = postHeaders;
                return handler;
            }
            else {
                return handler._postHeaders;
            }
        },
        
        /**
         * Get or set callback that will be executed when an Exception is reported.
         * @param {function} callback that will be executed when the Exception is reported.
         * @return Handler if callback is defined.  Callback if callback is not defined.
         */
        callback: function (callback) {
            if (callback) {
                handler._callback = callback;
                return handler;
            }
            else {
                return handler._callback;
            }
        },

        /**
         * Asynchronously load stacktrace.js
         */
        loadStacktraceJs: function () {
            utilities.scriptTag(handler.stacktraceUrl(), function () {
                handler._attemptedToLoadStacktraceJs = true;    
            });
        },
        
        /**
         * Asynchronously load html2cavas.js and execute the callback when the script is loaded.
         */
        loadHtml2Canvas: function (callback) {
            utilities.scriptTag(exceptions.handler.html2canvasUrl(), function () {
                handler._attemptedToLoadHtml2Canvas = true;
                callback();
            });
        },

        /**
         * Get all reported exceptions.  This includes all exeptions reported with report() and all
         * errors handled by exeptions.handler in window.onerror.
         */
        reportedExceptions: function () {
            return handler._reportedExceptions;
        },
                
        /**
         * Helper function to get the count of reported exceptions (see handler.reportedExceptions) within
         * the past x number of seconds.
         * @method countNumErrorsWith
         * @param {int} - Last number of seconds for which we care to count exceptions.  If not
         *        specified, we'll use the total number of exceptions reported since the exception
         *        handler was setup.
         */
        retrieveReportedExceptionsCount: function(seconds) {
            var i, 
            now = Date.now(), 
            threshold,
            reportedExceptions = handler.reportedExceptions();
            
            if (seconds === undefined) {
                return reportedExceptions.length;
            }
            
            threshold = now - (seconds * 1000); 
            
            for (i = reportedExceptions.length - 1; i >= 0; i -= 1) {
                if (reportedExceptions[i].timestamp > threshold) {
                    break;
                }
            }
            return i + 1;
        },

        _setup: function () {
            if (handler._isSetup) {
                return;
            }
            var previousOnError = window.onerror;
            window.onerror = function (errorMsg, url, lineNumber, columnNumber, errorObj) {
                if (typeof previousOnError === "function") {
                    previousOnError(errorMsg, url, lineNumber, columnNumber, errorObj);
                }
                if (handler.scope() === handler.scopeObject.all) {
                    handler._handle(errorMsg, url, lineNumber, columnNumber, errorObj);
                }
                else if (handler.scope() === handler.scopeObject.exceptions && errorObj instanceof Exception) {
                    handler._handle(errorMsg, url, lineNumber, columnNumber, errorObj);
                }
            };
            handler._isSetup = true;
        },
        
        _setupDefaultGuard: function () {
            handler.guard(function (g) {
                return g.restrictByExceptionsCount(10, 10);
            });
        },
        
        _handle: function (errorMsg, url, lineNumber, columnNumber, errorObj) {
            var data, exception;
            if (errorObj instanceof Exception) {
                exception = errorObj;
            }
            else if (errorObj instanceof Error) {
                exception = new Exception(errorObj, {
                    options: function (o) {
                        return o.stacktrace(false);
                    }});
            }
            else if (errorObj !== undefined) {
                exception = new Exception(errorMsg, {
                    data: {
                        thrownError: errorObj
                    },
                    options: function (o) {
                        return o.stacktrace(false);
                    }});
            }
            else {
                exception = new Exception(errorMsg, {
                    options: function (o) {
                        return o.stacktrace(false);
                    }});
            }
            data = exception.data();
            data.url = data.url || url;
            data.lineNumber = data.lineNumber || lineNumber;
            data.columnNumber = data.columnNumber || columnNumber;
            exception.report();
        },

        _pushReportedException: function (exception) {
            var reportedExceptions = handler.reportedExceptions();
            reportedExceptions.push({ exception: exception, timestamp: Date.now()});
        },
    };
        
    handler._setupDefaultGuard();
    handler._setup();
    
    exceptions = {
        Exception: Exception,
        ArgumentException: ArgumentException,
        InvalidOperationException: InvalidOperationException,
        NotImplementedException: NotImplementedException,
        handler: handler,
        createCustomException: createCustomException
    };
    
    window.exceptions = exceptions;
}());
