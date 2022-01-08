import React, { memo } from 'react';
import { useInteractionEvents } from '@instruments/common/hooks.js';

type ButtonProps = {
    messageId : number,
    index : string,
    content : string,
    clicked : (btn: string) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Button: React.FC<ButtonProps> = memo(({ messageId, index, content, clicked }) => {
    if (content.length !== 0) {
        useInteractionEvents([`A32NX_DCDU_BTN_MPL_${index}`, `A32NX_DCDU_BTN_MPR_${index}`], () => {
            clicked(index);
        });
    }

    const definition = { x: 0, y: 0, style: 'button ' };
    switch (index) {
    case 'L2':
        definition.y = 60;
    // eslint-disable-next-line no-fallthrough
    case 'L1':
        definition.x = 21;
        definition.y += 280;
        definition.style += 'button-left';
        break;
    case 'R2':
        definition.y = 60;
    // eslint-disable-next-line no-fallthrough
    default:
        definition.x = 470;
        definition.y += 280;
        definition.style += 'button-right';
        break;
    }

    return (
        <>
            {content.length !== 0 && (
                <text className={definition.style} x={definition.x} y={definition.y}>
                    {content}
                </text>
            )}
        </>
    );
});
