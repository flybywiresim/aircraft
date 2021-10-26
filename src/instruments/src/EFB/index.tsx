import React from 'react';
import { MemoryRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { FailuresOrchestratorProvider } from './failures-orchestrator-provider';
import Efb from './Efb';

import './Assets/Reset.scss';
import './Assets/Efb.scss';
import { render } from '../Common/index';
import { readSettingsFromPersistentStorage } from './Settings/sync';
import { store } from './Store/store';

const EFBLoad = () => (
    <Router>
        <Provider store={store}>
            <Efb />
        </Provider>
    </Router>
);

readSettingsFromPersistentStorage();

render(<FailuresOrchestratorProvider><EFBLoad /></FailuresOrchestratorProvider>);
