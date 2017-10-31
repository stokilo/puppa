##### Documentation for version: [v1.0.20](https://github.com/stokilo/puppa/blob/master/doc/documentation.md)

# puppa

Javascript test framework based on node.js and google puppeteer:
https://github.com/GoogleChrome/puppeteer

<span style="color:red">Requirements :</span>

Node with **Async/Await Support**, check version with latest features here:

https://nodejs.org/

Run two tests on separate tabs:

![alt text](https://raw.githubusercontent.com/stokilo/puppa/master/static/preview.gif)

Quick start example tests:
```
git clone https://github.com/stokilo/puppa
cd puppa
npm install
node run.js tests
```

Integrated with jQuery and jQuery-Expect framework. All test steps are
executed sequentially using async/await syntax. Framework supports parallel test execution
on multiple browser tabs.

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
	"chromeConfig":{
		"flags": "--window-size=1280,720"
	},
	"browserConfig": {
		"viewport": {
			"width": 1280,
			"height": 1024
		},
		"timeout": 60000,
		"headless": false,
		"dumpio": false,
		"closeBrowser": {
			"onFailure": false,
			"onSuccess": true
		},
		"devtools": false,
		"closeTab": {
			"onFailure": false,
			"onSuccess": true
		}
	},
	"globalInject": [
		"tests/google.js",
		"tests/pdf-test.js",
		"tests/expectations/pdf-expect.js"
	],
	"testSuite": {

		"suite1": {
			"tab1": [
				"${google.com}.testGoogleSearch",
				"${google.com}.testGoogleSearch"
			],
			"tab2": [
				"${graduateland.com}.testPdfTextContent",
				"${graduateland.com}.testPdfTextContent"
			]
		},

		"suite2": {
			"tab1": [
				"${google.com}.testGoogleSearch"
			],
			"tab2": [
				"${graduateland.com}.testPdfTextContent"
			]
		}
	}
}
```

You can create your own test suite and use puppa npm module to run them.
Run test cases using npm module:
```
mkdir mytests
cd mytests
npm install puppa
```

Copy https://github.com/stokilo/puppa/tests/  into mytests/tests
Create mytests/run.js

```javascript
const puppa = require("puppa");
puppa.run(__dirname)
```

Run all test cases using npm module
```
node run.js tests
```

or run test cases grouped in test suite with name 'devSuite'
```
node run.js tests -s=devSuite
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