/*global window, console, document */
(function () {
    "use strict";
    
    var ArgumentException, 
        InvalidOperationException, 
        NotImplementedException,
        EvalException,
        RangeException,
        ReferenceException,
        SyntaxException,
        TypeException,
        URIException,
        handler, 
        exceptions, 
        utilities, 
        _scopeOption;

    //polyfill for Object.create so we can support inheritance in ie8
    if (typeof Object.create != 'function') {
        (function () {
            var F = function () { };
            Object.create = function (o) {
                if (arguments.length > 1) {
                    throw Error('Second argument not supported');
                }
                if (o === null) {
                    throw Error('Cannot set a null [[Prototype]]');
                }
                if (typeof o != 'object') {
                    throw TypeError('Argument must be an object');
                }
                F.prototype = o;
                return new F();
            };
        })();
    }
    
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
        getBrowser: function() {
            var ua= navigator.userAgent, 
                tem, 
                M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
            if (/trident/i.test(M[1])){
                tem =  /\brv[ :]+(\d+)/g.exec(ua) || [];
                return 'IE '+ (tem[1] || '');
            }
            if (M[1] === 'Chrome'){
                tem = ua.match(/\bOPR\/(\d+)/);
                if (tem !== null) {
                    return 'Opera ' + tem[1];
                }
            }
            M = M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
            if ((tem = ua.match(/version\/(\d+)/i)) !== null) M.splice(1, 1, tem[1]);
            return M.join(' ');
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
     * exception is reported, posting a request to the exceptionsjs platform, and/or excecuting 
     * a reportCallback that receives the exception when the exception is reported.
     * @constructor
     */
    function Options(config) {
        if (!(this instanceof Options)) {
            return new Options();
        }
        this._stacktrace = config && config.stacktrace !== undefined ? config.stacktrace : true;
        this._screenshot = config && config.screenshot !== undefined ? config.screenshot : true;
        this._reportPost = config && config.reportPost !== undefined ? config.reportPost : true;
        this._reportCallback = config && config.reportCallback !== undefined ? config.reportCallback : true;
        this._reportToExceptionsJsPlatform = config && config.reportToExceptionsJsPlatform !== undefined ? config.reportToExceptionsJsPlatform : true;
        this._DOMDump = config && config.DOMDump !== undefined ? config.DOMDump : true;
    }
    
    Options.prototype = {
        /**
         * Get or set the retrieve stacktrace option.
         * @param {bool} Return the current option if undefined.  Enable the stacktrace option
         *        if enable is true.  Disable the stacktrace option if enable is false.
         * @return {Options|bool} Options object if enable is defined, value of the stacktrace option if 
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
         * @param {bool} Return the current option if undefined.  Enable the screenshot option
         *        if enable is true.  Disable the screenshot option if enable is false.
         * @return {Options|bool} Options object if enable is defined, value of the screenshot option if 
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
         * Get or set the retrieve report post option.
         * @param {bool} Return the current option if undefined.  Enable the post option
         *        if enable is true.  Disable the report post option if enable is false.
         * @return {Options|bool} Options object if enable is defined, value of the report 
         *         post option if enable is not defined.
         */
        reportPost: function (enable) {
            if (enable !== undefined) {
                this._reportPost = Boolean(enable);
                return this;
            }
            return this._reportPost;
        },
        /**
         * Get or set the execute handler report callback option.
         * @param {bool} Return the current option if undefined.  Enable the report callback option
         *        if enable is true.  Disable the report callback option if enable is false.
         * @return {Options|bool} Options object if enable is defined, value of the report
         *         callback option if enable is not defined.
         */
        reportCallback: function (enable) {
            if (enable !== undefined) {
                this._reportCallback = Boolean(enable);
                return this;
            }
            return this._reportCallback;
        },
        /**
         * Get or set the post to exceptions.js platform option
         * @param {bool} Return the current option if undefined.  Enable the report to exceptions.js
         *        platform option if enable is true.  Disable the report to exceptions.js platform option 
         *        if enable is false.
         * @return {Options|bool} Options object if enable is defined, value of the report to exceptions.js
         *         platform option if enable is not defined.
         */
        reportToExceptionsJsPlatform: function (enable) {
            if (enable !== undefined) {
                this._reportToExceptionsJsPlatform = Boolean(enable);
                return this;
            }
            return this._reportToExceptionsJsPlatform;
        },
        /**
         * Get or set the DOM dump option.
         * @param {bool} Return the current option if undefined.  Enable the DOM dump option
         *        if enable is true.  Disable the DOM dump option if enable is false.
         * @return {Options|bool} Options object if enable is defined, value of the DOM dump
         *         option if enable is not defined.
         */        
        DOMDump: function (enable) {
            if (enable !== undefined) {
                this._DOMDump = Boolean(enable);
                return this;
            }
            return this._DOMDump;
        },
        /**
         * Toggle all options according to the enable parameter
         * @param {bool} Enable all options if true.  Disable all options if false or undefined.
         * @return Options object
         */
        toggleAll: function (enable) {
            return this.stacktrace(enable)
                .screenshot(enable)
                .reportPost(enable)
                .reportCallback(enable)
                .reportToExceptionsJsPlatform(enable)
                .DOMDump(enable);
        }
    };
    
    /**
     * Create a custom exception class with the createCustomException function
     * @param {object} config object for creating an exception
     *        exception - {function} Constructor for the custom exception.  This constructor should 
     *                    call its base exception's constructor.  For debugging convenience, 
     *                    you'll probably want this function to have a name.
     *        baseException - {Exception} Exception that the custom exception will inherit from
     *        defaultOptions - {Options} Options that will be used by default for the exception 
     *                         if no others are specified.  You'll usually want to enable all options by default. 
     * @return Custom exception.  The type will be the function you provided in the config.exception property.
     */
    function createCustomException(config) {
        if (ArgumentException && ArgumentException.throwIf) {
            ArgumentException.throwIf(!utilities.functionName(config.exception), "Your exception constructor must have a name.  See examples on github.")
        }
        createCustomException._mixStaticFunctions(config.exception);
        createCustomException._inherits(
            config.exception, 
            config.baseException);
        createCustomException._setupDefaults(
            config.exception,
            config.baseException,
            config.defaultOptions);
        return config.exception;
    }
    
    createCustomException._createThrowIf = function (Exception) {
               /**
                * Throw an exception if the condition is true.
                * @function throwIf
                * @param {bool} throw the exception if true
                * @param {string} optional - create an exception with the 
                *        message if provided.  Else fallback to a generic message.
                */
        return function throwIf(condition, message) {
            if (condition) {
                var except = new Exception(message || "Condition evaluated to truthy");
                throw except;
            }
        };
    };
    
    createCustomException._createReportIf = function (Exception) {
                /**
                 * Report an exception if the condition is true.
                 * @function reportIf
                 * @param {bool} report the exception if true
                 * @param {string} optional - create an exception with the 
                 *        message if provided.  Else fallback to a generic message.
                 */
        return function reportIf(condition, message) {
            if (condition) {
                var except = new Exception(message || "Condition evaluated to truthy");
                except.report();
            }
        };
    };
    
    createCustomException._createDefaultOptions = function (exception) {
        return function defaultOptions(options){
            if (options) {
                exception._defaultOptions = options;
                return exception;
            }
            return new Options({
                stacktrace: exception._defaultOptions.stacktrace(),
                screenshot: exception._defaultOptions.screenshot(),
                reportPost: exception._defaultOptions.reportPost(),
                reportCallback: exception._defaultOptions.reportCallback(),
                reportToExceptionsJsPlatform: exception._defaultOptions.reportToExceptionsJsPlatform(),
                DOMDump: exception._defaultOptions.DOMDump()
            });
        };
    };
    
    createCustomException._mixStaticFunctions = function (exception) {
        var creators = {
            throwIf: createCustomException._createThrowIf(exception),
            reportIf: createCustomException._createReportIf(exception),
            defaultOptions: createCustomException._createDefaultOptions(exception)
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
    
    createCustomException._setupDefaults = function (sub, base, defaultOptions) {
        sub.defaultOptions(
            defaultOptions || 
            new Options({
                stacktrace: base.defaultOptions().stacktrace(),
                screenshot: base.defaultOptions().screenshot(),
                reportPost: base.defaultOptions().reportPost(),
                reportCallback: base.defaultOptions().reportCallback(),
                reportToExceptionsJsPlatform: base.defaultOptions().reportToExceptionsJsPlatform(),
                DOMDump: base.defaultOptions().DOMDump()
            }));
    };
    
    /**
     * Exception is the base Exception class that wraps an error and provides extra
     * functionality that the native Error class does not provide.  The Exception class
     * can be extended to create custom exceptions with the exceptions.createCustomException.
     * @Constructor
     * @param {string|Error} create an Exception with an Error object or error message.  This
     *        constructor will create a new Error(message) if you pass in a message or simply
     *        use the provided Error as the underlying Error it wraps.
     * @param {Object} optional - Configure the exception with a config object.  All properties 
     *           on the config are optional.
     *        name - {string} provide a name for the exception.  If no name is provided, we check if you
     *               manually set the name on the error created from this exception.  Otherwise, we fallback
     *               to the name of this exception's constructor.  Name is purely used for reporting purposes.  
     *               No functionality pivots off of name.  And the common case should be to not provide a name.
     *        innerException - {Exception} Exceptions are recursive, so you can create an inner
     *                         exception that is wrapped by the current exception.
     *        data - {object} - Provide any information you want to associate with this Exception.
     *               You'll notice a screenshot property is added to the data object when the screenshot
     *               option is enabled for this Exception.  Also, a browser property is added to the 
     *               data object.
     *        options - {Options} - Provide an Options object In most cases, the defaultOptions  will be sufficient
     *                 and this property is not needed.
     *        
     */
    function Exception(message, config) {
        try {
            if (!(this instanceof Exception)) {
                return new Exception(message, config);
            }
            
            this._error = (message instanceof Error) ? message : new Error(message);
            config = config || {};
            this._name = config.name || this._getName();
            this._stacktrace = null;
            this._innerException = config.innerException || null;
            this._data = config.data || {}; 
            this._options = config.options ? config.options : this.constructor.defaultOptions();
            this._guardedOptions = exceptions.handler.guard()._restrict(this._options, this);
            this._listeners = [];
            
            this._populateDefaultDataProperties();
            
            if (this._guardedOptions.stacktrace()) {
                this._stacktrace = this._retrieveStacktrace();
            }
            if (this._guardedOptions.screenshot()) {
                this._takeScreenshot();
            }
            if (this._guardedOptions.DOMDump()) {
                this._getDOMDump();
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
         * Get the inner exception
         * @method
         * @return inner exception
         */
        innerException: function () {
            return this._innerException;
        },
        /**
         * Get the stacktrace
         * @method
         * @return stacktrace
         */
        stacktrace: function () {
            return this._stacktrace;
        },
        /**
         * Get the data object
         * @method
         * @return data object
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
         * Get the name
         * @method
         */
        name: function () {
            return this._name;
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
         * making a post request with a serialized exception object if the post request option is
         * enabled, posting to the exception.js platform, and/or executing a custom report function if 
         * the report callback option is enabled.
         */
        report: function () {
            try {
                if (!this._screenshotComplete && this._guardedOptions.screenshot()) {
                    this._listeners.push(function () {
                        if (exceptions.handler.beforeReport()) {
                            exceptions.handler.beforeReport()(this);
                        }
                        this._report();
                    });
                }
                else {
                    if (exceptions.handler.beforeReport()) {
                        exceptions.handler.beforeReport()(this);
                    }
                    this._report();
                }
            }
            catch (e) {
                console.log("Error in exceptions.js:");
                console.log(e);
            }
        },
        /**
         * Convert an Exception into a simple object that is easier to serialize.
         * @return {object} - {
         *         name: name,
         *         message: message,
         *         stacktrace: stacktrace,
         *         data: data,
         *         innerException: inner exception,
         *         error: underlying error
         * }
         */
        toSerializableObject: function () {
            var innerException = this.innerException(),
                simpleObject = {
                name: this.name(),
                message: this.message(),
                stacktrace: this.stacktrace(),
                data: this.data(),
                innerException: innerException ? innerException.toSerializableObject() : null,
                error: this.error()
            };
            return simpleObject;
        },
        /**
         * Convert a serializable exception object created from toSerializableObject into a JSON string.
         * @return {string} JSON string of serializable exception object
        */
        toJSONString: function () {
            var simpleObject = this.toSerializableObject();
            return JSON.stringify(simpleObject);
        },
        
        /**
         * Return a string representation of the exception.
         * @return {String} exception represented as a string
         */
        toString: function () {
            if (this.message()) {
                return this.name() + " - " + this.message();
            }
            return this.name();
        },
        
        _getName: function () {
            var data = this.data(),
                error = this.error();
            return (error.name && error.name !== utilities.functionName(error.constructor)) ? error.name : utilities.functionName(this.constructor);
        },
        
        _populateDefaultDataProperties: function () {
            var data = this.data();
            this._mergeErrorIntoData();
            data.browser = data.browser || utilities.getBrowser();
            data.url = data.url || window.location.href;
            data.date = data.date || Date();
        },
        
        _mergeErrorIntoData: function () {
            var data = this.data(),
                error = this.error();
            
            //Microsoft specific extension
            if (error.description && !data.description) {
                data.description = error.description;
            }
            if (error.number && !data.number) {
                data.number = error.number;
            }
            
            //Mozilla specific extensions
            if (error.fileName && !data.fileName) {
                data.fileName = error.fileName;
            }
            if (error.lineNumber && !data.lineNumber) {
                data.lineNumber = error.lineNumber;
            }
            if (error.columnNumber && !data.columnNumber) {
                data.columnNumber = error.columnNumber;
            }
            if (error.toSource && !data.source) {
                data.source = error.toSource();
            }
            
            //Note, we do not include error.message nor error.stack.  We treat those differently
            //because we consider them to be first order properties on an exception which don't 
            //need to live in the data object.
        },        
        _report: function () {          
            if (this._guardedOptions.reportPost()) {
                this._reportPost();
            }
            if (this._guardedOptions.reportToExceptionsJsPlatform()) {
                this._reportToExceptionsJsPlatform();
            }
            if (this._guardedOptions.reportCallback()) {
                this._reportCallback();
            }
            handler._pushReportedException(this);
            console.log("exceptions.js exception: " + this.toString());
            console.log(this.toSerializableObject());
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
            var callback, self = this, scrollX, scrollY;
            
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
                scrollX = window.scrollX;
                scrollY = window.scrollY;
                window.html2canvas(document.body, {
                    onrendered: function (canvas) {
                        try {
                            //There is currently a bug in html2canvas that causes the page to scroll to the
                            //top during its operation.  This bug will be fix in version 0.5.  While using
                            //version 0.4.x, we'll include this fix so users don't experience scrolling issues.
                            //See github issues at html2canvas #57, #200, #254
                            window.scrollTo(scrollX, scrollY);
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
        _reportPost: function () {
            var http = new window.XMLHttpRequest(), 
                jsonString = this.toJSONString(),
                reportPost = exceptions.handler.reportPost(),
                postHeaders = reportPost.headers,
                i;
            http.open("POST", reportPost.url, true);
            if (postHeaders) {
                for (i = 0; i < postHeaders.length; i += 1) {
                    http.setRequestHeader(postHeaders[i].header, postHeaders[i].value);
                }
            }
            //Send the proper header information along with the request
            http.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
            http.send("exception=" + encodeURIComponent(jsonString));
        },
        _reportToExceptionsJsPlatform: function () {
            var http = new window.XMLHttpRequest(), 
                jsonString = this.toJSONString(),
                clientId = handler.clientId(),
                to = handler.to(),
                i;
            http.open("POST", "https://www.platform.exceptionsjs.com/v0.1/reportWithClientId/", true);
            
            //Send the proper header information along with the request
            http.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
            http.send("exception=" + encodeURIComponent(jsonString) + 
                      "&clientId=" + encodeURIComponent(clientId) +
                      "&to=" + encodeURIComponent(to));
        },
        _reportCallback: function () {
            var reportCallback = exceptions.handler.reportCallback();
            reportCallback(this);
        },
        _getDOMDump: function ()  {
            var htmlNode = document.getElementsByTagName("html")[0];
            this.data().DOMDump = "<html>" + htmlNode.innerHTML + "</html>";
        },
        constructor: Exception
    };
    
    //setup
    Exception.defaultOptions(new Options());
    
    /**
     * ArgumentException inherits from Exception.  It has the same 
     * static functions and methods as Exception.  However, it's default type is
     * "ArgumentException" rather than "Exception."  Use ArgumentException to throw 
     *  or report invalid arguments.
     * @constructor
     */
    ArgumentException = createCustomException({ 
        exception: function ArgumentException(message, config) {
            if (!(this instanceof ArgumentException)) {
                return new ArgumentException(message, config);
            }
            Exception.call(this, message, config);
        },
        baseException: Exception
    });
    
    /**
     * InvalidOperationException inherits from Exception.  It has the 
     * same static functions and methods as Exception.  However, 
     * it's default type is "InvalidOperationException" rather than "Exception."  
     * Use InvalidOperationException to throw or report invalid operations.
     * @constructor
     */
    InvalidOperationException = createCustomException({ 
        exception: function InvalidOperationException(message, config) {
            if (!(this instanceof InvalidOperationException)) {
                return new InvalidOperationException(message, config);
            }
            Exception.call(this, message, config);
        },
        baseException: Exception
    });
    
    /**
     * NotImplementedException inherits from Exception.  It has the same 
     * static functions and methods as Exception.  However, it's default 
     * type is "NotImplementedException" rather than "Exception."  Use 
     * NotImplementedException to throw or report attempts of executed 
     * code that is not implemented.
     * @constructor
     */
    NotImplementedException = createCustomException({ 
        exception: function NotImplementedException(message, config) {
            if (!(this instanceof NotImplementedException)) {
                return new NotImplementedException(message, config);
            }
            Exception.call(this, message, config);
        },
        baseException: Exception
    });
    
    EvalException = createCustomException({ 
        exception: function EvalException(message, config) {
            if (!(this instanceof EvalException)) {
                return new EvalException(message, config);
            }
            var error = (message instanceof Error) ? message : new EvalError(message);
            Exception.call(this, error, config);
        },
        baseException: Exception
    });
    
    RangeException = createCustomException({ 
        exception: function RangeException(message, config) {
            if (!(this instanceof RangeException)) {
                return new RangeException(message, config);
            }
            var error = (message instanceof Error) ? message : new RangeError(message);
            Exception.call(this, error, config);
        },
        baseException: Exception
    });
    
    ReferenceException = createCustomException({ 
        exception: function ReferenceException(message, config) {
            if (!(this instanceof ReferenceException)) {
                return new ReferenceException(message, config);
            }
            var error = (message instanceof Error) ? message : new ReferenceError(message);
            Exception.call(this, error, config);
        },
        baseException: Exception
    });
    
    SyntaxException = createCustomException({ 
        exception: function SyntaxException(message, config) {
            if (!(this instanceof SyntaxException)) {
                return new SyntaxException(message, config);
            }
            var error = (message instanceof Error) ? message : new SyntaxError(message);
            Exception.call(this, error, config);
        },
        baseException: Exception
    });
    
    TypeException = createCustomException({ 
        exception: function TypeException(message, config) {
            if (!(this instanceof TypeException)) {
                return new TypeException(message, config);
            }
            var error = (message instanceof Error) ? message : new TypeError(message);
            Exception.call(this, error, config);
        },
        baseException: Exception
    });
    
    URIException = createCustomException({ 
        exception: function URIException(message, config) {
            if (!(this instanceof URIException)) {
                return new URIException(message, config);
            }
            var error = (message instanceof Error) ? message : new URIError(message);
            Exception.call(this, error, config);
        },
        baseException: Exception
    });
    
    /**
     * Performing exception operations can be expensive or superfluous sometimes.  For example, you may 
     * not want to take a screenshot of your page if you've hit 10 errors in a row because it could cause 
     * noticable performance errors. Specify a guard with exceptions.handler.guard() to disable exception 
     * options you do not wish to perform. 
     */
    function Guard() {
        if (!(this instanceof Guard)) {
            return new Guard();
        }
        this._restrictions = [];
    }
    
    Guard.prototype = {
        _protectAgainstUnavailableOptions: function (o, exception) {
            if (!exception.error().stack && !exceptions.handler.stacktraceUrl()){
                o.stacktrace(false);
            }
            if (!exceptions.handler.html2canvasUrl() || !window.getComputedStyle){
                o.screenshot(false);
            }
            if (!exceptions.handler.reportPost().url){
                o.reportPost(false);
            }
            if (!exceptions.handler.reportCallback()){
                o.reportCallback(false);
            }
            if (!exceptions.handler.clientId()) {
                o.reportToExceptionsJsPlatform(false);
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
         *        function.
         */
        protectAgainstBurst: function (config) {
            var count = config.count,
                seconds = config.seconds,
                optionsFunc = config.optionsFunc;
            ArgumentException.throwIf(!config.count || config.count < 0, "You must specify a number greater than zero for count.")
            
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
        protectAgainst: function (restrictFunc) {
            this._restrictions.push(restrictFunc);
            return this;
        },
        _restrict: function (o, exception) {
            for(var i in this._restrictions) {
                this._restrictions[i](o, exception);
            }
            this._protectAgainstUnavailableOptions(o, exception);
            return o;
        }
    };
    
    _scopeOption = {
        none: 0,
        exceptions: 1,
        all: 2
    };
    
    /**
     * Handler as exposed by exceptions.handler.  The handler is responsible for handling errors thrown that
     * hit window.onerror and specifying global configurations including the stacktrace.js url, html2canvas.js url,
     * post url (to make a post request when an error is reported), post headers, custom report func (function executed when
     * an error is reported).
     */
    handler = {
        _guard: null,
        _reportPost: { url: null, headers: null },
        _html2canvasUrl: null,
        _stacktraceUrl: null,
        _reportCallback: null,
        _isSetup: false,
        _scope: _scopeOption.all,
        _reportedExceptions: [],
        _clientId: null,
        _to: null,
        
        /**
         * Scope options for the handler.  Options are none, exceptions, and all.  Setting the scope to none signals that the handler
         * won't handle anything in window.onerror.  Setting the scope to exceptions signals that the handler
         * will handle only thrown Exceptions, nothing else that is thrown.  Setting the scope to all signals that
         * the handler will handle everything in window.onerror.
         */
        scopeOption: _scopeOption,
        
        /**
         * Get or set the scope of the handler when executed in window.onerror.  Scope refers to scopeOption
         * which has three options: none, exceptions, and all.  Setting the scope to none signals that the handler
         * won't handle anything in window.onerror.  Setting the scope to exceptions signals that the handler
         * will handle only thrown Exceptions, nothing else that is thrown.  Setting the scope to all signals that
         * the handler will handle everything in window.onerror.
         * @param {int} Set the handler scope if specified.  Use window.handler.scopeOption.
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
         * @param {Guard} guard that protects against bursts of exceptions, repeated exceptions,
         *        or any other exceptions that should not be reported.
         * @return The handler if guard is defined.  Handler's guard if guard is not defined.
         */
        guard: function (guard) {
            if (guard) {
                handler._guard = guard;
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
            if (html2canvasUrl !== undefined) {
                handler._html2canvasUrl = html2canvasUrl;
                return handler;
            }
            return handler._html2canvasUrl;
        },
        
        /**
         * Get or set url that pulls stacktrace.js.
         * @param {string} url to stacktrace.js
         * @return Handler if stacktraceUrl is defined.  Url to stacktrace.js if stacktraceUrl is not defined.
         */
        stacktraceUrl: function (stacktraceUrl) {
            if (stacktraceUrl !== undefined) {
                handler._stacktraceUrl = stacktraceUrl;
                return handler;
            }
            return handler._stacktraceUrl;
        },
        
        beforeReport: function (func) {
            if (func !== undefined) {
                handler._beforeReportFunc = func;
                return handler;
            }
            return handler._beforeReportFunc;
        },
        
        /**
         * Get or set HTTP headers used to post the serialized exception when reported.
         * @param {array} Array of objects with the form { bstrHeader: "header", bstrValue: "value" }
         * @return Handler if postHeaders is defined.  Post headers for post request if postHeaders is not defined.
         */
        reportPost: function (config) {
            if (config !== undefined) {
                handler._reportPost = { url: config.url, headers: config.headers || [] };
                return handler;
            }
            return handler._reportPost;
        },
        
        /**
         * Enable posting to exceptionsjs platform.  The exceptionsjs platform handles 
         * your Javascript error by parsing the serialized exception and constructing a
         * useful exception email that includes stacktraces, screenshots, and extra information.
         * Register for exceptionsjs platform at https://exceptionsjs.com.  This option only works
         * if you've enabled the option to allow unsecure reporting.  If you have enabled secure
         * reporting you must send your exceptions to excpetionsjs platform using the full oauth2
         * process.  See https://exceptionsjs.com for useful libraries in many languages that make
         * submitting exceptions with the full oauth2 process easy.
         * @param {string} clientId that will be used with exceptionsjs platform
         * @param {string} post request url
         * @return Handler if postUrl is defined.  Url for post request if postUrl is not defined.
         */
        reportToExceptionsJsPlatform: function (config) {
            if (config !== undefined) {
                handler.clientId(config.clientId);    
                if (config.to) {
                    handler.to(config.to);
                }
                return handler;
            }
            return { clientId: handler.clientId(), to: handler.to() || "email address associated with client at exceptionsjs.com" };
            
        },
        
        clientId: function (clientId) {
            if (clientId !== undefined) {
                handler._clientId = clientId;
                return handler;
            }
            return handler._clientId;
        },
        
        to: function (to) {
            if (to !== undefined) {
                handler._to = to;
                return handler;
            }
            return handler._to;
        },
        
        /**
         * Get or set reportCallback that will be executed when an Exception is reported.
         * @param {function} reportCallback that will be executed when the Exception is reported.
         * @return Handler if func is defined.  ReportCallback if func is not defined.
         */
        reportCallback: function (func) {
            if (func !== undefined) {
                handler._reportCallback = func;
                return handler;
            }
            else {
                return handler._reportCallback;
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
         * @param {function} callback that will be executed when html2canvas.js has loaded
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
        
        /**
         * Handle any error by turning it into an exception and reporting it.
         * @param {Object} config object for information that will be used to
         *        create an exception and report it.  Properties are: errorMsg, 
         *        url, lineNumber, columnNumber, and error.
         */
        handle: function (config) {
            var errorMsg = config.errorMessage, 
                url = config.url, 
                lineNumber = config.lineNumber, 
                columnNumber = config.columnNumber, 
                errorObj = config.error,
                data = config.data || {},
                exception,
                options = new Options().stacktrace(Boolean(errorObj && errorObj.stack)),
                scope = handler.scope();
            
            if (scope === handler.scopeOption.none) {
                return;
            }
            else if (scope === handler.scopeOption.exceptions) {
                if (!(errorObj instanceof Exception)) {
                    return;    
                }
            }
            else if (scope !== handler.scopeOption.all) {
                console.log("Error in exceptions.js!");
                console.log("handler.scope() returned " + scope + ".  It should have been handler.scopeOption.all, handler.scopeOption.exceptions, or handler.scopeOption.none");
            }
                
            if (errorObj instanceof Exception) {
                exception = errorObj;
            }
            else if (errorObj instanceof Error) {
                if (errorObj instanceof EvalError) {
                    exception = new EvalException(errorObj, {
                        options: options,
                        data: data
                    });
                }
                else if (errorObj instanceof RangeError) {
                    exception = new RangeException(errorObj, {
                        options: options,
                        data: data
                    });
                }
                else if (errorObj instanceof ReferenceError) {
                    exception = new ReferenceException(errorObj, {
                        options: options,
                        data: data
                    });
                }
                else if (errorObj instanceof SyntaxError) {
                    exception = new SyntaxException(errorObj, {
                        options: options,
                        data: data
                    });
                }
                else if (errorObj instanceof TypeError) {
                    exception = new TypeException(errorObj, {
                        options: options,
                        data: data
                    });
                }
                else if (errorObj instanceof URIError) {
                    exception = new URIException(errorObj, {
                        options: options,
                        data: data
                    });
                }
                else {
                    exception = new Exception(errorObj, {
                        options: options,
                        data: data
                    });
                }
            }
            else if (errorObj !== undefined) {
                if (typeof errorObj === "string" || errorObj instanceof String) {
                    exception = new Exception(errorMsg || errorObj, {
                        options: options,
                        data: data
                    });
                }
                else {
                    data.errorWithUnknownType = errorObj;
                    exception = new Exception(errorMsg || errorObj.toString(), {
                        options: options,
                        data: data
                    });
                }
            }
            else {
                exception = new Exception(errorMsg, {
                    options: options,
                    data: data
                });
            }
            data = exception.data();
            data.url = data.url || url;
            data.lineNumber = data.lineNumber || lineNumber;
            data.columnNumber = data.columnNumber || columnNumber;
            exception.report();
        },        
        
        _setup: function () {
            handler
                ._setupDefaultGuard()
                ._setupOnError()
                .stacktraceUrl("https://cdnjs.cloudflare.com/ajax/libs/stacktrace.js/0.6.0/stacktrace.js")
                .html2canvasUrl("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/0.4.1/html2canvas.js");
        },

        _setupOnError: function () {
            if (handler._isSetup) {
                return;
            }
            var previousOnError = window.onerror;
            window.onerror = function (errorMsg, url, lineNumber, columnNumber, errorObj) {
                if (typeof previousOnError === "function") {
                    previousOnError(errorMsg, url, lineNumber, columnNumber, errorObj);
                }
                handler.handle({ errorMessage: errorMsg, url: url, lineNumber: lineNumber, columnNumber: columnNumber, error: errorObj });
            };
            handler._isSetup = true;
            return handler;
        },
        
        _setupDefaultGuard: function () {
            handler.guard(new Guard().protectAgainstBurst({ count: 10, seconds: 10 }).protectAgainstBurst({ count: 20 }));
            return handler;
        },

        _pushReportedException: function (exception) {
            var reportedExceptions = handler.reportedExceptions();
            reportedExceptions.push({ exception: exception, timestamp: Date.now()});
        }
    };
        
    handler._setup();
    
    exceptions = {
        handler: handler,
        Guard: Guard,
        Options: Options,
        Exception: Exception,
        ArgumentException: ArgumentException,
        InvalidOperationException: InvalidOperationException,
        NotImplementedException: NotImplementedException,
        EvalException: EvalException,
        RangeException: RangeException,
        ReferenceException: ReferenceException,
        SyntaxException: SyntaxException,
        TypeException: TypeException,
        URIException: URIException,
        createCustomException: createCustomException,
        throwIf: Exception.throwIf,
        reportIf: Exception.reportIf
    };
    
    window.exceptions = exceptions;
    window.ex = exceptions;
}());