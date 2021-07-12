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
import React from 'react';
import { connect } from 'react-redux';
import { scratchpadState } from '../redux/reducers/scratchpadRedcuer';

import './styles.scss';
import '../Components/styles.scss';

type ScratchpadProps = {
    scratchpad: scratchpadState
}
const Scratchpad: React.FC<ScratchpadProps> = ({ scratchpad }) => (
    <div className="scratchpad">
        <p className="scratchpad-input">{scratchpad.text}</p>
        <p className="scratchpad-arrow line-right">{'{}'}</p>
    </div>
);
const mapStateToProps = ({ scratchpad }) => ({ scratchpad });
export default connect(mapStateToProps)(Scratchpad);
