const puppeteer = require('puppeteer');
const fs = require('fs');
const colors = require('colors/safe');

const userConfig = JSON.parse(fs.readFileSync('user.config.json', 'utf8'));
const defaultConfig = JSON.parse(fs.readFileSync('default.config.json', 'utf8'));
const sharedConfig = 'shared' in userConfig ? userConfig.shared : defaultConfig.shared;
const testCases = 'testCases' in userConfig ? userConfig.testCases : defaultConfig.testCases;

(async () => {

	const browser = await puppeteer.launch({ headless: false});
	const page = await browser.newPage();
	page.setViewport(sharedConfig.viewport);

	for (testCase of testCases) {
		console.info(colors.blue('Running: ' + testCase.file + ':' + testCase.test));
		console.info(colors.inverse('Open page: ' + testCase.url));
		await page.goto(testCase.url);
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
		console.log((testResult.passed ? colors.green.underline('Result: Passed') : colors.red.underline('Result: Failed')));
		console.dir(testResult);
		//console.log(await page.evaluate('window.$$$result'));
	}
	// tmp: browser.close();
})();
