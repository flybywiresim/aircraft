import ReactDOM from 'react-dom';
import { renderTarget } from '../util.mjs';
import './style.scss';
import { useState } from 'react/cjs/react.production.min.js';
import { RadioManagementPanelPair } from './RadioManagementPanel.mjs';


const radioManagementPanelPair = new RadioManagementPanelPair();

function RadioManagementPanelDisplay() {
    const [frequencies, setFrequencies] = useState(radioManagementPanelPair.frequencies);
    radioManagementPanelPair.registerCallbacks(setFrequencies);

    return <div className="rnp-wrapper">
        <svg>
            <text x="100%" y="60%">{frequencies.left.active}</text>
        </svg>
        <svg>
            <text x="100%" y="60%">{frequencies.left.standby}</text>
        </svg>
        <svg>
            <text x="100%" y="60%">{frequencies.right.active}</text>
        </svg>
        <svg>
            <text x="100%" y="60%">{frequencies.right.standby}</text>
        </svg>
    </div>
}

ReactDOM.render(<RadioManagementPanelDisplay />, renderTarget);
