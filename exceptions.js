/*global window, console, document */
(function () {
    "use strict";
    
    var ArgumentException, InvalidOperationException, handler, exceptions, utilities;
    
    utilities = {
         /**
             * Add a script tag on the page to load a script.  Then execute the callback when the 
             * script has loaded
             * @method scriptTag
             * @param {string} url for the script
             * @param {function} callback to execute after the script loads
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
        functionName: function (fun) {
            var ret = fun.toString();
            ret = ret.substr('function '.length);
            ret = ret.substr(0, ret.indexOf('('));
            return ret;
        }
    };
    
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
        stacktrace: function (enable) {
            if (enable !== undefined) {
                this._stacktrace = Boolean(enable);
                return this;
            }
            return this._stacktrace;
        },
        screenshot: function (enable) {
            if (enable !== undefined) {
                this._screenshot = Boolean(enable);
                return this;
            }
            return this._screenshot;
        },
        post: function (enable) {
            if (enable !== undefined) {
                this._post = Boolean(enable);
                return this;
            }
            return this._post;
        },
        callback: function (enable) {
            if (enable !== undefined) {
                this._callback = Boolean(enable);
                return this;
            }
            return this._callback;
        },
        toggleAll: function (enable) {
            return this.stacktrace(enable)
                .screenshot(enable)
                .post(enable)
                .callback(enable);
        }
    };
    
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
                var except = new exception({ error: new Error(message || defaultMessage) });
                throw except;
            }
        };
    };
    
    createCustomException._createReportIf = function (exception) {
        var defaultMessage = utilities.functionName(exception);            
        return function reportIf(condition, message) {
            if (condition) {
                var except = new exception({ error: new Error(message || defaultMessage) });
                except.report();
            }
        };
    };
    
    createCustomException._createDefaultType = function (exception) {
        return function defaultType(type) {
            if(type) {
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
    
    function Exception(config) {
        if (!(this instanceof Exception)) {
            return new Exception(config);
        }
        var defaultOptions = this.constructor.defaultOptionsFunc()(new Options());
        this._type = config.type || this.constructor.defaultType();        
        this._error = config.error;
        this._stacktrace = null;
        this._innerException = config.innerException || null;
        this._data = config.data || {};
        this._options = config.options ? config.options(defaultOptions) : defaultOptions;
        this._guardedOptions = exceptions.handler.guard().restrict(this._options, this);
        
        this._listeners = [];
        
        if (this._guardedOptions.stacktrace()) {
            this._stacktrace = this._retrieveStacktrace();
        }
        if (this._guardedOptions.screenshot()) {
            this._takeScreenshot();
        }
    }
    //static functions
    createCustomException._mixStaticFunctions(Exception);
    
    Exception.shouldNeverGetHere = function () {
        throw new Exception({ error: new Error("Should never get here.") });
    };
    
    //member functions
    Exception.prototype = {
        innerException: function () {
            return this._innerException;
        },
        stacktrace: function () {
            return this._stacktrace;
        },
        data: function () {
            return this._data;
        },
        options: function () {
            return this._options;
        },
        type: function () {
            return this._type;
        },
        error: function () {
            return this._error;
        },
        report: function () {
            if (!this._screenshotComplete && this._guardedOptions.screenshot()) {
                this._listeners.push(this._report);
            }
            else {
                this._report();
            }
        },
        _report: function () {
            if(this._guardedOptions.post()) {
                this._post();
            }
            if(this._guardedOptions.callback()) {
                this._callback();
            }
            handler.pushReportedException(this);
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
                    try {
                        this.data().screenshot = canvas.toDataURL("image/png");
                    } catch (e) {
                        console.log("Error in exceptions.js:");
                        console.log(e);
                    }
                    finally {
                        this._screenshotComplete = true;
                    }
                    for (var i in this._listeners) {
                        this._listeners[i].call(self);
                    }
                };
                window.html2canvas(document.body, {
                    onrendered: function (canvas) {
                        callback.call(self, canvas);
                    }
                });
            }
        },
        _post: function () {
            var http = new window.XMLHttpRequest(), 
                postRequestHeaders = exceptions.handler.postRequestHeaders(),
                jsonString = this.toJSONString(),
                i;
            http.open("POST", exceptions.handler.postUrl(), true);
            if (postRequestHeaders) {
                for (i = 0; i < postRequestHeaders.length; i += 1) {
                    http.setRequestHeader(postRequestHeaders[i].bstrHeader, postRequestHeaders[i].bstrValue);
                }
            }
            //Send the proper header information along with the request
            http.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
            http.send("exception=" + encodeURIComponent(jsonString));
        },
        toSimpleObject: function () {
            var simpleObject = {
                innerException: this.innerException() ? this.innerException().toSimpleObject() : null,
                stacktrace: this.stacktrace(),
                data: this.data()
            };
            this._mergeErrorIntoSimpleObject(simpleObject);
            return simpleObject;
        },
        _callback: function () {
            var callback = exceptions.handler.callback();
            callback(this);
        },
        _mergeErrorIntoSimpleObject: function (simpleObject) {
            simpleObject.message = this._error.message;
        },
        toJSONString: function () {
            var simpleObject = this.toSimpleObject();
            return JSON.stringify(simpleObject);
        },
        constructor: Exception
    };
    
    //setup
    Exception.defaultType("Error");
    Exception.defaultOptionsFunc(function (o) {
        return o.toggleAll(true);
    });
    
    ArgumentException = createCustomException({ 
        exception: function ArgumentException(config) {
            if (!(this instanceof ArgumentException)) {
                return new ArgumentException(config);
            }
            Exception.call(this, config);
        },
        baseException: Exception, 
        defaultType: "ArgumentException"
    });
    
    InvalidOperationException = createCustomException({ 
        exception: function InvalidOperationException(config) {
            if (!(this instanceof InvalidOperationException)) {
                return new InvalidOperationException(config);
            }
            Exception.call(this, config);
        },
        baseException: Exception,
        defaultType: "Invalid Operation Exception"
    });
    InvalidOperationException.shouldNeverGetHere = function () {
        throw invalidOperationException(new Error("Should never get here."));
    };
    
    
    function Guard() {
        if (!(this instanceof Guard)) {
            return new Guard();
        }
        this._restrictions = [];
    }
    
    Guard.prototype = {
        _restrictByAvailableOptions: function (o, exception) {
            if(!exception.error().stack && !exceptions.handler.stacktraceUrl()){
                o.stacktrace(false);
            }
            if(!exceptions.handler.html2canvasUrl()){
                o.screenshot(false);
            }
            if(!exceptions.handler.postUrl()){
                o.post(false);
            }
            if(!exceptions.handler.callback()){
                o.callback(false);
            }
            return o;
        },
        restrictByExceptionsCount: function (count, seconds) {
            var restrictFunc = function (o) {
                var exceptionsCount = handler.retrieveExceptionsCount(seconds);
                if (exceptionsCount > count) {
                    o.toggleAll(false);
                }
                return o;
            };
            this._restrictions.push(restrictFunc);
            return this;
        },
        restrictBy: function (restrictFunc) {
            this._restrictions.push(restrictFunc);
            return this;
        },
        restrict: function (o, exception) {
            for(var i in this._restrictions) {
                this._restrictions[i](o, exception);
            }
            this._restrictByAvailableOptions(o, exception);
            return o;
        }
    };
    
    handler = {
        _guard: null,
        _postUrl: null,
        _postRequestHeaders: null,
        _html2canvasUrl: null,
        _stacktraceUrl: null,
        _callback: null,
        _onerror: null,
        _isSetup: false,
        _handleAllErrors: true,
        _handleExceptions: true,
        _reportedExceptions: [],
        _setup: function () {
            if(handler._isSetup) {
                return;
            }
            var previousOnError = window.onerror;
            window.onerror = function (errorMsg, url, lineNumber, columnNumber, errorObj) {
                if (typeof previousOnError === "function") {
                    previousOnError(errorMsg, url, lineNumber, columnNumber, errorObj);
                }
                if (handler.handleAllErrors()) {
                    handler._handle(errorMsg, url, lineNumber, columnNumber, errorObj);
                }
                else if (handler.handleExceptions() && errorObj instanceof Exception) {
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
                exception = new Exception({
                    error: errorObj,
                    options: function (o) {
                        return o.stacktrace(false);
                    }});
            }
            else {
                exception = new Exception({
                    error: new Error(errorMsg),
                    options: function (o) {
                        return o.stacktrace(false);
                    }});
            }
            data = exception.data();
            data.url = url;
            data.lineNumber = lineNumber;
            data.columnNumber = columnNumber;
            exception.report();
        },
        
        handleAllErrors: function (enable) {
            if (enable !== undefined) {
                handler._handleAllErrors = Boolean(enable);
                return handler;
            }
            return handler._handleAllErrors;
        },
        
        handleExceptions: function (enable) {
            if (enable !== undefined) {
                handler._handleExceptions = Boolean(enable);
                return handler;
            }
            return handler._handleExceptions;
        },
        
        loadStacktraceJs: function () {
            utilities.scriptTag(handler.stacktraceUrl(), function () {
                handler._attemptedToLoadStacktraceJs = true;
            });
        },
        
        loadHtml2Canvas: function (callback) {
            utilities.scriptTag(exceptions.handler.html2canvasUrl(), function () {
                handler._attemptedToLoadHtml2Canvas = true;
                callback();
            });
        },
        
        guard: function (guardFunc) {
            if (guardFunc) {
                handler._guard = guardFunc(new Guard());
                return this;
            }
            else {
                return handler._guard;
            }
        },
        
        postUrl: function (postUrl) {
            if(postUrl) {
                handler._postUrl = postUrl;
                return handler;
            }
            else {
                return handler._postUrl;
            }
        },
        
        postRequestHeaders: function (postRequestHeaders) {
            if(postRequestHeaders) {
                handler._postRequestHeaders = postRequestHeaders;
                return handler;
            }
            else {
                return handler._postRequestHeaders;
            }
        },
        
        html2canvasUrl: function (html2canvasUrl) {
            if(html2canvasUrl) {
                handler._html2canvasUrl = html2canvasUrl;
                return handler;
            }
            else {
                return handler._html2canvasUrl;
            }
        },
        
        stacktraceUrl: function (stacktraceUrl) {
            if(stacktraceUrl) {
                handler._stacktraceUrl = stacktraceUrl;
                return handler;
            }
            else {
                return handler._stacktraceUrl;
            }
        },
        
        callback: function (callback) {
            if(callback) {
                handler._callback = callback;
                return handler;
            }
            else {
                return handler._callback;
            }
        },
        
        onerror: function (onerror) {
            if(onerror) {
                handler._onerror = onerror;
                return handler;
            }
            else {
                return handler._onerror;
            }
        },
        
        reportedExceptions: function () {
            return handler._reportedExceptions;
        },
        
        pushReportedException: function (exception) {
            var reportedExceptions = handler.reportedExceptions();
            reportedExceptions.push({ exception: exception, timestamp: Date.now()});
        },
        
        /**
         * Helper function to get the count of errors within the past x number of seconds
         * @method countNumErrorsWith
         * @param {int} Number of seconds to look for errors in
         */
        retrieveExceptionsCount: function(seconds) {
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
        }
    };
        
    handler._setupDefaultGuard();
    handler._setup();
    
    exceptions = {
        Exception: Exception,
        ArgumentException: ArgumentException,
        InvalidOperationException: InvalidOperationException,
        handler: handler,
        createCustomException: createCustomException
    };
    
    window.exceptions = exceptions;
}());