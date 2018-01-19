const puppeteer = require("puppeteer");
const fs = require("fs");
const colors = require("colors/safe");
const path = require("path");
const cli = require("./modules/cli.js");
const configParser = require("./modules/config.js");
const runner = require("./modules/runner.js");
const Table = require('cli-table');
const jsonfile = require('jsonfile');

module.exports.run = function (rootDir) {

    // process user test run command
    var commandResult = cli.processCommand(rootDir);
    cli.validateProcessCommandResult(commandResult);

    // load configuration for defined test suite and merge with the selected user profile settings
    const userConfiguration = JSON.parse(fs.readFileSync(commandResult.testConfigPath, "utf8"));

    var testConfiguration = configParser.parseConfiguration(rootDir, commandResult);
    configParser.validateTestConfiguration(testConfiguration);

    // extract final configuration into variable to be used by test runner on multiple tabs
    var config = testConfiguration.configuration;

    // test case summary
    var summary = new Table({
        head: ['Test name', 'Result', 'Error details', 'Execution time']
    });

    (async (commandResult) => {
            try {
                var executionBefore = Date.now();

                // note: headless chrome won"t support extensions so tests against protected sites require headless:false
                const browser = await puppeteer.launch({
                    args: [
                        config.chromeConfig.flags,
                        "--disable-web-security",
                        '--disable-extensions-except=' + __dirname + path.sep + "lib" + path.sep + "ignore-headers",
                        "--load-extension=" + __dirname + path.sep + "lib" + path.sep + "ignore-headers",
                        "--no-first-run"],
                    headless: config.browserConfig.headless,
                    dumpio: config.browserConfig.dumpio,
                    ignoreHTTPSErrors: config.browserConfig.ignoreHTTPSErrors,
                    executablePath: config.browserConfig.executablePath,
                    slowMo: config.browserConfig.slowMo,
                    handleSIGINT: config.browserConfig.handleSIGINT,
                    timeout: config.browserConfig.timeout,
                    userDataDir: config.browserConfig.userDataDir,
                    env: config.browserConfig.env,
                    devtools: config.browserConfig.devtools
                });

                // run tests on each tab ...
                var promises = [];
                var batchResults = [];
                const suites = config.testSuite;


                for (var suite in suites) {
                    if (!commandResult.suite.length || (commandResult.suite.length && commandResult.suite == suite)) {

                        // ignore suite with name 'dev' when running all tests
                        // allow to run it only when provided as custom suite in -s=dev command line parameter
                        if (suite === "dev" && commandResult.suite !== "dev") {
                            continue;
                        }

                        var tabs = suites[suite];
                        for (var tab in tabs) {
                            promises.push(
                                runner.runTests(__dirname, browser, suites[suite][tab], config).then(
                                    (batchResult) => batchResults = batchResults.concat(batchResult)
                                )
                            );
                        }

                        // ... and wait until all finish execution
                        await Promise.all(promises);
                    }
                }

                // create final test result summary
                var allPassed = true;
                var total = 0;

                //create 'session' suite with failed test cases
                if (commandResult.mode === "session") {
                    userConfiguration.testSuite.session = {"tab1": []};
                }
                for (var j = 0; j < batchResults.length; j++) {
                    var singleResult = batchResults[j];
                    allPassed = !singleResult.passed ? false : allPassed;
                    total = total + singleResult.executionTime;

                    // record failed test cases under special test suite with name 'session'
                    if (commandResult.mode === "session" && !singleResult.passed) {
                        userConfiguration.testSuite.session.tab1.push(singleResult.originalTestName);
                    }
                    let singleSummary = [singleResult.testName,
                        singleResult.passed ? colors.green("PASSED") : colors.red("FAILED"),
                        !singleResult.passed ? singleResult.error : "",
                        cli.millisToMinutesAndSeconds(singleResult.executionTime) + ' (mm:ss)'
                    ];
                    summary.push(singleSummary);
                }

                var executionAfter = Date.now();
                var totalAllTabs = executionAfter - executionBefore;
                summary.push(["", "", "", "Execution time   (sum): " + cli.millisToMinutesAndSeconds(total) + ' (mm:ss)']);
                summary.push(["", "", "", "Execution time (total): " + cli.millisToMinutesAndSeconds(totalAllTabs) + ' (mm:ss)']);
                console.log(summary.toString());

                //overwrite test config with session test suite
                if (commandResult.mode === "session") {
                    jsonfile.writeFileSync(commandResult.testConfigPath, userConfiguration, {spaces: 4});
                }

                // always close browser in headless mode, leave open in non headless
                if (config.browserConfig.headless) {
                    console.info('Attemp to close browser 1 second after test finished to shut down it properly.');
                    try {
                        // if you combine page.close() and browser.close() then you can end up with race condition and nasty error
                        // https://github.com/GoogleChrome/puppeteer/issues/843
                        // workaround: delay browser closing action for 1 second
                        // await browser.close();
                        await setTimeout(function () {
                            browser.close();
                        }, 1000);
                    } catch (e) {
                        console.info('Unable to close the browser');
                    }
                    console.info('Browser closed');
                }


            } catch (testException) {
                console.dir(testException);
            }
        }
    )
    (commandResult);

};