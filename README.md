exceptions.js
======================
exceptions.js enhances Javscript error handling by providing a more comprehensive API for errors and by extending functionality of window.onerror.  exceptions.js is modeled off of C#'s exception infrastructure and provides the ability to record stacktraces, screenshots, inner exceptions with Javascript errors.  It also provides the ability to make post request that contain serialized exceptions so you can record and report Javascript errors.

Basic setup and usage
----------------------
```javascript
//Setup the exceptions handler to report errors when 
//you call Exception.report() or window.onerror executes
exeptions.handler
    .stacktraceUrl("http://cdnjs.cloudflare.com/ajax/libs/stacktrace.js/0.6.0/stacktrace.js")
    .html2canvasUrl("http://cdnjs.cloudflare.com/ajax/libs/html2canvas/0.4.1/html2canvas.js")
    .postUrl("http://localhost/handleException")
    .callback(function (exception) {
        console.log("We reported an exception!");
        console.log(exception);
    });
```
		
```javascript
//Report an exception.
var exception = new exceptions.Exception("Oh no!");
exception.report();

//Throw an exception.  The exceptions.handler will handle this thrown error when window.onerror is executed.
throw new exceptions.Exception("Oh no!");

//Include extra data with the exception.
throw new exceptions.Exception("Oh no!", {
    data: {
        foo: "bar"
    }
});

//The exceptions.handler will handle this thrown error when window.onerror is executed.  However, 
//you may find it more useful to throw an Exception rather than any arbirary object :)
throw "Oh no!";

```

API
----------------------
exceptions.js adds the exceptions property to the window object which exposes:

| Property | Description |
| -------- | ----------- |
| Exception | Base exception.  All other exceptions inherit from Exception. |
| ArgumentException | An exception inherited from Exception that is useful for throwing or reporting exceptions related to function arguments |
| InvalidOperationException | An exception inherited from Exception that is useful for throwing or reporting exceptions related to invalid operations |
| NotImplementedException | An exception inherited from Exception that is useful for throwing or reporting exceptions related to unimplemented code |
| EvalException | An exception inherited from Exception that is useful for throwing or reporting exceptions related to eval errors |
| RangeException | An exception inherited from Exception that is useful for throwing or reporting exceptions related to range errors |
| ReferenceException | An exception inherited from Exception that is useful for throwing or reporting exceptions related to reference errors |
| SyntaxException | An exception inherited from Exception that is useful for throwing or reporting exceptions related to syntax errors |
| TypeException | An exception inherited from Exception that is useful for throwing or reporting exceptions related to type errors |
| URIException | An exception inherited from Exception that is useful for throwing or reporting exceptions related to URI errors |
| createCustomException | Function you can use to create custom functions.  ArgumentException, InvalidOperationException, and NotImplementedException are all created with createCustomException |
| handler | Object responsible for handling errors thrown that hit window.onerror and specifying global configurations including the stacktrace.js url, html2canvas.js url, post url (to make a post request when an error is reported), post headers, callback (function executed when an error is reported). |

### Exception

##### constructor
Exception is the base Exception class that wraps an error and provides extra functionality that the native Error class does not provide.  The Exception class can be extended to create custom exceptions with the exceptions.createCustomException.

_parameters_

| Parameter | Type | Required | Description |
| --------  | ---- | -------- | ----------- |
| message | string or Error | no | Create an Exception with an Error object or error message.  This constructor will create a new Error(message) if you pass in a message or simply use the provided Error as the underlying Error it wraps. |
| config | object | no | Configure the exception with a config object.  All properties on the config are optional. |

_config_

| Property | Type | Description |
| -------- | ---- | ----------- |
| name | string | provide a name for the exception.  If no name is provided, we check if you manually set the name on the error created from this exception.  Otherwise, we fallback to the name of this exception's constructor.  Name is purely used for reporting purposes.  No functionality pivots off of name.  And the common case should be to not provide a name. |
| innerException | Exception | Exceptions are recursive, so you can create an inner exception that is wrapped by the current exception. |
| data | object | Provide any information you want to associate with this Exception.  You'll notice a screenshot property is added to the data object when the screenshot option is enabled for this Exception.  Also, a browser property is added to the data object. |
| optionsFunc | function | Provide a function that takes in an Options object and returns that Options object with enabled or disabled options.  The received options object will be Options object returned from the defaultOptionsFunc for the exception.  In most cases, the defaultOptionsFunc returns an Options object with all options enabled. |

_return_

| Type | Description |
| ---- | ----------- |
| Exception | The created exception |

```javascript
var foo = new exceptions.Exception("Oh no!");
var bar = new exceptions.Exception(new Error("Oh no!");
var baz = new exceptions.Exception("Oh no!" { 
    name: "OverriddenExceptionName",
    innerException: foo,
    data { 
        foo: "bar"
    },
    optionsFunc: function (o) {
        return o.stacktrace(false)
            .screenshot(false);
    }
});
```

##### static functions
###### throwIf
Throw an exception if the condition is true.

_parameters_

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| condition | bool | yes | throw the exception if true |
| message | string | no | create an exception with the message if provided.  Else fallback to a generic message. |


```javascript
exceptions.Exception.throwIf(1 === 1, "Error message");
```

###### reportIf

Report an exception if the condition is true.

_parameters_

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| condition | bool | yes | report the exception if true |
| message | string | no | create an exception with the message if provided.  Else fallback to a generic message. |


```javascript
exceptions.Exception.reportIf(1 === 1, "Error message");
```

##### methods

###### innerException

Get the inner exception

_return_

| Type | Description |
| ---- | ----------- |
| Exception | inner exception |

###### stacktrace

Get the stacktrace

_return_

| Type | Description |
| ---- | ----------- |
| string | stacktrace |

###### data

Get data object

_return_

| Type | Description |
| ---- | ----------- |
| object | data object |

###### options

Get the options

_return_

| Type | Description |
| ---- | ----------- |
| Options | options for the exception |

###### name

Get the name

_return_

| Type | Description |
| ---- | ----------- |
| string | name of the exception |

###### error

Get the underlying Error

_return_

| Type | Description |
| ---- | ----------- |
| Error | underlying Error |

###### message

Get the error message

_return_

| Type | Description |
| ---- | ----------- |
| string | error message |

###### report

Report the exception (without throwing it).  Reporting an exception involves making a post request with a serialized exception object if the post option is enabled and/or executing a callback if the callback option is enabled.  The post request uses the url returned from exception.handler.postUrl() and headers returned from exception.handler.postHeaders().  It will not make a post request if no url is specified.  The callback will execute the function returned from exceptions.handlers.callback and will not execute the callback if no function is specified.


###### toSerializableObject

Convert an Exception into a simple object that is easier to serialize.

_return_

| Type | Description |
| ---- | ----------- |
| object | { name: name, message: message, stacktrace: stacktrace, data: data, innerException: serializable inner exception object, error: underlying error } |

###### toJSONString

Convert a serializable exception object created from toSerializableObject into a JSON string.

_return_

| Type | Description |
| ---- | ----------- |
| string | JSON string of serializable exception object |


### ArgumentException
ArgumentException inherits from Exception.  It has the same static functions and methods as Exception.  However, it's default name is "ArgumentException" rather than "Exception."  Use ArgumentException to throw or report invalid arguments.

### InvalidOperationException
InvalidOperationException inherits from Exception.  It has the same static functions and methods as Exception.  However, it's default name is "InvalidOperationException" rather than "Exception."  Use InvalidOperationException to throw or report invalid operations.

### NotImplementedException
NotImplementedException inherits from Exception.  It has the same static functions and methods as Exception.  However, it's default name is "NotImplementedException" rather than "Exception."  Use NotImplementedException to throw or report attempts of executed code that is not implemented.

### EvalException
NotImplementedException inherits from Exception.  It has the same static functions and methods as Exception.  However, it's default name is "NotImplementedException" rather than "Exception."  Use NotImplementedException to throw or report attempts of executed code that is not implemented.  And the default error will be an EvalError.

### RangeException
NotImplementedException inherits from Exception.  It has the same static functions and methods as Exception.  However, it's default name is "NotImplementedException" rather than "Exception."  Use NotImplementedException to throw or report attempts of executed code that is not implemented.  And the default error will be a RangeError.

### ReferenceException
NotImplementedException inherits from Exception.  It has the same static functions and methods as Exception.  However, it's default name is "NotImplementedException" rather than "Exception."  Use NotImplementedException to throw or report attempts of executed code that is not implemented.  And the default error will be a ReferenceError.

### SyntaxException
NotImplementedException inherits from Exception.  It has the same static functions and methods as Exception.  However, it's default name is "NotImplementedException" rather than "Exception."  Use NotImplementedException to throw or report attempts of executed code that is not implemented.  And the default error will be a SyntaxError.

### TypeException
NotImplementedException inherits from Exception.  It has the same static functions and methods as Exception.  However, it's default name is "NotImplementedException" rather than "Exception."  Use NotImplementedException to throw or report attempts of executed code that is not implemented.  And the default error will be a TypeError.

### URIException
NotImplementedException inherits from Exception.  It has the same static functions and methods as Exception.  However, it's default name is "NotImplementedException" rather than "Exception."  Use NotImplementedException to throw or report attempts of executed code that is not implemented.  And the default error will be a URIError.

##createCustomException
Create a custom exception class with the createCustomException function

_parameters_

| Parameter | Type | Required | Description |
| --------  | ---- | -------- | ----------- |
| config | object | yes | config object to create the custom exception |

_config_

| Property | Type | Description |
| -------- | ---- | ----------- |
| exception | function | Constructor for the custom exception.  This constructor should call its base exception's constructor.  For debugging convenience, you'll probably want this function to have a name. |
| baseException | Exception | Exception that the custom exception will inherit from |
| defaultOptionsFunc | function | Provide a function that takes in an Options object and returns that Options object with enabled or disabled options.  You'll usually want to enable all options by default. |


_return_

| Type | Description |
| ---- | ----------- |
| object | Custom exception.  The type will be the function you provided in the config.exception property. |


```javascript
var ArgumentException = createCustomException({ 
    exception: function ArgumentException(message, config) {
        if (!(this instanceof ArgumentException)) {
            return new ArgumentException(message, config);
        }
        Exception.call(this, message, config);
    },
    baseException: Exception
});
```
```javascript
var FooArgumentException = createCustomException({ 
    exception: function FooArgumentException(message, config) {
        if (!(this instanceof FooArgumentException)) {
            return new FooArgumentException(message, config);
        }
        ArgumentException.call(this, message, config);
    },
    baseException: ArgumentException,
    defaultOptionsFunc: function (o) { return o.toggleAll(true).callback(false); }
});
```


##handler
The handler is responsible for handling errors thrown that hit window.onerror and specifying global configurations including the stacktrace.js url, html2canvas.js url, post url (to make a post request when an error is reported), post headers, callback (function executed when an error is reported).

##### static properties
###### scopeObject
Scope options for the handler.  Options are none, exceptions, and all.  Setting the scope to none signals that the handler won't handle anything in window.onerror.  Setting the scope to exceptions signals that the handler will handle only thrown Exceptions, nothing else that is thrown.  Setting the scope to all signals that the handler will handle everything in window.onerror.

##### static functions
###### scope
Get or set the scope of the handler when executed in window.onerror.  Scope refers to handler.scopeObject which has three options: none, exceptions, and all.  Setting the scope to none signals that the handler won't handle anything in window.onerror.  Setting the scope to exceptions signals that the handler will handle only thrown Exceptions, nothing else that is thrown.  Setting the scope to all signals that the handler will handle everything in window.onerror.

_parameters_

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| scope | int | no | Set the handler scope if specified.  Use window.handler.scopeOption. |

_return_

| Type | Description |
| ---- | ----------- |
| handler|scopeOption | The handler if scope is defined, value of the handler scope is not defined. |


```javascript
handler.scope(handler.scopeOption.all)
```

###### guard
Get or set a guard that will be used to restrict Exception options.
_parameters_

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| guardFunc | function | no | Function that receives one parameter: Guard and should return the received Guard. |

_return_

| Type | Description |
| ---- | ----------- |
| handler|Guard | The handler if guardFunc is defined.  Handler's guard if guardFunc is not defined. |


```javascript
handler.guard(function (g) {
    return g.restrictByExceptionsCount(10, 2)
            .restrictBy(function (o, exception) {
                if ( exception instanceof exceptions.SyntaxException) {
                    o.stacktrace(false);
                }
                return o;
            });
});
```

###### html2canvasUrl
Get or set url that pulls html2canvas.js.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| html2canvasUrl | string | no | url to html2canvas.js |

_return_

| Type | Description |
| ---- | ----------- |
| handler|string | Handler if html2canvasUrl is defined.  Url to html2canvas.js if the html2canvasUrl is not defined. |


###### stacktraceUrl
Get or set url that pulls html2canvas.js.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| stacktraceUrl | string | no | url to stacktrace.js |

_return_

| Type | Description |
| ---- | ----------- |
| handler|string | Handler if stacktraceUrl is defined.  Url to stacktrace.js if stacktraceUrl is not defined. |

###### postUrl
Get or set url used to post the serialized exception when reported.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| postUrl | string | no | post request url |

_return_

| Type | Description |
| ---- | ----------- |
| handler|string | Handler if postUrl is defined.  Url for post request if postUrl is not defined. |

###### postHeaders
Get or set HTTP headers used to post the serialized exception when reported.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| postHeaders | array | no | Array of objects with the form { bstrHeader: "header", bstrValue: "value" } |

_return_

| Type | Description |
| ---- | ----------- |
| handler|string | Handler if postHeaders is defined.  Post headers for post request if postHeaders is not defined. |

###### callback
Get or set callback that will be executed when an Exception is reported.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| callback | function | no | callback that will be executed when the Exception is reported. |

_return_

| Type | Description |
| ---- | ----------- |
| handler|function | Handler if callback is defined.  Callback if callback is not defined. |


###### loadStacktraceJs
Asynchronously load stacktrace.js

###### loadHtml2Canvas
Asynchronously load html2cavas.js and execute the callback when the script is loaded.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| callback | function | no | callback that will be executed when html2canvas.js has loaded|

###### reportedExceptions
Get all reported exceptions.  This includes all exeptions reported with report() and all errors handled by exeptions.handler in window.onerror.

###### retrieveReportedExceptionsCount
Helper function to get the count of reported exceptions (see handler.reportedExceptions) within the past x number of seconds.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| seconds | int | no | Last number of seconds for which we care to count exceptions.  If not specified, we'll use the total number of exceptions reported since the exception handler was setup.|

##Options
Options for an exception.  Options include retrieving a stacktrace, printing a screenshot, posting a serialized JSON representation of an exception to a specified url when the exception is reported, and/or excecuting a callback that recieves the exception when the exception is reported.  exceptions.js does not expose a way to create an Options object.  Instead, it passes an Options object to a few functions which are expected to manipulate and return the object.  Functions that receive an Options object are optionsFunc, defaultOptionsFunc, and restrictFunc.

##### methods

###### stacktrace
Get or set the retrieve stacktrace option.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| enable | bool | no | Return the current option if undefined.  Enable the stacktrace option if enable is true.  Disable the stacktrace option if enable is false. |

_return_

| Type | Description |
| ---- | ----------- |
| Options|bool | Options object if enable is defined, value of the stacktrace option if enable is not defined. |

###### screenshot
Get or set the retrieve screenshot option.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| enable | bool | no | Return the current option if undefined.  Enable the screenshot option if enable is true.  Disable the screenshot option if enable is false. |

_return_

| Type | Description |
| ---- | ----------- |
| Options|bool | Options object if enable is defined, value of the screenshot option if enable is not defined. |

###### post
Get or set the retrieve post option.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| enable | bool | no | Return the current option if undefined.  Enable the post option if enable is true.  Disable the post option if enable is false. |

_return_

| Type | Description |
| ---- | ----------- |
| Options|bool | Options object if enable is defined, value of the post option if enable is not defined. |

###### callback
Get or set the retrieve callback option.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| enable | bool | no | Return the current option if undefined.  Enable the callback option if enable is true.  Disable the callback option if enable is false. |

_return_

| Type | Description |
| ---- | ----------- |
| Options|bool | Options object if enable is defined, value of the callback option if enable is not defined. |

###### toggleAll
Toggle all options according to the enable parameter

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| enable | bool | no | Enable all options if true.  Disable all options if false or undefined. |

_return_

| Type | Description |
| ---- | ----------- |
| Options | Options object |

##Guard
Performing exception operations can be expensive or superfluous sometimes.  For example, you may not want to take a screenshot of your page if you've hit 10 errors in a row because it could cause noticable performance errors. Specify a guard with exceptions.handler.guard() to disable exception options you do not wish to perform. The guard restricts options for all reported exceptions.  exceptions.js does not expose a way to create a Guard object.  Instead, it passes a Guard object to the guardFunc specified in handler.guard.  The guardFunc is expected to manipulate and return the Guard.

###### restrictByExceptionsCount
Disable Exception options if the exception reported count threshold has been exceeded.  See handler.reportedExceptions for more information about how we defined a reported exception.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| count | int | yes | Threshold that must not be exceed lest you'll disable Exception options. |
| seconds | int | no | Last number of seconds for which we care to count exceptions.  If not specified, we'll use the total number of exceptions reported since the exception handler was setup. |
| optionsFunc | function | no | function that enables/disables and returns the options if the exception threshold has been exceeded.  If not specified, we'll disable all options for the Exception.  You'll likely only want to disable options in this function. |


_return_

| Type | Description |
| ---- | ----------- |
| Guard | The guard |

```javascript
handler.guard(function (g) {
    return g.restrictByExceptionsCount(10, 2, function (o) { return o.stacktrace(false); });
});
```

###### restrictBy
Disable Exception options with a specified restriction function.  Note: see window.handler.retrieveReportedExceptionsCount and window.handler.reportedExceptions for a convient utilities.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| restrictFunc | function | yes | Function that disables Exception options and returns the options object.  The function will receive two parameters: the current options for the Exception and the Exception itself.  It should return the provided options object. |

_return_

| Type | Description |
| ---- | ----------- |
| Guard | The guard |

```javascript
handler.guard(function (g) {
    return g.restrictBy(function (o, exception) {
                if ( exception instanceof exceptions.SyntaxException) {
                    o.stacktrace(false);
                }
                return o;
           });
});
```
