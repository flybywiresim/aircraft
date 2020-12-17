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
import React, { useState } from 'react';
import { InitPage } from './FMGC/Init/Init';
import MenuPage from './FMGC/Menu/Menu';
import { useInteractionEvent } from '../../Common/hooks';
import IdentPage from './FMGC/Ident/Ident';

const PagesContainer = () => {
    const [currentPage, setCurrentPage] = useState('MENU');
    const pages = {
        INIT: <InitPage />,
        MENU: <MenuPage setPage={setCurrentPage} />,
        IDENT: <IdentPage />,
    };

    useInteractionEvent('A32NX_MCDU_L_INIT_BUTTON_PRESSED', () => setCurrentPage('INIT'));
    useInteractionEvent('A32NX_MCDU_L_MENU_BUTTON_PRESSED', () => setCurrentPage('MENU'));

    return pages[currentPage];
};

export default PagesContainer;
