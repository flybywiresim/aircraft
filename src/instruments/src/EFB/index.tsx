import React, { useState, useEffect } from 'react';
import { MemoryRouter as Router } from 'react-router-dom';
import { FailuresOrchestratorProvider } from './failures-orchestrator-provider';
import Efb from './Efb';
import logo from './Assets/fbw-logo.svg';

import './Assets/Reset.scss';
import './Assets/Efb.scss';
import { render } from '../Common/index';
import { readSettingsFromPersistentStorage } from './Settings/sync';
import { useSimVar } from '../Common/simVars';

const ScreenBlank = () => {
    const [, setTurnedOn] = useSimVar('L:A32NX_EFB_TURNED_ON', 'number');

    return (
        <div onClick={() => setTurnedOn(1)} style={{ width: '100vw', height: '100vh' }} />
    );
};

const ScreenLoading = () => (
    <div className="loading-screen">
        <div className="center">
            <div className="placeholder">
                <img src={logo} className="fbw-logo" alt="logo" />
                {' '}
                flyPad
            </div>
            <div className="loading-bar">
                <div className="loaded" />
            </div>
        </div>
    </div>
);

const EFBLoad = () => {
    const [content, setContent] = useState('off');
    const [isTurnedOn, setTurnedOn] = useSimVar('L:A32NX_EFB_TURNED_ON', 'number');

    useEffect(() => {
        switch (isTurnedOn) {
        case 0:
            setContent('off');
            break;
        case 1:
            if (content !== 'loading') {
                setContent('loading');
                setTimeout(() => {
                    setTurnedOn(2);
                }, 6000);
            }
            break;
        case 2:
            setContent('loaded');
            break;
        default:
            throw new RangeError();
        }
    }, [isTurnedOn]);

    switch (content) {
    case 'off':
        return <ScreenBlank />;
    case 'loading':
        return <ScreenLoading />;
    case 'loaded':
        return (
            <Router>
                <Efb />
            </Router>
        );
    default:
        throw new Error();
    }
};

readSettingsFromPersistentStorage();

render(<FailuresOrchestratorProvider><EFBLoad /></FailuresOrchestratorProvider>);
