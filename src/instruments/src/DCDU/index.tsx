import React, { useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { useCoherentEvent } from '@instruments/common/hooks';
import { render } from '../Common';
import { SelfTest } from './pages/SelfTest';
import { Standby } from './pages/Standby';
import { WaitingForData } from './pages/WaitingForData';
import { Message } from './pages/Message';
import { getSimVar, useUpdate } from '../util.js';

import './style.scss';

enum DcduState {
    Default,
    Off,
    On,
    Waiting,
    Standby,
    Message
}

function powerAvailable() {
    // Each DCDU is powered by a different DC BUS. Sadly the cockpit only contains a single DCDU emissive.
    // Once we have two DCDUs running, the capt. DCDU should be powered by DC 1, and F/O by DC 2.
    return getSimVar('L:A32NX_ELEC_DC_1_BUS_IS_POWERED', 'Bool') || getSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'Bool');
}

const DCDU: React.FC = () => {
    const [isColdAndDark] = useSimVar('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', 200);
    const [state, setState] = useState(isColdAndDark ? DcduState.Off : DcduState.Standby);
    const [messageType, setMessageType] = useState('NONE');
    const [messageOut, setMessageOut] = useState(false);
    const [message, setMessage] = useState('');

    useCoherentEvent('A32NX_DCDU_MSG', (message: string, messageOut: boolean, type: string) => {
        setMessage(message);
        setMessageOut(messageOut);
        setMessageType(type);
    });

    useUpdate((_deltaTime) => {
        if (state === DcduState.Off) {
            if (powerAvailable()) {
                setState(DcduState.On);
            }
        } else if (!powerAvailable()) {
            setState(DcduState.Off);
        } else if (state === DcduState.Standby && messageType !== 'NONE' && message.length !== 0) {
            setState(DcduState.Message);
        } else if (state === DcduState.Message && (messageType === 'NONE' || message.length === 0)) {
            setState(DcduState.Standby);
        }
    });

    switch (state) {
    case DcduState.Off:
        return <></>;
    case DcduState.On:
        setTimeout(() => {
            if (powerAvailable()) {
                setState(DcduState.Waiting);
            }
        }, 8000);
        return (
            <>
                <div className="BacklightBleed" />
                <SelfTest />
            </>
        );
    case DcduState.Waiting:
        setTimeout(() => {
            if (powerAvailable()) {
                setState(DcduState.Standby);
            }
        }, 12000);
        return (
            <>
                <div className="BacklightBleed" />
                <WaitingForData />
            </>
        );
    case DcduState.Standby:
        return (
            <>
                <div className="BacklightBleed" />
                <Standby />
            </>
        );
    case DcduState.Message:
        return (
            <>
                <div className="BacklightBleed" />
                <Message out={messageOut} type={messageType} message={message} />
            </>
        );
    default:
        throw new RangeError();
    }
};

render(<DCDU />);
