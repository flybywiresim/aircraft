import React, { useState } from 'react';
import { MemoryRouter as Router } from 'react-router-dom';
import { FailuresOrchestratorProvider } from './failures-orchestrator-provider';
import Efb from './Efb';
import logo from './Assets/fbw-logo.svg';

import './Assets/Reset.scss';
import './Assets/Efb.scss';
import { render } from '../Common/index';
import { readSettingsFromPersistentStorage } from './Settings/sync';
import { useInteractionEvent } from '../util';

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

export enum ContentState {
    OFF,
    LOADING,
    LOADED
}

interface PowerContextInterface {
    content: ContentState,
    setContent: (ContentState) => void
}

export const PowerContext = React.createContext<PowerContextInterface>(undefined as any);

const EFBLoad = () => {
    const [content, setContent] = useState<ContentState>(ContentState.OFF);

    function offToLoaded() {
        setContent(ContentState.LOADING);
        setTimeout(() => {
            setContent(ContentState.LOADED);
        }, 6000);
    }

    useInteractionEvent('A32NX_EFB_POWER', () => {
        if (content === ContentState.OFF) {
            offToLoaded();
        } else {
            setContent(ContentState.OFF);
        }
    });

    switch (content) {
    case ContentState.OFF:
        return <div className="w-screen h-screen" onClick={() => offToLoaded()} />;
    case ContentState.LOADING:
        return <ScreenLoading />;
    case ContentState.LOADED:
        return (
            <Router>
                <PowerContext.Provider value={{ content, setContent }}>
                    <Efb />
                </PowerContext.Provider>
            </Router>
        );
    default:
        throw new Error('Invalid content state provided');
    }
};

readSettingsFromPersistentStorage();

render(<FailuresOrchestratorProvider><EFBLoad /></FailuresOrchestratorProvider>);
