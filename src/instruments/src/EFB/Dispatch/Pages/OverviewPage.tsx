/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, {useState, useEffect} from 'react';
import { IconAlignRight, IconBox, IconPlane, IconSwitchHorizontal, IconUsers, IconBolt } from '@tabler/icons';
import nose from '../../Assets/320neo-outline-nose.svg';
import fuselage from '../../Assets/320neo-outline-fuselage.svg';

type OverviewPageProps = {
    weights: {
        cargo: number,
        estLandingWeight: number,
        estTakeOffWeight: number,
        estZeroFuelWeight: number,
        maxLandingWeight: number,
        maxTakeOffWeight: number,
        maxZeroFuelWeight: number,
        passengerCount: number,
        passengerWeight: number,
        payload: number,
    },
    fuels: {
        avgFuelFlow: number,
        contingency: number,
        enrouteBurn: number,
        etops: number,
        extra: number,
        maxTanks: number,
        minTakeOff: number,
        planLanding: number,
        planRamp: number,
        planTakeOff: number,
        reserve: number,
        taxi: number,
    },
    units: string,
    arrivingAirport: string,
    arrivingIata: string,
    departingAirport: string,
    departingIata: string,
    altBurn: number,
    altIcao: string,
    altIata: string,
    tripTime: number,
    contFuelTime: number,
    resFuelTime: number,
    taxiOutTime: number,
};

type OverviewPageState = {
    unitConversion: number;
};

const OverviewPage = (props: OverviewPageProps) => {

    const [unitConversion, setunitConversion] = useState(1000);

    useEffect(() => {
        const unitConv = (props.units === "kgs") ? 1000 : 2240;
        console.log("Units changed to " + unitConv);
        setunitConversion(unitConv);
    }, [props.units]);

    return (
        <div className="px-6">
            <div className="flex w-full">
                <div className="w-1/2 bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden">
                    <h2 className="text-2xl font-medium">Airbus A320neo</h2>
                    <span>FlyByWire Simulations</span>
                    <img className="flip-vertical mt-6 h-24 -ml-24" src={nose} />
                    <div className="flex mt-8">
                        <div className="w-1/2">
                            <h3 className="text-xl font-medium flex items-center"><IconPlane className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" /> Model</h3>
                            <span className="mt-2 text-lg">A320-251N [A20N]</span>

                            <h3 className="text-xl font-medium flex items-center mt-6"><IconSwitchHorizontal className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" /> Range</h3>
                            <span className="mt-2 text-lg">3400 [nm]</span>

                            <h3 className="text-xl font-medium flex items-center mt-6"><IconBox className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" /> MRW</h3>
                            <span className="mt-2 text-lg">175,000 [lb]</span>

                            <h3 className="text-xl font-medium flex items-center mt-6"><IconBox className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" /> MZFW</h3>
                            <span className="mt-2 text-lg">141,800 [lb]</span>

                            <h3 className="text-xl font-medium flex items-center mt-6"><IconUsers className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" /> Max PAX</h3>
                            <span className="mt-2 text-lg">180</span>
                        </div>
                        <div className="w-1/2">
                            <h3 className="text-xl font-medium flex items-center"><IconBolt className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" /> Engines</h3>
                            <span className="mt-2 text-lg">CFM LEAP 1A-26</span>

                            <h3 className="text-xl font-medium flex items-center mt-6"><IconAlignRight className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" /> Mmo</h3>
                            <span className="mt-2 text-lg">0.82</span>

                            <h3 className="text-xl font-medium flex items-center mt-6"><IconBox className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" /> MTOW</h3>
                            <span className="mt-2 text-lg">174,200 [lb]</span>

                            <h3 className="text-xl font-medium flex items-center mt-6"><IconBox className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" /> Max Fuel Capacity</h3>
                            <span className="mt-2 text-lg">26,725 [kg]</span>

                            <h3 className="text-xl font-medium flex items-center mt-6"><IconBox className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" /> Max Cargo</h3>
                            <span className="mt-2 text-lg">44,000 [kg]</span>
                        </div>
                    </div>
                </div>
                <div className="w-1/2 text-white overflow-hidden">
                    <img className="-ml-6 transform rotate-45" src={fuselage} />
                </div>
            </div>
        </div>
    );
};

export default OverviewPage;