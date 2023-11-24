import React, { FC, useEffect, useState } from 'react';
import { Layer } from '@instruments/common/utils';
import { useHistory } from 'react-router-dom';
import { useActiveOrTemporaryFlightPlan } from '@instruments/common/flightplan';
import { useSimVar } from '@instruments/common/simVars';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { TextBox } from '../../../Components/Textbox';
import { Button } from '../../../Components/Button';

export const Page: FC = () => {
    const history = useHistory();
    const [flightPlan] = useActiveOrTemporaryFlightPlan();
    const [flightNumber, setFlightNumber] = useSimVar('ATC FLIGHT NUMBER', 'string', 250);

    const [tempOriginIcao, setTempOriginIcao] = useState('');
    const [tempDestIcao, setTempDestIcao] = useState('');
    const [tempAltnIcao, setTempAltnIcao] = useState('');

    useEffect(() => {
        if (tempOriginIcao && tempDestIcao && tempAltnIcao) {
            FlightPlanService.newCityPair(tempOriginIcao, tempDestIcao, tempAltnIcao);
        }
    }, [tempOriginIcao, tempDestIcao, tempAltnIcao]);

    return (
        <Layer x={0} y={140}>
            <text x={36} y={48} fontSize={22} fill="#fff">FLT NBR</text>
            <TextBox
                x={144}
                y={18}
                width={220}
                defaultValue={flightNumber}
                onSubmit={((value) => {
                    setFlightNumber(value);
                    return true;
                })}
            />
            <Button x={369} y={18} width={200}>ACFT STATUS</Button>

            <Button x={591} y={10} width={174} height={60} disabled>
                <tspan dy={-3}>CPNY F-PLN</tspan>
                <tspan dy={19}>REQUEST</tspan>
            </Button>

            <text x={80} y={112} fontSize={22} fill="#fff">FROM</text>
            <TextBox
                x={145}
                y={83}
                width={98}
                maxLength={4}
                defaultValue={flightPlan.originAirport?.ident}
                onSubmit={(ident) => {
                    setTempOriginIcao(ident);
                    return true;
                }}
            />

            <text x={250} y={113} fontSize={22} fill="#fff">TO</text>
            <TextBox
                x={290}
                y={83}
                width={98}
                maxLength={4}
                defaultValue={flightPlan.destinationAirport?.ident}
                onSubmit={(ident) => {
                    setTempDestIcao(ident);
                    return true;
                }}
            />

            <text x={401} y={113} fontSize={22} fill="#fff">ALTN</text>
            <TextBox
                x={471}
                y={83}
                width={98}
                maxLength={4}
                defaultValue={flightPlan.alternateDestinationAirport?.ident}
                onSubmit={(ident) => {
                    setTempAltnIcao(ident);
                    return true;
                }}
            />

            <text x={23} y={179} fontSize={22} fill="#fff">CPNY RTE</text>
            <TextBox x={145} y={151} width={219} height={41} />
            <Button x={369} y={151} width={200} height={41} disabled>RTE SEL</Button>

            <text x={23} y={229} fontSize={22} fill="#fff">ALTN RTE</text>
            <TextBox x={145} y={199} width={219} height={41} />
            <Button x={369} y={199} width={200} height={41} disabled>ALTN RTE SEL</Button>

            <line x1={10} y1={264} x2={757} y2={264} fill="none" stroke="#fff" strokeWidth={2} />

            <text x={51} y={309} fontSize={22} fill="#fff">CRZ FL</text>
            <TextBox x={145} y={279} width={119} height={41} maxLength={3} prefix="FL" />

            <text x={293} y={309} fontSize={22} fill="#fff">CRZ TEMP</text>
            <TextBox x={419} y={279} width={119} height={41} maxLength={3} suffix="°C" autoFilled />

            <text x={109} y={359} fontSize={22} fill="#fff">CI</text>
            <TextBox x={145} y={331} width={78} height={41} maxLength={3} />

            <text x={338} y={359} fontSize={22} fill="#fff">TROPO</text>
            <TextBox x={419} y={331} width={150} height={41} maxLength={6} suffix="FT" autoFilled />

            <text x={8} y={447} fontSize={22} fill="#fff">TRIP WIND</text>
            <TextBox x={145} y={419} width={119} height={41} maxLength={3} prefix="HD" />

            <Button x={369} y={417} width={100} height={41}>WIND</Button>
            <Button x={591} y={373} width={174} height={60}>
                <tspan dy={-3}>CPNY WIND</tspan>
                <tspan dy={19}>REQUEST</tspan>
            </Button>

            <line x1={9} y1={520} x2={756} y2={520} fill="none" stroke="#fff" strokeWidth={2} />

            <Button x={144} y={536} width={156} height={41}>IRS</Button>
            <Button x={144} y={593} width={156} height={41} onClick={() => history.push('/fms/active/f-pln/departure')}>DEPARTURE</Button>
            <Button x={144} y={650} width={156} height={41}>NAVAIDS</Button>
            <Button x={144} y={707} width={156} height={41}>FUEL&LOAD</Button>
            <Button x={144} y={764} width={156} height={41}>T.O PERF</Button>
            <Button x={371} y={596} width={200} height={41}>RTE SUMMARY</Button>
            <Button x={591} y={748} width={174} height={60}>
                <tspan dy={-3}>CPNY T.O.</tspan>
                <tspan dy={19}>REQUEST</tspan>
            </Button>
        </Layer>
    );
};
