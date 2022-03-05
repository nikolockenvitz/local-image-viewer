function interceptFileRequests(requestDetails) {
    console.log("intercepted", requestDetails);
    // return { requestHeaders: requestDetails.requestHeaders };
    return {};
}

async function main() {
    // remove potential previous listeners
    browser.webRequest.onBeforeSendHeaders.removeListener(interceptFileRequests);

    const opt_extraInfoSpec = ["blocking", "requestHeaders"];
    //if (isChromium) opt_extraInfoSpec.push("extraHeaders");
    browser.webRequest.onBeforeSendHeaders.addListener(
        interceptFileRequests,
        //{ urls: ["file:///home/*", "https://raw.githubusercontent.com/*"] },
        { urls: ["<all_urls>"]},
        opt_extraInfoSpec
    );
}
main();

browser.runtime.onMessage.addListener(function (request) {
    if (request.rerunMainFunctionOfBackgroundPage) {
        main();
    }
});

/*
- install addon as temporary extension (about:debugging, This Firefox)
- click on Inspect to view this background page's console output
- open a local file in the browser and open the console

async function req(url, n=100) { console.log((await (await fetch(url)).text()).substring(0, n))}

req("https://raw.githubusercontent.com/nikolockenvitz/local-image-viewer/master/README.md")
// <-- will log "intercepted"

req("file:///home/", 300)
// <-- does nothing aaaaarrrrrggggghhhh
// missing host permission for file?
*/
