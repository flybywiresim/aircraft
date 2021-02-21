import './style.scss';
import React, { useEffect, useState } from 'react';
import { render } from '../Common';
import { useSimVar, useSplitSimVar } from '../Common/simVars';
import { useInteractionEvent, useUpdate } from '../Common/hooks';

const getDigitsFromCode = (code: number): number[] => {
    let codeCopy = code;
    const digits: number[] = [];
    while (codeCopy > 0) {
        digits.push(codeCopy % 10);
        codeCopy = Math.floor(codeCopy / 10);
    }
    digits.reverse();
    return digits;
};
const getBco16FromDigits = (digits: number[]): number => (digits[0] * 4096) + (digits[1] * 256) + (digits[2] * 16) + digits[3];

const PoweredXpdrDisplay = () => {
    const [currentDigits, setCurrentDigits] = useState([0, 0, 0, 0]);
    const [currentEnteredDigits, setEnteredDigits] = useState(4);
    const [doubleClrTimer, setDoubleClrTimer] = useState(-1);
    const [displayResetTimer, setDisplayResetTimer] = useState(-1);
    const [ltsTest] = useSimVar('L:XMLVAR_LTS_Test', 'Bool', 250);

    const [transponderCode, setTransponderCode] = useSplitSimVar('TRANSPONDER CODE:1', 'number', 'K:XPNDR_SET', 'Bco16', 250);

    // Check if the transponder code simvar has changed. If it has, and we are not currently editing the code,
    // set the display to the new code.
    useEffect(() => {
        if (currentEnteredDigits === 4) {
            const newDigits = getDigitsFromCode(transponderCode);
            if (newDigits.length === 4) {
                setCurrentDigits(newDigits);
            }
        }
    }, [transponderCode]);

    // Count down the timers, if they are in use
    useUpdate((deltaTime) => {
        if (doubleClrTimer > 0) {
            setDoubleClrTimer(doubleClrTimer - deltaTime / 1000);
        }
        if (displayResetTimer > 0) {
            setDisplayResetTimer(displayResetTimer - deltaTime / 1000);
        }
    });

    // Reset the double press timer, if the CLR button was not pressed a second time.
    if (doubleClrTimer < 0 && doubleClrTimer !== -1) {
        setDoubleClrTimer(-1);
    }

    // Check if less than 4 digits are currently entered, and start the reset timer.
    if (displayResetTimer === -1 && currentEnteredDigits < 4) {
        setDisplayResetTimer(5);
    }
    // Check if the reset timer has run up. If it has, reset the display to the previously entered transponder
    // code, and reset the timer.
    if (displayResetTimer < 0 && displayResetTimer !== -1) {
        setDisplayResetTimer(-1);
        const newDigits = getDigitsFromCode(transponderCode);
        if (newDigits.length === 4) {
            setCurrentDigits(newDigits);
        }
        setEnteredDigits(4);
    }

    const buttonPressHandler = (buttonId) => {
        // Check if the pressed button is the reset button, and if ther is a digit displayed.
        if (buttonId === 8 && currentEnteredDigits > 0) {
            // If the clear button has not been pressed previously, just delete the rightmost digit.
            if (doubleClrTimer === -1) {
                setEnteredDigits(currentEnteredDigits - 1);
                setDoubleClrTimer(0.2);
                // If it has been pressed previously, clear the whole display.
            } else {
                setEnteredDigits(0);
                setDoubleClrTimer(-1);
            }
            // If the pressed button is not the CLR button, and if not all digits have been entered yet,
            // write to the next free digit.
        } else if (buttonId !== 8 && currentEnteredDigits < 4) {
            const digitsToSet = currentDigits;
            digitsToSet[currentEnteredDigits] = buttonId;
            setEnteredDigits(currentEnteredDigits + 1);
            // If 3 digits are currently entered (i.e. if this digit will fill the display), write to the simvar.
            if (currentEnteredDigits === 3) {
                setTransponderCode(getBco16FromDigits(currentDigits));
                setDisplayResetTimer(-1);
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

    let text = '';
    if (ltsTest) {
        text = '8888';
    } else {
        for (let i = 0; i < currentEnteredDigits; i++) {
            text += currentDigits[i].toString();
        }
    }

    return (
        <svg>
            <text x="8%" y="45%">{text}</text>
        </svg>
    );
};

const XpdrRootDisplay = () => {
    const [powerAvailable] = useSimVar('L:DCPowerAvailable', 'Boolean', 250);

    if (!powerAvailable) return null;
    return <PoweredXpdrDisplay />;
};

render(
    <div className="atc-wrapper">
        <XpdrRootDisplay />
    </div>,
);
