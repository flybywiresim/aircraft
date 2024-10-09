import React from 'react';
import ReactDOM from 'react-dom';
import { getRootElement } from '@instruments/common/defaults.js';
import { SystemDisplay } from './SystemDisplay';
import { render } from '../Common';
import { renderTarget } from '../util';

if (renderTarget) {
  render(<SystemDisplay />);
}

getRootElement().addEventListener('unload', () => {
  ReactDOM.unmountComponentAtNode(renderTarget ?? document.body);
});
