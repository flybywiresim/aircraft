import React from 'react';
import { useActiveOrTemporaryFlightPlan } from '@instruments/common/flightplan';
import { Layer } from '../../../Components/Layer';
import { TextBox } from '../../../Components/Textbox';
import { Button } from '../../../Components/Button';

export const Page = () => {
    const [flightPlan] = useActiveOrTemporaryFlightPlan();

    return (
        <Layer y={140}>
            <text x={63} y={39} fontSize={22} fill="#fff">GW</text>
            <text x={137} y={45} fontSize={29} fill="lime">---.-</text>
            <text x={239} y={39} fontSize={22} fill="blue">KLB</text>

            <text x={339} y={39} fontSize={22} fill="#fff">CG</text>
            <text x={391} y={45} fontSize={29} fill="lime">--.-</text>
            <text x={474} y={40} fontSize={22} fill="blue">%</text>

            <text x={547} y={39} fontSize={22} fill="#fff">FOB</text>
            <text x={617} y={45} fontSize={29} fill="lime">---.-</text>
            <text x={719} y={39} fontSize={22} fill="blue">KLB</text>

            <text x={133} y={101} fontSize={22} fill="#fff">ZFW</text>
            <TextBox x={186} y={70} width={165} height={43} maxLength={4} suffix="KLB" />

            <text x={105} y={163} fontSize={22} fill="#fff">BLOCK</text>
            <TextBox x={186} y={133} width={165} height={43} maxLength={4} suffix="KLB" />

            <text x={394} y={101} fontSize={22} fill="#fff">ZFWCG</text>
            <TextBox x={479} y={70} width={114} height={43} maxLength={3} suffix="%" />

            <Button x={508} y={126} width={171} height={60}>
                <tspan dx={-10} dy={-3}>FUEL</tspan>
                <tspan dx={-10} dy={19}>PLANNING</tspan>
                <tspan dx={70} dy={4}>*</tspan>
            </Button>

            <line x1={9} y1={197} x2={746} y2={197} stroke="#fff" strokeWidth={2} />

            <text x={52} y={254} fontSize={22} fill="#fff">TAXI</text>
            <TextBox x={118} y={224} width={165} height={43} maxLength={4} suffix="KLB" />

            <text x={52} y={315} fontSize={22} fill="#fff">TRIP</text>
            <text x={131} y={318} fontSize={29} fill="lime">173.9</text>
            <text x={232} y={316} fontSize={22} fill="blue">KLB</text>
            <text x={304} y={319} fontSize={29} fill="lime">06:14</text>

            <text x={9} y={375} fontSize={22} fill="#fff">RTE RSV</text>
            <TextBox x={118} y={345} width={165} height={43} maxLength={4} suffix="KLB" />
            <TextBox x={293} y={345} width={119} height={43} maxLength={3} suffix="%" />

            <text x={52} y={434} fontSize={22} fill="#fff">ALTN</text>
            <TextBox x={118} y={404} width={165} height={43} maxLength={3} suffix="KLB" />
            <text x={304} y={436} fontSize={29} fill="lime">00:56</text>

            <text x={38} y={495} fontSize={22} fill="#fff">FINAL</text>
            <TextBox x={118} y={465} width={165} height={43} maxLength={4} suffix="KLB" />
            <TextBox x={294} y={465} width={119} height={43} maxLength={5} />

            <text x={471} y={254} fontSize={22} fill="#fff">PAX NBR</text>
            <TextBox x={579} y={224} width={79} height={43} maxLength={3} />

            <text x={544} y={316} fontSize={22} fill="#fff">CI</text>
            <TextBox x={579} y={286} width={79} height={43} maxLength={3} />

            <text x={471} y={375} fontSize={22} fill="#fff">JTSN GW</text>
            <TextBox x={579} y={344} width={185} height={43} maxLength={4} suffix="KLB" />

            <text x={529} y={433} fontSize={22} fill="#fff">TOW</text>
            <text x={630} y={437} fontSize={29} fill="lime">1035</text>
            <text x={713} y={434} fontSize={22} fill="blue">KLB</text>

            <text x={651} y={496} fontSize={29} fill="lime">861</text>
            <text x={713} y={492} fontSize={22} fill="blue">KLB</text>

            <line x1={10} y1={543} x2={747} y2={543} stroke="#fff" strokeWidth={2} />

            <text x={232} y={595} fontSize={22} fill="#fff">UTC</text>
            <text x={348} y={595} fontSize={22} fill="#fff">EFOB</text>
            <line x1={18} y1={608} x2={456} y2={608} stroke="#fff" strokeWidth={2} />

            <text x={22} y={649} fontSize={22} fill="#fff">DEST</text>
            <text x={103} y={652} fontSize={29} fill="lime">{flightPlan.destinationAirport}</text>
            <text x={204} y={652} fontSize={29} fill="lime">06:14</text>
            <text x={357} y={652} fontSize={29} fill="lime">67.2</text>
            <text x={441} y={649} fontSize={22} fill="blue">KLB</text>

            <text x={23} y={693} fontSize={22} fill="#fff">ALTN</text>
            <text x={103} y={695} fontSize={29} fill="lime">LFPG</text>
            <text x={204} y={695} fontSize={29} fill="lime">07:11</text>
            <text x={356} y={696} fontSize={29} fill="lime">00.3</text>
            <text x={440} y={693} fontSize={22} fill="blue">KLB</text>

            <text x={497} y={594} fontSize={22} fill="#fff">MIN FUEL AT DEST</text>
            <TextBox x={521} y={618} width={185} height={43} maxLength={4} suffix="KLB" />
            <text x={582} y={713} fontSize={22} fill="#fff">EXTRA</text>
            <text x={486} y={747} fontSize={29} fill="lime">16.5</text>
            <text x={569} y={744} fontSize={22} fill="blue">KLB</text>
            <text x={642} y={748} fontSize={29} fill="lime">00:34</text>
            <Button x={2} y={763} width={149} height={43}>RETURN</Button>
        </Layer>
    );
};
