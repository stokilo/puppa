const puppeteer = require('puppeteer');
const fs = require('fs');

const userConfig = JSON.parse(fs.readFileSync('user.config.json', 'utf8'));
const defaultConfig = JSON.parse(fs.readFileSync('default.config.json', 'utf8'));
const sharedConfig = 'shared' in userConfig ? userConfig.shared : defaultConfig.shared;
const testCases = 'testCases' in userConfig ? userConfig.testCases : defaultConfig.testCases;

(async () => {

	const browser = await puppeteer.launch({ headless: false});
	const page = await browser.newPage();
	page.setViewport(sharedConfig.viewport);

	for (testCase of testCases) {
		console.info('goto page: ' + testCase.url);
		await page.goto(testCase.url);
		for (fileName of sharedConfig.inject) {
			await page.injectFile(fileName);
			console.info('injected file: ' + fileName);
		}
		console.info('injected file: ' + testCase.file);
		await page.injectFile(testCase.file);
		// inject configuration into the window
		await page.evaluate("window.$$$config = '" + JSON.stringify(testCase) + "'");

		console.info('start testcase: ' + testCase.file)
		await page.evaluate(async () => {return run_tests();});

		const watchDog = page.waitForFunction("window.$$$result.isRunning == false",
			{ interval: 1000, timeout: sharedConfig.timeout });
		await watchDog;
		console.info('Test: ' + testCase.file + ' : ' + testCase.test + ' result: ');
		console.log(await page.evaluate('window.$$$result')); 
	}
	//browser.close();
})();
