const supportedFileTypesLowerCase = [ // MUST BE lower case, matches case insensitive
    "png", "jpg", "jpeg", "webp",
    "svg",
];

const NUMBER_OF_FILES_TO_PRELOAD = 4;

let curDirectory, curFilename;
[curDirectory, curFilename] = splitAtLast(window.location.href, "/");

let filenames = [];

async function getListOfFilenamesInCurrentDirectory () {
    let curDirectory = splitAtLast(window.location.href, "/")[0];
    let filenames = [];
    try {
        const response = await fetch(curDirectory);
        const data = await response.text();
        const fileList = data.split("\n");
        for (let line of fileList) {
            let filename = getFilenameIfSupportedFile(line);
            if (filename) {
                filenames.push(filename);
            }
        }
    } catch (err) {
        console.log(err);
    }
    return filenames;
}

function getFilenameIfSupportedFile (line) {
    // depends on browser; this is currently only for Firefox
    if (line.startsWith("201: ")) {
        let temp = line.split(" ");
        let filename = temp[1];
        let type = temp[temp.length-2];
        if (type === "FILE" && hasSupportedFileType(filename)) {
            filename = applyCorrectURLEncoding(filename);
            return filename;
        }
    }
}

function hasSupportedFileType (filename) {
    let fileType = splitAtLast(filename, ".")[1].toLowerCase();
    return supportedFileTypesLowerCase.includes(fileType);
}

function applyCorrectURLEncoding (filename) {
    /* the encoding of retrieved filenames of the directory and the encoding
     * of the url differ a bit, e.g. when opening a picture with a "(" in the
     * name it will be "(" in the url but "%28" in the directory file list
     */
    return encodeURI(decodeURI(filename));
}

function splitAtLast (text, separator) {
    let temp = text.split(separator);
    let last = temp.pop();
    return [temp.join(separator), last];
}

function redirectToAdjacentFile (diff) {
    let path = getAdjacentFilePath(diff);
    redirectToURL(path);
}

function getAdjacentFilePath (diff) {
    let ix = (filenames.indexOf(curFilename) + diff) % filenames.length;
    if (ix < 0) ix += filenames.length
    return curDirectory + "/" + filenames[ix];
}

function redirectToURL (url) {
    window.location.replace(url);
}

function getImageElementBySrc (src) {
    let query = `img[src="${src}"]`;
    return document.querySelector(query);
}

function preloadAdjacentFiles () {
    for (let i=0; i<NUMBER_OF_FILES_TO_PRELOAD; i++) {
        let diff = (Math.floor(i/2)+1)*(i%2?-1:1); // +1, -1, +2, -2, +3, ...
        let filepath = getAdjacentFilePath(diff);
        _preloadFile(filepath);
    }
}

function _preloadFile (filepath) {
    if (getImageElementBySrc(filepath)) return;
    let image = new Image();
    image.src = filepath;
    image.style.maxWidth = "100%";
    image.style.maxHeight = "100%";
    image.classList.add("transparent");

    image.classList.add("shrinkToFit");
    image.addEventListener("click", function (event) {
        zoomImage(image, event);
    });

    image.style.zIndex = "0";
    document.body.appendChild(image);
}

function zoomImage (image, event) {
    if (!isImageGreaterThanBody(image)) {
        image.classList.remove("shrinkToFit");
        image.classList.remove("overflowingVertical");
        image.classList.remove("overflowingHorizontalOnly");
        return;
    }
    if (image.naturalHeight > image.height || image.naturalWidth > image.width) {
        // zoom in
        let prevWidth = image.clientWidth;
        let prevHeight = image.clientHeight;
        let clickPosXRelativeToImage = event.layerX;
        let clickPosYRelativeToImage = event.layerY;
        image.classList.remove("shrinkToFit");
        if (image.naturalHeight > document.body.clientHeight) {
            image.classList.add("overflowingVertical");
        } else {
            image.classList.add("overflowingHorizontalOnly");
        }
        image.style.maxWidth = "";
        image.style.maxHeight = "";

        // centers the clicked position
        if (event) {
            let scrollX = (clickPosXRelativeToImage/prevWidth)*image.naturalWidth - document.body.clientWidth/2;
            let scrollY = (clickPosYRelativeToImage/prevHeight)*image.naturalHeight - document.body.clientHeight/2;
            window.scrollTo(scrollX, scrollY);
        }
    } else {
        // zoom out
        image.classList.add("shrinkToFit");
        image.classList.remove("overflowingVertical");
        image.classList.remove("overflowingHorizontalOnly");
        image.style.maxWidth = "100%";
        image.style.maxHeight = "100%";
    }
}

function isImageGreaterThanBody (image) {
    return image.naturalWidth > document.body.clientWidth
        || image.naturalHeight > document.body.clientHeight;
}

function updateZoomOfCurrentImage () {
    let image = getImageElementBySrc(curDirectory+"/"+curFilename);
    if (!isImageGreaterThanBody(image)) {
        // image fits into body -> no zoom needed
        image.classList.remove("shrinkToFit");
        image.classList.remove("overflowingVertical");
        image.classList.remove("overflowingHorizontalOnly");
        return;
    }

    image.classList.add("shrinkToFit");
    if (image.classList.contains("overflowingVertical") || image.classList.contains("overflowingHorizontalOnly")) {
        // currently zoomed in -> update overflow
        if (image.naturalHeight > document.body.clientHeight) {
            image.classList.add("overflowingVertical");
            image.classList.remove("overflowingHorizontalOnly");
        } else {
            image.classList.add("overflowingHorizontalOnly");
            image.classList.remove("overflowingVertical");
        }
    } else {
        image.style.maxWidth = "100%";
        image.style.maxHeight = "100%";
    }
}

function loadAdjacentFile (diff) {
    let filename = splitAtLast(getAdjacentFilePath(diff), "/")[1];
    if (splitAtLast(filename, ".")[1].toLowerCase() === "svg") {
        redirectToAdjacentFile(diff);
        return;
    }
    loadFile(filename);
}

function loadFile (filename) {
    let oldImage = getImageElementBySrc(curDirectory+"/"+curFilename);
    oldImage.style.zIndex = "0";
    if (!oldImage.classList.contains("shrinkToFit")) { // zoom out
        oldImage.classList.add("shrinkToFit");
        oldImage.classList.remove("overflowingVertical");
        oldImage.classList.remove("overflowingHorizontalOnly");
        oldImage.style.maxWidth = "100%";
        oldImage.style.maxHeight = "100%";
    }

    curFilename = filename;
    let newImage = getImageElementBySrc(curDirectory+"/"+curFilename);
    if (!newImage) {
        _preloadFile(curDirectory+"/"+curFilename);
        newImage = getImageElementBySrc(curDirectory+"/"+curFilename);
    }
    newImage.style.zIndex = "2";
    if (newImage.naturalWidth === newImage.width && newImage.naturalHeight === newImage.height) {
        // remove zoom-mouse-pointer if zoom-in not possible
        newImage.classList.remove("shrinkToFit");
    }

    updateURLAndTitle();
    preloadAdjacentFiles();
}

function updateURLAndTitle () {
    let filepath = curDirectory + "/" + curFilename;
    let fileType = splitAtLast(curFilename, ".")[1].toUpperCase();
    let image = getImageElementBySrc(filepath);
    let scale = Math.floor(100 * Math.min(
        document.body.clientWidth / image.naturalWidth,
        document.body.clientHeight / image.naturalHeight
    ));

    let title = `${decodeURI(curFilename)} (${fileType} Image,
                ${image.naturalWidth} x ${image.naturalHeight} pixels)`;
    if (scale < 100) title += ` - Scaled (${scale}%)`;
    window.history.replaceState(
        {},
        title,
        filepath
    );
    document.title = title;
}

function createBackgroundDiv () {
    let div = document.createElement("div");
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.background = "#222";
    div.style.position = "absolute";
    div.style.zIndex = "1";
    document.body.appendChild(div);

    let mainImage = getImageElementBySrc(curDirectory+"/"+curFilename);
    mainImage.style.zIndex = "2";
}

function showAdjacentFile (diff) {
    if (redirectFallback) {
        redirectToAdjacentFile(diff);
    } else {
        loadAdjacentFile(diff);
    }
}


const redirectFallback = document.body === null;
async function main () {
    filenames = await getListOfFilenamesInCurrentDirectory();

    if (!filenames.includes(curFilename)) {
        return;
    }

    if (!redirectFallback) {
        createBackgroundDiv();
        preloadAdjacentFiles();
    }

    document.addEventListener("keyup", function (event) {
        switch (event.key) {
            case "ArrowLeft":
                showAdjacentFile(-1);
                break;
            case "ArrowRight":
                showAdjacentFile(1);
                break;
        }
    });

    window.addEventListener("resize", function () {
        updateZoomOfCurrentImage();
    });
};
main();
