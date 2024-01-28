import React, { useEffect, useState } from 'react';

import { useSimVar } from '@instruments/common/simVars';
import { useArinc429Var } from '@instruments/common/arinc429';
import { NXUnits } from '@shared/NXUnits';

export const StatusArea = () => {
    const [airDataSwitchingKnob] = useSimVar('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'Enum');

    const getStatusAirDataReferenceSource = () => {
        const ADIRS_3_TO_CAPTAIN = 0;

        return airDataSwitchingKnob === ADIRS_3_TO_CAPTAIN ? 3 : 1;
    };

    const [gLoad] = useSimVar('G FORCE', 'GFORCE');
    const [gLoadIsAbnormal, setGLoadIsAbnormal] = useState(false);

    const getValuePrefix = (value: number) => (value >= 0 ? '+' : '');

    useEffect(() => {
        if (gLoad < 0.7 || gLoad > 1.4) {
            const timeout = setTimeout(() => {
                setGLoadIsAbnormal(true);
            }, 2_000);
            return () => clearTimeout(timeout);
        }
        setGLoadIsAbnormal(false);

        return () => { };
    }, [gLoad]);

    const airDataReferenceSource = getStatusAirDataReferenceSource();
    const sat = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_STATIC_AIR_TEMPERATURE`);
    const tat = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_TOTAL_AIR_TEMPERATURE`);

    const [cg] = useSimVar('CG PERCENT', 'percent');

    const userWeightUnit = NXUnits.userWeightUnit();

    // TODO: Currently this value will always be displayed but it should have more underlying logic tied to it as it relates to SAT
    const isa = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_INTERNATIONAL_STANDARD_ATMOSPHERE_DELTA`);

    const [emptyWeight] = useSimVar('EMPTY WEIGHT', 'kg');
    const [payloadCount] = useSimVar('PAYLOAD STATION COUNT', 'number');

    const getPayloadWeight = () => {
        let payloadWeight = 0;

        for (let i = 1; i <= payloadCount; i++) {
            payloadWeight += SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${i}`, 'kg');
        }

        return payloadWeight;
    };

    const [fuelWeight] = useSimVar('FUEL TOTAL QUANTITY WEIGHT', 'kg');
    const gw = Math.round(NXUnits.kgToUser(emptyWeight + fuelWeight + getPayloadWeight()));

    const [seconds] = useSimVar('E:ZULU TIME', 'seconds');

    const getCurrentHHMMSS = () => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secondsLeft = (seconds - (hours * 3600) - (minutes * 60)).toFixed(0);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
    };

    return (
        <g id="status">
            {/* Frame */}
            <path className="SW4 White StrokeRound" d="M 7,667 l 754,0" />
            <path className="SW4 White" d="M 0,765 l 768,0" />
            <path className="SW4 White StrokeRound" d="M 257,667 l 0,92" />
            <path className="SW4 White StrokeRound" d="M 512,667 l 0,92" />

            {/* <path className='ecam-thicc-line LineRound' d='m 518 690 v 90' /> */}

            {/* Temps */}
            <text x={34} y={696} className="F26 White LS1">TAT</text>
            <text x={34} y={725} className="F26 White LS1">SAT</text>
            <text x={34} y={754} className="F26 White LS1">ISA</text>
            <text x={158} y={696} className={`F25 ${tat.isNormalOperation() ? 'Green' : 'Amber'} EndAlign`}>
                {tat.isNormalOperation() ? getValuePrefix(tat.value) + tat.value.toFixed(0) : 'XX'}
            </text>
            <text x={158} y={725} className={`F25 ${sat.isNormalOperation() ? 'Green' : 'Amber'} EndAlign`}>
                {sat.isNormalOperation() ? getValuePrefix(sat.value) + sat.value.toFixed(0) : 'XX'}
            </text>
            <text x={158} y={754} className={`F25 ${isa.isNormalOperation() ? 'Green' : 'Amber'} EndAlign`}>
                {isa.isNormalOperation() ? getValuePrefix(isa.value) + isa.value.toFixed(0) : 'XX'}
            </text>
            <text x={185} y={696} className="F26 Cyan">&#176;C</text>
            <text x={185} y={725} className="F26 Cyan">&#176;C</text>
            <text x={185} y={754} className="F26 Cyan">&#176;C</text>

            {/* G Load Indication */}
            {gLoadIsAbnormal && (
                <>
                    <text x={296} y={702} className="F27 Amber">G LOAD</text>
                    <text x={410} y={702} className="F27 Amber">
                        {getValuePrefix(gLoad)}
                        {gLoad}
                    </text>
                </>
            )}

            {/* Clock */}
            <text x={296} y={730} className="F29 Green LS-1">{getCurrentHHMMSS().substring(0, 6)}</text>
            <text x={394} y={730} className="F26 Green">{getCurrentHHMMSS().substring(6)}</text>
            <text x={434} y={729} className="F22 Green">GPS</text>

            {/* Weights / Fuel */}
            <text x={529} y={696} className="F25 White">GW</text>
            <text x={529} y={724} className="F25 White">GWCG</text>
            <text x={529} y={752} className="F25 White">FOB</text>

            <text x={705} y={696} className="F27 Green EndAlign">{Math.round(gw)}</text>
            <text x={705} y={724} className="F27 Green EndAlign">{Number.parseFloat(cg).toFixed(1)}</text>
            <text x={705} y={752} className="F27 Green EndAlign">{Math.round(fuelWeight)}</text>

            <text x={711} y={696} className="F22 Cyan">{userWeightUnit}</text>
            <text x={711} y={724} className="F22 Cyan">%</text>
            <text x={711} y={752} className="F22 Cyan">{userWeightUnit}</text>
        </g>
    );
};
