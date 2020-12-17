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
import React, { useContext, useEffect, useState } from 'react';
import { InitAPage } from './InitA';
import { InitBPage } from './InitB';
import { RootContext } from '../../../RootContext';
import { useInteractionEvent } from '../../../../Common/hooks';
import { slewKeys } from '../../../Components/Buttons';

const InitPage: React.FC = () => {
    const pages = {
        A: <InitAPage />,
        B: <InitBPage />,
    };
    const [currentPage, setCurrentPage] = useState('A');
    const [, , , setTitle] = useContext(RootContext);

    function determinePage() {
        if (currentPage === 'A') {
            return 'B';
        }
        return 'A';
    }

    useEffect(() => {
        setTitle('INIT');
    }, []);

    useInteractionEvent(slewKeys.right, () => {
        setCurrentPage(determinePage());
    });

    useInteractionEvent(slewKeys.left, () => {
        setCurrentPage(determinePage());
    });

    return pages[currentPage];
};

export { InitPage };
