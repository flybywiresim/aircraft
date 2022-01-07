import React, { memo } from 'react';
import { useInteractionEvents } from '@instruments/common/hooks.js';

type ButtonProps = {
    btnLeft1 : string,
    btnLeft2 : string,
    btnRight1 : string,
    btnRight2 : string,
    clicked : (btn: string) => void
}

export const ButtonMenu: React.FC<ButtonProps> = memo(({ btnLeft1, btnLeft2, btnRight1, btnRight2, clicked }) => {
    if (btnLeft1.length !== 0) {
        useInteractionEvents(['A32NX_DCDU_BTN_MPL_L1', 'A32NX_DCDU_BTN_MPR_L1'], () => {
            clicked('L1');
        });
    }
    if (btnLeft2.length !== 0) {
        useInteractionEvents(['A32NX_DCDU_BTN_MPL_L2', 'A32NX_DCDU_BTN_MPR_L2'], () => {
            clicked('L2');
        });
    }
    if (btnRight1.length !== 0) {
        useInteractionEvents(['A32NX_DCDU_BTN_MPL_R1', 'A32NX_DCDU_BTN_MPR_R1'], () => {
            clicked('R1');
        });
    }
    if (btnRight2.length !== 0) {
        useInteractionEvents(['A32NX_DCDU_BTN_MPL_R2', 'A32NX_DCDU_BTN_MPR_R2'], () => {
            clicked('R2');
        });
    }

    return (
        <>
            <g>
                {btnLeft1.length !== 0 && (<text className="button button-left" x="21" y="280">{btnLeft1}</text>)}
                {btnLeft2.length !== 0 && (<text className="button button-left" x="21" y="340">{btnLeft2}</text>)}
                {btnRight1.length !== 0 && (<text className="button button-right" x="470" y="280">{btnRight1}</text>)}
                {btnRight2.length !== 0 && (<text className="button button-right" x="470" y="340">{btnRight2}</text>)}
            </g>
        </>
    );
});
