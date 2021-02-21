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

type LoadsheetPageProps = {
    loadsheet: string
};

const LoadSheetWidget = (props: LoadsheetPageProps) => (
    <div className="px-6">
        <div className="w-full">
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-y-scroll" dangerouslySetInnerHTML={{ __html: props.loadsheet }} />
        </div>
    </div>
);

export default LoadSheetWidget;
