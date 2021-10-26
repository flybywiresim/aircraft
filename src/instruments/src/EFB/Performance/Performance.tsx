import React, { useState } from 'react';
import { map } from 'lodash';

import { Navbar } from '../Components/Navbar';
import TODCalculator from '../TODCalculator/TODCalculator';
import LandingWidget from './Widgets/LandingWidget';

const tabs = [
    { name: 'Top of Descent', renderComponent: () => <TODCalculator /> },
    { name: 'Landing', renderComponent: () => <LandingWidget /> },
];

export const Performance = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="w-full">
            <div className="relative">
                <h1 className="font-bold text-white">Performance</h1>
                <Navbar className="absolute top-0 right-0" tabs={map(tabs, 'name')} onSelected={(activeIndex) => setActiveIndex(activeIndex)} />
            </div>
            <div className="mt-6">
                {tabs[activeIndex].renderComponent()}
            </div>
        </div>
    );
};
