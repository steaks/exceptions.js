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
var exception = new Exception("Oh no!");
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

Namespace
----------------------
exceptions.js adds the exceptions property to the window object which exposes:
```javascript
window.exceptions = {
    //Base Exception.  All other exceptions inherit from Exception
    Exception: Exception,
    //Argument excpetion, useful for throwing or reporting exceptions related to function arguments
    ArgumentException: ArgumentException,
    //Invalid operation excpetion, useful for throwing or reporting exceptions related to invalid operations
    InvalidOperationException: InvalidOperationException,
    //Not implemented exception, useful for throwing or reporting exceptions related to unimplemented code
    NotImplementedException: NotImplementedException,
    //Function you can use to create custom functions.  ArgumentException, InvalidOperationException, and
    //NotImplementedException are all created with createCustomException
    createCustomException: createCustomException,
    //object responsible for handling errors thrown that hit window.onerror and specifying global configurations
    //including the stacktrace.js url, html2canvas.js url, post url (to make a post request when an error is reported),
    //post headers, callback (function executed when an error is reported).
    handler: handler,
};
```
