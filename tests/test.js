// headless chrome won't load extensions so this test fail in this mode
// reason is that google.com is not allowing to be included in iframe be sending appropriate HTTP headers
// works only in non-headless mode
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

