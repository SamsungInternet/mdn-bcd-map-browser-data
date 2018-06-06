# MDN Browser Compat Data - tool for mapping browser data

**Currently in progress and hardcoded for Samsung Internet use**

A script to hopefully make it easier to update [MDN browser-compat-data](https://github.com/mdn/browser-compat-data).

It uses a defined `source` browser and version mapping, to update the supported version data for another browser, where that data is currently missing.

It updates the JSON files directly. It takes a path which contains Browser Compat Data JSON files, so you could apply it to the whole repo, or a subpath.

## map-browser-data

Usage:

```
npm install
node map-browser-data [path]
```

Examples

```
node map-browser-data .
node map-browser-data ../bcd/javascript/
```

To debug, set the DEBUG environment variable with the namespace 'map-browser-data':

```
DEBUG=map-browser-data node map-browser-data.js [path]
```

