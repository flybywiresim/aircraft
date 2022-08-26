/* eslint-disable max-len */
import React, { useState, useEffect } from 'react';
import { MemoryRouter as Router } from 'react-router-dom';
import { customAlphabet } from 'nanoid';
import { NXDataStore } from '@shared/persistence';
import { usePersistentProperty } from '@instruments/common/persistence';
import { Provider } from 'react-redux';
import { render } from '@instruments/common/index';
import { ErrorBoundary } from 'react-error-boundary';
import { SentryConsentState, SENTRY_CONSENT_KEY } from '../../../sentry-client/src/FbwAircraftSentryClient';
import { ModalProvider } from './UtilComponents/Modals/Modals';
import { FailuresOrchestratorProvider } from './failures-orchestrator-provider';
import Efb from './Efb';

import './Assets/Efb.scss';
import './Assets/Theme.css';
import './Assets/Slider.scss';
import { readSettingsFromPersistentStorage } from './Settings/sync';
import { store } from './Store/store';
import { Error } from './Assets/Error';

const EFBLoad = () => {
    const [, setSessionId] = usePersistentProperty('A32NX_SENTRY_SESSION_ID');
    useEffect(() => () => setSessionId(''), []);

    const [err, setErr] = useState(false);

    return (
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => setErr(false)} resetKeys={[err]}>
            <Router>
                <ModalProvider>
                    <Provider store={store}>
                        <Efb />
                    </Provider>
                </ModalProvider>
            </Router>
        </ErrorBoundary>
    );
};

interface ErrorFallbackProps {
    resetErrorBoundary: (...args: Array<unknown>) => void;
}

export const ErrorFallback = ({ resetErrorBoundary }: ErrorFallbackProps) => {
    const [sessionId] = usePersistentProperty('A32NX_SENTRY_SESSION_ID');
    const [sentryEnabled] = usePersistentProperty(SENTRY_CONSENT_KEY, SentryConsentState.Refused);

    return (
        <div className="flex justify-center items-center w-full h-screen bg-theme-body">
            <div className="max-w-4xl">
                <Error />
                <div className="mt-6 space-y-12">
                    <h1 className="text-4xl font-bold">A critical error has been encountered.</h1>

                    <h2 className="text-3xl">You are able to reset this tablet to recover from this error.</h2>

                    {sentryEnabled === SentryConsentState.Given && (
                        <>
                            <h2 className="text-3xl leading-relaxed">
                                You have opted into anonymous error reporting and this issue has been relayed to us. If you want immediate support, please share the following code to a member of staff in the #support channel on the FlyByWire Discord server:
                            </h2>

                            <h1 className="text-4xl font-extrabold tracking-wider text-center">{sessionId}</h1>
                        </>
                    )}

                    <div className="py-4 px-8 w-full text-theme-body hover:text-utility-red bg-utility-red hover:bg-theme-body rounded-md border-2 border-utility-red transition duration-100" onClick={resetErrorBoundary}>
                        <h2 className="font-bold text-center text-current">Reset Display</h2>
                    </div>
                </div>
            </div>
        </div>
    );
};

const setSessionId = () => {
    const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const SESSION_ID_LENGTH = 14;
    const nanoid = customAlphabet(ALPHABET, SESSION_ID_LENGTH);
    const generatedSessionID = nanoid();

    NXDataStore.set('A32NX_SENTRY_SESSION_ID', generatedSessionID);
};

const setup = () => {
    readSettingsFromPersistentStorage();
    setSessionId();
};

if (process.env.VITE_BUILD) {
    window.addEventListener('AceInitialized', setup);
} else {
    setup();
}

render(
    <FailuresOrchestratorProvider><EFBLoad /></FailuresOrchestratorProvider>,
    true, true,
);
