import React, { memo, useState } from 'react';
import { useInteractionEvents } from '@instruments/common/hooks.js';

type ButtonProps = {
    messageId : string,
    btnLeft1 : any,
    btnLeft2 : any,
    btnRight1 : any,
    btnRight2 : any,
    clicked : (btn: string) => void
}

export const ButtonMenu: React.FC<ButtonProps> = memo(({ messageId, btnLeft1, btnLeft2, btnRight1, btnRight2, clicked }) => {
    const [clickedL1, setClickedL1] = useState(false);
    const [clickedL2, setClickedL2] = useState(false);
    const [clickedR1, setClickedR1] = useState(false);
    const [clickedR2, setClickedR2] = useState(false);

    if (btnLeft1.content.length !== 0) {
        useInteractionEvents(['A32NX_DCDU_BTN_MPL_L1', 'A32NX_DCDU_BTN_MPR_L1'], () => {
            setClickedL2(false);
            setClickedR1(false);
            setClickedR2(false);

            if (clickedL1 === false && btnLeft1.dblClick === true) {
                setClickedL1(true);
            } else {
                clicked('L1');
            }
        });
    }
    if (btnLeft2.content.length !== 0) {
        useInteractionEvents(['A32NX_DCDU_BTN_MPL_L2', 'A32NX_DCDU_BTN_MPR_L2'], () => {
            setClickedL1(false);
            setClickedR1(false);
            setClickedR2(false);

            if (clickedL2 === false && btnLeft2.dblClick === true) {
                setClickedL2(true);
            } else {
                clicked('L2');
            }
        });
    }
    if (btnRight1.content.length !== 0) {
        useInteractionEvents(['A32NX_DCDU_BTN_MPL_R1', 'A32NX_DCDU_BTN_MPR_R1'], () => {
            setClickedL1(false);
            setClickedL2(false);
            setClickedR2(false);

            if (clickedR1 === false && btnRight1.dblClick === true) {
                setClickedR1(true);
            } else {
                clicked('R1');
            }
        });
    }
    if (btnRight2.content.length !== 0) {
        useInteractionEvents(['A32NX_DCDU_BTN_MPL_R2', 'A32NX_DCDU_BTN_MPR_R2'], () => {
            setClickedL1(false);
            setClickedL2(false);
            setClickedR1(false);

            if (clickedR2 === false && btnRight2.dblClick === true) {
                setClickedR2(true);
            } else {
                clicked('R2');
            }
        });
    }

    const dblClickL1 = clickedL1 === false && btnLeft1.dblClick === true;
    const dblClickL2 = clickedL2 === false && btnLeft2.dblClick === true;
    const dblClickR1 = clickedR1 === false && btnRight1.dblClick === true;
    const dblClickR2 = clickedR2 === false && btnRight2.dblClick === true;

    return (
        <>
            <g>
                {btnLeft1.content.length !== 0 && (
                    <text className="button button-left" x="21" y="280">
                        {dblClickL1 === true && '*'}
                        {btnLeft1.content}
                    </text>
                )}
                {btnLeft2.content.length !== 0 && (
                    <text className="button button-left" x="21" y="340">
                        {dblClickL2 === true && '*'}
                        {btnLeft2.content}
                    </text>
                )}
                {btnRight1.content.length !== 0 && (
                    <text className="button button-right" x="470" y="280">
                        {btnRight1.content}
                        {dblClickR1 === true && '*'}
                    </text>
                )}
                {btnRight2.content.length !== 0 && (
                    <text className="button button-right" x="470" y="340">
                        {btnRight2.content}
                        {dblClickR2 === true && '*'}
                    </text>
                )}
            </g>
        </>
    );
});
