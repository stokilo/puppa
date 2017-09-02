const puppeteer = require("puppeteer");
const fs = require("fs");
const colors = require("colors/safe");
const path = require("path");
const cli = require("./modules/cli.js");
const configParser = require("./modules/config.js");

// process user test run command and convert into puppa format
var commandResult = cli.processCommand(__dirname);
cli.validateProcessCommandResult(commandResult);

var testConfiguration = configParser.parseConfiguration(__dirname, commandResult);
configParser.validateTestConfiguration(testConfiguration);

var config = testConfiguration.configuration;
const testCases = config.testSuite.order;

(async () => {

	// note: headless chrome won"t support extensions so tests against protected sites require headless:false
	// TODO: headless, dumpio as part of the profile
	const browser = await puppeteer.launch({
		args: [
			"--disable-web-security",
			"--load-extension=" + __dirname + path.sep + "lib" + path.sep + "ignore-headers",
			"--no-first-run"],
		headless: false,
		dumpio: false
	});

	const page = await browser.newPage();
	page.setViewport(config.browserConfig.viewport);

	for (var testCase in testCases) {

		for (var i = 0; i < testCases[testCase].length; i++) {
			var test = testCases[testCase][i];

			// open page with iframe and load page defined in test case
			console.info(colors.blue("Running: " + test.url + ":" + test.testName));
			var contentHtmlFile = "file:///" + __dirname + "/lib/index.html?url=" + encodeURIComponent(test.url);
			console.info(colors.inverse("Open page: " + test.url));
			await page.goto(contentHtmlFile);

			// inject js that should persist navigation
			for (fileName of config.globalInject) {
				await page.injectFile(fileName);
				console.info("Global file inject: " + fileName);
			}

			// inject configuration into the window
			await page.evaluate("window.$$$config = '" + JSON.stringify({"test": test.testName}) + "'");

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
	}
	await browser.close();
})();
