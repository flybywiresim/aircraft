import React from 'react';
import { MemoryRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { render } from '@instruments/common/index';
import { ModalProvider } from './UtilComponents/Modals/Modals';
import { FailuresOrchestratorProvider } from './failures-orchestrator-provider';
import Efb from './Efb';

import './Assets/Efb.scss';
import './Assets/Theme.css';
import './Assets/Slider.scss';
import { readSettingsFromPersistentStorage } from './Settings/sync';
import { store } from './Store/store';

const EFBLoad = () => (
    <Router>
        <ModalProvider>
            <Provider store={store}>
                <Efb />
            </Provider>
        </ModalProvider>
    </Router>
);

readSettingsFromPersistentStorage();

render(<FailuresOrchestratorProvider><EFBLoad /></FailuresOrchestratorProvider>);
