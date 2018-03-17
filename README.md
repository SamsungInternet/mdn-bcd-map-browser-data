# MDN Browser Compat Data update tools

Tools to hopefully make it easier to update [MDN browser-compat-data](https://github.com/mdn/browser-compat-data).

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

To debug, set the DEBUG environment variable with the namespace '':

DEBUG=map-browser-data node map-browser-data.js
