import React, { useEffect } from 'react';
import { MemoryRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { FailuresOrchestratorProvider } from './failures-orchestrator-provider';
import Efb from './Efb';

import './Assets/Reset.scss';
import './Assets/Efb.scss';
import './Assets/Theme.css';
import { render } from '../Common/index';
import { readSettingsFromPersistentStorage } from './Settings/sync';
import { store } from './Store/store';
import { usePersistentProperty } from '@instruments/common/persistence';

const EFBLoad = () => {
    const [theme] = usePersistentProperty('EFB_THEME');

    useEffect(() => {
        switch(theme) {
            case 'dark':
                document.documentElement.className += ' theme-dark';
                break;
            case 'light':
                document.documentElement.className += ' theme-light';
                break;
        }
    }, [theme]);

    return (
        <Router>
            <Provider store={store}>
                <Efb />
            </Provider>
        </Router>
    );
};

readSettingsFromPersistentStorage();

render(<FailuresOrchestratorProvider><EFBLoad /></FailuresOrchestratorProvider>);
