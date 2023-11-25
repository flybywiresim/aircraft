import React, { FC, useEffect, useState } from 'react';
import { Layer } from '@instruments/common/utils';
import { useActiveOrTemporaryFlightPlan, useNavDatabase } from '@instruments/common/flightplan';
import { useHistory } from 'react-router-dom';
import { Runway, Departure, IlsNavaid } from 'msfs-navdata';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { Dropdown, DropdownItem } from '../../../../Components/Dropdown';
import { Button } from '../../../../Components/Button';

export const Page: FC = () => {
    const [flightPlan, isTemporary, planVersion] = useActiveOrTemporaryFlightPlan();
    const database = useNavDatabase();
    const [runways, setRunways] = useState<Runway[]>();
    const [departures, setDepartures] = useState<Departure[]>();
    const [ls, setLs] = useState<IlsNavaid>();

    const runway = runways?.find((runway) => runway.ident === flightPlan.originRunway?.ident);

    const history = useHistory();

    useEffect(() => {
        if (flightPlan.originAirport) {
            database.getIlsAtAirport(flightPlan.originAirport?.ident ?? '')
                .then((ils) => setLs(ils.find((ils) => ils.runwayIdent === flightPlan.originRunway?.ident)));
        } else {
            setLs(undefined);
        }
    }, [flightPlan.originAirport, flightPlan.departureSegment, flightPlan.originRunway?.ident]);

    useEffect(() => {
        if (flightPlan.originAirport) {
            setRunways(flightPlan.availableOriginRunways);
            setDepartures(flightPlan.availableDepartures);
        } else {
            setRunways([]);
            setDepartures([]);
        }
    }, [planVersion]);

    return (
        <Layer x={0} y={140}>
            <rect x={11} y={18} width={743} height={179} fill="none" stroke="#fff" strokeWidth={2} />
            <rect x={40} y={16} width={262} height={4} />
            <text x={42} y={29} fontSize={22} fill="#fff">SELECTED DEPARTURE</text>

            <text x={16} y={80} fontSize={22} fill="#fff">FROM</text>
            <text x={90} y={82} fontSize={29} fill={isTemporary ? '#ff0' : 'lime'}>
                {flightPlan.originAirport?.ident}
                {' '}
                {runway?.lsIdent && 'ILS'}
                {' '}
                {runway?.lsIdent}
            </text>

            <text x={379} y={61} fontSize={22} fill="#fff">RWY</text>
            <text x={379} y={102} fontSize={28} fill={isTemporary ? '#ff0' : 'lime'}>{flightPlan.originRunway?.ident.substr(2) || '---'}</text>

            <text x={503} y={60} fontSize={22} fill="#fff">LENGTH</text>
            <text x={512} y={102} fontSize={28} fill={isTemporary ? '#ff0' : 'lime'}>
                {runway ? Math.round(runway.length) : '----'}
                {flightPlan.originRunway?.ident && <tspan dx={3} dy={-3} fill="blue" fontSize={22}>FT</tspan>}
            </text>

            <text x={654} y={60} fontSize={22} fill="#fff">CRS</text>
            <text x={647} y={102} fontSize={28} fill={isTemporary ? '#ff0' : 'lime'}>
                {runway ? Math.round(runway.magneticBearing) : '---'}
                {flightPlan.originRunway?.ident && <tspan dx={5} fill="blue" fontSize={22}>°</tspan>}
            </text>

            <text x={16} y={141} fontSize={22} fill="#fff">EOSID</text>
            <text x={14} y={181} fontSize={29} fill={isTemporary ? '#ff0' : 'lime'}>{flightPlan.departureSegment ? 'NONE' : '-----'}</text>

            <text x={188} y={141} fontSize={22} fill="#fff">FREQ/CHAN</text>
            <text x={190} y={180} fontSize={28} fill={isTemporary ? '#ff0' : 'lime'}>{ls?.frequency ?? '---.--'}</text>

            <text x={438} y={141} fontSize={22} fill="#fff">SID</text>
            <text x={438} y={181} fontSize={28} fill={isTemporary ? '#ff0' : 'lime'}>{flightPlan.originDeparture?.ident || '------'}</text>

            <text x={607} y={141} fontSize={22} fill="#fff">TRANS</text>
            <text x={608} y={181} fontSize={28} fill={isTemporary ? '#ff0' : 'lime'}>
                {flightPlan.originDeparture?.enrouteTransitions.find((trans) => trans.ident === flightPlan.departureEnrouteTransition?.ident)?.ident || '-----'}
            </text>

            {/* RWY */}
            <Dropdown x={51} y={213} width={279} height={43} title="RWY" scrollable>
                {runways?.map((runway) => (
                    <DropdownItem onSelect={() => FlightPlanService.setOriginRunway(runway.ident)} centered={false}>
                        <tspan x={30}>{runway.ident.substr(2)}</tspan>
                        <tspan x={175} textAnchor="end">
                            {Math.floor(runway.length)}
                            FT
                        </tspan>
                        <tspan x={200}>
                            {runway.lsIdent && 'ILS'}
                        </tspan>
                    </DropdownItem>
                ))}
            </Dropdown>

            {/* SID */}
            <Dropdown x={439} y={213} width={134} height={43} title="SID" disabled={!flightPlan.originRunway?.ident || !departures?.length} scrollable>
                <DropdownItem onSelect={() => FlightPlanService.setDepartureProcedure(undefined)} centered={false}>NONE</DropdownItem>
                {departures?.map((departure) => (
                    <DropdownItem centered={false} onSelect={() => FlightPlanService.setDepartureProcedure(departure.ident)}>{departure.ident}</DropdownItem>
                ))}
            </Dropdown>

            {/* TRANS */}
            <Dropdown x={608} y={213} width={134} height={43} title="TRANS" disabled={!flightPlan.originDeparture?.enrouteTransitions.length} scrollable>
                <DropdownItem onSelect={() => FlightPlanService.setDepartureEnrouteTransition(undefined)} centered={false}><tspan x={10}>NONE</tspan></DropdownItem>
                {flightPlan.originDeparture?.enrouteTransitions?.map((trans) => (
                    <DropdownItem centered={false} onSelect={() => FlightPlanService.setDepartureEnrouteTransition(trans.ident)}>{trans.ident}</DropdownItem>
                ))}
            </Dropdown>

            {isTemporary && (
                <Button x={598} y={765} width={161} height={43} onClick={() => history.push('/fms/active/f-pln')}>
                    <tspan fill="yellow" dy={8}>TMPY F-PLN</tspan>
                </Button>
            )}
        </Layer>
    );
};
