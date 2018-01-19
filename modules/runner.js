/**
 * Module for running puppeteer tests.
 */
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const colors = require("colors/safe");
const esprima = require("esprima");
const estraverse = require("estraverse");

module.exports = {

    runTests: function (parentDir, browser, testCases, config) {
        let batchResult = [];
        return (async () => {
            let allPassed = true;
            for (let i = 0; i < testCases.length; i++) {
                let test = testCases[i];
                let page = await browser.newPage();
                page.setViewport(config.browserConfig.viewport);

                // open page with iframe and load page defined in test case
                console.info(colors.blue("Running: " + test.url + ":" + test.testName));
                let contentHtmlFile = "file:///" + parentDir + "/lib/index.html?url=" + encodeURIComponent(test.url);
                //console.info(colors.inverse("Open page: " + test.url));
                let pageLoaded = false;
                try {
                  await page.goto(contentHtmlFile, {"timeout": config.browserConfig.timeout, "waitUntil": "domcontentloaded"});
                  pageLoaded = true;
                } catch(loadError) {
                    console.info("Unable to load page (timeout): " + test.url);
                }

                // inject js that should persist navigation
                for (fileProperties of config.globalInject) {
                    let fileName = fileProperties.file;
                    let isInstrumented = fileProperties.instrumented;

                    // read test file
                    let file = fs.readFileSync(fileName, "utf8");

                    if (isInstrumented) {
                        // parse script with option to return locations of detected elements
                        let parsed = esprima.parseScript(file, {range: false, loc: true, comment: false});
                        // traverse all nodes and declarations and expression
                        let locations = [];
                        estraverse.traverse(parsed, {
                            enter: function(node, parent) {
                                if (node.type === 'AwaitExpression' ||
                                    node.type === 'VariableDeclaration' ||
                                    node.type === 'ExpressionStatement') {
                                   locations.push(node.loc);
                                }
                            }
                        });
                        // Instrument a function to log test calls
                        let split = file.split("\n");
                        let changedLines = [];
                        for (let i = 0; i < locations.length; i++) {
                            let start = locations[i].start.line - 1;
                            if (changedLines.indexOf(start) <= -1) {
                                let codeLineEscaped = split[start].replace(/"/g, '\\"').replace(/(?:\r\n|\r|\n)/g, '');
                                split[start] = "log2console(\"" + codeLineEscaped+ "\");" + " " + split[start];
                                changedLines.push(start);
                            }
                        }
                        // Final test script
                        let scriptContent = split.join("\n");
                        await page.addScriptTag( {"content": scriptContent});

                        let baseName = path.basename(fileName);
                        //fs.writeFileSync("./test_" + baseName, scriptContent);
                        //fs.writeFileSync("./tree_" + baseName.replace(".js", ".json"), JSON.stringify(parsed));
                    } else {
                        await page.addScriptTag( {"content": file});
                    }
                }

                // inject configuration into the window
                let testConfig = Object.assign({}, config.profileConfig);
                testConfig.testName = test.testName;
                testConfig.browserConfig = config.browserConfig;
                await page.evaluate("window.$$$config = '" + JSON.stringify(testConfig) + "'");

                // run the test
                if (pageLoaded) {
                    await page.evaluate(async () => {
                        return runTest();
                    });
                    const watchDog = page.waitForFunction("window.$$$result.isRunning == false",
                        {interval: 1000, timeout: config.browserConfig.timeout});
                    await watchDog;
                }

                // output result
                let testResult = pageLoaded ? await page.evaluate("window.$$$result")
                                            : {"passed": false, "error": "Page loading timeout", "executionTime": config.browserConfig.timeout};
                let resultMessage = testResult.passed ?
                    colors.green.underline("Passed") :
                    colors.red.underline("Failed");
                console.info(colors.blue("Result: " + test.url + ":" + test.testName) + ": " + resultMessage);

                if (!testResult.passed) {
                    console.log("        " + colors.red.inverse(testResult.error));
                }

                // required for final reporting
                allPassed = !testResult.passed ? false : allPassed;
                batchResult.push({
                    "testName": test.testName,
                    "originalTestName": test.originalTestName,
                    "passed": testResult.passed,
                    "error": typeof testResult.error === 'string' ? testResult.error : "Unknown error",
                    "executionTime": testResult.executionTime
                });

                try {
                    // close tab dependin on the test result: https://github.com/stokilo/puppa/issues/5
                    if(allPassed && config.browserConfig.closeTab.onSuccess ||
                        !allPassed && config.browserConfig.closeTab.onFailure) {
                        page.close();
                    }
                } catch (e) {
                    console.info('Error when closing the browser tab');
                }
            }
            // results from all tests running on given tab
            return batchResult;
        })();
    }
};