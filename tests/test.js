testGoogle = async function (config) {
    // change to english (not required)
    // await waitFor(() => elementByContent('a', 'English')).then(result => result[0].click());
    // enter term 'test'
    await waitFor("#lst-ib").then(result => result.val('test'));
    // search
    await waitFor("#tsf").then(result => result[0].submit());
}

 testGithub = async function (config) {
    // enter 'test' into Github search on the main page 
    await waitFor("input[name=q]").then(result => result.val("test")); 
    // submit the form
    window.aaa = await function(){ alert('a'); };
    await waitFor(".js-site-search-form").then(result => result.submit());
    // TODO: new page after submit, it would require injecting again all js files including test !
    // TODO: what is more important, this javascript execution is terminated after submit, this throws an error and 
    // TODO: interrup test
    // click on Java tag on the project list
    window.aaa = await function(){ alert('a'); };
    //await waitFor(() => elementByContent('a', 'Java')).then(result => result.click());
}
