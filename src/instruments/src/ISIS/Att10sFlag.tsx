import React, { useRef, useState } from 'react';
import { useInteractionEvent, useUpdate } from '@instruments/common/hooks';

export const Att10sFlag: React.FC = ({ children }) => {
    const timeToReset = 10;

    const attRstPressTime = useRef<number | null>(null);
    const [timer, setTimer] = useState<number | null>(null);
    const [inAttRst, setInAttRst] = useState(false);

    useUpdate((deltaTime) => {
        if (timer !== null) {
            if (timer > 0) {
                setTimer(timer - (deltaTime / 1000));
            } else if (inAttRst) {
                setInAttRst(false);
                setTimer(null);
            }
        }
    });

    useInteractionEvent('A32NX_ISIS_RST_PRESSED', () => {
        if (inAttRst) {
            return;
        }

        if (attRstPressTime.current === null) {
            attRstPressTime.current = Date.now();
        } else if (Date.now() - attRstPressTime.current >= 2000) {
            setInAttRst(true);
            setTimer(timeToReset);
            attRstPressTime.current = null;
        }
    });

    if (inAttRst) {
        return (
            <g id="Att10s">
                <g id="AttFlag">
                    <rect id="AttTest" className="FillYellow" width="160" height="40" x="178" y="154" />
                    <text
                        id="AltTestTxt"
                        className="FontMedium TextBackground"
                        textAnchor="middle"
                        x="256"
                        y="186"
                    >
                        {`ATT ${Math.max(0, Math.ceil(timer!)).toString().padStart(2, '0')}s`}
                    </text>
                </g>
            </g>
        );
    }

    return (<>{children}</>);
};
