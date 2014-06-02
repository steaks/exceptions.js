window = {
    printStackTrace: function () { }
};
var nodeunit = require("nodeunit");
require("./exceptions");

module.exports = {
    setUp: function (callback) {
        window.exceptionReported = undefined;
        window.exceptions.handler
            .callback(function (exception) {
                exception.callbackExecuted = true;
                window.exceptionReported = exception;
            })
        callback();
    },
    //basic Exception functionality
    testExecutedCallback: function (test) {
        var exception = new window.exceptions.Exception("foo");
        exception.report();
        test.equals(exception.callbackExecuted, true);
        test.done();
    },
    testCustomName: function (test) {
        var exception = new window.exceptions.Exception("foo", {
            name: "bar"
        });
        test.equals(exception.name(), "bar");
        test.done();
    },
    testDefaultName: function (test) {
        var exception = new window.exceptions.Exception("foo", {
            name: "bar"
        });
        test.equals(exception.name(), "bar");
        test.done();
    },
    testData: function (test) {
        var exception = new window.exceptions.Exception("foo", {
            data: {
                foo: "bar"
            }
        });
        test.equals(exception.data().foo, "bar");
        test.done();
    },
    //Options and guards
    testOptionCallback: function (test) {
        var exception = new window.exceptions.Exception("foo", {
            optionsFunc: function (o) {
                return o.callback(false);
            }
        });
        test.equals(exception.options().callback(), false);
        test.done();
    },
    testOptionAllfalse: function (test) {
        var exception = new window.exceptions.Exception("foo", {
            optionsFunc: function (o) {
                return o.toggleAll(false);
            }
        });
        test.equals(exception.options().stacktrace(), false);
        test.equals(exception.options().screenshot(), false);
        test.equals(exception.options().post(), false);
        test.equals(exception.options().callback(), false);
        test.done();
    },
    testDefaultGuard: function (test) {
        var exception = new window.exceptions.Exception("foo");
        //we default to enable stacktrace and callback because we
        //have an Error.stack and a specified callback.
        //But we haven't specified a html2canvas url, post url.
        test.equals(exception.options().stacktrace(), true);
        test.equals(exception.options().screenshot(), false);
        test.equals(exception.options().post(), false);
        test.equals(exception.options().callback(), true);
        test.done();
    },
    //Exception static functions
    testReportIfTrueWithOutMessage: function (test) {
        window.exceptions.Exception.reportIf(true);
        test.equals(window.exceptionReported.callbackExecuted, true);
        test.equals(window.exceptionReported.message(), "Reported exception: Exception");
        test.done();
    },
    testReportIfTrueWithMessage: function (test) {
        window.exceptions.Exception.reportIf(true, "foo");
        test.equals(window.exceptionReported.callbackExecuted, true);
        test.equals(window.exceptionReported.message(), "foo");
        test.done();
    },
    testReportIfFalse: function (test) {
        window.exceptions.Exception.reportIf(false);
        test.equals(window.exceptionReported, undefined);
        test.done();
    },
    //serialization
    testToSerializableObject: function (test) {
        var data = { foo: "bar" }
            exception = new window.exceptions.Exception("foo", {
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
        var argumentException = new window.exceptions.ArgumentException("foo");
        argumentException.report();
        test.equals(argumentException.callbackExecuted, true);
        test.equals(argumentException.name(), "ArgumentException");
        test.done();
    },
    testInvalidOperationException: function (test) {
        var invalidOperationException = new window.exceptions.InvalidOperationException("foo");
        invalidOperationException.report();
        test.equals(invalidOperationException.callbackExecuted, true);
        test.equals(invalidOperationException.name(), "InvalidOperationException");
        test.done();
    },
    testEvalException: function (test) {
        var exception = new window.exceptions.EvalException("foo");
        exception.report();
        test.equals(exception.callbackExecuted, true);
        test.equals(exception.name(), "EvalException");
        test.ok(exception.error() instanceof EvalError);
        test.done();
    },
    testRangeException: function (test) {
        var exception = new window.exceptions.RangeException("foo");
        exception.report();
        test.equals(exception.callbackExecuted, true);
        test.equals(exception.name(), "RangeException");
        test.ok(exception.error() instanceof RangeError);
        test.done();
    },
    testReferenceException: function (test) {
        var exception = new window.exceptions.ReferenceException("foo");
        exception.report();
        test.equals(exception.callbackExecuted, true);
        test.equals(exception.name(), "ReferenceException");
        test.ok(exception.error() instanceof ReferenceError);
        test.done();
    },
    testSyntaxException: function (test) {
        var exception = new window.exceptions.SyntaxException("foo");
        exception.report();
        test.equals(exception.callbackExecuted, true);
        test.equals(exception.name(), "SyntaxException");
        test.ok(exception.error() instanceof SyntaxError);
        test.done();
    },
    testTypeException: function (test) {
        var exception = new window.exceptions.TypeException("foo");
        exception.report();
        test.equals(exception.callbackExecuted, true);
        test.equals(exception.name(), "TypeException");
        test.ok(exception.error() instanceof TypeError);
        test.done();
    },
    testURIException: function (test) {
        var exception = new window.exceptions.URIException("foo");
        exception.report();
        test.equals(exception.callbackExecuted, true);
        test.equals(exception.name(), "URIException");
        test.ok(exception.error() instanceof URIError);
        test.done();
    },
    testCreateCustomException: function (test) {
        var CustomException = window.exceptions.createCustomException({ 
                    exception: function CustomException(message, config) {
                    if (!(this instanceof CustomException)) {
                        return new CustomException(message, config);
                    }
                    window.exceptions.Exception.call(this, message, config);
                },
                baseException: window.exceptions.Exception
            }),
            instance = new CustomException("foo");
        instance.report();
        test.equals(instance.name(), "CustomException");
        test.equals(instance.callbackExecuted, true);
        test.done();
    },
    testTwoLayerCustomException: function (test) {
        var CustomArgumentException = window.exceptions.createCustomException({ 
                    exception: function CustomArgumentException(message, config) {
                    if (!(this instanceof CustomArgumentException)) {
                        return new CustomArgumentException(message, config);
                    }
                    window.exceptions.ArgumentException.call(this, message, config);
                },
                baseException: window.exceptions.ArgumentException
            }),
            instance = new CustomArgumentException("foo");
        instance.report();
        test.equals(instance.name(), "CustomArgumentException");
        test.equals(instance.callbackExecuted, true);
        test.done();
    },
    //handler
    testHandleException: function (test) {
        window.exceptions.handler._handle("foo", "url", 1, 1, new window.exceptions.Exception("message"));
        test.equals(window.exceptionReported.name(), "Exception");
        test.ok(window.exceptionReported instanceof window.exceptions.Exception);
        test.ok(window.exceptionReported.error() instanceof Error);
        test.done();
    },
    testHandleError: function (test) {
        window.exceptions.handler._handle("foo", "url", 1, 1, new Error());
        test.equals(window.exceptionReported.name(), "Exception");
        test.ok(window.exceptionReported instanceof window.exceptions.Exception);
        test.ok(window.exceptionReported.error() instanceof Error);
        test.done();
    },
    testHandleEvalError: function (test) {
        window.exceptions.handler._handle("foo", "url", 1, 1, new EvalError());
        test.equals(window.exceptionReported.name(), "EvalException");
        test.ok(window.exceptionReported instanceof window.exceptions.Exception);
        test.ok(window.exceptionReported.error() instanceof EvalError);
        test.done();
    },
    testHandleRangeError: function (test) {
        window.exceptions.handler._handle("foo", "url", 1, 1, new RangeError());
        test.equals(window.exceptionReported.name(), "RangeException");
        test.ok(window.exceptionReported instanceof window.exceptions.Exception);
        test.ok(window.exceptionReported.error() instanceof RangeError);
        test.done();
    },
    testHandleTypeError: function (test) {
        window.exceptions.handler._handle("foo", "url", 1, 1, new TypeError());
        test.equals(window.exceptionReported.name(), "TypeException");
        test.ok(window.exceptionReported instanceof window.exceptions.Exception);
        test.ok(window.exceptionReported.error() instanceof TypeError);
        test.done();
    },
    testHandleSyntaxError: function (test) {
        window.exceptions.handler._handle("foo", "url", 1, 1, new SyntaxError());
        test.equals(window.exceptionReported.name(), "SyntaxException");
        test.ok(window.exceptionReported instanceof window.exceptions.Exception);
        test.ok(window.exceptionReported.error() instanceof SyntaxError);
        test.done();
    },
    testHandleTypeError: function (test) {
        window.exceptions.handler._handle("foo", "url", 1, 1, new TypeError());
        test.equals(window.exceptionReported.name(), "TypeException");
        test.ok(window.exceptionReported instanceof window.exceptions.Exception);
        test.ok(window.exceptionReported.error() instanceof TypeError);
        test.done();
    },
    testHandleURIError: function (test) {
        window.exceptions.handler._handle("foo", "url", 1, 1, new URIError());
        test.equals(window.exceptionReported.name(), "URIException");
        test.ok(window.exceptionReported instanceof window.exceptions.Exception);
        test.ok(window.exceptionReported.error() instanceof URIError);
        test.done();
    }
};
