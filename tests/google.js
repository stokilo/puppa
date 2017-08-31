// headless chrome won't load extensions so this test fail in this mode
// reason is that google.com is not allowing to be included in iframe be sending appropriate HTTP headers
// works only in non-headless mode
testGoogleSearch = async function (config) {

    // enter term 'test'
    await elem("#lst-ib", elem => elem.val('test'));

    // search
    await elem("#tsf", elem => elem[0].submit());

    // wait for 10 rows with results
    await elem(".r", rows => $expect(rows).to.have.items(10));

    // assert text content on the result list
    await felem(() => elementByContent('span', 'Test - Wikipedia'), wiki => wiki.click());

    // check wikipedia heading text
    await elem(".firstHeading", heading => $expect(heading).to.have.text('Test'));
}

