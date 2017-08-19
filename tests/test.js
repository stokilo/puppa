testGoogle = async function (config) {
    // change to english (not required)
    // await waitFor(() => elementByContent('a', 'English')).then(result => result[0].click());
    // enter term 'test'
    await waitFor("#lst-ib").then(result => result.val('test'));
    // search
    await waitFor("#tsf").then(result => result[0].submit());
}
