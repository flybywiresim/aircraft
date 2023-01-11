import React, { useEffect, useState } from 'react';
import { Layer } from '@instruments/common/utils';
import { EfisSide } from '@shared/NavigationDisplay';
import { Arinc429Word } from '@shared/arinc429';
import { SimVarString } from '@shared/simvar';
import { useSimVar } from '@instruments/common/simVars';

type TopMessagesProps = {
    side: EfisSide,
    ppos: LatLongData,
    trueTrack: Arinc429Word,
    trueRef: boolean,
}

type GridTrackProps = {
    gridTrack: number,
};

const GridTrack: React.FC<GridTrackProps> = ({ gridTrack }) => (
    <>
        <rect x={0} width={94} y={-20} height={23} className="White" strokeWidth={1.5} />
        <text x={45} fontSize={22} textAnchor="middle">
            <tspan className="Green">
                ◇
                {gridTrack?.toFixed(0).padStart(3, '0') ?? ''}
            </tspan>
            <tspan className="Cyan">
                <tspan dx="-5" dy="8" fontSize={28}>°</tspan>
                <tspan dy="-8">G</tspan>
            </tspan>
        </text>
    </>
);

type TrueFlagProps = {
    xOffset?: number,
    box: boolean,
};

const TrueFlag: React.FC<TrueFlagProps> = ({ xOffset = 0, box }) => (
    <>
        <rect x={-30 + xOffset} width={68} y={-20} height={23} className="Cyan" strokeWidth={1.5} visibility={box ? 'inherit' : 'hidden'} />
        <text x={4 + xOffset} fontSize={22} className="Cyan" textAnchor="middle">TRUE</text>
    </>
);

export const TopMessages: React.FC<TopMessagesProps> = ({ side, ppos, trueTrack, trueRef }) => {
    const [apprMsg0] = useSimVar(`L:A32NX_EFIS_${side}_APPR_MSG_0`, 'number', 5000);
    const [apprMsg1] = useSimVar(`L:A32NX_EFIS_${side}_APPR_MSG_1`, 'number', 5000);
    const [apprMsg, setApprMsg] = useState<string | null>(null);

    const [gridTrack, setGridTrack] = useState<number | null>(null);
    useEffect(() => {
        if (trueTrack.isNormalOperation() && Math.abs(ppos.lat) > 65) {
            setGridTrack(Math.round(Avionics.Utils.clampAngle(trueTrack.value - Math.sign(ppos.lat) * ppos.long)) % 360);
        } else {
            setGridTrack(null);
        }
    }, [ppos.lat.toFixed(0), ppos.long.toFixed(1), trueTrack.value.toFixed(0), trueTrack.ssm]);

    useEffect(() => {
        const msg = SimVarString.unpack([apprMsg0, apprMsg1]);
        setApprMsg(msg.length > 0 ? msg : null);
    }, [apprMsg0, apprMsg1]);

    return (
        <>
            <Layer x={384} y={28} visibility={apprMsg === null ? 'hidden' : 'visible'}>
                <text x={0} y={0} fontSize={25} className="Green" textAnchor="middle">{apprMsg ?? ''}</text>
            </Layer>
            <Layer x={384} y={apprMsg === null ? 36 : 56} visibility={trueRef ? 'visible' : 'hidden'}>
                <TrueFlag xOffset={apprMsg === null && gridTrack !== null ? -54 : 0} box={apprMsg === null} />
                <Layer x={0} y={0} visibility={apprMsg === null && gridTrack !== null ? 'inherit' : 'hidden'}>
                    <GridTrack gridTrack={gridTrack ?? 0} />
                </Layer>
            </Layer>
        </>
    );
};
