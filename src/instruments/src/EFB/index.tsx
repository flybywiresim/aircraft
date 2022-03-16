import React from 'react';
import { MemoryRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { render } from '@instruments/common/index';
import ReactDOM from 'react-dom';
import * as Defaults from '@instruments/common/defaults';
import { ErrorBoundary } from 'react-error-boundary';
import { ModalProvider } from './UtilComponents/Modals/Modals';
import { FailuresOrchestratorProvider } from './failures-orchestrator-provider';
import Efb from './Efb';

import './Assets/Efb.scss';
import './Assets/Theme.css';
import './Assets/Slider.scss';
import { readSettingsFromPersistentStorage } from './Settings/sync';
import { store } from './Store/store';
import { Error } from './Assets/Error';

const EFBLoad = () => (
    <Router>
        <ModalProvider>
            <Provider store={store}>
                <Efb />
            </Provider>
        </ModalProvider>
    </Router>
);

if (process.env.VITE_BUILD) {
    window.addEventListener('AceInitialized', () => readSettingsFromPersistentStorage());
} else {
    readSettingsFromPersistentStorage();
}

export const ErrorBoundaryMessage = () => (
    <div className="flex justify-center items-center w-full h-screen bg-theme-body">
        <div className="max-w-4xl">
            <Error />
            <div className="mt-6 space-y-12">
                <h1 className="text-4xl font-bold">A critical error has been encountered.</h1>

                <h2 className="text-3xl">You must restart your flight to use this tablet.</h2>

                <h2 className="text-3xl leading-relaxed">
                    You have opted into anonymous error reporting and this issue has been relayed to us. If you want immediate support, please share the following code to a member of staff in the #support channel on the FlyByWire Discord server:
                </h2>
                {/* TODO: Replace this with the actual sessionID */}
                <h1 className="text-4xl font-extrabold tracking-wider text-center">ZX96CHUNGHOLBOR</h1>
            </div>
        </div>
    </div>
);

try {
    render(
        <ErrorBoundary FallbackComponent={ErrorBoundaryMessage}>
            <FailuresOrchestratorProvider><EFBLoad /></FailuresOrchestratorProvider>
        </ErrorBoundary>,
    );
} catch (e) {
    ReactDOM.render(<ErrorBoundaryMessage />, Defaults.getRenderTarget());
}
