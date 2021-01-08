import { useState } from 'react/cjs/react.production.min.js';
import { SpeedKnob } from '../Knobs/SpeedKnob.mjs';

const knob = new SpeedKnob();

export const Speed = () => {
    const [currentValue, setCurrentValue] = useState(knob.value);
    const [currentState, setCurrentState] = useState(knob.state);
    knob.registerCallbacks(setCurrentValue, setCurrentState);

    const windowValue = (currentState === 1) ? '---' : currentValue.toString().padStart(3, '0');

    return <div className="fcu-window">
        <svg>
            <text className="label active" x="15%" y="25%">SPD</text>
            <text className="label inactive" x="40%" y="25%">MACH</text>
            <text className="value active" x="18%" y="85%">{windowValue}</text>
            <circle className="inactive" r="1.5%" cx="16%" cy="82.5%" />
            <circle className="inactive" r="1.5%" cx="30%" cy="82.5%" />
            <circle className="inactive" r="1.5%" cx="44%" cy="82.5%" />
            <circle className={currentState === 0 ? 'inactive' : 'active'} r="7%" cx="73%" cy="62%" />
        </svg>
    </div>;
}
