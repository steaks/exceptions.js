exceptions.js
======================
Exceptions.js is the library that makes Javascript Errors useful.  Include stacktraces, screenshots, DOM dumps, browser information, etc. when users hit Javascript errors.  The library can be used as a standalone open source project or can be used with the exceptionsjs platform (https://www.exceptionsjs.com) which translates reported exceptions into emails and delivers them to registered developers.  See demos here: https://www.exceptionsjs.com/demo.

Basic setup and usage
----------------------
```javascript
<script type="text/javascript" src="path/to/exceptions.js"></script>

ex.handler
    //Reporting to exceptionsjs platform is the easiest way to track your exceptions.
    //Register for free at https://www.exceptionsjs.com.
    .reportToExceptionsJsPlatform({ clientId: "CLIENT_ID" })
    //Set a custom report post request that will be issued when an exception is reported.
    //if you want to bypass the exceptionsjs platform and handle the exception yourself.
    .reportPost({ url: "http://localhost/path/to/errorhandler/" });
```

```javascript
//exceptions.js will handle any error.
var foo = {}, oops = foo.uhoh.doesNotExist;
throw new Error("Something went wrong!");
throw "Something went wrong!";

//you can also report exceptions.
new ex.Exception("Something went wrong!").report();

//or throw an exception.
throw new ex.Exception("Something went wrong!");

//exceptions.js provides convienence methods that make code more readable.
function myFunc(requiredArg) {
    ex.throwIf(!requiredArg, "The requiredArg argument was not provided!!!");
}

//and types that make errors more explicit
function WillWriteInTheFuture() {
    throw ex.NotImplementedException();
}

//and other useful features including support for inner exceptions,
//ability to include extra data with your exceptions, abilities protect
//against bursts or repeated exceptions
```

API
----------------------
exceptions.js adds the exceptions property to the window object which exposes:

| Property | Description |
| -------- | ----------- |
| handler | Object responsible for handling errors thrown that hit window.onerror and specifying global configurations including the stacktrace.js url, html2canvas.js url, post url (to make a post request when an error is reported), post headers, callback (function executed when an error is reported). |
| Guard | Guard to protect your page from slowing down or a large influx of error emails when your application encounters a burst of exceptions |
| Options | Options for what should be turned on or off when reporting an individual exception. |
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
| throwIf | Shorthand method to invoke Exception.throwIf.  Use this function to conditionally throw exceptions. |
| reportIf | Shorthand method to invoke Exception.reportIf.  Use this function to conditionally throw exceptions.  |

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
| options | Options | Provide an Options object In most cases, the defaultOptions  will be sufficient and this property is not needed. |

_return_

| Type | Description |
| ---- | ----------- |
| Exception | The created exception |

```javascript
var foo = new ex.Exception("Oh no!");
var bar = new ex.Exception(new Error("Oh no!");
var baz = new ex.Exception("Oh no!", {
    name: "OverriddenExceptionName",
    innerException: foo,
    data: {
        foo: "bar"
    },
    options: new ex.Options().stacktrace(false).screenshot(false)
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
ex.Exception.throwIf(1 === 1, "Error message");
```

###### reportIf

Report an exception if the condition is true.

_parameters_

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| condition | bool | yes | report the exception if true |
| message | string | no | create an exception with the message if provided.  Else fallback to a generic message. |


```javascript
ex.Exception.reportIf(1 === 1, "Error message");
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

Report the exception (without throwing it).  Reporting an exception involves making a post request with a serialized exception object if the post request option is enabled, posting to the exception.js platform, and/or executing a custom report function if the report callback option is enabled.


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
| defaultOptions | Options | Options that will be used by default for the exception if no others are specified.  You'll usually want to enable all options by default. |


_return_

| Type | Description |
| ---- | ----------- |
| object | Custom exception.  The type will be the function you provided in the config.exception property. |


```javascript
var ArgumentException = ex.createCustomException({
    exception: function ArgumentException(message, config) {
        if (!(this instanceof ArgumentException)) {
            return new ArgumentException(message, config);
        }
        ex.Exception.call(this, message, config);
    },
    baseException: ex.Exception
});
```
```javascript
var FooArgumentException = ex.createCustomException({
    exception: function FooArgumentException(message, config) {
        if (!(this instanceof FooArgumentException)) {
            return new FooArgumentException(message, config);
        }
        ex.ArgumentException.call(this, message, config);
    },
    baseException: ex.ArgumentException,
    defaultOptions: new ex.Options().toggleAll(true).reportCallback(false)
});
```


##handler
The handler is responsible for handling errors thrown that hit window.onerror and specifying global configurations including the stacktrace.js url, html2canvas.js url, post url (to make a post request when an error is reported), post headers, callback (function executed when an error is reported).

##### static properties
###### scopeOption
Scope options for the handler.  Options are none, exceptions, and all.  Setting the scope to none signals that the handler won't handle anything in window.onerror.  Setting the scope to exceptions signals that the handler will handle only thrown Exceptions, nothing else that is thrown.  Setting the scope to all signals that the handler will handle everything in window.onerror.

##### static functions
###### scope
Get or set the scope of the handler when executed in window.onerror.  Scope refers to handler.scopeOption which has three options: none, exceptions, and all.  Setting the scope to none signals that the handler won't handle anything in window.onerror.  Setting the scope to exceptions signals that the handler will handle only thrown Exceptions, nothing else that is thrown.  Setting the scope to all signals that the handler will handle everything in window.onerror.

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
| guard | Guard | no | guard that protects against bursts of exceptions, repeated exceptions, or any other exceptions that should not be reported. |

_return_

| Type | Description |
| ---- | ----------- |
| handler|Guard | The handler if guard is defined.  Handler's guard if guard is not defined. |


```javascript
ex.handler.guard(new ex.Guard()
    //Protect against a burst of exceptions where you're considering
    //a "burst" 10 exceptions in the last two seconds.  This protection
    //will ensure that we'll never report more than 10 exceptions in a
    //2 second window.
    .protectAgainstBurst({ count: 10, seconds: 2 })
    //Protect against any situation you desire with the protectAgainst
    //funciton.  We happen to be protecting ourselves from generating
    //a stacktrace for SyntaxExceptions.  Note, this is an arbitrary
    //protection and not necessary.  It is only used to show you can
    //protect against any situation and can turn on/off options individually.
    .protectAgainst(function (o, exception) {
        if (exception instanceof ex.SyntaxException) {
            o.stacktrace(false);
        }
        return o;
    }));
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

###### reportPost
Get or set the configuration used to post the serialized exception when reported.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| config | object | no | Configuration for how to send the post request to report the exception to an arbitrary url |

| Property | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| postUrl | string | yes | post request url |
| postHeaders | array | no | Array of objects with the form { bstrHeader: "header", bstrValue: "value" } |

_return_

| Type | Description |
| ---- | ----------- |
| handler|config | Handler if postUrl is defined.  Config for post request if config parameter is not defined. |

###### reportCallback
Get or set callback that will be executed when an Exception is reported.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| callback | function | no | callback that will be executed when the Exception is reported. |

_return_

| Type | Description |
| ---- | ----------- |
| handler|function | Handler if callback is defined.  Callback if callback is not defined. |

###### reportToExceptionsjsPlatform
Enable posting to exceptionsjs platform.  The exceptionsjs platform handles your Javascript error by parsing the serialized exception and constructing a useful exception email that includes stacktraces, screenshots, and extra information.  Register for exceptionsjs platform at https://exceptionsjs.com.  This option only works if you've enabled the option to allow unsecure reporting.  If you have enabled secure reporting you must send your exceptions to excpetionsjs platform using the full oauth2 process.  See https://exceptionsjs.com for useful libraries in many languages that make submitting exceptions with the full oauth2 process easy.

| Parameter | Type | Required | Description |
| --------- | ---- | --------- | ----------- |
| config | object | no | configuration object to specify how you want to report to the exceptionsjs platform |

| Property | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| clientId | string | no | clientId that will be used with exceptionsjs platform |
| to | string | no | email address that will receive the exception |

_return_

| Type | Description |
| ---- | ----------- |
| handler|object | Handler if config is defined.  Object for configuration of how you're reporting to exceptions.js platform if undefined |

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
Options for an exception.  Options include retrieving a stacktrace, printing a screenshot, posting a serialized JSON representation of an exception to a specified url when the exception is reported, posting a request to the exceptionsjs platform, and/or excecuting a reportCallback that receives the exception when the exception is reported.

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

###### reportPost
Get or set the retrieve post option.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| enable | bool | no | Return the current option if undefined.  Enable reporting to an arbitrary url via a post request option if enable is true.  Disable the option if enable is false. |

_return_

| Type | Description |
| ---- | ----------- |
| Options|bool | Options object if enable is defined, value of the post option if enable is not defined. |

###### reportCallback
Get or set the report callback option.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| enable | bool | no | Return the current option if undefined.  Enable the callback option if enable is true.  Disable the callback option if enable is false. |

###### reportToExceptionsJsPlatform
Get or set the report to exceptionsjs platform option.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| enable | bool | no | Return the current option if undefined.  Enable the post to reportToExceptionsJsPlatform if enable is true.  Disable the reportToExceptionsJsPlatform option if enable is false. |

_return_

| Type | Description |
| ---- | ----------- |
| Options|bool | Options object if enable is defined, value of the callback option if enable is not defined. |

###### DOMDump
Get or set the DOM dump option.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| enable | bool | no | Return the current option if undefined.  Enable the DOM dump option if enable is true.  Disable the DOM dump option if enable is false. |

_return_

| Type | Description |
| ---- | ----------- |
| Options|bool | ptions object if enable is defined, value of the DOM dump option if enable is not defined. |


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
Performing exception operations can be expensive or superfluous sometimes.  For example, you may not want to take a screenshot of your page if you've hit 10 errors in a row because it could cause noticable performance errors. Specify a guard with ex.handler.guard() to disable exception options you do not wish to perform. The guard restricts options for all reported exceptions.

###### protectAgainstBurst
Disable Exception options if the exception reported count threshold has been exceeded.  See handler.reportedExceptions for more information about how we defined a reported exception.

| Parameter | Type | Required | Description |
| --------- | ---- | --------- | ----------- |
| config | object | yes | configuration object to specify how you want to protect your page from bursts of exceptions |

| Property | Type | Required | Description |
| -------- | ---- | -------- | ----------- |
| count | int | yes | Threshold that must not be exceed lest you'll disable Exception options. |
| seconds | int | no | Last number of seconds for which we care to count ex.  If not specified, we'll use the total number of exceptions reported since the exception handler was setup. |
| optionsFunc | function | no | function that enables/disables and returns the options if the exception threshold has been exceeded.  If not specified, we'll disable all options for the Exception.  You'll likely only want to disable options in this function. |


_return_

| Type | Description |
| ---- | ----------- |
| Guard | The guard |

```javascript
ex.handler.guard(new ex.Guard()
    .protectAgainstBurst({
        count: 10,
        seconds: 2,
        optionsFunc: function (o) { return o.stacktrace(false); }
    }));
```

###### protectAgainst
Disable Exception options with a specified restriction function.  Note: see window.handler.retrieveReportedExceptionsCount and window.handler.reportedExceptions for a convient utilities.

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| restrictFunc | function | yes | Function that disables Exception options and returns the options object.  The function will receive two parameters: the current options for the Exception and the Exception itself.  It should return the provided options object. |

_return_

| Type | Description |
| ---- | ----------- |
| Guard | The guard |

```javascript
ex.handler.guard(new ex.Guard()
    //Protect against a burst of exceptions where you're considering
    //a "burst" 10 exceptions in the last two seconds.  This protection
    //will ensure that we'll never report more than 10 exceptions in a
    //2 second window.
    .protectAgainstBurst({ count: 10, seconds: 2 })
    //Protect against any situation you desire with the protectAgainst
    //funciton.  We happen to be protecting ourselves from generating
    //a stacktrace for SyntaxExceptions.  Note, this is an arbitrary
    //protection and not necessary.  It is only used to show you can
    //protect against any situation and can turn on/off options individually.
    .protectAgainst(function (o, exception) {
        if (exception instanceof ex.SyntaxException) {
            o.stacktrace(false);
        }
        return o;
    }));
```
