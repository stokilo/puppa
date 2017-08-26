# puppa

Functional tests framework based on node.js and google puppeteer:

https://github.com/GoogleChrome/puppeteer

Run testcases defined in user.config.json
```
git clone https://github.com/stokilo/puppa
cd puppa
npm install
node index.js
```

Example test, see 'tests' directory for more examples:

```
testGoogleSearch = async function (config) {
    // enter term 'test'
    await waitFor("#lst-ib").then(result => result.val('test'));

    // search
    await waitFor("#tsf").then(result => result[0].submit());

    // wait for row elements with class 'r'
    await waitFor(".r").then(r => $expect(r).to.have.items(10));

    // assert text exists
    await waitFor(elementByContent('span', 'Test - Wikipedia')).then(result => console.info(result));
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
