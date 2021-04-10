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

import './Status.scss';
import ReactDOM from 'react-dom';
import React from 'react';
import { getRenderTarget, setIsEcamPage } from '../../../Common/defaults';
import { SimVarProvider, useSimVar } from '../../../Common/simVars';

setIsEcamPage('status_page');

export const StatusPage = () => {
    const [cabin] = useSimVar('INTERACTIVE POINT OPEN:0', 'percent', 1000);
    const [catering] = useSimVar('INTERACTIVE POINT OPEN:3', 'percent', 1000);
    const [cargo] = useSimVar('INTERACTIVE POINT OPEN:5', 'percent', 1000);
    const [oxygen] = useSimVar('L:PUSH_OVHD_OXYGEN_CREW', 'bool', 1000);
    const [slides] = useSimVar('L:A32NX_SLIDES_ARMED', 'bool', 1000);

    return (
        <>
            {/* This is already in an svg so we should remove the containing one - TODO remove style once we are not in the Asobo ECAM */}
            <svg id="status-page" viewBox="0 0 600 600" style={{ marginTop: '-60px' }} xmlns="http://www.w3.org/2000/svg">
                <text className="PageTitle" x="300" y="15">STATUS</text>
                <line className="Separator" x1="375" y1="65" x2="375" y2="465" />
                <text id="inop-sys-title" className="PageTitle" x="490" y="75" visibility="hidden">INOP SYS</text>
                <text id="status-normal" className="InfoIndication" x="175" y="250">NORMAL</text>
            </svg>

        </>
    );
};

ReactDOM.render(<SimVarProvider><StatusPage /></SimVarProvider>, getRenderTarget());
