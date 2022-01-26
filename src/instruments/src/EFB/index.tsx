import React from 'react';
import { MemoryRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { FailuresOrchestratorProvider } from './failures-orchestrator-provider';
import Efb from './Efb';

import './Assets/Efb.scss';
import './Assets/Theme.css';
import { render } from '@instruments/common/index';
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
