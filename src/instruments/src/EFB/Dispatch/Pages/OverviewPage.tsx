import React, { useState, useEffect } from 'react';
import { IconAlignRight, IconBox, IconPlane, IconSwitchHorizontal, IconUsers, IconBolt } from '@tabler/icons';
import fuselage from '../../Assets/320neo-outline-nose.svg';
import { useSimVar } from '../../../Common/simVars';

/* eslint-disable react/no-unused-prop-types */

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

const OverviewPage = (props: OverviewPageProps) => {
    const [, setUnitConversion] = useState(1000);

    useEffect(() => {
        const unitConv = (props.units === 'kgs') ? 1000 : 2240;
        setUnitConversion(unitConv);
    }, [props.units]);

    let [airline] = useSimVar('ATC AIRLINE', 'String', 1_000);

    if (airline === 0 || null || '') {
        airline = 'FlyByWire Simulations';
    }

    return (
        <div className="flex mt-6">
            <div className="w-1/2 mr-3">
                <div className="text-white overflow-hidden bg-navy-lighter rounded-2xl shadow-lg p-6 h-efb-nav">
                    <h2 className="text-2xl font-medium">Airbus A320neo</h2>
                    <span className="text-lg">{airline}</span>
                    <div className="flex items-center justify-center mt-6">
                        <img className="flip-horizontal h-48 -ml-96 mr-32" src={fuselage} />
                    </div>
                    <div className="mt-8 flex">
                        <div className="w-1/2">
                            <h3 className="text-xl font-medium flex items-center">
                                <IconPlane className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                Model
                            </h3>
                            <span className="mt-2 text-lg">A320-251N [A20N]</span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconSwitchHorizontal className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                Range
                            </h3>
                            <span className="mt-2 text-lg">3400 [nm]</span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconBox className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                MRW
                            </h3>
                            <span className="mt-2 text-lg">79,400 [kg]</span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconBox className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                MZFW
                            </h3>
                            <span className="mt-2 text-lg">64,300 [kg]</span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconUsers className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                Max PAX
                            </h3>
                            <span className="mt-2 text-lg">180</span>
                        </div>
                        <div className="w-1/2">
                            <h3 className="text-xl font-medium flex items-center">
                                <IconBolt className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                Engines
                            </h3>
                            <span className="mt-2 text-lg">CFM LEAP 1A-26</span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconAlignRight className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                Mmo
                            </h3>
                            <span className="mt-2 text-lg">0.82</span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconBox className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                MTOW
                            </h3>
                            <span className="mt-2 text-lg">79,000 [kg]</span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconBox className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                Max Fuel Capacity
                            </h3>
                            <span className="mt-2 text-lg">23,721 [l]</span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconBox className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                Max Cargo
                            </h3>
                            <span className="mt-2 text-lg">9,435 [kg]</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewPage;
