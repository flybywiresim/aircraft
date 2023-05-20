# Source Files for Instruments

This directory contains the source files for the instruments.

## Overview

The instruments build is powered by [Mach](https://github.com/Synaptic-Simulations/mach/). Mach uses `esbuild` internally, which uses native code to compile JavaScript sources quickly.

### Building all instruments

To build all instruments outside of the normal build process, one can simply run:

```
$ mach build
```

...provided that your working directory is `fbw-a32nx` or `fbw-a380x`. If it is not, you can specify a path to the config by adding `--config path/to/mach.config.js --work-in-config-dir`.

```
$ mach build --config path/to/mach.config.js --work-in-config-dir
```

### Building a specific instrument

You can build only one instrument by using the `--filter / -f` flag (parsed as a RegEx):

```
$ mach build -f EWD
```

### Watch mode

To watch an instrument and recompile when changes to source files are detected, simply use `watch` instead of `build`:

```
$ mach watch -f EWD
```

### Source maps

You can append source maps to the end of instrument bundles using the `-u / --output-sourcemaps` flag.

**Note:** Source maps currently do not work with React based instruments. This will be fixed in the future.

### Adding a new instrument

To add a new instrument, simply edit the `mach.config.js` file of your desired project folder.

You can add an instrument to the list using the `reactInstrument / msfsAvionicsInstrument` helper functions. Note that React should be avoided for new instruments. Consult with the dev team on Discord if you have any questions.

### A note on cross-platform usage

Since compiling aircraft in this repository usually happens using the provided `dev-env` Docker image, the OS in which the commands are run can differ.

This can cause issues with `esbuild`, as it relies on pre-compiled binaries to work correctly. For this reason, running `npx mach` after Mach was installed in the Linux `dev-env` container can cause errors.

To solve this, install Mach globally on your PC:

```
$ npm install -g @synaptic-simulations/mach
```

### A note on ACE instruments builds

If you are building instruments for use with ACE, the old `rollup` pipeline is still used. A convenience script is available:

```
$ npm run build:ace
```

This will be ported over to Mach in the future.

## How to create a new instrument

To create a new instrument, create a folder in `/src/systems/instruments/src`, with a `config.json` file, for example:

```json
{
    "index": "./index.tsx",
    "isInteractive": false,
}
```

- `index` - Name of the main file in the instrument, in this example `index.jsx`.
- `isInteractive` - `true` if this instrument should intercept click events and such.

Once you have your index file, you can import the render element target and start doing stuff with it:

```jsx
import { renderTarget } from '../util.js';

// modify it manually...
renderTarget.style.backgroundColor = 'red';

// or use a rendering library...
ReactDOM.render(<MyAwesomeThing />, renderTarget);

// or something else!
```
