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
import React, { useEffect, useState } from 'react';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { SLEW_KEYS } from 'instruments/src/MCDU/Components/Buttons';
import * as titlebarActions from '../../../redux/actions/titlebarActionCreators';

import InitAPage from './InitA';
import InitBPage from './InitB';

import { useInteractionEvent } from '../../../../Common/hooks';

type InitPageProps = {
    setTitlebar: Function,
}
const InitPage: React.FC<InitPageProps> = ({ setTitlebar }) => {
    const pages = {
        A: <InitAPage />,
        B: <InitBPage />,
    };
    const [currentPage, setCurrentPage] = useState('A');

    function determinePage() {
        if (currentPage === 'A') {
            return 'B';
        }
        return 'A';
    }

    useEffect(() => {
        setTitlebar('INIT');
    }, []);

    useInteractionEvent(SLEW_KEYS.RARROW, () => setCurrentPage(determinePage()));
    useInteractionEvent(SLEW_KEYS.LARROW, () => setCurrentPage(determinePage()));

    return pages[currentPage];
};

const mapDispatchToProps = (dispatch) => ({ setTitlebar: bindActionCreators(titlebarActions.setTitleBarText, dispatch) });
export default connect(null, mapDispatchToProps)(InitPage);
