import React, { useState } from 'react';
import { map } from 'lodash';

import { Navbar } from '../Components/Navbar';
import TODCalculator from '../TODCalculator/TODCalculator';

const tabs = [
    { name: 'TOD Calculator', renderComponent: () => <TODCalculator /> },
];

const Performance = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="w-full">
            <Navbar tabs={map(tabs, 'name')} onSelected={(activeIndex) => setActiveIndex(activeIndex)} />
            <div>
                {tabs[activeIndex].renderComponent()}
            </div>
        </div>
    );
};

export default Performance;
