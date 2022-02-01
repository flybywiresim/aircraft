import React, { useState } from 'react';
import { useInteractionEvents } from '@instruments/common/hooks.js';
import { Checkerboard } from './Checkerboard';

type ButtonProps = {
    messageId: number,
    index: string,
    content: string,
    active: boolean,
    onClick: (btn: string) => void
}

export const Button: React.FC<ButtonProps> = ({ index, content, active, onClick }) => {
    const [clicked, setClicked] = useState(false);

    if (content.length === 0) {
        return <></>;
    }

    useInteractionEvents([`A32NX_DCDU_BTN_MPL_${index}`, `A32NX_DCDU_BTN_MPR_${index}`], () => {
        if (active) {
            setClicked(true);
            setTimeout(() => {
                setClicked(false);
                onClick(index);
            }, 1000);
        }
    });

    let leftButton = false;
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
        leftButton = true;
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
    const backgroundWidth = 1032;
    const backgroundHeight = 240;

    backgroundDefinition.y = textDefinition.y - 176;
    if (clicked) {
        textDefinition.style += 'button-color-clicked';
        backgroundDefinition.style = 'button-color';
    } else {
        textDefinition.style += 'button-color';
        backgroundDefinition.style = 'button-color-clicked';
    }

    // one character has a width of 86px -> calculate the ratio between the text and the background
    const textWidth = (content.length - 1) * 86;
    const textFillRatio = 1.0 - textWidth / backgroundWidth;
    const activeBtnOffset = active ? 86 : 0;
    const offset = Math.round(backgroundWidth * textFillRatio * 0.5);
    if (leftButton) {
        // move the left X (text aligned left in CSS) coordinate to the half text fill ratio to be aligned to the center
        textDefinition.x = offset - activeBtnOffset;
    } else {
        // move the right X (text aligned right in CSS) coordinate to the half text fill ratio to be aligned to the center
        textDefinition.x = backgroundDefinition.x + backgroundWidth - offset + activeBtnOffset;
    }

    // create the final text
    let text: string;
    if (active) {
        if (leftButton) {
            text = `*${content}`;
        } else {
            text = `${content}*`;
        }
    } else {
        text = content;
    }

    return (
        <>
            {clicked && content.length !== 0 && (
                <Checkerboard
                    x={backgroundDefinition.x}
                    y={backgroundDefinition.y}
                    width={backgroundWidth}
                    height={backgroundHeight}
                    cellSize={10}
                    fill="rgb(0,255,255)"
                />
            )}
            {content.length !== 0 && (
                <text className={textDefinition.style} x={textDefinition.x} y={textDefinition.y}>
                    {text}
                </text>
            )}
        </>
    );
};
