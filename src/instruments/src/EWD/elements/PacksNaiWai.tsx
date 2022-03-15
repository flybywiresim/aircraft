import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

type PacksNaiWaiProps = {
    x: number,
    y: number,
    flightPhase: number,
};

const PacksNaiWai: React.FC<PacksNaiWaiProps> = ({ x, y, flightPhase }) => {
    const [autoThrustMode] = useSimVar('L:A32NX_AUTOTHRUST_MODE', 'enum', 500);
    const [packs1Supplying] = useSimVar('L:A32NX_COND_PACK_FLOW_VALVE_1_IS_OPEN', 'bool', 500);
    const [packs2Supplying] = useSimVar('L:A32NX_COND_PACK_FLOW_VALVE_2_IS_OPEN', 'bool', 500);
    const [engine1AntiIce] = useSimVar('L:XMLVAR_Momentary_PUSH_OVHD_ANTIICE_ENG1_Pressed', 'number', 500);
    const [engine2AntiIce] = useSimVar('L:XMLVAR_Momentary_PUSH_OVHD_ANTIICE_ENG2_Pressed', 'number', 500);
    const [wingAntiIce] = useSimVar('L:XMLVAR_Momentary_PUSH_OVHD_ANTIICE_WING_Pressed', 'bool', 500);

    const messageStrings = [
        { name: 'PACKS', show: packs1Supplying || packs2Supplying },
        { name: 'NAI', show: engine1AntiIce || engine2AntiIce },
        { name: 'WAI', show: wingAntiIce },
    ];

    const finalMessageString = messageStrings.filter((item) => item.show).map((item) => item.name).join('/');

    const showMessage = !!(flightPhase === 2
    || (autoThrustMode >= 1 && autoThrustMode <= 4)
    || (flightPhase >= 5 && flightPhase <= 7 && autoThrustMode === 5));

    if (!showMessage) {
        return null;
    }
    return (

        <text className="Green Large End" x={x} y={y}>{finalMessageString}</text>

    );
};

export default PacksNaiWai;
