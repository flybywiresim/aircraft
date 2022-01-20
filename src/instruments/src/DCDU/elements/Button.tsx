import React, { useState } from 'react';
import { useInteractionEvents } from '@instruments/common/hooks.js';

type ButtonProps = {
    messageId: number,
    index: string,
    content: string,
    active: boolean,
    clickShowTime: number,
    clickEventDelay: number;
    clickedCallback: (btn: string) => void
}

export const Button: React.FC<ButtonProps> = ({ index, content, active, clickShowTime, clickEventDelay, clickedCallback }) => {
    const [clicked, setClicked] = useState(false);

    if (content.length !== 0) {
        useInteractionEvents([`A32NX_DCDU_BTN_MPL_${index}`, `A32NX_DCDU_BTN_MPR_${index}`], () => {
            if (active) {
                if (clickShowTime > 0) {
                    setClicked(true);
                    setTimeout(() => setClicked(false), clickShowTime);
                } else if (clickShowTime === -1) {
                    setClicked(true);
                }

                if (clickEventDelay > 0) {
                    setTimeout(() => clickedCallback(index), clickEventDelay);
                } else {
                    clickedCallback(index);
                }
            }
        });
    }

    const textDefinition = { x: 0, y: 0, style: 'button ' };
    const backgroundDefinition = { x: 0, y: 0, style: 'button ' };
    switch (index) {
    case 'L2':
        textDefinition.y = 60;
    // eslint-disable-next-line no-fallthrough
    case 'L1':
        backgroundDefinition.x = 0;
        textDefinition.x = 21;
        textDefinition.y += 280;
        textDefinition.style += 'button-left ';
        backgroundDefinition.style += 'button-left ';
        break;
    case 'R2':
        textDefinition.y = 60;
    // eslint-disable-next-line no-fallthrough
    default:
        backgroundDefinition.x = 363;
        textDefinition.x = 470;
        textDefinition.y += 280;
        textDefinition.style += 'button-right ';
        backgroundDefinition.style += 'button-right ';
        break;
    }

    backgroundDefinition.y = textDefinition.y - 22;
    if (clicked) {
        textDefinition.style += 'button-color-clicked';
        backgroundDefinition.style = 'button-color';
    } else {
        textDefinition.style += 'button-color';
        backgroundDefinition.style = 'button-color-clicked';
    }

    return (
        <>
            {clicked && content.length !== 0 && (
                <rect className={backgroundDefinition.style} x={backgroundDefinition.x} y={backgroundDefinition.y} width={129} height={30} />
            )}
            {content.length !== 0 && (
                <text className={textDefinition.style} x={textDefinition.x} y={textDefinition.y}>
                    {content}
                </text>
            )}
        </>
    );
};
