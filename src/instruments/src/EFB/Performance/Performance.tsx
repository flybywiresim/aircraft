import React, { useState } from 'react';
import { map } from 'lodash';

import { Navbar } from '../Components/Navbar';
import TODCalculator from '../TODCalculator/TODCalculator';
import LandingWidget from './Widgets/LandingWidget';

const tabs = [
    { name: 'Top of Descent', renderComponent: () => <TODCalculator /> },
    { name: 'Landing', renderComponent: () => <LandingWidget /> },
];

const Performance = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="w-full">
            <h1 className="text-3xl pt-6 text-white">Performance</h1>
            <Navbar tabs={map(tabs, 'name')} onSelected={(activeIndex) => setActiveIndex(activeIndex)} />
            <div className="px-6 pt-2">
                {tabs[activeIndex].renderComponent()}
            </div>
        </div>
    );
};

export default Performance;
