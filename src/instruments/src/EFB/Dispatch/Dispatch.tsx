import React, { useState } from 'react';

import OverviewPage from './Pages/OverviewPage';
import LoadsheetPage from './Pages/LoadsheetPage';
import { Navbar } from '../Components/Navbar';
import { FuelPage } from './Pages/FuelPage';

type DispatchProps = {
    loadsheet: string,
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

const Dispatch = (props: DispatchProps) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const tabs = [
        'Overview',
        'OFP',
        'Fuel',
    ];

    function handleClick(index: number) {
        setActiveIndex(index);
    }

    function currentPage() {
        switch (activeIndex) {
        case 1:
            return (
                <LoadsheetPage loadsheet={props.loadsheet} />
            );
        case 2:
            return (
                <FuelPage />
            );
        case 3:
            return (
                <div className="w-full h-full">
                    <p className="text-white font-medium mt-6 ml-4 text-3xl">Inop.</p>
                </div>
            );
        default:
            return (
                <OverviewPage
                    weights={props.weights}
                    fuels={props.fuels}
                    units={props.units}
                    arrivingAirport={props.arrivingAirport}
                    arrivingIata={props.arrivingIata}
                    departingAirport={props.departingAirport}
                    departingIata={props.departingIata}
                    altBurn={props.altBurn}
                    altIcao={props.altIcao}
                    altIata={props.altIata}
                    tripTime={props.tripTime}
                    contFuelTime={props.contFuelTime}
                    resFuelTime={props.resFuelTime}
                    taxiOutTime={props.taxiOutTime}
                />
            );
        }
    }

    return (
        <div className="w-full">
            <div className="relative">
                <h1 className="text-white">Dispatch</h1>
                <Navbar className="absolute right-0 top-0" tabs={tabs} onSelected={(index) => handleClick(index)} />
            </div>
            <div>
                {currentPage()}
            </div>
        </div>
    );
};

export default Dispatch;
