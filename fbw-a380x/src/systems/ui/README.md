# UI Element

To create a new UI element, create a folder in `/src/ui/src`, with a `config.json` file, for example:

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
