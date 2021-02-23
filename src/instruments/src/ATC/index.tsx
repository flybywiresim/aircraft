import './style.scss';
import React, { useEffect, useState } from 'react';
import { render } from '../Common';
import { useSimVar, useSplitSimVar } from '../Common/simVars';
import { useInteractionEvent, useUpdate } from '../Common/hooks';

const getDigitsFromBco16 = (code: number): number[] => {
    let codeCopy = code;
    const digits: number[] = [];
    while (codeCopy > 0) {
        digits.push(codeCopy % 16);
        codeCopy = Math.floor(codeCopy / 16);
    }
    if (digits.length < 4) {
        for (let i = 0; i <= 4 - digits.length; i++) {
            digits.push(0);
        }
    }
    digits.reverse();
    return digits;
};
const getBco16FromDigits = (digits: number[]): number => (digits[0] * 4096) + (digits[1] * 256) + (digits[2] * 16) + digits[3];

const PoweredXpdrDisplay = () => {
    const [newDigits, setNewDigits] = useState<null | number[]>(null);
    const [doubleClrTimer, setDoubleClrTimer] = useState(-1);
    const [displayResetTimer, setDisplayResetTimer] = useState(-1);
    const [ltsTest] = useSimVar('L:XMLVAR_LTS_Test', 'Bool', 250);

    const [transponderCode, setTransponderCode] = useSplitSimVar('TRANSPONDER CODE:1', 'Bco16', 'K:XPNDR_SET', 'Bco16', 500);
    const codeInDisplay = newDigits !== null ? newDigits : getDigitsFromBco16(transponderCode);

    useUpdate((deltaTime) => {
        if (doubleClrTimer > 0) {
            setDoubleClrTimer(Math.max(doubleClrTimer - deltaTime / 1000, 0));
        }
        if (displayResetTimer > 0) {
            setDisplayResetTimer(Math.max(displayResetTimer - deltaTime / 1000, 0));
        }
    });

    useEffect(() => {
        if (doubleClrTimer === 0) {
            setDoubleClrTimer(-1);
        }
    }, [doubleClrTimer]);

    useEffect(() => {
        if (displayResetTimer === -1) {
            if (newDigits !== null) {
                setDisplayResetTimer(5);
            }
        } else if (displayResetTimer === 0) {
            setNewDigits(null);
            setDisplayResetTimer(-1);
        } else if (newDigits === null) {
            setDisplayResetTimer(-1);
        }
    }, [newDigits, displayResetTimer]);

    const buttonPressHandler = (buttonId) => {
        if (buttonId === 8) {
            if (newDigits === null || newDigits.length > 0) {
                if (doubleClrTimer === -1) {
                    setNewDigits(codeInDisplay.splice(0, codeInDisplay.length - 1));
                    setDoubleClrTimer(0.3);
                } else {
                    setNewDigits([]);
                    setDoubleClrTimer(-1);
                }
            }
        } else if (buttonId !== 8 && newDigits !== null) {
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
            <text x="8%" y="45%">{ltsTest ? '8888' : codeInDisplay.join('')}</text>
        </svg>
    );
};

const XpdrRootDisplay = () => {
    const [powerAvailable] = useSimVar('L:DCPowerAvailable', 'Boolean', 250);

    if (!powerAvailable) return null;
    return <PoweredXpdrDisplay />;
};

render(
    <XpdrRootDisplay />,
);
