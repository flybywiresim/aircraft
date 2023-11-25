import { getRootElement } from '@instruments/common/defaults';
import React from 'react';
import ReactDOM from 'react-dom';
import { render } from '../Common';
import { renderTarget } from '../util.js';
import { EngineWarningDisplay } from './EngineWarningDisplay';

import './style.scss';

if (renderTarget) {
    render(<EngineWarningDisplay />);
}

getRootElement().addEventListener('unload', () => {
    ReactDOM.unmountComponentAtNode(renderTarget ?? document.body);
});
