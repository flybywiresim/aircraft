import React from 'react';
import { ComponentPositionProps } from './ComponentPositionProps';
import { useHydraulics } from './HydraulicsProvider';
import { HydraulicSystem } from './HydraulicSystem';
import { SvgGroup } from './SvgGroup';
import './HydraulicIndicator.scss';

interface HydraulicIndicatorProps extends ComponentPositionProps {
    type: HydraulicSystem,
}
export const HydraulicIndicator = ({ x, y, type }: HydraulicIndicatorProps) => {
    const hydraulics = useHydraulics();

    return (
        <SvgGroup x={x} y={y}>
            <rect x={0} y={0} className="HydraulicIndicator HydBgShape" width="18" height="24" rx="0" />
            <text x={9} y={11} className={`HydraulicIndicator Standard ${hydraulics[type].available ? 'Value' : 'Warning'}`} textAnchor="middle" alignmentBaseline="central">
                {type}
            </text>
        </SvgGroup>
    );
};
