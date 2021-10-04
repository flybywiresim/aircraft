import './style.scss';
import React, { useEffect, useState } from 'react';
import { useSimVar, useSplitSimVar } from '@instruments/common/simVars';
import { useInteractionEvent, useUpdate } from '@instruments/common/hooks';
import { TcasComputer } from '@tcas/index';
import { render } from '@instruments/common/index';

const getDigitsFromBco16 = (code: number): number[] => {
    let codeCopy = code;
    const digits: number[] = [];
    while (codeCopy > 0) {
        digits.push(codeCopy % 16);
        codeCopy = Math.floor(codeCopy / 16);
    }
    if (digits.length < 4) {
        const digitsToAdd = 4 - digits.length;
        for (let i = 0; i < digitsToAdd; i++) {
            digits.push(0);
        }
    }
    digits.reverse();
    return digits;
};
const getBco16FromDigits = (digits: number[]): number => (digits[0] * 4096) + (digits[1] * 256) + (digits[2] * 16) + digits[3];

const PoweredXpdrDisplay = () => {
    const [newDigits, setNewDigits] = useState<null | number[]>(null);
    const [clrPressed, setClrPressed] = useState(false);
    const [displayResetTimer, setDisplayResetTimer] = useState(-1);
    const [ltsTest] = useSimVar('L:A32NX_OVHD_INTLT_ANN', 'Number', 250);
    const [tcas] = useState(() => new TcasComputer());

    const [transponderCode, setTransponderCode] = useSplitSimVar('TRANSPONDER CODE:1', 'Bco16', 'K:XPNDR_SET', 'Bco16', 500);
    const codeInDisplay = newDigits !== null ? newDigits : getDigitsFromBco16(transponderCode);

    useEffect(() => {
        tcas.init();
    }, []);

    useUpdate((deltaTime) => {
        tcas.update(deltaTime);
        if (displayResetTimer > 0) {
            setDisplayResetTimer(Math.max(displayResetTimer - deltaTime / 1000, 0));
        }
    });

    useEffect(() => {
        if (displayResetTimer === -1) {
            if (newDigits !== null) {
                setDisplayResetTimer(7);
            }
        } else if (displayResetTimer === 0) {
            setNewDigits(null);
            setDisplayResetTimer(-1);
        } else if (newDigits === null) {
            setDisplayResetTimer(-1);
        }
    }, [newDigits, displayResetTimer]);

    const buttonPressHandler = (buttonId) => {
        if (displayResetTimer > 0) {
            setDisplayResetTimer(-1);
        }
        if (buttonId === 8) {
            if (newDigits === null || newDigits.length > 0) {
                if (!clrPressed) {
                    setNewDigits(codeInDisplay.splice(0, codeInDisplay.length - 1));
                    setClrPressed(true);
                } else {
                    setNewDigits([]);
                    setClrPressed(false);
                }
            }
        } else if (buttonId !== 8 && newDigits !== null) {
            if (clrPressed) {
                setClrPressed(false);
            }
            if (newDigits.length < 3) {
                setNewDigits([...newDigits, buttonId]);
            } else {
                setNewDigits(null);
                setTransponderCode(getBco16FromDigits([...newDigits, buttonId]));
            }
        }
    };

    useInteractionEvent('A320_Neo_ATC_BTN_0', () => buttonPressHandler(0));
    useInteractionEvent('A320_Neo_ATC_BTN_1', () => buttonPressHandler(1));
    useInteractionEvent('A320_Neo_ATC_BTN_2', () => buttonPressHandler(2));
    useInteractionEvent('A320_Neo_ATC_BTN_3', () => buttonPressHandler(3));
    useInteractionEvent('A320_Neo_ATC_BTN_4', () => buttonPressHandler(4));
    useInteractionEvent('A320_Neo_ATC_BTN_5', () => buttonPressHandler(5));
    useInteractionEvent('A320_Neo_ATC_BTN_6', () => buttonPressHandler(6));
    useInteractionEvent('A320_Neo_ATC_BTN_7', () => buttonPressHandler(7));
    useInteractionEvent('A320_Neo_ATC_BTN_CLR', () => buttonPressHandler(8));

    return (
        <svg className="atc-svg">
            <text x="15%" y="45%">{ltsTest === 0 ? '8888' : codeInDisplay.join('')}</text>
        </svg>
    );
};

const XpdrRootDisplay = () => {
    // XPDR 1 is powered by the AC ESS SHED bus.
    // When XPDR 2 is added, it should be powered by the AC 2 bus.
    const [acEssShedIsPowered] = useSimVar('L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED', 'Bool', 250);

    if (!acEssShedIsPowered) return null;
    return <PoweredXpdrDisplay />;
};

render(
    <XpdrRootDisplay />,
);
