import React, { useEffect } from 'react';
import { MemoryRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { usePersistentProperty } from '@instruments/common/persistence';
import { FailuresOrchestratorProvider } from './failures-orchestrator-provider';
import Efb from './Efb';

import './Assets/Efb.scss';
import './Assets/Theme.css';
import { render } from '../Common/index';
import { readSettingsFromPersistentStorage } from './Settings/sync';
import { store } from './Store/store';

const EFBLoad = () => {
    const [theme] = usePersistentProperty('EFB_THEME');

    useEffect(() => {
        let themeToApply;
        switch (theme) {
        case 'dark':
            themeToApply = ' theme-dark';
            break;
        case 'light':
            themeToApply = ' theme-light';
            break;
        default:
            themeToApply = ' theme-blue';
        }
        document.documentElement.className = document.documentElement.className.replace(/\btheme-\S+/g, ' ');
        document.documentElement.className += themeToApply;
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
