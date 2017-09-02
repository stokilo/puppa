/**
 * Module for running puppeteer tests.
 */
const puppeteer = require("puppeteer");
const fs = require("fs");
const colors = require("colors/safe");

module.exports = {

    runTests: function (parentDir, browser, testCases, config) {

        return (async () => {
            const page = await browser.newPage();
            page.setViewport(config.browserConfig.viewport);

            for (var i = 0; i < testCases.length; i++) {
                var test = testCases[i];

                // open page with iframe and load page defined in test case
                console.info(colors.blue("Running: " + test.url + ":" + test.testName));
                var contentHtmlFile = "file:///" + parentDir + "/lib/index.html?url=" + encodeURIComponent(test.url);
                console.info(colors.inverse("Open page: " + test.url));
                await page.goto(contentHtmlFile);

                // inject js that should persist navigation
                for (fileName of config.globalInject) {
                    await page.injectFile(fileName);
                    console.info("Global file inject: " + fileName);
                }

                // inject configuration into the window
                var testConfig = Object.assign({}, config.profileConfig);
                testConfig.testName = test.testName;
                await page.evaluate("window.$$$config = '" + JSON.stringify(testConfig) + "'");

                // run the test
                await page.evaluate(async () => { return runTest(); });
                const watchDog = page.waitForFunction("window.$$$result.isRunning == false",
                    { interval: 1000, timeout: config.browserConfig.timeout });
                await watchDog;

                // output result
                var testResult = await page.evaluate("window.$$$result");
                var resultMessage = testResult.passed ?
                    colors.green.underline("Passed") :
                    colors.red.underline("Failed");
                console.log("Result: " + resultMessage);
                if (!testResult.passed) {
                    console.log("        " + colors.red.inverse(testResult.error));
                }
            }
            
        })();

    }
};