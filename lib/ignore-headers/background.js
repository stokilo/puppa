chrome.webRequest.onHeadersReceived.addListener(
    function (details) {
      var filteredResponseHeaders = [];
      for (var i = 0; i < details.responseHeaders.length; ++i) {
        var headerName = details.responseHeaders[i].name.toLowerCase();
        if (['x-frame-options', 'content-security-policy', 'x-content-type-options'].indexOf(headerName) < 0) {
            filteredResponseHeaders.push(details.responseHeaders[i]); 
        }
      }

      console.dir(filteredResponseHeaders);

      return {
        responseHeaders: filteredResponseHeaders
      };
    }, {
      urls: ["<all_urls>"]
    }, ["blocking", "responseHeaders"]);