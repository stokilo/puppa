const puppeteer = require('puppeteer');
const fs = require('fs');
const colors = require('colors/safe');
const path = require('path');

const userConfig = JSON.parse(fs.readFileSync('user.config.json', 'utf8'));
const defaultConfig = JSON.parse(fs.readFileSync('default.config.json', 'utf8'));
const sharedConfig = 'shared' in userConfig ? userConfig.shared : defaultConfig.shared;
const testCases = 'testCases' in userConfig ? userConfig.testCases : defaultConfig.testCases;

(async () => {

	// note: headless chrome won't support extensions so tests against protected sites require headless:false
	const browser = await puppeteer.launch({
		 args: [
				'--disable-web-security',
				'--load-extension=' + __dirname + path.sep + 'lib' + path.sep+ 'ignore-headers', 
				'--no-first-run'],
		 headless: false,
		 dumpio: false
	});

	const page = await browser.newPage();
	page.setViewport(sharedConfig.viewport);

	for (testCase of testCases) {
		console.info(colors.blue('Running: ' + testCase.file + ':' + testCase.test));
		var contentHtmlFile = "file:///" + __dirname + '/index.html?url=' + encodeURIComponent(testCase.url);
		console.info(colors.inverse('Open page: ' + testCase.url));
		await page.goto(contentHtmlFile);
		for (fileName of sharedConfig.inject) {
			await page.injectFile(fileName);
			console.info('Inject file: ' + fileName);
		}
		console.info('Inject file: ' + testCase.file);
		await page.injectFile(testCase.file);
		// inject configuration into the window
		await page.evaluate("window.$$$config = '" + JSON.stringify(testCase) + "'");

		await page.evaluate(async () => { return runTest(); });

		const watchDog = page.waitForFunction("window.$$$result.isRunning == false",
			{ interval: 1000, timeout: sharedConfig.timeout });
		await watchDog;
		// result presentation
		var testResult = await page.evaluate('window.$$$result');
		var resultMessage = testResult.passed ? 
							colors.green.underline('Passed') :
							colors.red.underline('Failed');
		console.log('Result: ' + resultMessage);
		if (!testResult.passed) {
			console.log('        ' + colors.red.inverse(testResult.error));
		}
	}
	await browser.close();
})();
