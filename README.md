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
    await waitFor("#lst-ib").then(elem => elem.val('test'));

    // search
    await waitFor("#tsf").then(elem => elem[0].submit());

    // wait for 10 rows with results
    await waitFor(".r").then(rows => $expect(rows).to.have.items(10));

    // assert text content on the result list
    await waitFor(elementByContent('span', 'Test - Wikipedia')).then(wiki => $expect(wiki).to.exist());
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
