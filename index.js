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
	const testCases = config.testSuite.order;


	// test case summary
	var summary = new Table({
		head: ['Test name', 'Result', 'Error details']
	});

	(async () => {

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
		for (var testCase in testCases) {
			promises.push(
				runner.runTests(__dirname, browser, testCases[testCase], config).then(
					(batchResult) => batchResults = batchResults.concat(batchResult)
				)
			);
		}

		// ... and wait until all finish execution
		await Promise.all(promises);
		if (config.browserConfig.closeBrowser) {
			await browser.close();
		}

		// create final test result summary
		for (var j = 0; j < batchResults.length; j++) {
			var singleResult = batchResults[j];
			summary.push(
				[singleResult.testName,
				singleResult.passed ? colors.green("PASSED") : colors.red("FAILED"),
				!singleResult.passed ? singleResult.error : ""
				]
			);
		}
		console.log(summary.toString());
	})();

};