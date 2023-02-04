import React from 'react';
import { ComponentPositionProps } from './ComponentPositionProps';
import { useHydraulics } from './HydraulicsProvider';
import { HydraulicSystem } from './HydraulicSystem';
import { SvgGroup } from './SvgGroup';

interface HydraulicIndicatorProps extends ComponentPositionProps {
    type: HydraulicSystem,
}
export const HydraulicIndicator = ({ x, y, type }: HydraulicIndicatorProps) => {
    const hydraulics = useHydraulics();

    return (
        <SvgGroup x={x} y={y}>
            <rect x={0} y={0} className="GreyFill" width="23" height="26" rx="0" />
            <text x={12} y={22} className={`Standard Center ${hydraulics[type].available ? 'Green' : 'Amber'}`}>
                {type}
            </text>
        </SvgGroup>
    );
};
