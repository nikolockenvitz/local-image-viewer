const supportedFileTypesLowerCase = [ // MUST BE lower case, matches case insensitive
    "png", "jpg", "jpeg",
    //"pdf",
];

let curDirectory, curFilename;
[curDirectory, curFilename] = splitAtLast(window.location.href, "/");

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

function redirectToAdjacentFile (filenames, diff) {
    let ix = (filenames.indexOf(curFilename) + diff) % filenames.length;
    if (ix < 0) ix += filenames.length
    redirectToURL(curDirectory + "/" + filenames[ix]);
}

let redirectToURL = function (url) {
    window.location.replace(url);
};

async function main () {
    let filenames = await getListOfFilenamesInCurrentDirectory();

    if (!filenames.includes(curFilename)) {
        console.log("current file is not part of supported files");
        return;
    }

    document.addEventListener("keyup", function (event) {
        switch (event.key) {
            case "ArrowLeft":
                redirectToAdjacentFile(filenames, -1);
                break;
            case "ArrowRight":
                redirectToAdjacentFile(filenames, +1);
                break;
        }
    });
};
main();
