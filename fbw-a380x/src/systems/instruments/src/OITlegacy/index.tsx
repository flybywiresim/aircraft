import React from 'react';
import { getRootElement } from '@instruments/common/defaults';
import { HashRouter as Router } from 'react-router-dom';
import ReactDOM from 'react-dom';
import { renderTarget } from '../util.js';
import { OnboardInformationTerminal } from './OnboardInformationTerminal';
import { render } from '../Common';

if (renderTarget) {
  render(
    <Router>
      <OnboardInformationTerminal />
    </Router>,
  );
}

getRootElement().addEventListener('unload', () => {
  ReactDOM.unmountComponentAtNode(renderTarget ?? document.body);
});
