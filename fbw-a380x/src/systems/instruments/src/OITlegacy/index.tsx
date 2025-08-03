// @ts-strict-ignore
import React from 'react';
import { getRootElement } from '@instruments/common/defaults';
import ReactDOM from 'react-dom';
import { renderTarget } from '../util.js';
import { render } from '../Common';
import { OitEfbWrapper } from 'instruments/src/OITlegacy/OitLegacy.js';
import { EventBus } from '@microsoft/msfs-sdk';

if (renderTarget) {
  render(<OitEfbWrapper eventBus={new EventBus()} />);
}

getRootElement().addEventListener('unload', () => {
  ReactDOM.unmountComponentAtNode(renderTarget ?? document.body);
});
