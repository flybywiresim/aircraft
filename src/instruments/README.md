# Instruments

## config.json

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
import { renderTarget } from '../util.mjs';

// modify it manually...
renderTarget.style.backgroundColor = 'red';

// or use a rendering library...
ReactDOM.render(<MyAwesomeThing/>, renderTarget);

// or something else!
```

## panel.cfg

``/A32NX/SimObjects/AirPlanes/Asobo_320_Neo/panel/panel.cfg``

Relink in panel.cfg to generated build template.html

Old:
```
htmlgauge00=Airliners/A320_Neo/Com/A320_Neo_Com.html, 0,0,512,384
```

New:
```
htmlgauge00=generated/DCDU/template.html, 0,0,512,384
```