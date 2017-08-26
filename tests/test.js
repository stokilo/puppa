// headless chrome won't load extensions so this test fail in this mode
// reason is that google.com is not allowing to be included in iframe be sending appropriate HTTP headers
// works only in non-headless mode
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

