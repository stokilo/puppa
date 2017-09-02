# puppa

Functional tests framework based on node.js and google puppeteer:

https://github.com/GoogleChrome/puppeteer

It allows to write test cases in pure javascript. Current version
is integrated with jQuery and jQuery-Expect framework. All test steps are
executed sequentially using async/await syntax. Framework supports parallel test execution
on multiple browser tabs.

Because tests are written in pure javascript there is no limit on what can be injected into tested page.


![alt text](https://raw.githubusercontent.com/stokilo/puppa/master/static/preview.gif)


Run test cases defined in the tests directory (see test-config.json and dev-profile.json)
```
git clone https://github.com/stokilo/puppa
cd puppa
npm install
node index.js tests
```

Example, see 'tests' directory for more examples:

```javascript
testGoogleSearch = async function (config) {
    // enter term 'test', wait max 15 seconds for element, repeat selector search every 200 ms
    await elem("#lst-ib", elem => elem.val('test'), {pooling: 200, timeout: 15000});

    // search
    await elem("#tsf", elem => elem[0].submit());

    // wait for 10 rows with results
    await elem(".r", rows => $expect(rows).to.have.items(10));

    // assert text content on the result list
    await felem(() => elementByContent('span', 'Test - Wikipedia'), wiki => wiki.click());

    // check wikipedia heading text
    await elem(".firstHeading", heading => $expect(heading).to.have.text('Test'));
}
```

Example test runner configuration that defines parallel test execution on 2 tabs.

```javascript
{
	"profile": "dev-profile.json",
	"browserConfig": {
		"viewport": {
			"width": 1280,
			"height": 1024
		},
		"timeout": 60000,
		"headless": false,
		"dumpio": false,
		"closeBrowser": true
	},
	"globalInject": [
		"tests/google.js",
		"tests/pdf-test.js",
		"tests/expectations/pdf-expect.js"
	],
	"testSuite": {
		"order": {
			"tab1": [
				"${google.com}.testGoogleSearch",
				"${google.com}.testGoogleSearch"
			],
			"tab2": [
				"${graduateland.com}.testPdfTextContent",
				"${graduateland.com}.testPdfTextContent"
			]
		}
	}
}
```

###  Libraries included:
* [Puppeteer] - https://github.com/GoogleChrome/puppeteer
  https://github.com/GoogleChrome/puppeteer/blob/master/LICENSE

* [JQuery] - https://github.com/jquery/jquery
  Copyright JS Foundation and other contributors, https://js.foundation/
  https://github.com/jquery/jquery/blob/master/LICENSE.txt

* [JQuery-Expect] - https://github.com/Codecademy/jquery-expect 
  MIT License. Copyright (c) 2012 Amjad Masad <amjad@codecademy.com> Ryzac, Inc.

* [PDF.js] - https://mozilla.github.io/pdf.js/
  https://github.com/mozilla/pdf.js/blob/master/LICENSE