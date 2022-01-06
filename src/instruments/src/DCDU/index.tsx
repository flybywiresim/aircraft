import React, { useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { useCoherentEvent } from '@instruments/common/hooks';
import { AtcMessageDirection, AtcMessageType } from '@atsu/AtcMessage';
import { PreDepartureClearance } from '@atsu/PreDepartureClearance';
import { render } from '../Common';
import { SelfTest } from './pages/SelfTest';
import { WaitingForData } from './pages/WaitingForData';
import { BaseView } from './elements/BaseView';
import { DatalinkMessage } from './elements/DatalinkMessage';
import { getSimVar, useUpdate } from '../util.js';

import './style.scss';

enum DcduState {
    Default,
    Off,
    On,
    Waiting,
    Active,
}

function powerAvailable() {
    // Each DCDU is powered by a different DC BUS. Sadly the cockpit only contains a single DCDU emissive.
    // Once we have two DCDUs running, the capt. DCDU should be powered by DC 1, and F/O by DC 2.
    return getSimVar('L:A32NX_ELEC_DC_1_BUS_IS_POWERED', 'Bool') || getSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'Bool');
}

const DCDU: React.FC = () => {
    const [isColdAndDark] = useSimVar('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', 200);
    const [state, setState] = useState(isColdAndDark ? DcduState.Off : DcduState.Active);
    const [messageUid, setMessageUid] = useState('');
    const [messages, setMessages] = useState([]);
    const maxMessageCount = 5;

    useCoherentEvent('A32NX_DCDU_MSG', (serialized: any) => {
        // both DCDUs are triggered
        const duplicate = messages.find((element) => element.UniqueMessageID === serialized.UniqueMessageID);

        if (duplicate === undefined && AtcMessageType.PDC === serialized.Type) {
            const newMessage = new PreDepartureClearance();
            newMessage.deserialize(serialized);
            setMessages((messages) => [...messages, newMessage]);

            SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'bool', messages.length >= maxMessageCount);
        }
    });
    useCoherentEvent('A32NX_DCDU_MSG_REMOVE', (uid: string) => {
        messages.forEach((element, index) => {
            if (element.UniqueMessageID === uid) {
                messages.slice(index, 1);
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'bool', messages.length >= maxMessageCount);
            }
        });
    });

    useUpdate((_deltaTime) => {
        if (state === DcduState.Off) {
            if (powerAvailable()) {
                setState(DcduState.On);
            }
        } else if (!powerAvailable()) {
            setState(DcduState.Off);
        }
    });

    // prepare the data
    let serializedMessage = '';
    let messageDirection = AtcMessageDirection.Output;
    if (state === DcduState.Active) {
        if (messageUid !== '') {
            const messageIndex = messages.findIndex((element) => messageUid === element.UniqueMessageID);
            if (messageIndex !== -1) {
                serializedMessage = messages[messageIndex].serialize();
                messageDirection = messages[messageIndex].Direction;
            }
        } else if (messages.length !== 0) {
            serializedMessage = messages[0].serialize();
            messageDirection = messages[0].Direction;
        }
    }

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
                setState(DcduState.Active);
            }
        }, 12000);
        return (
            <>
                <div className="BacklightBleed" />
                <WaitingForData />
            </>
        );
    case DcduState.Active:
        return (
            <>
                <div className="BacklightBleed" />
                <svg className="dcdu">
                    <DatalinkMessage message={serializedMessage} direction={messageDirection} />
                    <BaseView />
                </svg>
            </>
        );
    default:
        throw new RangeError();
    }
};

render(<DCDU />);
