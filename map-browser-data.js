/** 
 * Map all data from one browser's version to another browser's version
 * as a starting point, where that data is currently missing. 
 * E.g. Map Chrome v59 to Samsung Internet v7.
 */
const fs = require('fs');
const path = require('path');
const traverse = require('traverse');
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

const chromeDesktopBrowserId = 'chrome';
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

    glob(path.join(inputFilePath, (inputFilePath.match(/\.json$/) ? '' : '**/*.json')), {ignore: 'node_modules'}, (error, files) => {

        if (error) {
            throw error;
        }

        for (const file of files) {

            debug('Read file', file);
            
            const data = fs.readFileSync(file, 'utf8');

            updateJSON(file, data);
                
        }
        

    });

}

function updateJSON(file, data) {

    const json = JSON.parse(data);
    let hasUpdates = false;
    
    // Examples of where the data might be:
    // .html.elements.[element_name].__compat.support.[browser_name]
    // .html.global_attributes.[attribute_name].__compat.support.[browser_name]
    // .http.[feature_name].__compat.support.[browser_name]
    // .javascript.classes.__compat.support.[browser_name]
    // .javascript.classes.[feature_name].__compat.support.[browser_name]

    const supportNodes = traverse(json).reduce(function(acc, node) {

        if (!this.key || !this.parent.key) return acc;

        if (this.key == 'support' && this.parent.key == '__compat') {
            acc.push(this.node);
        }
        return acc;

    }, []);

    debug('supportNodes', supportNodes.length);

    if (supportNodes.length) {

        console.log('Parsing', file);
        
        for (supportNode of supportNodes) {

            let sourceSupportNode = supportNode[sourceBrowserId];
            const chromeSupportNode = supportNode[chromeDesktopBrowserId];

            // Get existing object or make a new one if one is not already present
            const destSupportNode = supportNode[destBrowserId] || {};
            supportNode[destBrowserId] = destSupportNode;

            if (sourceSupportNode) {

                // Sometimes the browser support node contains an array
                // Current example: api/AnimationEvent.json
                // In this case, copy the array first...

                if (Array.isArray(sourceSupportNode)) {

                    // If it is already populated ignore it.
                    if (Array.isArray(destSupportNode)) continue;

                    supportNode[destBrowserId] = {version_added: null};

                    const firstDatumKeys = Object.keys(sourceSupportNode[0]).sort();

                    // If all the data is the same ensure it is sorted by version added.
                    if (sourceSupportNode.every(node => {
                        const keys = Object.keys(node).sort();

                        // Make sure the keys are the same
                        return keys.length === firstDatumKeys.length &&
                            (keys.filter((key, i) => key !== firstDatumKeys[i]).length === 0)
                    })) {
                        // All of the arrays have the same keys
                        sourceSupportNode = sourceSupportNode
                        .slice()
                        .sort((a,b) => {
                                const aVal = parseInt(a.version_added) || Infinity; // true, false, null should be weighted 
                                const bVal = parseInt(b.version_added) || Infinity; // true, false, null should be weighted 
                                return aVal - bVal; 
                        });
                    }
                    
                    const outData = sourceSupportNode
                    .filter(i => !(i.flags || i.alternative_name))
                    .map(i => {
                        const out = Object.assign({}, i);
                        delete out.version_added;
                        mapSupport(i, out, null);
                        return out;

                    }).filter((el, i) => {
                        // filter out any objects with a falsy version_added (aside from the first)
                        if (i === 0) return true;
                        if (!el.version_added) return false;

                        // Filter out situations where the chrome_data is bad i.e.
                        /*
                            [{
                                "version_added": "4.0"
                            },
                            {
                                "version_added": true
                            }]
                        */
                        const keys = Object.keys(el);
                        if (keys.length === 1 && keys[0] === 'version_added') {
                            return false;
                        }
                        return true;
                    });

                    if (!!outData[0].version_added) {
                        if (outData.length === 1 && Object.keys(outData[0]).length) {
                            supportNode[destBrowserId] = outData[0];
                        } else if (Object.keys(outData).length) {
                            supportNode[destBrowserId] = outData;
                        }
                    } else {
                        supportNode[destBrowserId] = {version_added: false};
                    }
                    hasUpdates = true;

                } else {
                    hasUpdates = hasUpdates || mapSupport(sourceSupportNode, destSupportNode, chromeSupportNode);
                }
            }
            if (Object.keys(supportNode[destBrowserId]).length === 0) {
                delete supportNode[destBrowserId];
            }
        }
        
    }
        
    if (hasUpdates) {
        writeJSON(json, file);
    }
    
}

function chromeVersionToSamsung(chromeVer) {

    // Maps false to false and null to null.
    // Otherwise, maps version using our mapping definition.
    // If version mapping not found, default to false.
    return chromeVer && (
        Array.from(browserVersionMapping.entries())
        .find(a => (chromeVer >= a[0][0] && chromeVer <= a[0][1]))
        || [false, false]
    )[1];
}

// In progress - broken...
function mapSupport(sourceSupportNode, destSupportNode, chromeSupportNode) {

    const sourceVersionAdded = sourceSupportNode['version_added'];
    const sourceVersionRemoved = sourceSupportNode['version_removed'];
    const versionAdded = chromeVersionToSamsung(sourceVersionAdded);

    // If support info doesn't exist for Samsung Internet, or is
    // false or null, then continue...
    if (!destSupportNode['version_added']) {

        if (versionAdded === null && chromeSupportNode &&
            chromeSupportNode['version_added'] === false) {

            // If Chrome desktop version is false, if so,
            // we presume false too. (Erring on side of reducing nulls)
            
            console.log(colors.info('- Replacing null with false'));
            destSupportNode['version_added'] = false;         
            
        } else {

            console.log(colors.data(`- Mapped source ${sourceVersionAdded} to ${versionAdded}`));
            destSupportNode['version_added'] = versionAdded;

            if (sourceVersionRemoved) {
                const samsungVersionRemoved = chromeVersionToSamsung(sourceVersionRemoved);
                if (samsungVersionRemoved) {
                    destSupportNode['version_removed'] = samsungVersionRemoved;

                    // Remove the flag if it is added and removed in the same 'version'
                    if (destSupportNode.version_removed === destSupportNode.version_added) {
                        destSupportNode.version_added = false;
                    }
                }
            }
        }

        // needs update so return true
        return true;
    }
}

function writeJSON(json, file) {

    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
    console.log('Writing ' + file);
}

readJSON();

