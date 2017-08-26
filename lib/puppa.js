/**
 * Object to store test configuration data (test function name, optional parameters required for test run)
 */
window.$$$config= {};

/**
 * Object to store test results
 */
window.$$$result = {
    passed: true,
    error: null,
    isRunning: true
};

/**
 * Function run the test that was registered in the global window.$$$config object.
 * Function register test results in global window.$$$result object.
 */
runTest = async function () {
    try {
        // config string2object
        window.$$$config = JSON.parse(window.$$$config);

        // check if test function name was registered in global scope is a function
        // if is an existing function in the scope then call it (run a test), otherwise show an error
        var fn = window[window.$$$config.test];
        if (typeof fn === 'function') {
            await fn(window.$$$config);
        } else {
            throw('Could not find function (or is not a function): [' + window.$$$config.test + ']');
        }
        
        // success
        window.$$$result.passed = true;
        window.$$$result.isRunning = false;
    } catch (e) {
        // failure
        window.$$$result.error = e.message; 
        window.$$$result.passed = false;
        window.$$$result.isRunning = false;
    }
}

/**
 * Wait for HTML element to be present on the page.
 * This function requires only @target argument to be provided. 
 * @target can be a valid jQuery selector to match HTML element or a function
 * that returns HTML element (in this case function implements page search).
 * 
 * Please note: default values are set for @repeatMs and @timeout 
 * 
 * @param {*} target html element we wait for to be loaded, can be jQuery selector or function that wraps it.
 * @param {*} repeatMs optional parameter that specified how often search for HTML element.
 * @param {*} timeout optional parameter that specify when to stop to search HTML element.
 */
var waitFor = async function (target, repeatMs, timeout) {
    // register stack trace line of caller, it will be return in case of error 
    var callerId = new Error().stack.split("\n")[2].trim();

    var fn = $.isFunction(target) ? target : () => $("#contentId").contents().find(target);
    var repeatMs_ = $.isNumeric(repeatMs) ? repeatMs : 500;
    var timeout_ = $.isNumeric(timeout) ? timeout : 5000;

    var stat = await checkSelector(repeatMs_, timeout_, fn)
        .then(checkIsVisible);

    if (!stat.found) {
        throw new Error("Element not found: [" + target + "] " + callerId);
    }
    return stat.elem;
}
/**
 * Function that returns promise that we use for implementing delay.
 * 
 * @param {*} ms how long to wait in milliseconds.
 */
var wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Function that execute given function @fn every @repeatMs and timeout after given @timeout.
 * Function @fn is a function that returns HTML element or array of HTML elements. If @fn won't return
 * at least 1 element then it will be called again after @repeatMs until @timeout is reached.
 * 
 * Idea is to use this function to wait for HTML element to be present on the page. Because we can't
 * wait infinitely that is why timeout is required.
 *  
 * @param {*} repeatMs number of milliseconds between @fn executions 
 * @param {*} timeout number of milliseconds after this function stop executing @fn
 * @param {*} fn function that is executed, must return HTML elements/array of elements 
 */
var checkSelector = (repeatMs, timeout, fn) => {
    var status = {
        found: false,
        timeout: timeout,
        elem: null,
        intervalID: setInterval(() => {
            status.elem = fn();
            status.found = status.elem.length;
            status.timeout = status.timeout - repeatMs;
        }, repeatMs)
    };
    return wait(repeatMs).then(() => status);
};
/**
 * Helper function for @checkSelector to return found HTML element if is available on the page
 * or to continue waiting if not.
 * 
 * @param {*} status of selector check (if element found, timeout counter etc)
 */
var checkIsVisible = status => {
    if (status.timeout <= 0) {
        clearInterval(status.intervalID);
        return status;
    }
    if (status.found <= 0) {
        return wait(1000).then(() => checkIsVisible(status));
    }
    clearInterval(status.intervalID);
    return status;
};

/**
 * Returns all HTML elements matching given criteria. This function search HTML elements
 * with specified tagName and text content.
 * 
 * Note: text content must be exactly that same as given argument @textContent.
 * Usage: elementByContent('span', 'Login button').
 *  
 * @param {*} tagName HTML element tag name that should contain given @textContent.
 * @param {*} textContent exact text content that we are looking for.
 */
function elementByContent(tagName, textContent) {
    return $("#contentId").contents().find(tagName).filter(function () { return $(this).text() == textContent; });
}