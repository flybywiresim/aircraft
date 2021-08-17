import React from 'react';
import ReactDOM from 'react-dom';
import { SimVarProvider } from '@instruments/common/simVars';
import * as Defaults from './defaults';

/**
 * Use the given React element to render the instrument using React.
 */
export const render = (slot: React.ReactElement) => {
    ReactDOM.render(<SimVarProvider>{slot}</SimVarProvider>, Defaults.getRenderTarget());
};
