import React, { FC } from 'react';
import { HydraulicPowerSource, PowerSupplyIndication, PowerSupplyType } from './PowerSupply';

export enum GearPosition {
    Nose,
    Left,
    Right,
}

export enum GearType {
    Nose,
    WLG,
    BLG,
}

interface GearProps {
    x: number,
    y: number,
    position: GearPosition,
    type: GearType,
}

export const Gear: FC<GearProps> = ({ x, y, position, type }) => {
    const hydraulicSource = type === GearType.WLG || type === GearType.Nose ? HydraulicPowerSource.Green : HydraulicPowerSource.Yellow;

    let uplockX: number;
    let uplockY: number;
    if (type === GearType.Nose) {
        uplockX = -20;
        uplockY = -36;
    } else if (type === GearType.BLG) {
        uplockX = position === GearPosition.Left ? -66 : 74;
        uplockY = -14;
    } else {
        uplockX = position === GearPosition.Left ? -40 : 48;
        uplockY = -20;
    }

    return (
        <g id={`gear-${position}-${type}`} transform={`translate(${x} ${y})`}>
            <PowerSupplyIndication x={23} y={type === GearType.Nose ? -32 : -36} type={PowerSupplyType.Conventional} powerSource={hydraulicSource} />
            <PositionIndicatior system={1} />
            <PositionIndicatior system={2} />
            <GearDoor type={type} position={position} />

            <UplockFlag x={uplockX} y={uplockY} type={type} />
        </g>
    );
};

interface PositionIndicatiorProps {
    system: 1 | 2,
}

const PositionIndicatior: FC<PositionIndicatiorProps> = ({ system }) => {
    const color = 'Green';
    const hide = false;

    return (
        <g className={`SW2 ${color} ${hide ? 'Hidden' : ''}`}>
            {system === 1 && (
                <>
                    <path d="m 0 0 h 29 v 26 z" />
                    <path d="M 13 0 v 12 M 21 0 v 19" />
                </>
            )}
            {system === 2 && (
                <>
                    <path d="m 67 0 h -29 v 26 z" />
                    <path d="M 46 0 v 19 M 54 0 v 12" />
                </>
            )}
        </g>
    );
};

interface GearDoorProps {
    position: GearPosition,
    type: GearType,
}

const GearDoor: FC<GearDoorProps> = ({ position, type }) => {
    const color = 'Green';
    const hide = false;

    const yPos = type === GearType.BLG ? -8 : -6;

    return (
        <g className={`SW2 ${color} ${hide ? 'Hidden' : ''}`}>
            {(type === GearType.BLG || type === GearType.Nose) && (
                <>
                    <path d={`m -14 ${yPos} h 46`} />
                    <path d={`m 81 ${yPos} h -46`} />
                    <circle r="3" cx={-15} cy={yPos} />
                    <circle r="3" cx={82} cy={yPos} />
                </>
            )}
            {type === GearType.WLG && (
                <>
                    <path d={`m ${position === GearPosition.Left ? 83 : -16} -7 l ${position === GearPosition.Left ? '-' : ''}94 -5`} />
                    <circle r="3" cx={position === GearPosition.Left ? 84 : -17} cy={-7} />
                </>
            )}
        </g>
    );
};

interface UplockFlagProps {
    x: number,
    y: number,
    type: GearType,
}

const UplockFlag: FC<UplockFlagProps> = ({ x, y, type }) => (
    <>
        {
            (type === GearType.BLG || type === GearType.WLG) && (
                <g transform={`translate(${x} ${y})`}>
                    <text className="F24 Amber" x={16} y={-24}>UP</text>
                    <text className="F24 Amber" x={0} y={0}>LOCK</text>
                </g>
            )
        }
        {
            type === GearType.Nose && (
                <text className="F24 Amber" x={x} y={y}>UP LOCK</text>
            )
        }
    </>

);
