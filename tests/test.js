testGoogle = async function (config) {
    // change to english
    // await waitFor(() => elementByContent('a', 'English')).then(result => result[0].click());
    // search for term 'test'
    await waitFor("#lst-ib").then(result => result.val('test'));
    // press search
     await waitFor("#tsf").then(result => result[0].submit());
}
