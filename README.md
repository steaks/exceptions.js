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
