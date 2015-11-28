# Meeting

Suite of applications for performing distributed group video conferences and managing shared meeting boards.

## Development

All development thus-far has been performed on OS X. It is anticipated that the same mechanisms described here will also work on Linux systems.

### Dependencies

```bash
npm install -g browserify
npm install
```

See the [React documentation](http://facebook.github.io/react/docs/getting-started.html#using-react-from-npm) for further notes on installation.

### Building

```bash
browserify -t reactify main.js -o bundle.js
```

### Running

```bash
node service.js
```