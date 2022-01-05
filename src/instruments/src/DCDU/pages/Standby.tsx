import { useState } from 'react';
import { useInteractionEvent } from '../../util.js';
import { BaseView } from '../elements/BaseView';

export const Standby: React.FC = () => {
    const [inop, setInop] = useState(false);

    useInteractionEvent('A32NX_DCDU_BTN_INOP', () => {
        if (!inop) {
            setInop(true);
            setTimeout(() => {
                setInop(false);
            }, 3000);
        }
    });

    return (
        <>
            <svg className="dcdu">
                <BaseView />
            </svg>
        </>
    );
};
