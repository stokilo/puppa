/**
 * Object to store test configuration data (test function name, optional parameters required for test run)
 */
window.$$$config = {};

/**
 * Object to store test results
 */
window.$$$result = {
    passed: true,
    executionTime: 0,
    error: null,
    isRunning: true
};

/**
 * Log to javascript console that appear on tested page
 * @param message to be logged.
 */
log2console = function(message) {
    jq_logger.success(message);
};

/**
 * Wait for HTML element to be present on the page.
 * Element is represented by jQuery selector.
 * 
 * @param {*} selector jQuery selector for element 
 * @param {*} promiseHandle function to be called if element appear on the page, it gets element as a parameter
 * @param {*} options object with options 
 *            'timeout' 
 *                     (number of ms after which runner stop waiting for element and throws an error)
 *            'pooling'
 *                     (an interval at which the selector is executed)
 */
var elem = async function (selector, promiseHandle, options) {
    var options = options || {};
    options.pooling = "pooling" in options && $.isNumeric(options.pooling) ? options.pooling : 1000;
    options.timeout = "timeout" in options && $.isNumeric(options.timeout) ? options.timeout : 60000;
    options.retry = "retry" in options ? options.retry : { retry: 0, wait: 0 };
    var stack = new Error().stack;

    try {
        if ($.isFunction(promiseHandle)) {
            await waitFor(selector, options.pooling, options.timeout, options.retry).then(
                ((elem) => {
                    try {
                        promiseHandle(elem);
                    } catch (err) {
                        throw new Error("Could not execute promise handler: " + err);
                    }
                })
            );
        } else {
            await waitFor(selector, options.pooling, options.timeout, options.retry).then(() => true);
        }
    } catch (error) {
        throw new Error(error + ' ' + stack);
    }

}

/**
 * Wait for selectorFunc to match any element on the page. Function must return an array of elements
 * that are expected to be present on the page.
 * 
 * @param {*} selector function that performs element search on the page
 * @param {*} promiseHandle function to be called if element appear on the page, it gets element as a parameter
 * @param {*} options object with options 
 *            'timeout' 
 *                     (number of ms after which runner stop waiting for element and throws an error)
 *            'pooling'
 *                     (an interval at which the selector function is executed)
 */
var felem = async function (selectorFunc, promiseHandle, options) {
    var options = options || {};
    options.pooling = "pooling" in options && $.isNumeric(options.pooling) ? options.pooling : 1000;
    options.timeout = "timeout" in options && $.isNumeric(options.timeout) ? options.timeout : 60000;
    options.retry = "retry" in options ? options.retry : { retry: 0, wait: 0 };
    var stack = new Error().stack;

    try {
        if ($.isFunction(promiseHandle)) {
            await waitFor(selectorFunc, options.pooling, options.timeout, options.retry).then(
                ((elem) => {
                    try {
                        promiseHandle(elem);
                    } catch (err) {
                        throw new Error("Could not execute promise handler: " + err + " " + err.stack);
                    }
                })
            );
        } else {
            await waitFor(selectorFunc, options.pooling, options.timeout, options.retry).then(() => true);
        }
    } catch (error) {
        throw new Error(error + ' ' + stack);
    }
}

/**
 * Function run the test that was registered in the global window.$$$config object.
 * Function register test results in global window.$$$result object.
 */
runTest = async function () {
    var t0 = performance.now();
    try {
        // config string2object
        window.$$$config = JSON.parse(window.$$$config);

        // check if test function name was registered in global scope is a function
        // if is an existing function in the scope then call it (run a test), otherwise show an error
        var fn = window[window.$$$config.testName];
        console.info("Running test: [" +window.$$$config.testName + "]");
        if (typeof fn === "function") {            
            await fn(window.$$$config);
            var t1 = performance.now();
            window.$$$result.executionTime = (t1 - t0);
            
        } else {
            throw ("Could not find function (or is not a function): [" + window.$$$config.testName + "]");
        }

        // success
        window.$$$result.passed = true;
        window.$$$result.isRunning = false;
    } catch (e) {
        // failure
        window.$$$result.error = e.message;
        window.$$$result.passed = false;
        window.$$$result.isRunning = false;
        var t1 = performance.now();
        window.$$$result.executionTime = (t1 - t0);
    }
}

/**
 * Wait for HTML element to be present on the page.
 * This function requires only @target argument to be provided. 
 * @target can be a valid jQuery selector to match HTML element or a function
 * that returns HTML element (in this case function implements page search).
 * 
 * Please note: default values are set for @pooling and @timeout 
 * 
 * @param {*} target html element we wait for to be loaded, can be jQuery selector or function that wraps it.
 * @param {*} pooling optional parameter that specified how often search for HTML element.
 * @param {*} timeout optional parameter that specify when to stop to search HTML element.
 * @param {*} retry optional parameter that specify an retry object, in case of element is not found runner will attemp to retry again 
 *                  i.e. {retry: 2, wait: 2000} it will attempt to retry 2 times, it will wait 2000 seconds after failed attempt
 */
var waitFor = async function (target, pooling, timeout, retry) {
    var fn = $.isFunction(target) ? target : () => $("#contentId").contents().find(target);
    var pooling_ = $.isNumeric(pooling) ? pooling : 1000;
    var timeout_ = $.isNumeric(timeout) ? timeout : 60000;


    var stat = await checkSelector(pooling_, timeout_, fn)
        .then(checkIsVisible);

    if (!stat.found) {
        if (retry.retry <= 0) {
            throw new Error("Element not found: [" + target + "]");
        } else {
            await wait(retry.delay);
            retry.retry = retry.retry - 1;
            return waitFor(target, pooling, timeout, retry);
        }

    }
    return stat.elem;
}
/**
 * Function that returns promise that we use for implementing delay.
 * 
 * @param {*} ms how long to wait in milliseconds.
 */
let wait = ms => new Promise(resolve => {
    setTimeout(resolve, ms)
}
);
let wait_ = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Function that execute given function @fn every @pooling and timeout after given @timeout.
 * Function @fn is a function that returns HTML element or array of HTML elements. If @fn won"t return
 * at least 1 element then it will be called again after @pooling until @timeout is reached.
 * 
 * Idea is to use this function to wait for HTML element to be present on the page. Because we can"t
 * wait infinitely that is why timeout is required.
 *  
 * @param {*} pooling number of milliseconds between @fn executions 
 * @param {*} timeout number of milliseconds after this function stop executing @fn
 * @param {*} fn function that is executed, must return HTML elements/array of elements 
 */
var checkSelector = (pooling, timeout, fn) => {

    var status = {
        found: false,
        timeout: timeout,
        elem: null,
        intervalID: setInterval(() => {

            var el = [], error = false;
            try {
                el = fn()
            } catch (err) {
                error = true;
                console.dir(err);
            }

            status.elem = el;
            status.found = error ? false : status.elem.length;
            status.timeout = error ? 0 : status.timeout - pooling;
        }, pooling)
    };
    return wait_(pooling).then(() => status);
};
/**
 * Helper function for @checkSelector to return found HTML element if is available on the page
 * or to continue waiting if not.
 * 
 * @param {String} status of selector check (if element found, timeout counter etc)
 */
var checkIsVisible = status => {
    if (status.timeout <= 0) {
        clearInterval(status.intervalID);
        return status;
    }
    if (status.found <= 0) {
        return wait_(1000).then(() => checkIsVisible(status));
    }
    clearInterval(status.intervalID);
    return status;
};

/**
 * Returns all HTML elements matching given criteria. This function search HTML elements
 * with specified tagName and text content.
 * 
 * Note: text content must be exactly that same as given argument @textContent.
 * Usage: elementByContent("span", "Login button").
 *  
 * @param {String} tagName HTML element tag name that should contain given @textContent.
 * @param {String} textContent exact text content that we are looking for.
 */
function elementByContent(tagName, textContent) {
    return $("#contentId").contents().find(tagName).filter(function () { return $(this).text() == textContent; }).filter(":visible");
}

/**
 * Returns all HTML elements matching given criteria. This function search HTML elements
 * with specified tagName and text content matched by provided regular expression.
 * 
 * Note: text content must be matched by provided regular expression, example usage to find all span elements
 * that starts with text Login
 * Usage: elementByRegex("span", new RegExp('^Login', 'i')).
 *  
 * @param {String} tagName HTML element tag name that should contain given @textContent.
 * @param {String} regex regular expression to match element text content
 */
function elementByRegex(tagName, regex) {
    return $("#contentId").contents().find(tagName).filter(function () { return regex.test($(this).text()); }).filter(":visible");
}

/**
 * Compare pdf text content with string returned by function "expectFnName"
 * @param {URL} pdfUrl url to fetch pdf document from
 * @param {FunctionName} expectFnName function name that return string with expected pdf text content
 */
var expectPdfContent = async function (pdfUrl, expectFnName) {
    var callerId = new Error().stack.split("\n")[2].trim();
    var pdf = await PDFJS.getDocument(pdfUrl);
    var pdfInfo = pdf.pdfInfo;
    var pdfText = "";

    for (var i = 1; i <= pdfInfo.numPages; i++) {
        var page = await pdf.getPage(i);
        var pageTextContent = await page.getTextContent();

        await pageTextContent.items.map(
            (item) => { pdfText = pdfText + item.str.trim() }
        );
    }

    var expected = expectFnName();
    expected = expected.replace(/(\r\n|\n|\r)/gm, "");

    if (pdfText !== expected) {
        //TODO: consider pdf diff report
        throw new Error("Pdf don't match: " + callerId);
    }
}

