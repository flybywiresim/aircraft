import React, { useEffect, useState } from 'react';
import { Layer } from '@instruments/common/utils';
import { useActiveOrTemporaryFlightPlan } from '@instruments/common/flightplan';
import { Route, Switch, useHistory, useRouteMatch } from 'react-router-dom';
import { FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { MissedApproachSegment } from '@fmgc/flightplanning/new/segments/MissedApproachSegment';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { LegRow, SpecialRow, WaypointRow } from './LegRow';
import { Arrows } from '../../../../Components/Arrows';
import { Button } from '../../../../Components/Button';
import { Dropdown, DropdownItem } from '../../../../Components/Dropdown';
import { Pages } from '../../index';
import RevisionsMenu from './RevisionsMenu';

const NUM_FPLN_ROWS = 9;
const NUM_FPLN_ROWS_TEMPORARY = 8;

export enum WindowType {
    None,
    Revisions,
}

export const Page: React.FC = () => {
    const [flightPlan, isTemporary] = useActiveOrTemporaryFlightPlan();
    const [scrollPos, setScrollPos] = useState(0);

    useEffect(() => {
        if (scrollPos > 0) {
            const legIndex = scrollPos + 1;

            const legExists = flightPlan.hasElement(legIndex);

            if (legExists) {
                SimVar.SetSimVarValue('L:A32NX_SELECTED_WAYPOINT_FP_INDEX', 'Number', 0);
                SimVar.SetSimVarValue('L:A32NX_SELECTED_WAYPOINT_INDEX', 'Number', legIndex);
            }
        }
    }, [scrollPos]);

    const history = useHistory();

    const scrollPage = (direction: -1 | 1) => setScrollPos((p) => Math.max(Math.min(p + direction, flightPlan.allLegs.length - 2), 0));

    const { path } = useRouteMatch();
    const [currentWindow, setCurrentWindow] = useState(WindowType.None);
    const [selectedLeg, setSelectedLeg] = useState<number | undefined>();

    const selectLeg = (index: number) => {
        setSelectedLeg(index);
        setCurrentWindow(WindowType.Revisions);
    };

    const mainFplnLegInfoColorClass = isTemporary ? 'Yellow' : 'White';

    const renderWindow = () => {
        switch (currentWindow) {
        default:
            return <></>;
        case WindowType.Revisions:
            return (selectedLeg !== undefined ? (
                <RevisionsMenu
                    leg={selectedLeg}
                    setCurrentWindow={setCurrentWindow}
                    onClose={() => {
                        setCurrentWindow(WindowType.None); setSelectedLeg(undefined);
                    }}
                />
            ) : <></>);
        }
    };

    return (
        <Switch>
            <Route exact path={`${path}/departure`} component={Pages.Active.FplnDepartures} />
            <Route exact path={`${path}/arrival`} component={Pages.Active.FplnArrivals} />
            <Route exact path={`${path}/airways`}>
                {selectedLeg && <Pages.Active.FplnAirways legIndex={selectedLeg} /> }
            </Route>
            <Route exact path={path}>
                <Layer x={0} y={140}>
                    {flightPlan.allLegs.map((leg, index, array) => {
                        const isLastLeg = index === flightPlan.legCount - 1;

                        let identColorClass;
                        if (!leg.isDiscontinuity && leg.segment instanceof MissedApproachSegment) {
                            identColorClass = 'Cyan';
                        } else if (index === flightPlan.activeLegIndex) {
                            identColorClass = 'White';
                        } else if (isTemporary) {
                            identColorClass = 'Yellow';
                        } else {
                            identColorClass = 'Green';
                        }

                        let lineColorClass;
                        if (isTemporary) {
                            lineColorClass = 'Yellow';
                        } else if (!leg.isDiscontinuity && leg.segment instanceof MissedApproachSegment) {
                            lineColorClass = 'Cyan';
                        } else {
                            lineColorClass = 'Green';
                        }

                        let waypointLineTopColorClass = lineColorClass;
                        if (index === flightPlan.activeLegIndex) {
                            waypointLineTopColorClass = 'White';
                        }

                        if (index - scrollPos >= 0 && index - scrollPos < (isTemporary ? NUM_FPLN_ROWS_TEMPORARY : NUM_FPLN_ROWS)) {
                            if (!leg.isDiscontinuity) {
                                return (
                                    <>
                                        {index - scrollPos > 0 && array[index - 1] instanceof FlightPlanLeg && (
                                            <LegRow
                                                ident={leg.annotation}
                                                distance={0} // FIXME
                                                bearing={0} // FIXME
                                                index={index - scrollPos}
                                                infoColorClass={mainFplnLegInfoColorClass}
                                                lineColorClass={waypointLineTopColorClass}
                                            />
                                        )}
                                        <WaypointRow
                                            onClick={() => selectLeg(index)}
                                            selected={selectedLeg === index}
                                            ident={leg.ident + (leg.overfly ? '' /* TODO delta symbol when crévin phont */ : '')}
                                            index={index - scrollPos}
                                            eta="08:35"
                                            altitude="0"
                                            speed="0"
                                            hideDiamond={!index}
                                            precedesLeg={array[index + 1] instanceof FlightPlanLeg && index - scrollPos < (isTemporary ? 7 : 8)}
                                            followsLeg={array[index - 1] instanceof FlightPlanLeg && index - scrollPos > 0}
                                            identColorClass={identColorClass}
                                            lineTopColorClass={waypointLineTopColorClass}
                                            lineBottomColorClass={lineColorClass}
                                        />

                                        {isLastLeg && <SpecialRow index={index - scrollPos + 1} text="END OF F-PLN" />}
                                    </>
                                );
                            }

                            return (
                                <SpecialRow index={index - scrollPos} text="DISCONTINUITY" />
                            );
                        }

                        return (<></>);
                    })}

                    {!flightPlan.alternateFlightPlan.destinationAirport ? (
                        <SpecialRow index={flightPlan.allLegs.length + scrollPos + 1} text="NO ALTN F-PLN" />
                    ) : (
                        flightPlan.alternateFlightPlan.allLegs.map((leg, index, array) => {
                            // All main fpln elements + "END OF F-PLN" marker
                            const mainFplnRows = flightPlan.allLegs.length + 1;

                            if (mainFplnRows + index - scrollPos >= 0 && mainFplnRows + index - scrollPos < (isTemporary ? 8 : 9)) {
                                if (!leg.isDiscontinuity) {
                                    return (
                                        <>
                                            {index - scrollPos > 0 && array[index - 1] instanceof FlightPlanLeg && (
                                                <LegRow
                                                    ident={leg.annotation}
                                                    distance={0} // FIXME
                                                    bearing={0} // FIXME
                                                    index={mainFplnRows + index - scrollPos}
                                                    infoColorClass={mainFplnLegInfoColorClass}
                                                    lineColorClass={mainFplnLegInfoColorClass}
                                                />
                                            )}
                                            <WaypointRow
                                                onClick={() => selectLeg(index)}
                                                selected={selectedLeg === index}
                                                ident={leg.ident}
                                                index={mainFplnRows + index - scrollPos}
                                                eta="08:35"
                                                altitude="0"
                                                speed="0"
                                                hideDiamond={!index}
                                                precedesLeg={array[mainFplnRows + index + 1] instanceof FlightPlanLeg && mainFplnRows + index - scrollPos < (isTemporary ? 7 : 8)}
                                                followsLeg={array[mainFplnRows + index - 1] instanceof FlightPlanLeg && mainFplnRows + index - scrollPos > 0}
                                                identColorClass={isTemporary ? 'Yellow' : 'Cyan'}
                                                lineTopColorClass={isTemporary ? 'Yellow' : 'Cyan'}
                                                lineBottomColorClass={isTemporary ? 'Yellow' : 'Cyan'}
                                            />
                                        </>
                                    );
                                }

                                return (
                                    <SpecialRow index={mainFplnRows + index - scrollPos} text="DISCONTINUITY" />
                                );
                            }

                            return (<></>);
                        })
                    )}

                    {isTemporary && (
                        <>
                            <Button x={8} y={613} width={127} height={55} onClick={() => FlightPlanService.temporaryDelete()}>
                                <tspan dy={-3} fill="orange">ERASE</tspan>
                                <tspan dy={19} fill="orange">TMPY*</tspan>
                            </Button>

                            <Button x={635} y={613} width={127} height={55} onClick={() => FlightPlanService.temporaryInsert()}>
                                <tspan dy={-3} fill="orange">INSERT</tspan>
                                <tspan dy={19} fill="orange">TMPY*</tspan>
                            </Button>
                        </>
                    )}

                    {renderWindow()}

                    <line x1={2} y1={678} x2={765} y2={678} fill="none" stroke="#fff" strokeWidth={2} />
                    <Button x={7} y={694} width={149} height={40} onClick={() => history.push('/fms/active/f-pln/arrival')}>
                        <tspan fontSize={28} fill={isTemporary ? 'yellow' : 'white'}>
                            {flightPlan.destinationAirport?.ident}
                            {/* {flightPlan.procedureDetails.approachIdentifier.substr(1)} */ /* FIXME */}
                        </tspan>
                    </Button>
                    <text x={189} y={723} fontSize={22} fill={isTemporary ? 'yellow' : '#fff'}>20:08</text>
                    <text x={309} y={723} fontSize={22} fill={isTemporary ? 'yellow' : '#fff'}>
                        74.5
                        <tspan className="Blue">KLB</tspan>
                    </text>
                    <text x={429} y={724} fontSize={22} fill={isTemporary ? 'yellow' : '#fff'}>
                        6009
                        <tspan className="Blue">NM</tspan>
                    </text>

                    <Button x={525} y={687} width={63} height={57} onClick={() => scrollPage(1)}>
                        <Arrows x={31.5} y={28.5} angle={180} />
                    </Button>
                    <Button x={589} y={687} width={63} height={57} onClick={() => scrollPage(-1)}>
                        <Arrows x={31.5} y={28.5} />
                    </Button>
                    <Button x={653} y={687} width={108} height={57}>DEST</Button>

                    <line x1={2} y1={753} x2={765} y2={753} stroke="#fff" strokeWidth={2} />

                    <Button x={7} y={765} width={127} height={40} onClick={() => history.push('/fms/active/init')}>INIT</Button>
                    <Button x={286} y={765} width={197} height={40}>F-PLN INFO</Button>
                    <Button x={634} y={765} width={127} height={40}>DIR TO</Button>

                    <Header />
                </Layer>
            </Route>
        </Switch>
    );
};

const Header = () => (
    <>
        <text x={4} y={35} fontSize={22} fill="#fff">FROM</text>
        <text x={208} y={34} fontSize={22} fill="#fff">TIME</text>

        <Dropdown x={309} y={6} width={255} height={40} title="SPD ALT">
            <DropdownItem>SPD ALT</DropdownItem>
            <DropdownItem>EFOB T.WIND</DropdownItem>
        </Dropdown>

        <text x={582} y={35} fontSize={22} fill="#fff">TRK</text>
        <text x={642} y={35} fontSize={22} fill="#fff">DIST</text>
        <text x={718} y={35} fontSize={22} fill="#fff">FPA</text>

        <line y1={49} x2={763} y2={49} fill="none" stroke="#fff" strokeWidth={2} />
    </>
);
