import React from 'react';
import { Layer } from '@instruments/common/utils';
import { useSimVar } from '@instruments/common/simVars';
import { SimVarString } from '@shared/simvar';
import { EfisSide } from '@shared/NavigationDisplay';

type ApproachMessageProps = {
    side: EfisSide,
}

export const ApproachMessage: React.FC<ApproachMessageProps> = ({ side }) => {
    const [apprMsg0] = useSimVar(`L:A32NX_EFIS_${side}_APPR_MSG_0`, 'number', 5000);
    const [apprMsg1] = useSimVar(`L:A32NX_EFIS_${side}_APPR_MSG_1`, 'number', 5000);

    const apprMsg = SimVarString.unpack([apprMsg0, apprMsg1]);

    if (apprMsg.length < 1) {
        return null;
    }

    return (
        <Layer x={384} y={28}>
            <text x={0} y={0} fontSize={25} className="Green" textAnchor="middle">{apprMsg}</text>
        </Layer>
    );
};
