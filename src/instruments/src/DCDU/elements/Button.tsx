import React, { useState } from 'react';
import { useInteractionEvents } from '@instruments/common/hooks.js';

type ButtonProps = {
    messageId: number,
    index: string,
    content: string,
    active: boolean,
    onClick: (btn: string) => void
}

export const Button: React.FC<ButtonProps> = ({ index, content, active, onClick }) => {
    const [clicked, setClicked] = useState(false);

    if (content.length !== 0) {
        useInteractionEvents([`A32NX_DCDU_BTN_MPL_${index}`, `A32NX_DCDU_BTN_MPR_${index}`], () => {
            if (active) {
                setClicked(true);
                setTimeout(() => {
                    setClicked(false);
                    onClick(index);
                }, 1000);
            }
        });
    }

    const textDefinition = { x: 0, y: 0, style: 'button ' };
    const backgroundDefinition = { x: 0, y: 0, style: 'button ' };
    switch (index) {
    case 'L2':
        textDefinition.y = 480;
    // eslint-disable-next-line no-fallthrough
    case 'L1':
        backgroundDefinition.x = 0;
        textDefinition.x = 168;
        textDefinition.y += 2240;
        textDefinition.style += 'button-left ';
        backgroundDefinition.style += 'button-left ';
        break;
    case 'R2':
        textDefinition.y = 480;
    // eslint-disable-next-line no-fallthrough
    default:
        backgroundDefinition.x = 2904;
        textDefinition.x = 3760;
        textDefinition.y += 2240;
        textDefinition.style += 'button-right ';
        backgroundDefinition.style += 'button-right ';
        break;
    }

    backgroundDefinition.y = textDefinition.y - 176;
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
                <rect className={backgroundDefinition.style} x={backgroundDefinition.x} y={backgroundDefinition.y} width={1032} height={240} />
            )}
            {content.length !== 0 && (
                <text className={textDefinition.style} x={textDefinition.x} y={textDefinition.y}>
                    {content}
                </text>
            )}
        </>
    );
};
