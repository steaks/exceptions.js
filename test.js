window = {};
var nodeunit = require("nodeunit");
require("exceptions");
require("stacktrace");

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
    testType: function (test) {
        var exception = new window.exceptions.Exception("foo", {
            type: "bar"
        });
        test.equals(exception.type(), "bar");
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
            options: function (o) {
                return o.callback(false);
            }
        });
        test.equals(exception.options().callback(), false);
        test.done();
    },
    testOptionAllfalse: function (test) {
        var exception = new window.exceptions.Exception("foo", {
            options: function (o) {
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
        //we have a Error.stack property
        test.equals(exception.options().stacktrace(), true);
        test.equals(exception.options().screenshot(), false);
        test.equals(exception.options().post(), false);
        //we've set the post url
        test.equals(exception.options().callback(), true);
        test.done();
    },
    //Exception static functions
    testReportIfTrue: function (test) {
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
    testToSimpleObject: function (test) {
        var data = { foo: "bar" }
            exception = new window.exceptions.Exception("foo", {
                data: data
            }),
            simpleObject = exception.toSimpleObject();
        test.equals(simpleObject.message, "foo");
        test.equals(simpleObject.data, data);
        test.done();             
    },
    //Custom Exceptions
    testArgumentException: function (test) {
        var argumentException = new window.exceptions.ArgumentException("foo");
        argumentException.report();
        test.equals(argumentException.callbackExecuted, true);
        test.equals(argumentException.type(), "ArgumentException");
        test.done();
    },
    testInvalidOperationException: function (test) {
        var invalidOperationException = new window.exceptions.InvalidOperationException("foo");
        invalidOperationException.report();
        test.equals(invalidOperationException.callbackExecuted, true);
        test.equals(invalidOperationException.type(), "InvalidOperationException");
        test.done();
    },
    testNotImplementedException: function (test) {
        var notImplementedException = new window.exceptions.NotImplementedException("foo");
        notImplementedException.report();
        test.equals(notImplementedException.callbackExecuted, true);
        test.equals(notImplementedException.type(), "NotImplementedException");
        test.done();
    },
    testCreateCustomException: function (test) {
        var CustomException = window.exceptions.createCustomException({ 
                    exception: function CustomException(message, config) {
                    if (!(this instanceof CustomException)) {
                        return new CustomException(message, config);
                    }
                    window.exceptions.Exception.call(this, config);
                },
                baseException: window.exceptions.Exception, 
                defaultType: "CustomException"
            }),
            instance = new CustomException("foo");
        instance.report();
        test.equals(CustomException.defaultType(), "CustomException");
        test.equals(instance.type(), "CustomException");
        test.equals(instance.callbackExecuted, true);
        test.done();
    },
    testTwoLayerCustomException: function (test) {
        var CustomArgumentException = window.exceptions.createCustomException({ 
                    exception: function CustomArgumentException(message, config) {
                    if (!(this instanceof CustomArgumentException)) {
                        return new CustomArgumentException(message, config);
                    }
                    window.exceptions.ArgumentException.call(this, config);
                },
                baseException: window.exceptions.ArgumentException, 
                defaultType: "CustomArgumentException"
            }),
            instance = new CustomArgumentException("foo");
        instance.report();
        test.equals(CustomArgumentException.defaultType(), "CustomArgumentException");
        test.equals(instance.type(), "CustomArgumentException");
        test.equals(instance.callbackExecuted, true);
        test.done();
    }
};








