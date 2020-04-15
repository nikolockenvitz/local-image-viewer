const supportedFileTypesLowerCase = [ // MUST BE lower case, matches case insensitive
    "png", "jpg", "jpeg", "webp",
];

const NUMBER_OF_FILES_TO_PRELOAD = 2;

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
            return filename;
        }
    }
}

function hasSupportedFileType (filename) {
    let fileType = splitAtLast(filename, ".")[1].toLowerCase();
    return supportedFileTypesLowerCase.includes(fileType);
}

function splitAtLast (text, separator) {
    let temp = text.split(separator);
    let last = temp.pop();
    return [temp.join(separator), last];
}

function redirectToAdjacentFile (diff) {
    let path = getAdjacentFilePath(filenames, diff);
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
        _preloadAdjacentFile(filepath);
    }
}

function _preloadAdjacentFile (filepath) {
    if (getImageElementBySrc(filepath)) return;
    let image = new Image();
    image.src = filepath;
    image.style.maxWidth = document.body.clientWidth;
    image.style.maxHeight = document.body.clientHeight;
    image.classList.add("transparent");

    image.classList.add("shrinkToFit");
    image.addEventListener("click", function (event) {
        function isImageSmallerThanBody () {
            return image.naturalWidth <= document.body.clientWidth
                && image.naturalHeight <= document.body.clientHeight;
        }
        if (isImageSmallerThanBody()) {
            image.classList.remove("shrinkToFit");
            return;
        }
        if (image.classList.contains("shrinkToFit")) {
            // zoom in
            let prevWidth = image.clientWidth;
            let prevHeight = image.clientHeight;
            let clickPosXRelativeToImage = event.layerX;
            let clickPosYRelativeToImage = event.layerY;
            image.classList.remove("shrinkToFit");
            image.classList.add("overflowingVertical");
            image.style.maxWidth = "";
            image.style.maxHeight = "";

            // centers the clicked position
            let scrollX = (clickPosXRelativeToImage/prevWidth)*image.naturalWidth - document.body.clientWidth/2;
            let scrollY = (clickPosYRelativeToImage/prevHeight)*image.naturalHeight - document.body.clientHeight/2;
            window.scrollTo(scrollX, scrollY);
        } else {
            // zoom out
            image.classList.add("shrinkToFit");
            image.classList.remove("overflowingVertical");
            image.style.maxWidth = "100%";
            image.style.maxHeight = "100%";
        }
    });

    image.style.display = "none";
    document.body.appendChild(image);
}

function loadAdjacentFile (diff) {
    let oldImage = getImageElementBySrc(curDirectory+"/"+curFilename);
    oldImage.style.display = "none";

    curFilename = splitAtLast(getAdjacentFilePath(diff), "/")[1];
    let newImage = getImageElementBySrc(curDirectory+"/"+curFilename);
    if (!newImage) {
        _preloadAdjacentFile(curDirectory+"/"+curFilename);
        newImage = getImageElementBySrc(curDirectory+"/"+curFilename);
    }
    newImage.style.display = "";

    preloadAdjacentFiles();
}


async function main () {
    filenames = await getListOfFilenamesInCurrentDirectory();

    if (!filenames.includes(curFilename)) {
        return;
    }

    preloadAdjacentFiles();

    document.addEventListener("keyup", function (event) {
        switch (event.key) {
            case "ArrowLeft":
                loadAdjacentFile(-1);
                // TODO: maybe clear old cached files, make sure that reload leads to this new image
                break;
            case "ArrowRight":
                loadAdjacentFile(1);
                break;
        }
    });
};
main();
