/** 
 * Map all data from one browser's version to another browser's version
 * as a starting point, where that data is currently missing. 
 * E.g. Map Chrome v59 to Samsung Internet v7.
 */
const fs = require('fs');
const path = require('path');
const jsel = require('jsel');
const glob = require('glob');
const debug = require('debug')('map-browser-data');
const colors = require('colors/safe');

colors.setTheme({
    info: 'green',
    data: 'grey',
    warn: 'yellow',
    error: 'red'
});

if (process.argv.length < 3) {
    console.error(colors.error('Usage: [path]. Please provide a directory of BCD JSON files'));
    process.exit(9)
}

const inputFilePath = process.argv[2];

debug('Using directory', inputFilePath);

const sourceBrowserId = 'chrome_android';
const destBrowserId = 'samsunginternet_android';

/**
 * Maps the version range on the left, to the version on the right.
 */
const browserVersionMapping = new Map([
    [[57, 59], "7.0"],
    [[52, 56], "6.0"],
    [[45, 51], "5.0"],
    [[39, 44], "4.0"],
    [[0, 38], true],
]);

function readJSON() {

    glob(path.join(inputFilePath, '**/*.json'), null, (error, files) => {

        if (error) {
            throw error;
        }

        for (const file of files) {

            debug('Read file', file);
            
            fs.readFile(file, 'utf8', function(error, data) {

                if (error) {
                    throw error;
                }

                updateJSON(file, data);
                
            });
            
        }
        

    });

}

function updateJSON(file, data) {

    const json = JSON.parse(data);
    const dom = jsel(json);
    let hasUpdates = false;
    
    // Examples of where the data might be:
    // .html.elements.[element_name].__compat.support.[browser_name]
    // .html.global_attributes.[attribute_name].__compat.support.[browser_name]
    // .http.[feature_name].__compat.support.[browser_name]
    // .javascript.classes.__compat.support.[browser_name]
    // .javascript.classes.[feature_name].__compat.support.[browser_name]
    
    const supportNodes = dom.selectAll('//__compat/support');

    debug('supportNodes', supportNodes.length);

    if (supportNodes.length) {

        console.log('Parsing', file);
        
        for (supportNode of supportNodes) {

            const sourceSupportNode = supportNode[sourceBrowserId];
            const destSupportNode = supportNode[destBrowserId];
        
            if (sourceSupportNode) {

                const sourceVersion = sourceSupportNode['version_added'];

                // Maps false to false and null to null.
                // Otherwise, maps version using our mapping definition.
                // If version mapping not found, default to false.
                const mappedVersion = sourceVersion && (
                    Array.from(browserVersionMapping.entries())
                    .find(a => (sourceVersion >= a[0][0] && sourceVersion <= a[0][1]))
                    || [false, false]
                )[1];

                // If support info doesn't exist for Samsung Internet, or is
                // false or null, then continue...
                if (!destSupportNode || !destSupportNode['version_added']) {

                    console.log(colors.data(`- Mapped source ${sourceVersion} to ${mappedVersion}`));

                    supportNode[destBrowserId] = {
                        'version_added': mappedVersion
                    };

                    hasChanges = true;
                }

            }

        }
        
    }
        
    if (hasChanges) {
        writeJSON(json, file);
    }
    
}

function writeJSON(json, file) {

    fs.writeFile(file, JSON.stringify(json, null, 2) + '\n', (error) => {

        if (error) {
            console.error(colors.error('Error writing to file %s'), file);
        } else {
            debug('Saved', file);
        }
        
    });
    
}

readJSON();

