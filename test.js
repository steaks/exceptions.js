window = {
    printStackTrace: function () { }
};
var nodeunit = require("nodeunit");
require("./exceptions");

module.exports = {
    setUp: function (callback) {
        window.exceptionReported = undefined;
        window.ex.handler
            .scope(window.ex.handler.scopeOption.all)
            .beforeReport(function (exception) {
                exception.beforeReportCallbackExecuted = true;
            })
            .reportCallback(function (exception) {
                exception.callbackExecuted = true;
                window.exceptionReported = exception;
            })
            .guard(new window.ex.Guard());
        callback();
    },
    //basic Exception functionality
    testExecutedBeforeReport: function (test) {
        var exception = new window.ex.Exception("foo");
        exception.report();
        test.equals(exception.beforeReportCallbackExecuted, true);
        test.done();
    },
    testExecutedCallback: function (test) {
        var exception = new window.ex.Exception("foo");
        exception.report();
        test.equals(exception.callbackExecuted, true);
        test.done();
    },
    testCustomName: function (test) {
        var exception = new window.ex.Exception("foo", {
            name: "bar"
        });
        exception.report();
        test.equals(exception.name(), "bar");
        test.done();
    },
    testDefaultName: function (test) {
        var exception = new window.ex.Exception("foo", {
            name: "bar"
        });
        exception.report();
        test.equals(exception.name(), "bar");
        test.done();
    },
    testData: function (test) {
        var exception = new window.ex.Exception("foo", {
            data: {
                foo: "bar"
            }
        });
        exception.report();
        test.equals(exception.data().foo, "bar");
        test.done();
    },
    //Inner exception
    testInnerException: function (test) {
        var exception = new window.ex.Exception("foo", {
            innerException: new window.ex.ArgumentException("bar")
        });
        exception.report();
        test.equals(exception.message(), "foo");
        test.equals(exception.innerException().message(), "bar");
        test.done();
    },
    //Options and guards
    testOptionCallback: function (test) {
        var exception = new window.ex.Exception("foo", {
            options: new window.ex.Options({ reportCallback: false })
        });
        test.equals(exception.options().reportCallback(), false);
        test.done();
    },
    testOptionAllfalse: function (test) {
        var exception = new window.ex.Exception("foo", {
        	options: new window.ex.Options().toggleAll(false)
        });
        exception.report();
        test.equals(exception.options().stacktrace(), false);
        test.equals(exception.options().screenshot(), false);
        test.equals(exception.options().reportPost(), false);
        test.equals(exception.options().reportToExceptionsJsPlatform(), false);
        test.equals(exception.options().reportCallback(), false);
        test.done();
    },
    testDefaultGuard: function (test) {
        var exception = new window.ex.Exception("foo");
        exception.report();
        //we default to enable stacktrace and callback because we
        //have an Error.stack and a specified callback.
        //But we haven't specified a html2canvas url, post url, or client id for exceptionsjs platform.
        test.equals(exception.options().stacktrace(), true);
        test.equals(exception.options().screenshot(), false);
        test.equals(exception.options().reportPost(), false);
        test.equals(exception.options().reportToExceptionsJsPlatform(), false);
        test.equals(exception.options().reportCallback(), true);
        test.done();
    },
    testCustomGuard: function (test) {
        var guard = new window.ex.Guard()
            .protectAgainst(function (o, e) {
                if (e.message() === "foo") {
                    return o.toggleAll(false);
                }
                return o;
            });
        window.ex.handler.guard(guard);
        var exception = new window.ex.Exception("foo");
        exception.report();
        
        test.equals(exception.options().stacktrace(), false);
        test.equals(exception.options().screenshot(), false);
        test.equals(exception.options().reportPost(), false);
        test.equals(exception.options().reportToExceptionsJsPlatform(), false);
        test.equals(exception.options().reportCallback(), false);
        test.done();
    },
    //Exception static functions
    testReportIfTrueWithOutMessage: function (test) {
        window.ex.Exception.reportIf(true);
        test.equals(window.exceptionReported.callbackExecuted, true);
        test.equals(window.exceptionReported.message(), "Condition evaluated to truthy");
        test.done();
    },
    testReportIfTrueWithMessage: function (test) {
        window.ex.Exception.reportIf(true, "foo");
        test.equals(window.exceptionReported.callbackExecuted, true);
        test.equals(window.exceptionReported.message(), "foo");
        test.done();
    },
    testReportIfFalse: function (test) {
        window.ex.Exception.reportIf(false);
        test.equals(window.exceptionReported, undefined);
        test.done();
    },
    testShortcutReportIfTrueWithOutMessage: function (test) {
        window.ex.reportIf(true);
        test.equals(window.exceptionReported.callbackExecuted, true);
        test.equals(window.exceptionReported.message(), "Condition evaluated to truthy");
        test.done();
    },
    testShortcutReportIfTrueWithMessage: function (test) {
        window.ex.reportIf(true, "foo");
        test.equals(window.exceptionReported.callbackExecuted, true);
        test.equals(window.exceptionReported.message(), "foo");
        test.done();
    },
    testShortcutReportIfFalse: function (test) {
        window.ex.reportIf(false);
        test.equals(window.exceptionReported, undefined);
        test.done();
    },
    //serialization
    testToSerializableObject: function (test) {
        var data = { foo: "bar" }
            exception = new window.ex.Exception("foo", {
                data: data
            }),
            serializableObject = exception.toSerializableObject();
        test.equals(serializableObject.name, "Exception");
        test.equals(serializableObject.message, "foo");
        test.equals(serializableObject.data, data);
        test.done();             
    },
    //Custom Exceptions
    testArgumentException: function (test) {
        var argumentException = new window.ex.ArgumentException("foo");
        argumentException.report();
        test.equals(argumentException.callbackExecuted, true);
        test.equals(argumentException.name(), "ArgumentException");
        test.done();
    },
    testInvalidOperationException: function (test) {
        var invalidOperationException = new window.ex.InvalidOperationException("foo");
        invalidOperationException.report();
        test.equals(invalidOperationException.callbackExecuted, true);
        test.equals(invalidOperationException.name(), "InvalidOperationException");
        test.done();
    },
    testEvalException: function (test) {
        var exception = new window.ex.EvalException("foo");
        exception.report();
        test.equals(exception.callbackExecuted, true);
        test.equals(exception.name(), "EvalException");
        test.ok(exception.error() instanceof EvalError);
        test.done();
    },
    testRangeException: function (test) {
        var exception = new window.ex.RangeException("foo");
        exception.report();
        test.equals(exception.callbackExecuted, true);
        test.equals(exception.name(), "RangeException");
        test.ok(exception.error() instanceof RangeError);
        test.done();
    },
    testReferenceException: function (test) {
        var exception = new window.ex.ReferenceException("foo");
        exception.report();
        test.equals(exception.callbackExecuted, true);
        test.equals(exception.name(), "ReferenceException");
        test.ok(exception.error() instanceof ReferenceError);
        test.done();
    },
    testSyntaxException: function (test) {
        var exception = new window.ex.SyntaxException("foo");
        exception.report();
        test.equals(exception.callbackExecuted, true);
        test.equals(exception.name(), "SyntaxException");
        test.ok(exception.error() instanceof SyntaxError);
        test.done();
    },
    testTypeException: function (test) {
        var exception = new window.ex.TypeException("foo");
        exception.report();
        test.equals(exception.callbackExecuted, true);
        test.equals(exception.name(), "TypeException");
        test.ok(exception.error() instanceof TypeError);
        test.done();
    },
    testURIException: function (test) {
        var exception = new window.ex.URIException("foo");
        exception.report();
        test.equals(exception.callbackExecuted, true);
        test.equals(exception.name(), "URIException");
        test.ok(exception.error() instanceof URIError);
        test.done();
    },
    testCreateCustomException: function (test) {
        var CustomException = window.ex.createCustomException({
                    exception: function CustomException(message, config) {
                    if (!(this instanceof CustomException)) {
                        return new CustomException(message, config);
                    }
                    window.ex.Exception.call(this, message, config);
                },
                baseException: window.ex.Exception
            }),
            instance = new CustomException("foo");
        instance.report();
        test.equals(instance.name(), "CustomException");
        test.equals(instance.callbackExecuted, true);
        test.done();
    },
    testTwoLayerCustomException: function (test) {
        var CustomArgumentException = window.ex.createCustomException({
                    exception: function CustomArgumentException(message, config) {
                    if (!(this instanceof CustomArgumentException)) {
                        return new CustomArgumentException(message, config);
                    }
                    window.ex.ArgumentException.call(this, message, config);
                },
                baseException: window.ex.ArgumentException
            }),
            instance = new CustomArgumentException("foo");
        instance.report();
        test.equals(instance.name(), "CustomArgumentException");
        test.equals(instance.callbackExecuted, true);
        test.done();
    },
    //handler
    testHandleException: function (test) {
        window.ex.handler.handle({
            errorMessage: "foo", 
            url: "url", 
            lineNumber: 1, 
            columnNumber: 1, 
            error: new window.ex.Exception("message") });
        test.equals(window.exceptionReported.name(), "Exception");
        test.ok(window.exceptionReported instanceof window.ex.Exception);
        test.ok(window.exceptionReported.error() instanceof Error);
        test.done();
    },
    testHandleError: function (test) {
        window.ex.handler.handle({
            errorMessage: "foo", 
            url: "url", 
            lineNumber: 1, 
            columnNumber: 1, 
            error: new Error() });
        test.equals(window.exceptionReported.name(), "Exception");
        test.ok(window.exceptionReported instanceof window.ex.Exception);
        test.ok(window.exceptionReported.error() instanceof Error);
        test.done();
    },
    testHandleEvalError: function (test) {
        window.ex.handler.handle({
            errorMessage: "foo", 
            url: "url", 
            lineNumber: 1, 
            columnNumber: 1, 
            error: new EvalError() });
        test.equals(window.exceptionReported.name(), "EvalException");
        test.ok(window.exceptionReported instanceof window.ex.Exception);
        test.ok(window.exceptionReported.error() instanceof EvalError);
        test.done();
    },
    testHandleRangeError: function (test) {
        window.ex.handler.handle({
            errorMessage: "foo", 
            url: "url", 
            lineNumber: 1, 
            columnNumber: 1, 
            error: new RangeError() });
        test.equals(window.exceptionReported.name(), "RangeException");
        test.ok(window.exceptionReported instanceof window.ex.Exception);
        test.ok(window.exceptionReported.error() instanceof RangeError);
        test.done();
    },
    testHandleSyntaxError: function (test) {
        window.ex.handler.handle({
            errorMessage: "foo", 
            url: "url", 
            lineNumber: 1, 
            columnNumber: 1, 
            error: new SyntaxError() });
        test.equals(window.exceptionReported.name(), "SyntaxException");
        test.ok(window.exceptionReported instanceof window.ex.Exception);
        test.ok(window.exceptionReported.error() instanceof SyntaxError);
        test.done();
    },
    testHandleTypeError: function (test) {
        window.ex.handler.handle({
            errorMessage: "foo", 
            url: "url", 
            lineNumber: 1, 
            columnNumber: 1, 
            error: new TypeError() });
        test.equals(window.exceptionReported.name(), "TypeException");
        test.ok(window.exceptionReported instanceof window.ex.Exception);
        test.ok(window.exceptionReported.error() instanceof TypeError);
        test.done();
    },
    testHandleURIError: function (test) {
        window.ex.handler.handle({
            errorMessage: "foo", 
            url: "url", 
            lineNumber: 1, 
            columnNumber: 1, 
            error: new URIError() });
        test.equals(window.exceptionReported.name(), "URIException");
        test.ok(window.exceptionReported instanceof window.ex.Exception);
        test.ok(window.exceptionReported.error() instanceof URIError);
        test.done();
    },
    testHandleURIError: function (test) {
        window.ex.handler.handle({
            errorMessage: "foo", 
            url: "url", 
            lineNumber: 1, 
            columnNumber: 1, 
            error: new URIError() });
        test.equals(window.exceptionReported.name(), "URIException");
        test.ok(window.exceptionReported instanceof window.ex.Exception);
        test.ok(window.exceptionReported.error() instanceof URIError);
        test.done();
    },
    testScope: function (test) {
        var exception = new window.ex.Exception("foo");
        window.ex.handler.scope(window.ex.handler.scopeOption.exceptions);

        window.ex.handler.handle({
            errorMessage: "foo", 
            url: "url", 
            lineNumber: 1, 
            columnNumber: 1, 
            error: new Error("foo") });
        test.equals(window.exceptionReported, undefined);

        window.ex.handler.handle({
            errorMessage: "foo", 
            url: "url", 
            lineNumber: 1, 
            columnNumber: 1, 
            error: exception });
        test.equals(window.exceptionReported, exception);
        test.done();
    }
};
