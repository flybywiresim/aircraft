import { useSimVar } from '@instruments/common/simVars';
import React, { useState, useEffect } from 'react';

export const MachIndicator: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [mach] = useSimVar('AIRSPEED MACH', 'mach');

    useEffect(() => {
        if (mach > 0.5 && !visible) {
            setVisible(true);
        } else if (mach < 0.45 && visible) {
            setVisible(false);
        }
    }, [mach]);

    return (
        <>
            {(visible) && <text x={40} y={464} className="TextGreen FontLarge">{mach.toFixed(2).slice(1)}</text>}
        </>
    );
};
