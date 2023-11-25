import React, { FC } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useHover } from 'use-events';
import { useActiveOrTemporaryFlightPlan } from '@instruments/common/flightplan';
import { OriginSegment } from '@fmgc/flightplanning/new/segments/OriginSegment';
import { DestinationSegment } from '@fmgc/flightplanning/new/segments/DestinationSegment';
import { ApproachSegment } from '@fmgc/flightplanning/new/segments/ApproachSegment';
import { LegType } from 'msfs-navdata';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { FlightPlanIndex } from '@fmgc/flightplanning/new/FlightPlanManager';
import { Layer } from '../../../../Components/Layer';
import { WindowType } from './index';

const width = 287;
const height = 627;
const strokeWidth = 2;
const itemHeight = 41.8;
type RevisionItemProps = {
    index?: number;
    onSelect?: () => void;
    disabled?: boolean;
}
export const RevisionItem: FC<RevisionItemProps> = ({ index = 0, onSelect, children, disabled }) => {
    const [hovered, hoverProps] = useHover();

    return (
        <Layer y={index * itemHeight} {...hoverProps} onClick={onSelect}>
            <rect x={1} y={1} width={width - 2} height={itemHeight - 2} fill="transparent" stroke={hovered ? 'cyan' : 'none'} strokeWidth={2} />
            <text x={12} y={itemHeight / 2} fill={disabled ? '#ababab' : 'white'} fontSize={22} dominantBaseline="central">{children}</text>
        </Layer>
    );
};

type RevisionsMenuProps = {
    leg: number;
    setCurrentWindow: (value: WindowType) => void;
    onClose: () => void;
}

const RevisionsMenu = ({ leg, setCurrentWindow, onClose }: RevisionsMenuProps) => {
    const history = useHistory();
    const [flightPlan] = useActiveOrTemporaryFlightPlan();
    const { path } = useRouteMatch();
    const element = flightPlan.allLegs[leg];

    if (element.isDiscontinuity) {
        return <></>;
    }

    const departureRevisionAvailable = element.segment instanceof OriginSegment;
    const arrivalRevisionAvailable = element.segment instanceof ApproachSegment || element.segment instanceof DestinationSegment;
    const airwaysRevisionAvailable = element.isXF();

    return (
        <>
            <rect width={1000} height={2000} fill="transparent" onClick={onClose} />
            <Layer x={179} y={51}>
                <polygon
                    points={`
                    0, 0
                    ${width}, 0
                    ${width - 5}, 5
                    5, ${height - 5} 
                    0, ${height}`}
                    fill="white"
                />
                <polygon
                    points={`
                    ${width}, 0
                    ${width}, ${height} 
                    0, ${height}
                    5, ${height - 5}
                    ${width - 5}, 5`}
                    fill="grey"
                />
                <rect
                    x={strokeWidth / 2}
                    y={strokeWidth / 2}
                    width={width - strokeWidth}
                    height={height - strokeWidth}
                    fill="#7d7d7d"
                />

                <RevisionItem>
                    FROM P.POS DIR TO*
                </RevisionItem>
                <RevisionItem
                    index={1}
                    disabled
                >
                    INSERT NEXT WPT
                </RevisionItem>
                <RevisionItem
                    index={2}
                    onSelect={() => FlightPlanService.deleteElementAt(leg)}
                    disabled={element.type === LegType.VM || element.type === LegType.FM}
                >
                    DELETE*
                </RevisionItem>
                <RevisionItem
                    index={3}
                    onSelect={() => history.push(`${path}/departure`)}
                    disabled={!departureRevisionAvailable}
                >
                    DEPARTURE
                </RevisionItem>
                <RevisionItem
                    index={4}
                    onSelect={() => history.push(`${path}/arrival`)}
                    disabled={!arrivalRevisionAvailable}
                >
                    ARRIVAL
                </RevisionItem>
                <RevisionItem
                    index={5}
                    disabled
                >
                    OFFSET
                </RevisionItem>
                <RevisionItem
                    index={6}
                    disabled
                >
                    HOLD
                </RevisionItem>
                <RevisionItem
                    index={7}
                    onSelect={() => history.push(`${path}/airways`)}
                    disabled={!airwaysRevisionAvailable}
                >
                    AIRWAYS
                </RevisionItem>
                <RevisionItem
                    index={8}
                    disabled
                >
                    OVERFLY*
                </RevisionItem>
                <RevisionItem
                    index={9}
                    disabled
                >
                    ENABLE ALTN*
                </RevisionItem>
                <RevisionItem
                    index={10}
                    disabled
                >
                    NEW DEST
                </RevisionItem>
                <RevisionItem
                    index={11}
                    disabled
                >
                    CONSTRAINTS
                </RevisionItem>
                <RevisionItem
                    index={12}
                    disabled
                >
                    CMS
                </RevisionItem>
                <RevisionItem
                    index={13}
                    disabled
                >
                    STEP ALTS
                </RevisionItem>
                <RevisionItem
                    index={14}
                    disabled
                >
                    WIND
                </RevisionItem>
            </Layer>
        </>
    );
};
export default RevisionsMenu;
