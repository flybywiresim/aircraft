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

import { useInteractionEvent } from '@instruments/common/hooks';

import { bindActionCreators } from 'redux';
import { scratchpadState } from '../redux/reducers/scratchpadReducer';
import * as scratchpadActions from '../redux/actions/scratchpadActionCreators';

import './styles.scss';
import '../Components/styles.scss';
import { ALPHABET_KEYS, NUMPAD_KEYS } from '../Components/Buttons';

type ScratchpadProps = {
    scratchpad: scratchpadState
    addToScratchpad: Function,
    addPlusMinus: Function,
    clearScratchpadCharacter: Function,
}
const Scratchpad: React.FC<ScratchpadProps> = ({ scratchpad, addToScratchpad, addPlusMinus, clearScratchpadCharacter }) => {
    /* START OF SCRATCHPAD INTERACTIONS */

    // ALphabet
    useInteractionEvent(ALPHABET_KEYS.A, () => addToScratchpad('A'));
    useInteractionEvent(ALPHABET_KEYS.B, () => addToScratchpad('B'));
    useInteractionEvent(ALPHABET_KEYS.C, () => addToScratchpad('C'));
    useInteractionEvent(ALPHABET_KEYS.D, () => addToScratchpad('D'));
    useInteractionEvent(ALPHABET_KEYS.E, () => addToScratchpad('E'));
    useInteractionEvent(ALPHABET_KEYS.F, () => addToScratchpad('F'));
    useInteractionEvent(ALPHABET_KEYS.G, () => addToScratchpad('G'));
    useInteractionEvent(ALPHABET_KEYS.H, () => addToScratchpad('H'));
    useInteractionEvent(ALPHABET_KEYS.I, () => addToScratchpad('I'));
    useInteractionEvent(ALPHABET_KEYS.J, () => addToScratchpad('J'));
    useInteractionEvent(ALPHABET_KEYS.K, () => addToScratchpad('K'));
    useInteractionEvent(ALPHABET_KEYS.L, () => addToScratchpad('L'));
    useInteractionEvent(ALPHABET_KEYS.M, () => addToScratchpad('M'));
    useInteractionEvent(ALPHABET_KEYS.N, () => addToScratchpad('N'));
    useInteractionEvent(ALPHABET_KEYS.O, () => addToScratchpad('O'));
    useInteractionEvent(ALPHABET_KEYS.P, () => addToScratchpad('P'));
    useInteractionEvent(ALPHABET_KEYS.Q, () => addToScratchpad('Q'));
    useInteractionEvent(ALPHABET_KEYS.R, () => addToScratchpad('R'));
    useInteractionEvent(ALPHABET_KEYS.S, () => addToScratchpad('S'));
    useInteractionEvent(ALPHABET_KEYS.T, () => addToScratchpad('T'));
    useInteractionEvent(ALPHABET_KEYS.U, () => addToScratchpad('U'));
    useInteractionEvent(ALPHABET_KEYS.V, () => addToScratchpad('V'));
    useInteractionEvent(ALPHABET_KEYS.W, () => addToScratchpad('W'));
    useInteractionEvent(ALPHABET_KEYS.X, () => addToScratchpad('X'));
    useInteractionEvent(ALPHABET_KEYS.Y, () => addToScratchpad('Y'));
    useInteractionEvent(ALPHABET_KEYS.Z, () => addToScratchpad('Z'));

    // Numbers
    useInteractionEvent(NUMPAD_KEYS.ZERO, () => addToScratchpad('0'));
    useInteractionEvent(NUMPAD_KEYS.ONE, () => addToScratchpad('1'));
    useInteractionEvent(NUMPAD_KEYS.TWO, () => addToScratchpad('2'));
    useInteractionEvent(NUMPAD_KEYS.THREE, () => addToScratchpad('3'));
    useInteractionEvent(NUMPAD_KEYS.FOUR, () => addToScratchpad('4'));
    useInteractionEvent(NUMPAD_KEYS.FIVE, () => addToScratchpad('5'));
    useInteractionEvent(NUMPAD_KEYS.SIX, () => addToScratchpad('6'));
    useInteractionEvent(NUMPAD_KEYS.SEVEN, () => addToScratchpad('7'));
    useInteractionEvent(NUMPAD_KEYS.EIGHT, () => addToScratchpad('8'));
    useInteractionEvent(NUMPAD_KEYS.NINE, () => addToScratchpad('9'));

    // Modifiers
    useInteractionEvent(ALPHABET_KEYS.DOT, () => addToScratchpad('.'));
    useInteractionEvent(ALPHABET_KEYS.PLUSMINUS, () => addPlusMinus());
    useInteractionEvent(ALPHABET_KEYS.DIV, () => addToScratchpad('/'));
    useInteractionEvent(ALPHABET_KEYS.CLR, () => clearScratchpadCharacter('CLR'));

    // Disabled
    // useInteractionEvent(ALPHABET_KEYS.OVFY, () => addToScratchpad('OVFY'));
    // useInteractionEvent(ALPHABET_KEYS.SP, () => addToScratchpad('SP'));

    /* END OF SCRATCHPAD INTERACTIONS */

    return (
        <div className="scratchpad">
            <p className={`scratchpad-input ${scratchpad.currentColor}`}>{scratchpad.currentMessage}</p>
            <p className="scratchpad-arrow line-right">{scratchpad.arrow}</p>
        </div>
    );
};
const mapStateToProps = ({ scratchpad }) => ({ scratchpad });
const mapDispatchToProps = (dispatch) => ({
    addToScratchpad: bindActionCreators(scratchpadActions.addToScratchpad, dispatch),
    addPlusMinus: bindActionCreators(scratchpadActions.addPlusMinus, dispatch),
    clearScratchpadCharacter: bindActionCreators(scratchpadActions.clearScratchpadCharacter, dispatch),
});
export default connect(mapStateToProps, mapDispatchToProps)(Scratchpad);
