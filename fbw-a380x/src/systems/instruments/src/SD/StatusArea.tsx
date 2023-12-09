import React, { useEffect, useRef, useState } from 'react';

import useMouse from '@react-hook/mouse-position';
import { useSimVar } from '@instruments/common/simVars';
import { useArinc429Var } from '@instruments/common/arinc429';
import { NXUnits } from '@shared/NXUnits';
import { Button } from '../ATCCOM/Components/Button';
import { Cursor } from '../ATCCOM/MultiFunctionDisplay';

export const StatusArea = () => {
    const ref = useRef(null);

    const mouse = useMouse(ref, {
        fps: 165,
        enterDelay: 100,
        leaveDelay: 100,
    });

    // TODO REMOVE TEMP CODE JUST TO TRIGGER SD PAGES
    const [, setEcamPage] = useSimVar('L:A380X_SD_CURRENT_PAGE_INDEX', 'number');
    const [ecam, setEcam] = useState(0);

    useEffect(() => {
        if (ecam === 13) {
            setEcam(0);
            setEcamPage(0);
        } else {
            setEcamPage(ecam);
        }
    }, [ecam]);
    // END TEMP CODE

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

        return () => {};
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
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}.${secondsLeft.toString().padStart(2, '0')}`;
    };

    return (
        <g>
            {/* Upper status */}
            <g id="upper-status">
                {/* Frame */}
                <path className="ecam-thicc-line" d="M 5,658 l 758,0" />
                <path className="ecam-thicc-line" d="M 0,754 l 768,0" />
                <path className="ecam-thicc-line" d="M 254,658 l 0,96" />
                <path className="ecam-thicc-line" d="M 510,658 l 0,96" />

                {/* <path className="ecam-thicc-line LineRound" d="m 518 690 v 90" /> */}

                {/* Temps */}
                <text x={34} y={688} className="F24 White">TAT</text>
                <text x={34} y={715} className="F24 White">SAT</text>
                <text x={34} y={743} className="F24 White">ISA</text>
                <text x={151} y={688} className={`F24 ${tat.isNormalOperation() ? 'Green' : 'Amber'} EndAlign`}>
                    {tat.isNormalOperation() ? getValuePrefix(tat.value) + tat.value.toFixed(0) : 'XX'}
                </text>
                <text x={151} y={715} className={`F24 ${sat.isNormalOperation() ? 'Green' : 'Amber'} EndAlign`}>
                    {sat.isNormalOperation() ? getValuePrefix(sat.value) + sat.value.toFixed(0) : 'XX'}
                </text>
                <text x={151} y={743} className={`F24 ${isa.isNormalOperation() ? 'Green' : 'Amber'} EndAlign`}>
                    {isa.isNormalOperation() ? getValuePrefix(isa.value) + isa.value.toFixed(0) : 'XX'}
                </text>
                <text x={182} y={688} className="F23 Cyan">&#176;C</text>
                <text x={182} y={715} className="F23 Cyan">&#176;C</text>
                <text x={182} y={743} className="F23 Cyan">&#176;C</text>

                {/* G Load Indication */}
                {gLoadIsAbnormal && (
                    <>
                        <text x={290} y={730} fontSize={27} className="Amber">G LOAD</text>
                        <text x={430} y={730} fontSize={24} className="Amber">
                            {getValuePrefix(gLoad)}
                            {gLoad}
                        </text>
                    </>
                )}

                {/* Clock */}
                <text x={424} y={723} className="F27 Green EndAlign">
                    {getCurrentHHMMSS().substring(0, 5)}
                    <tspan className="F24 Green">{getCurrentHHMMSS().substring(5)}</tspan>
                </text>
                <text x={437} y={723} className="F22 Green">GPS</text>

                {/* Weights / Fuel */}
                <text x={529} y={688} className="F24 White">GW</text>
                <text x={529} y={715} className="F24 White">GWCG</text>
                <text x={529} y={743} className="F24 White">FOB</text>

                <text x={705} y={688} className="F23 Green EndAlign">{Math.round(gw)}</text>
                <text x={705} y={715} className="F23 Green EndAlign">{Number.parseFloat(cg).toFixed(1)}</text>
                <text x={705} y={743} className="F23 Green EndAlign">{Math.round(fuelWeight)}</text>

                <text x={709} y={688} className="F21 Cyan">{userWeightUnit}</text>
                <text x={709} y={715} className="F21 Cyan">%</text>
                <text x={709} y={743} className="F21 Cyan">{userWeightUnit}</text>
            </g>

            <g ref={ref}>
                <rect x={0} y={778} width={768} height={246} fill="transparent" />
                {/* Lower status */}
                <path className="ecam-thin-line" d="m 99 754 v 270" />
                <path className="ecam-thin-line" d="m 359 985 v 44" />
                <path className="ecam-thin-line" d="m 618 754 v 270" />
                <path className="ecam-thin-line" d="m 99 985 h 519" />

                {/* ATC thing */}
                <text className="F26 Amber" x={110} y={843}>ATC DATALINK COM</text>
                <text className="F26 Amber" x={110} y={880}>NOT AVAIL</text>

                {/* Recall */}
                {/* TODO REMOVE onClick event when ECAM implememented */}
                <Button x={0} y={972} width={100} height={50} onClick={() => setEcam(ecam + 1)}>
                    <text x={5} y={25} style={{ dominantBaseline: 'middle' }} fontSize={24} fill="white">RECALL</text>
                </Button>
                {mouse.isOver && <Cursor x={mouse.x!} y={mouse.pageY!} />}
            </g>
        </g>
    );
};
