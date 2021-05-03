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
    const inopArray = [
        { id: 'G_HYD', id2: 'Y_HYD', message: 'G+Y HYD' },
        { id: 'R_AIL', id2: '', message: 'R AIL' },
        { id: 'IR_2', id2: 'IR_3', message: 'IR 2+3' },
        { id: 'ELAC_2', id2: '', message: 'ELAC 2' },
        { id: 'YAW_DAMPER', id2: '', message: 'YAW DAMPER' },
        { id: 'ATHR', id2: '', message: 'A/THR' },
        { id: 'LG_RETRACT', id2: '', message: 'L/G RETRACT' },
        { id: 'FCTL_PROT', id2: '', message: 'F/CTL PROT' },
        { id: 'REVERSER_1', id2: 'REVERSER_2', message: 'REVERSER 1+2' },
        { id: 'RA_1', id2: 'RA_2', message: 'RA 1+2' },
        { id: 'SEC_2', id2: 'SEC_3', message: 'SEC 2+3' },
        { id: 'ACALL_OUT', id2: '', message: 'A/CALL OUT' },
        { id: 'FUEL_PUMPS', id2: '', message: 'FUEL PUMPS' },
        { id: 'CAP_PR_1', id2: 'CAP_PR_2', message: 'CAP PR 1+2' },
        { id: 'STABILIZER', id2: '', message: 'STABILISER' },
        { id: 'ADR_2', id2: 'ADR_3', message: 'ADR 2+3' },
        { id: 'SPOILER_1245', id2: '', message: 'SPOILER 1+2+4+5' },
        { id: 'FLAPS', id2: '', message: 'FLAPS' },
        { id: 'AP_1', id2: 'AP_2', message: 'AP 1+2' },
        { id: 'WING_A_ICE', id2: '', message: 'WING A.ICE' },
        { id: 'CAT_3', id2: '', message: 'CAT 3' },
        { id: 'CAT_3_DUAL', id2: '', message: 'CAT 3 DUAL' },
        { id: 'ENG_2_BLEED', id2: '', message: 'ENG 2 BLEED' },
        { id: 'PACK_1', id2: '', message: 'PACK 1' },
        { id: 'PACK_2', id2: '', message: 'PACK 2' },
        { id: 'PACK_1', id2: 'PACK_2', message: 'PACK 1+2' },
        { id: 'MAIN GALLEY', id2: '', message: 'MAIN_GALLEY' },
        { id: 'Y_ENGINE_2_PUMP', id2: '', message: 'Y ENGINE 2 PUMP' },
        { id: 'G_ENGINE_1_PUMP', id2: '', message: 'G ENGINE 1 PUMP' },
        { id: 'TCAS', id2: '', message: 'TCAS' },
        { id: 'ANTI_SKID', id2: '', message: 'ANTI SKID' },
        { id: 'NS_STEER', id2: '', message: 'N/W STRG' },
        { id: 'NORM_BRK', id2: '', message: 'NORM BRK' },
        { id: 'ALTN_BRK', id2: '', message: 'ALTN BRK' },
        { id: 'AUTO_BRK', id2: '', message: 'AUTO BRK' },
        { id: 'APU', id2: '', message: 'APU' },
    ];

    const inopSimVars = inopArray.map((inop) => ({
        id: inop.id,
        value: inop.id2 === '' ? useSimVar(`L:A32NX_ECAM_INOP_SYS_${inop.id}`, 'bool', 1000)
            : useSimVar(`L:A32NX_ECAM_INOP_SYS_${inop.id}`, 'bool', 1000) && useSimVar(`L:A32NX_ECAM_INOP_SYS_${inop.id2}`, 'bool', 1000),
    }));

    inopSimVars.map((x) => console.log(`${x.id} has a value of ${x.value}`));

    return (
        <>
            {/* This is already in an svg so we should remove the containing one - TODO remove style once we are not in the Asobo ECAM */}
            <svg id="ecam-status-page" viewBox="0 0 600 600" style={{ marginTop: '-60px' }} xmlns="http://www.w3.org/2000/svg">
                <text id="PageTitle" className="Title" x="300" y="16" alignmentBaseline="central">STATUS</text>

                <line className="Separator" x1="375" y1="65" x2="375" y2="465" />
                <text id="inop-sys-title" className="SubTitle hide" x="470" y="75">INOP SYS</text>
                <text id="status-normal" className="InfoIndication" x="160" y="250">NORMAL</text>
            </svg>

        </>
    );
};

ReactDOM.render(<SimVarProvider><StatusPage /></SimVarProvider>, getRenderTarget());
