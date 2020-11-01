# Instruments

To create a new instrument, create a folder in `/src/instruments/src`, with a `config.json` file, for example:

```json
{
    "index": "./index.jsx",
    "isInteractive": false,
}
```

- `index` - Name of the main file in the instrument, in this example `index.jsx`.
- `isInteractive` - `true` if this instrument should intercept click events and such.