const puppeteer = require("puppeteer");
const fs = require("fs");
const colors = require("colors/safe");
const path = require("path");
const cli = require("./modules/cli.js");
const configParser = require("./modules/config.js");
const runner = require("./modules/runner.js");
const Table = require('cli-table');

module.exports.run = function (rootDir) {

	// process user test run command 
	var commandResult = cli.processCommand(rootDir);
	cli.validateProcessCommandResult(commandResult);

	// load configuration for defined test suite and merge with the selected user profile settings
	var testConfiguration = configParser.parseConfiguration(rootDir, commandResult);
	configParser.validateTestConfiguration(testConfiguration);

	// extract final configuration into variable to be used by test runner on multiple tabs
	var config = testConfiguration.configuration;

	// test case summary
	var summary = new Table({
		head: ['Test name', 'Result', 'Error details', 'Execution time']
	});

	(async (commandResult) => {
		console.time("Execution time: ");
		// note: headless chrome won"t support extensions so tests against protected sites require headless:false
		const browser = await puppeteer.launch({
			args: [
				config.chromeConfig.flags,
				"--disable-web-security",
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
		for (var j = 0; j < batchResults.length; j++) {
			var singleResult = batchResults[j];
			allPassed = !singleResult.passed ? false : allPassed;
			total = total + singleResult.executionTime;
			summary.push(
				[singleResult.testName,
				singleResult.passed ? colors.green("PASSED") : colors.red("FAILED"),
				!singleResult.passed ? singleResult.error : "",
				cli.millisToMinutesAndSeconds(singleResult.executionTime) + ' (mm:ss)'
				]
			);
		}
		
		summary.push(["", "", "", "Total: " + cli.millisToMinutesAndSeconds(total) + ' (mm:ss)']);
		console.log(summary.toString());
		console.timeEnd("Execution time: ");

		// close browser after tests depending on test results: https://github.com/stokilo/puppa/issues/6
		if (allPassed && config.browserConfig.closeBrowser.onSuccess ||
			!allPassed && config.browserConfig.closeBrowser.onFailure){
			console.info('Attemp to close browser 1 second after test finished to shut down it properly.');
			try{
				// if you combine page.close() and browser.close() then you can end up with race condition and nasty errro
				// https://github.com/GoogleChrome/puppeteer/issues/843
				// workaround: delay browser closing action for 1 second
				// await browser.close();
				await setTimeout(function() {
					browser.close();
				}, 1000);
			}catch(e) {
				console.info('Unable to close the browser');
			}
			console.info('Browser closed');
		}

	})(commandResult);

};