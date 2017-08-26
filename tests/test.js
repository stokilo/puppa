testGoogle = async function (config) {
    // enter term 'test'
    await waitFor(() => $("#contentId").contents().find("#lst-ib")).then(result => result.val('test'));
    // search
    await waitFor(() => $("#contentId").contents().find("#tsf")).then(result => result[0].submit());
}

