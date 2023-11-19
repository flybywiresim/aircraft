import React from 'react';
import { useHover } from 'use-events';
import { Layer } from '../../../../Components/Layer';

type WaypointRowProps = {
    ident: string;
    identColorClass: string;
    lineTopColorClass: string;
    lineBottomColorClass: string;
    eta?: string;
    speed?: string;
    altitude?: string;
    index: number;
    onClick?: () => void;
    selected?: boolean;
    followsLeg?: boolean;
    precedesLeg?: boolean;
    hideDiamond?: boolean;
};

const rowSpacing = 71;

export const WaypointRow = ({ ident, identColorClass, lineTopColorClass, lineBottomColorClass, eta, speed, altitude, index, followsLeg, precedesLeg, hideDiamond, selected, onClick }: WaypointRowProps) => {
    const [hovered, hoverRef] = useHover();
    return (
        <>
            <g {...hoverRef} onClick={onClick}>
                <rect x={1} y={61 + index * rowSpacing} height={47} width={173} fill={selected ? 'grey' : 'transparent'} stroke={hovered ? 'cyan' : 'none'} strokeWidth={2} />
                <text x={8} y={95 + index * rowSpacing} fontSize={29} className={identColorClass}>{ident}</text>
            </g>
            <text x={201} y={93 + index * rowSpacing} fontSize={22} className={identColorClass}>{eta}</text>
            <text x={345} y={94 + index * rowSpacing} fontSize={22} className={identColorClass}>{speed ?? '"'}</text>
            <text x={430} y={93 + index * rowSpacing} fontSize={22} className={identColorClass}>{altitude ?? '"'}</text>

            {!hideDiamond && followsLeg && (
                <line
                    x1={559}
                    y1={51 + index * rowSpacing}
                    x2={559}
                    y2={74 + index * rowSpacing}
                    className={lineTopColorClass}
                    strokeWidth={2}
                />
            )}
            {!hideDiamond && (
                <>
                    <path
                        d={`M551 ${86 + index * rowSpacing} l 8 -13 l 8 13 l -8 13 z`}
                        fill="none"
                        className={lineTopColorClass}
                        strokeWidth={2}
                    />
                    <line
                        x1={536}
                        y1={86 + index * rowSpacing}
                        x2={552}
                        y2={86 + index * rowSpacing}
                        className={lineTopColorClass}
                        strokeWidth={2}
                    />
                </>
            )}
            {!hideDiamond && precedesLeg && (
                <line
                    x1={559}
                    y1={98 + index * rowSpacing}
                    x2={559}
                    y2={121 + index * rowSpacing}
                    className={lineBottomColorClass}
                    strokeWidth={2}
                />
            )}
        </>
    );
};

type LegRowProps = {
    ident: string;
    bearing: number;
    distance: number;
    index: number;
    infoColorClass: string;
    lineColorClass: string;
};

export const LegRow = ({ ident, bearing, distance, index, infoColorClass, lineColorClass }: LegRowProps) => (
    <>
        <text x={101} y={57 + index * rowSpacing} fontSize={22} className={infoColorClass}>{ident}</text>
        <text x={583} y={56 + index * rowSpacing} fontSize={22} className={infoColorClass}>
            {bearing && `${Math.round(bearing)}°`}
        </text>
        <text
            x={687}
            y={56 + index * rowSpacing}
            className={infoColorClass}
        >
            {distance && Math.round(distance)}
        </text>
        <line
            x1={558}
            y1={50 + index * rowSpacing}
            x2={580}
            y2={50 + index * rowSpacing}
            className={lineColorClass}
            strokeWidth={2}
        />
    </>
);

type SpecialRowProps = {
    index: number;
    text: string;
    onClick?: () => void;
}

export const SpecialRow = ({ index, text, onClick }: SpecialRowProps) => (
    <Layer x={0} y={index * rowSpacing + 95} onClick={onClick}>
        <path className="White" d="M 20 0 H 240" strokeWidth={3.75} strokeDasharray="14.5 25" />
        <text x={250} y={7} className="White XLarge">{text}</text>
        <path className="White" d="M 504 0 H 724" strokeWidth={3.5} strokeDasharray="14.5 25" />
    </Layer>
);
