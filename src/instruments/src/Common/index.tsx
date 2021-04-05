import React from 'react';
import ReactDOM from 'react-dom';
import * as Defaults from './defaults';
import { SimVarProvider } from './simVars';

/**
 * Use the given React element to render the instrument using React.
 */
export const render = (Slot: React.ReactElement) => {
    ReactDOM.render(<SimVarProvider>{Slot}</SimVarProvider>, Defaults.getRenderTarget());
};
