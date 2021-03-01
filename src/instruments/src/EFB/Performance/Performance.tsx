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
