import React, { FC, useEffect, useState } from 'react';
import { useActiveOrTemporaryFlightPlan, useNavDatabase } from '@instruments/common/flightplan';
import { Approach, Arrival, Database, IlsNavaid, Runway } from 'msfs-navdata';
import { useHistory } from 'react-router-dom';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { Layer } from '../../../../Components/Layer';
import { Dropdown, DropdownItem } from '../../../../Components/Dropdown';
import { Button } from '../../../../Components/Button';

export const Page: FC = () => {
    const [flightPlan, isTemporary, version] = useActiveOrTemporaryFlightPlan();
    const database = useNavDatabase();
    const [runways, setRunways] = useState<Runway[]>();
    const [arrivals, setArrivals] = useState<Arrival[]>();
    const [approaches, setApproaches] = useState<Approach[]>();
    const [ls, setLs] = useState<IlsNavaid>();

    const history = useHistory();

    useEffect(() => {
        if (flightPlan.destinationAirport) {
            setRunways(flightPlan.availableDestinationRunways);
            setArrivals(flightPlan.availableArrivals);
            setApproaches(flightPlan.availableApproaches);

            const { approach } = flightPlan;
            if (approach) {
                database.getIlsAtAirport(flightPlan.destinationAirport?.ident ?? '')
                    .then((ils) => setLs(ils.find((it) => it.runwayIdent === Database.approachToRunway(approach.ident))));
            }
        }
    }, [version]);

    const mainFplnColorClass = isTemporary ? 'Yellow' : 'Green';

    return (
        <Layer x={0} y={140}>
            <rect
                x={11}
                y={17}
                width={744}
                height={179}
                fill="none"
                stroke="#fff"
                strokeMiterlimit="10"
                strokeWidth={2}
            />
            <rect x={30} y={15} width={250} height={4} />
            <text x={41} y={28} fontSize={22} fill="#fff">SELECTED ARRIVAL</text>

            <text className="White" x={16} y={80} fontSize={22}>TO</text>
            <text className={mainFplnColorClass} x={62} y={80} fontSize={29}>
                {flightPlan.destinationRunway?.ident}
            </text>

            <text className="White" x={191} y={59} fontSize={22}>LS</text>
            <text className={mainFplnColorClass} x={190} y={102} fontSize={29}>
                {flightPlan.destinationRunway?.lsIdent ?? '----'}
            </text>

            <text className="White" x={361} y={59} fontSize={22}>RWY</text>
            <text className={mainFplnColorClass} x={361} y={102} fontSize={29}>
                {flightPlan.destinationRunway?.ident.substring(2) ?? '---'}
            </text>

            <text className="White" x={478} y={59} fontSize={22}>LENGTH</text>
            <text className={mainFplnColorClass} x={466} y={101} fontSize={29}>
                {flightPlan.destinationRunway ? Math.floor(flightPlan.destinationRunway.length) : '----'}
                {flightPlan.destinationRunway && <tspan dx={3} dy={-3} fill="blue" fontSize={22}>FT</tspan>}
            </text>

            <text className="White" x={629} y={60} fontSize={22}>CRS</text>
            <text className={mainFplnColorClass} x={623} y={102} fontSize={29}>
                {flightPlan.destinationRunway?.magneticBearing ?? '---'}
                {flightPlan.destinationRunway?.magneticBearing && <tspan dx={5} fill="blue" fontSize={22}>°</tspan>}
            </text>

            <text className="White" x={16} y={141} fontSize={22}>APPR</text>
            <text className={mainFplnColorClass} x={15} y={181} fontSize={29}>
                {flightPlan.approach?.ident ?? '-----'}
            </text>

            <text className="White" x={190} y={141} fontSize={22}>FREQ/CHAN</text>
            <text className={mainFplnColorClass} x={190} y={181} fontSize={29}>
                {ls?.frequency ?? '---.--'}
            </text>

            <text className="White" x={361} y={141} fontSize={22}>VIA</text>
            <text className={mainFplnColorClass} x={360} y={181} fontSize={29}>
                {flightPlan.approachVia?.ident ?? '-----'}
            </text>

            <text className="White" x={495} y={141} fontSize={22}>STAR</text>
            <text className={mainFplnColorClass} x={496} y={181} fontSize={29}>
                {flightPlan.arrival?.ident ?? '-----'}
            </text>

            <text className="White" x={631} y={141} fontSize={22}>TRANS</text>
            <text className={mainFplnColorClass} x={631} y={181} fontSize={29}>
                {flightPlan.arrivalEnrouteTransition?.ident ?? '-----'}
            </text>

            {/* RWY */}
            <Dropdown x={9} y={213} width={173} height={42} title="RWY" scrollable>
                {runways?.map((runway) => (
                    <DropdownItem centered={false} onSelect={() => FlightPlanService.setDestinationRunway(runway.ident)}>
                        <tspan x={10}>{runway.ident.substring(2)}</tspan>
                        <tspan x={55}>
                            {Math.floor(runway.length)}
                            FT
                        </tspan>
                    </DropdownItem>
                ))}
            </Dropdown>

            {/* APPR */}
            <Dropdown x={192} y={213} width={158} height={42} title="APPR" scrollable>
                <DropdownItem onSelect={() => FlightPlanService.setApproach(undefined)} centered={false}>NONE</DropdownItem>
                {approaches?.map((approach) => (
                    <DropdownItem centered={false} onSelect={() => FlightPlanService.setApproach(approach.ident)}>{approach.ident}</DropdownItem>
                ))}
            </Dropdown>

            {/* VIA */}
            <Dropdown x={360} y={213} width={125} height={42} title="VIA" disabled={!flightPlan.approach?.transitions.length} scrollable>
                <DropdownItem onSelect={() => FlightPlanService.setApproachVia(undefined)} centered={false}>NONE</DropdownItem>
                {flightPlan.approach?.transitions.map((trans) => (
                    <DropdownItem centered={false} onSelect={() => FlightPlanService.setApproachVia(trans.ident)}>{trans.ident}</DropdownItem>
                ))}
            </Dropdown>

            <Dropdown x={495} y={213} width={125} height={42} title="STAR" disabled={!arrivals?.length} scrollable>
                <DropdownItem onSelect={() => FlightPlanService.setArrival(undefined)} centered={false}>NONE</DropdownItem>
                {arrivals?.map((arrival) => (
                    <DropdownItem centered={false} onSelect={() => FlightPlanService.setArrival(arrival.ident)}>{arrival.ident}</DropdownItem>
                ))}
            </Dropdown>

            {/* TRANS */}
            <Dropdown x={630} y={213} width={125} height={42} title="TRANS" disabled={!flightPlan.arrival?.enrouteTransitions?.length} scrollable>
                <DropdownItem onSelect={() => FlightPlanService.setArrivalEnrouteTransition(undefined)} centered={false}>NONE</DropdownItem>
                {flightPlan.arrival?.enrouteTransitions.map((trans) => (
                    <DropdownItem centered={false} onSelect={() => FlightPlanService.setArrivalEnrouteTransition(trans.ident)}>{trans.ident}</DropdownItem>
                ))}
            </Dropdown>

            {isTemporary && (
                <Button x={598} y={770} width={161} height={43} onClick={() => history.push('/fms/active/f-pln')}>
                    <tspan fill="yellow">TMPY F-PLN</tspan>
                </Button>
            )}
        </Layer>
    );
};
