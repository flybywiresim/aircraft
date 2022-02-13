import React from 'react';
import { MemoryRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { render } from '@instruments/common/index';
import ReactDOM from 'react-dom';
import * as Defaults from '@instruments/common/defaults';
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

try {
    render(<FailuresOrchestratorProvider><EFBLoad /></FailuresOrchestratorProvider>);
} catch (e) {
    ReactDOM.render(
        <div className="flex flex-col justify-center items-center w-full h-screen bg-theme-body">
            <div className="max-w-4xl text-center">
                <h1 className="font-bold">A critical, unrecoverable error has been encountered.</h1>
                <h2>You will have to restart your flight to recover this instrument.</h2>

                <h1 className="mt-16 font-bold">You have opted into anonymous error reporting and this issue has been relayed to us.</h1>
                <h2>If you wish to seek immediate assistance, please share the unique identifier below to a member of staff in the #support channel on the FlyByWire Discord.</h2>
                <h1 className="mt-4 font-extrabold tracking-wider">ZX96CHUNGHOLBOR</h1>
            </div>
        </div>, Defaults.getRenderTarget(),
    );
}
