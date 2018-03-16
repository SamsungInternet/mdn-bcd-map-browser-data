/** 
 * Map all data from one browser's version to another browser's version
 * as a starting point, where that data is currently missing. 
 * E.g. Map Chrome v59 to Samsung Internet v7.
 */
const fs = require('fs');
const jsel = require('jsel');

// TODO extend to multiple files - starting with one
const inputFilePath = process.argv[2];

console.log('input filepath', inputFilePath);

// TODO make it write back to the same file
const outputFilePath = inputFilePath + '.tmp';

const sourceBrowserId = 'chrome_android';
const destBrowserId = 'samsunginternet_android';

/**
 * Maps the version on the left, to the version on the right.
 * TODO refactor with ranges to avoid repetition.
 */
const browserVersionMapping = {
    "59": "7.0",
    "58": "7.0",
    "58": "7.0",
    "57": "7.0",
    "56": "6.0",
    "55": "6.0",
    "54": "6.0",
    "53": "6.0",
    "52": "6.0",
    "51": "5.0",
    "50": "5.0",
    "49": "5.0",
    "48": "5.0",
    "47": "5.0",
    "46": "5.0",
    "45": "5.0",
    "44": "4.0",
    "43": "4.0",
    "42": "4.0",
    "41": "4.0",
    "40": "4.0",
    "39": "4.0",
    "38": "3.0",
    "37": "3.0",
    "36": "3.0",
    "35": "3.0",
    "34": "2.0",
    "33": "2.0",
    "32": "2.0",
    "31": "2.0",
    "30": "2.0",
    "29": "2.0",
    "28": "1.5",
    "27": "1.5",
    "26": "1.5",
    "25": "1.5",
    "24": "1.5",
    "23": "1.5",
    "22": "1.5",
    "21": "1.5",
    "20": "1.5",
    "19": "1.5",
    "18": "1.0",
    "17": "1.0",
    "16": "1.0",
    "15": "1.0",
    "14": "1.0",
    "13": "1.0",
    "12": "1.0",
    "11": "1.0",
    "10": "1.0",
    "9": "1.0",
    "8": "1.0",
    "7": "1.0",
    "6": "1.0",
    "5": "1.0",
    "4": "1.0",
    "3": "1.0",
    "2": "1.0",
    "1": "1.0"
};

let json;
let dom;

function readJSON() {

    console.log('Read file');

    fs.readFile(inputFilePath, 'utf8', function(error, data) {

        if (error) {
            throw error;
        }

        json = JSON.parse(data);
        dom = jsel(json);

        updateJSON();
        
    });
    
}

function updateJSON() {

    // Examples of where the data might be:
    // .html.elements.[element_name].__compat.support.[browser_name]
    // .html.global_attributes.[attribute_name].__compat.support.[browser_name]
    // .http.[feature_name].__compat.support.[browser_name]
    // .javascript.classes.__compat.support.[browser_name]
    // .javascript.classes.[feature_name].__compat.support.[browser_name]
    
    const supportNodes = dom.selectAll('//__compat/support');

    console.log('supportNodes', supportNodes.length);

    for (supportNode of supportNodes) {

        const sourceSupportNode = supportNode[sourceBrowserId];
        const destSupportNode = supportNode[destBrowserId];
        
        if (sourceSupportNode) {

            // Source browser exists but not dest browser
            const sourceVersion = sourceSupportNode['version_added'];

            const mappedVersion = browserVersionMapping[sourceVersion];

            if (!destSupportNode || !destSupportNode['version_added']) {

                // Not going to overwrite existing data

                if (sourceVersion === true ||
                    sourceVersion === false ||
                    sourceVersion === null ) {

                    // No version data. Presume true for Chrome is 'true'
                    // for Samsung Internet, false is false, null is null...
                    // Because it's likely to be older stuff.
                    // But we should make a note and check.

                    console.log('Copying source version value:', sourceVersion);
                    
                    supportNode[destBrowserId] = {
                        "version_added": sourceVersion
                    };

                } else if(mappedVersion) {
                
                    console.log(`Mapped source ${sourceVersion} to ${mappedVersion}`);
                    
                    supportNode[destBrowserId] = {
                        "version_added": mappedVersion
                    };


                } else {
                    console.warn('Unrecognised source version', sourceVersion);
                }
                
            }
            
        }
        
    }
    
    writeJSON();
    
}

function writeJSON() {

    console.log('Write file');
    
    fs.writeFile(outputFilePath, JSON.stringify(json, null, 2) + '\n', (error) => {

        if (error) {
            console.error('Error writing to file', outputFilePath);
        } else {
            console.log('Saved', outputFilePath);
        }
        
    });
    
}

readJSON();

