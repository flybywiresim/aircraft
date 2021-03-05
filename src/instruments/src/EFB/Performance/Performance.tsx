import React, { useState } from 'react';
import { map } from 'lodash';

import { Navbar } from '../Components/Navbar';
import TODCalculator from '../TODCalculator/TODCalculator';

const tabs = [
    { name: 'Top of Descent', renderComponent: () => <TODCalculator /> },
];

const Performance = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="w-full">
            <h1 className="text-3xl pt-6 text-white">Performance</h1>
            <Navbar tabs={map(tabs, 'name')} onSelected={(activeIndex) => setActiveIndex(activeIndex)} />
            <div>
                {tabs[activeIndex].renderComponent()}
            </div>
        </div>
    );
};

export default Performance;
