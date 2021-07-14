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
import { titleBarState } from '../redux/reducers/titlebarReducer';

import './styles.scss';
import '../Components/styles.scss';

type titlebarProps = {
    titlebar: titleBarState
}
/**
 * @todo figure out a way to do split colors on the titlebar
 */
const Titlebar: React.FC<titlebarProps> = ({ titlebar }) => (
    <div className="title">
        <p />
        <p className={`${titlebar.orientation} ${titlebar.color}`}>{titlebar.text}</p>
        <p />
    </div>
);

const mapStateToProps = ({ titlebar }) => ({ titlebar });
export default connect(mapStateToProps)(Titlebar);
