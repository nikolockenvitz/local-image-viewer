const MATCH_PATTERN = [
    "file:///*.png",
    "file:///*.PNG",
    "file:///*.jpg",
    "file:///*.JPG",
    "file:///*.jpeg",
    "file:///*.JPEG",
    "file:///*.webp",
    "file:///*.WEBP",
    "file:///*.svg",
    "file:///*.SVG",
];

function onContextMenuItemClick (info, tab) {
    switch (info.menuItemId) {
        case "prev-image":
            sendMessage(tab.id, "prev-image");
            break;
        case "next-image":
            sendMessage(tab.id, "next-image");
            break;
    }
}
function addContextMenuEntries () {
    if (browser.contextMenus.onClicked.hasListener(onContextMenuItemClick)) {
        return;
    }

    browser.contextMenus.create({
        id: "prev-image",
        title: "Previous Image",
        contexts: ["all"],
        documentUrlPatterns: MATCH_PATTERN,
        icons: {
            "128": "icons/arrow_left.svg",
        },
    });

    browser.contextMenus.create({
        id: "next-image",
        title: "Next Image",
        contexts: ["all"],
        documentUrlPatterns: MATCH_PATTERN,
        icons: {
            "128": "icons/arrow_right.svg",
        },
    });

    browser.contextMenus.onClicked.addListener(onContextMenuItemClick);
}

function removeContextMenuEntries () {
    browser.contextMenus.removeAll();
    browser.contextMenus.onClicked.removeListener(onContextMenuItemClick);
}

function sendMessage (tabId, message) {
    browser.tabs.sendMessage(tabId, message);
}

browser.runtime.onMessage.addListener(function (message) {
    switch (message) {
        case "bs-add-context-menu-entries":
            addContextMenuEntries();
            break;
    }
});
