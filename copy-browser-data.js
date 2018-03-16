/** 
 * Map all data from one browser's version to another browser's version
 * where that data is currently missing. E.g. Map Chrome v59 to 
 * Samsung Internet v7.
 */
const fs = require('fs');

// TODO come back to this to make it non-hardcoded
// See: http://yargs.js.org/
/*
const yargs = require('yargs');

yargs.usage('$0 <cmd> [args]')
    .command('copy-browser-data [filepath] [source] [source-version] [dest] [dest-version]', (yargs) => {
        yargs.positional('filepath', {
            
        })
    })
*/

// TODO extend to multiple files - starting with one
const inputFilePath = './html/elements/a.json';

// TODO make it write back to the same file
const outputFilePath = './html/elements/a.json.tmp';

let json;

function readJSON() {

    console.log('Read file');

    fs.readFile(inputFilePath, 'utf8', function(error, data) {

        if (error) {
            throw error;
        }

        json = JSON.parse(data);

        writeJSON();
        
    });
    
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







