import React from 'react';
import ReactDOM from 'react-dom';
import * as Defaults from './defaults';
import { SimVarProvider } from './simVars';

/**
 * Use the given React element to render the instrument using React.
 */
export const render = (Slot: React.ReactElement, container: Element | DocumentFragment | null = Defaults.renderTarget, dev?: boolean) => {
    ReactDOM.render(<SimVarProvider dev={dev}>{Slot}</SimVarProvider>, container);
}
