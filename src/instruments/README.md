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

### ERROR: Javascript heap out of memory

#### Increase memory limit

```
node --max-old-space-size=8192 node_modules/rollup/dist/bin/rollup -wc .\src\instruments\buildSrc\simulatorBuild.mjs
```

#### Custom ES Module (.mjs)

Note: If you are memory resource constrained, create a custom ``build.mjs`` targeted at ``.\src\instruments\buildSrc\custom\``
i.e.

``rollup -wc src\instruments\buildSrc\custom\mfdBuild.mjs``

```
import fs from 'fs';
import { join } from 'path';
import { baseCompile } from '../plugins.mjs';
import { getTemplatePlugin } from '../templatePlugins.mjs';
import { Directories } from '../directories.mjs';
import { getInputs } from '../igniter/tasks.mjs';

process.chdir(Directories.src);

export default getInputs()
    .filter(({ path, name }) => name === 'ND' || name === 'PFD')
    .map(({ path, name, isInstrument }) => {
        const config = JSON.parse(fs.readFileSync(join(Directories.instruments, 'src', path, 'config.json')));

        const additionalImports = config.additionalImports ? config.additionalImports : [];
        return {
            watch: true,
            name,
            input: join(Directories.instruments, 'src', path, config.index),
            output: {
                file: join(Directories.temp, 'bundle.js'),
                format: 'iife',
            },
            plugins: [
                ...baseCompile(name, path),
                getTemplatePlugin({
                    name,
                    path,
                    imports: [
                        '/JS/dataStorage.js',
                        '/Pages/VCockpit/Instruments/FlightElements/A32NX_Waypoint.js',
                        ...additionalImports,
                    ],
                    config,
                    isInstrument,
                }),
            ],
        };
    });
```

This module only watches ``PFD`` and ``ND`` and no other instruments, reducing rollup memory usage.

IMPORTANT NOTE: Increasing memory size is greatly preferred to this, as you must be careful of any unwatched dependencies. It is highly recommended to occasionally check with `` .\scripts\dev-env\run.cmd ./scripts/setup.sh`` and ``.\scripts\dev-env\run.cmd ./scripts/build.sh --no-cache``
