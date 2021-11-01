import React, { useState } from 'react';

import { OverviewPage } from './Pages/OverviewPage';
import { LoadSheetWidget } from './Pages/LoadsheetPage';
import { Navbar } from '../Components/Navbar';
import { FuelPage } from './Pages/FuelPage';
import { useAppSelector } from '../Store/store';

export const Dispatch = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const simbriefData = useAppSelector((state) => state.simbrief.data);

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
                <LoadSheetWidget loadsheet={simbriefData.loadsheet} />
            );
        case 2:
            return (
                <FuelPage />
            );
        default:
            return (
                <OverviewPage
                    weights={simbriefData.weights}
                    fuels={simbriefData.fuels}
                    units={simbriefData.units}
                    arrivingAirport={simbriefData.arrivingAirport}
                    arrivingIata={simbriefData.arrivingIata}
                    departingAirport={simbriefData.departingAirport}
                    departingIata={simbriefData.departingIata}
                    altBurn={simbriefData.altBurn}
                    altIcao={simbriefData.altIcao}
                    altIata={simbriefData.altIata}
                    tripTime={simbriefData.tripTime}
                    contFuelTime={simbriefData.contFuelTime}
                    resFuelTime={simbriefData.resFuelTime}
                    taxiOutTime={simbriefData.taxiOutTime}
                />
            );
        }
    }

    return (
        <div className="w-full">
            <div className="relative">
                <h1 className="">Dispatch</h1>
                <Navbar className="absolute top-0 right-0" tabs={tabs} onSelected={(index) => handleClick(index)} />
            </div>
            <div>
                {currentPage()}
            </div>
        </div>
    );
};
