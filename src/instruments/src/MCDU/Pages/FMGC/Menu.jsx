/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
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

import { useState, useEffect, useContext } from 'react';
import { BasePage, McduLabels, McduText } from '../Templates/BasePage.jsx';
import { RootContext } from '../../RootContext.jsx';

const MenuPage = () => {
    const [labels, setLabels] = useState(McduLabels);
    const [text, _] = useState(McduText);
    const [, , , setTitle] = useContext(RootContext);

    useEffect(() => {
        setTitle('MCDU MENU');
        setLabels((prevState) => ({
            ...prevState,
            L0: {
                ...prevState.L0,
                text: 'FMGC',
            },
            L1: {
                ...prevState.L3,
                text: 'ATSU',
            },
            L2: {
                ...prevState.L2,
                text: 'AIDS',
            },
            L3: {
                ...prevState.L1,
                text: 'CFDS',
            },
            L4: {
                ...prevState.L4,
                text: 'Return',
            },
        }));
    }, []);

    /**
     * TODO create event handlers
     * TODO create handling of scratchpad messages
     */

    return (
        <BasePage data={text} labels={labels} />
    );
};

export { MenuPage };
