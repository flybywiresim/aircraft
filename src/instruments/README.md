# Instruments

## How to create a new instrument

To create a new instrument, create a folder in `/src/instruments/src`, with a `config.json` file, for example:

```json
{
    "index": "./index.jsx",
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
ReactDOM.render(<MyAwesomeThing/>, renderTarget);

// or something else!
```

## Build process

The build process is based on `rollup` and has two configurations:

- `buildSrc/simulatorBuild.mjs` - this creates a configuration which includes both the base compile (babel, postcss, ...) and the MSFS VCockpit template generation;
- `buildSrc/browserBuild.mjs` - this creates a configuration which includes both the base compile (babel, postcss, ...), without any MSFS extras.

The instruments and ECAM pages to build are provided by `buildSrc/igniter/tasks.mjs`.

### Igniter task generation

For `igniter` builds, `buildSrc/igniter/tasks.mjs` generates a list of `igniter` tasks which are run by the aircraft build.

## How to build in watch mode

After running `npm install`, from the root folder, run:

```
rollup -wc .\src\instruments\buildSrc\simulatorBuild.mjs
```
