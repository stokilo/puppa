##### Documentation for version: [v1.0.11](https://github.com/stokilo/puppa/blob/master/doc/documentation.md)
# Puppa API 

##### Table of Contents

- [Overview](#overview)
- [Description of test-config.json](#description-of-test-config)
- [Default javascript functions](#default-javascript-functions)
  * [puppa.elem()](#puppaelem)
  * [puppa.felem()](#puppafelem)
    * [puppa.elementByContent()](#puppaelementbycontent)
    * [puppa.expectPdfContent()](#puppaexpectpdfcontent)
    

### Overview

Puppa is a library that combines various javascript libraries to run set of test cases in a chrome browser. 

###### How it works after running: 'node run.js tests' ?
- 1. Load test-config.json from tests directory and merge it with configured profile file (i.e. dev-profile.json)
- 2. Launch chrome instance configured as described at step 1
- 3. Each test is assigned into a tab. All tabs are open at same time
- 4. Inject iframe into each tab. Content of each iframe is a page configured for a test.
- 5. Enable extension that allows to ignore headers blocking iframe embedding: 'x-frame-options', 'content-security-policy', 'x-content-type-options' (works only in non-headless mode)
- 6. Execute list of javascript test function in context of each tab as described in test cases (step 1)
- 7. Produce test result output to stdout.

### Description of test config

File test-config.json contains description of test environment and test suite. Example:

```js
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
		"closeBrowser": true,
		"devtools": false
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

- `profile` <[string]> name of the profile file that will be used to used for test run, content of sampel profile:
```js
{
    "placeholders": {
        "google.com": "https://google.com",
        "graduateland.com": "https://graduateland.com/api/v2/users/jesper/cv"
    },
    "config": {
        "username": "test",
        "password": "test"
    }
}
```
  - `placeholder`<[object]> placeholders for test-config.json.testSuite element. Profile is defined in a separate file because you can choose active profile on test runtime. To switch profile from command line you can use argument: `'--p=other-dev-profile'` (note lack of json extension). Think about profile as settings for each member of your team. Each developer has different machine settings like IP or credentials to
  access the system. Profile should be used to separate such data from common test configuration.
    - `<key><value>` map of all placeholders where key if placeholder name and value is value to use
  - `config` <[object]> object with configuration that will be passed to each test. Good place for credentials and test suite settings.

- `chromeConfig`<[object]> 
  - `flags`<string> command line chromium arguments: [here](http://peter.sh/experiments/chromium-command-line-switches/).
- `browserConfig`<[object]> configuration of puppeteer browser object
  - `viewport`<[object]> puppeteer browser viewport settings
    - `width`<[number]> viewport width (note: if you want define browser window size use chromeConfig.flags {"flags": "--window-size=1280,720"})
    - `height`<[number]> viewport height (note: if you want define browser window size use chromeConfig.flags {"flags": "--window-size=1280,720"})
  - `timeout`<[number]> timeout in ms if puppeteer browser won't launch
  - `headless`<[boolean]> should puppeteer browser run in headless mode?
  - `dumpio`<[boolean]> should puppeteer browser pump out/err into your stdout/stderr? 
  - `closeBrowser`<[boolean]> should puppa close puppeteer browser after test run ? It does not matter if tests failed or passed. If you set this to false 
  and combine with headless = false then you have an option to inspect open pages using dev tools (see console log, network activity etc).
  - `devtools`<[boolean]> should dev tools should be open on test run? 
- `globalInject`<[array]> array of javascript files that should be injected into test page. Puppa define top page that contains an IFRAME and all scripts defined in `globalInject`. So each page you test are wrapped into the IFRAME decorated
with scripts on runtime. Reason why scripts must be defined is to give developer flexibility to resolve library conflicts.
- `testSuite` <[object]> list of test grouped on tabs
  - `order` <[object]> order of tabs on the browser
    - `map<[string],[array]>` <[string],[array]> map of tabs and tests assigned to them. Each test is defined in format
    `url.testFunctionName` i.e. `${google.com}.testGoogleSearch`. Support for placeholder from profile is implemented, in this example  `${google.com}.testGoogleSearch` will be resolved to `https://google.com.testGoogleSearch`
 

 
### Default javascript functions

List of functions that are injected by default into test page.

####  puppa.elem()
##### puppa.elem(jQuerySelector, jQuerySelectorHandler, options)

Function that is performing jQuery query on embedded IFRAME with test page. 
Query is repeated until timeout is reached. Query is repeated if `retry` is defined.
`jQuerySelectorHandler` is called on timeout or when element it found. Role of `jQuerySelectorHandler` is
to either test found elements or perform any jQuery function on the found element. 

- `jQuerySelector` <[string]> jQuery selector as string 
- `jQuerySelectorHandler` <[function]> handler of jQuery selector query, function takes as argument result of jQuery query
- `options` <[object]> 
  - `pooling` <[number]> selector query pooling interval in ms, default 500 ms
  - `timeout` <[number]> timeout for single selector query in ms, default 5000 ms
  - `retry` <[object]> repeat search for jQuerySelector 
    - `retry` <[number]> how many times to repeat, default 0
    - `delay` <[number]> delay before next retry in ms, default 1000

Example: 
```js
testGoogleSearch = async function (config) {
    // enter term 'test'
    await elem("#lst-ib", elem => elem.val('test'), 
               {pooling: 200, timeout: 5000, retry: {retry: 2, delay: 1000}});

    // search
    await elem("#tsf", elem => elem[0].submit());

    // wait for 10 rows with results
    await elem(".r", rows => $expect(rows).to.have.items(10));
}
```

####  puppa.felem()
##### puppa.felem(fQuery, fQueryHandle, options)

Function that is performing custom javascript query on embedded IFRAME with test page. 
Function fQuery is repeated until timeout is reached. Function fQuery is repeated if `retry` is defined.
`fQueryHandle` is called on timeout or when element it found. Role of `fQueryHandle` is
to either test found elements or perform any function on the found element. 

felem() is used to perform custom search query on test page. If you use EXTJS you can inject here ComponentQuery,
if you implement own search logic you can wrap it into function and pass as fQuery parameter.

Puppa contains some pre defined custom functions described below.

- `fQuery` <[function]> any custom javascript function that perform query on the test page and return result
- `fQueryHandle` <[function]> handler of fQuery result, function takes as argument value returned from fQuery
- `options` <[object]> 
  - `pooling` <[number]> selector query pooling interval in ms, default 500 ms
  - `timeout` <[number]> timeout for single selector query in ms, default 5000 ms
  - `retry` <[object]> repeat search for jQuerySelector 
    - `retry` <[number]> how many times to repeat, default 0
    - `delay` <[number]> delay before next retry in ms, default 1000

Example: 
```js
testGoogleSearch = async function (config) {
    // assert text content on the result list
    await felem(() => elementByContent('span', 'Test - Wikipedia'), wiki => wiki.click());
}
```

####  puppa.elementByContent()
##### puppa.elementByContent(tagName, textContent)

Search elements with given tag name and text content.

- `tagName` <[string]> html tag name for content search
- `textContent` <[string]> text content to find

Example: 
```js
testGoogleSearch = async function (config) {
    // assert text content on the result list
    await felem(() => elementByContent('span', 'Test - Wikipedia'), wiki => wiki.click());
}
```

####  puppa.expectPdfContent()
##### puppa.expectPdfContent(pdfUrl, expectFnName)

Compare PDF content from given `pdfUrl` with result returned from function `expectFnName`

- `pdfUrl` <[string]> url that returns valid PDF file
- `expectFnName` <[function]> function that return string with expected pdf content

Example: 
```js
testPdfTextContent = async function (config) {
    await expectPdfContent("https://graduateland.com/api/v2/users/jesper/cv", educationGovYkCaPdfContent);
}

```
