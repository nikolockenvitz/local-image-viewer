const inputIds = [
    "enable-addon", "reload-on-disabling",
];

let options = {};
let config = {};

window.onload = async function () {
    await Promise.all([
        loadOptionsFromStorage(),
    ]);

    for (let inputId of inputIds) {
        toggleInputOnSectionTextClick(inputId); // sectionText includes also the input itself
    }
    initInputs();

    addEventListenersOnLinkClicks();
};

let onChangeInput = async function (inputId) {
    options[inputId] = document.getElementById(inputId).checked;
    await saveOptionsToStorage();
    if (inputId === "enable-addon" && options[inputId] === false &&
      options["reload-on-disabling"] !== false) {
        browser.tabs.reload();
    } else {
        runMainFunctionOfContentAndBackgroundScripts();
    }
};

let runMainFunctionOfContentAndBackgroundScripts = function () {
    browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
        for (let tab of tabs) {
            // connect will trigger main function of content scripts
            browser.tabs.connect(tab.id).disconnect();
        }
    });
    browser.runtime.getBackgroundPage().then((backgroundWindow) => {
        backgroundWindow.main();
    });
};

let toggleInputOnSectionTextClick = function (inputId) {
    let inputEl = document.getElementById(inputId);
    let sectionText = getSectionTextParent(inputEl);
    if (sectionText) {
        sectionText.addEventListener("click", function (event) {
            if (!inputEl.disabled) {
                inputEl.checked = !inputEl.checked;
                if (!event.target.classList.contains("slider")) {
                    /* click on slider creates two onclick events, so we
                    * can ignore the click on the slider and just use the
                    * click on the input
                    */
                    onChangeInput(inputId);
                }
            }
        });
    }
};

let getSectionTextParent = function (element) {
    while (element) {
        if (element.classList.contains('section-text')) {
            return element;
        }
        element = element.parentElement;
    }
    return null;
};


let loadOptionsFromStorage = async function () {
    return new Promise(async function (resolve, reject) {
        browser.storage.local.get("options").then((res) => {
            options = res.options || {};
            resolve();
        });
    });
};

let saveOptionsToStorage = function () {
    return new Promise(async function (resolve, reject) {
        browser.storage.local.set({options}).then(() => {
            resolve();
        });
    });
};

let initInputs = function () {
    for (let inputId of inputIds) {
        document.getElementById(inputId).checked = (!options || options[inputId] !== false);
    }
};

let addEventListenersOnLinkClicks = function () {
    let links = document.getElementsByClassName("external-link");
    for (let el of links) {
        el.addEventListener("click", function () {
            browser.tabs.create({url: el.title}).then(() => {
                window.close();
            });
        });
    }
};
