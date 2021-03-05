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

import React from 'react';
import { IconUser } from '@tabler/icons';
import Input from '../Components/Form/Input/Input';

type CompanyProps = {
    simbriefUsername: string,
    changeSimbriefUsername: Function,
}

const Company = (props: CompanyProps) => (
    <div className="flex p-6 w-full">
        <div className="w-4/12 mr-4">
            <h1 className="text-white font-medium ml-2 mb-4 text-xl">Simbrief</h1>

            <Input
                label="Username"
                type="text"
                value={props.simbriefUsername}
                onChange={(value) => props.changeSimbriefUsername(value)}
                leftComponent={<IconUser color="white" size={35} />}
            />
        </div>
    </div>
);

export default Company;
