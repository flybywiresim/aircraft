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
    const [left1LandingGear] = useSimVar('L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED', 'bool', 500);
    const [right1LandingGear] = useSimVar('L:A32NX_LGCIU_1_RIGHT_GEAR_COMPRESSED', 'bool', 500);
    const onGround = left1LandingGear === 1 && right1LandingGear === 1;
    const [engine1State] = useSimVar('L:A32NX_ENGINE_STATE:1', 'enum', 500);
    const [engine2State] = useSimVar('L:A32NX_ENGINE_STATE:2', 'enum', 500);
    const [throttle1Position] = useSimVar('L:XMLVAR_Throttle1Position', 'number', 500);
    const [throttle2Position] = useSimVar('L:XMLVAR_Throttle2Position', 'number', 500);
    const [apuBleedPressure] = useSimVar('L:APU_BLEED_PRESSURE', 'psi', 500);

    const messageStrings = [
        { name: 'PACKS', show: (packs1Supplying || packs2Supplying) && apuBleedPressure === 0 },
        { name: 'NAI', show: engine1AntiIce || engine2AntiIce },
        { name: 'WAI', show: wingAntiIce },
    ];

    const finalMessageString = messageStrings.filter((item) => item.show).map((item) => item.name).join('/');

    const showMessage = !!(
        [3, 4].includes(throttle1Position) || [3, 4].includes(throttle1Position)
        || (onGround && (engine1State === 1 || engine2State === 1))
    || (autoThrustMode >= 1 && autoThrustMode <= 4 && (throttle1Position === 2 || throttle2Position === 2))
    || (flightPhase >= 5 && flightPhase <= 7 && autoThrustMode === 5));

    return (
        (showMessage
            ? <text className="Green Large End" x={x} y={y}>{finalMessageString}</text>
            : null)
    );
};

export default PacksNaiWai;
