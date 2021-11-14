import React, { useState } from 'react';

import { OverviewPage } from './Pages/OverviewPage';
import { LoadSheetWidget } from './Pages/LoadsheetPage';
import { Navbar } from '../Components/Navbar';
import { FuelPage } from './Pages/FuelPage';

export const Dispatch = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    const tabs = [
        'Overview',
        'OFP',
        'Fuel',
    ];

    function currentPage() {
        switch (activeIndex) {
        case 1:
            return (
                <LoadSheetWidget />
            );
        case 2:
            return (
                <FuelPage />
            );
        default:
            return (
                <OverviewPage />
            );
        }
    }

    return (
        <div className="w-full">
            <div className="relative">
                <h1 className="font-bold">Dispatch</h1>
                <Navbar className="absolute top-0 right-0" tabs={tabs} onSelected={(index) => setActiveIndex(index)} />
            </div>
            <div>
                {currentPage()}
            </div>
        </div>
    );
};
