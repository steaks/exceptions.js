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
//report an exception
var exception = new exceptions.Exception("Oh no!");
exception.report();

//throw an exception
throw new exceptions.Exception("Oh no!");

//include extra data with the exception
throw new exceptions.Exception("Oh no!", {
    data: {
        foo: "bar"
    }
});

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
| type | string | Provide a type to override the default exception type.  Type is purely used for reporting purposes.  No functionality pivots off of type. |
| innerException | Exception | Exceptions are recursive, so you can create an inner exception that is wrapped by the current exception. |
| data | object | Provide any information you want to associate with this Exception.  You'll notice a screenshot property is added to the data object when the screenshot option is enabled for this Exception.  Also, browser and browser version properties are added to the data object. |
| optionsFunc | function | Provide a function that takes in an Options object and returns that Options object with enabled or disabled options.  The received options object will be Options object returned from the defaultOptionsFunc for the exception.  In most cases, the defaultOptionsFunc returns an Options object with all options enabled. |

_return_

| Type | Description |
| ---- | ----------- |
| Exception | The created exception |

```javascript
var foo = new exceptions.Exception("Oh no!");
var bar = new exceptions.Exception(new Error("Oh no!");
var baz = new exceptions.Exception("Oh no!" { 
    type: "OverriddenExceptionType",
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
| message | string | no | create an exception with the message if provided.  Else fallback to the default type of the exception. |


```javascript
exceptions.Exception.throwIf(1 === 1, "Error message");
```

###### reportIf

Report an exception if the condition is true.

_parameters_

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| condition | bool | yes | report the exception if true |
| message | string | no | create an exception with the message if provided.  Else fallback to the default type of the exception. |


```javascript
exceptions.Exception.reportIf(1 === 1, "Error message");
```

###### defaultType

Get or set the default type of the exception.

_parameters_

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| type | string | no | default type of the exception |
| message | string | no | create an exception with the message if provided.  Else fallback to the default type of the exception. |

_return_

| Type | Description |
| ---- | ----------- |
| Exception or string | exception if type is defined.  Default type of the exception if defaultType is not defined. |

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

###### type

Get the type

_return_

| Type | Description |
| ---- | ----------- |
| string | type of the exception |

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
| object | { type: type, message: message, stacktrace: stacktrace, data: data, innerException: serializable inner exception object, error: underlying error } |

###### toJSONString

Convert a serializable exception object created from toSerializableObject into a JSON string.

_return_

| Type | Description |
| ---- | ----------- |
| string | JSON string of serializable exception object |


### ArgumentException
ArgumentException inherits from Exception.  It has the same static functions and methods as Exception.  However, it's default type is "ArgumentException" rather than "Exception."  Use ArgumentException to throw or report invalid arguments.

### InvalidOperationException
InvalidOperationException inherits from Exception.  It has the same static functions and methods as Exception.  However, it's default type is "InvalidOperationException" rather than "Exception."  Use InvalidOperationException to throw or report invalid operations.

### NotImplementedException
NotImplementedException inherits from Exception.  It has the same static functions and methods as Exception.  However, it's default type is "NotImplementedException" rather than "Exception."  Use NotImplementedException to throw or report attempts of executed code that is not implemented.

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
| defaultType | string | Default type of the exception |
| defaultOptionsFunc | function | Provide a function that takes in an Options object and returns that Options object with enabled or disabled options.  You'll usually want to enable all options by default. |


_return_

| Type | Description |
| ---- | ----------- |
| {object} | Custom exception.  The type will be what you provided in the config.exception property. |


```javascript
var ArgumentException = createCustomException({ 
    exception: function ArgumentException(message, config) {
        if (!(this instanceof ArgumentException)) {
            return new ArgumentException(message, config);
        }
        Exception.call(this, config);
    },
    baseException: Exception, 
    defaultType: "ArgumentException"
});
```
