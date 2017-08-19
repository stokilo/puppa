window.$$$config= {};

window.$$$result = {
    passed: true,
    error: null,
    isRunning: true
};

run_tests = async function () {
    try {
        //config string2object
        window.$$$config = JSON.parse(window.$$$config);

        var fn = window[window.$$$config.test];
        if (typeof fn === 'function') {
            await fn(window.$$$config);
        } else {
            throw('Could not find function (or is not a function): [' + window.$$$config.test + ']');
        }
        window.$$$result.passed = true;
        window.$$$result.isRunning = false;
    } catch (e) {
        console.info('Calling testcase resulted in error:');
        console.dir(e);
        window.$$$result.error = e;
        window.$$$result.passed = false;
        window.$$$result.isRunning = false;
    }
}

var waitFor = async function (target, repeatMs, timeout) {
    var fn = $.isFunction(target) ? target : () => $(target);
    var repeatMs_ = $.isNumeric(repeatMs) ? repeatMs : 500;
    var timeout_ = $.isNumeric(timeout) ? timeout : 5000;

    var stat = await checkSelector(repeatMs_, timeout_, fn)
        .then(checkIsVisible);

    if (!stat.found) {
        throw new Error("Unable to find element." + target);
    }
    return stat.elem;
}

var wait = ms => new Promise(resolve => setTimeout(resolve, ms));

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

function elementByContent(element, textContent) {
    return $(element).filter(function () { return $(this).text() == textContent; });
}