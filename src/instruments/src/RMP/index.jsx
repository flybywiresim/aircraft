import ReactDOM from 'react-dom';
import { renderTarget } from '../util.mjs';
import './style.scss';

import { useState } from 'react/cjs/react.production.min.js';
import { RadioManagementPanel as RMP } from './RadioManagementPanel.mjs';

const rmp = new RMP();

function RadioManagementPanel() {
    const [data, setData] = useState(rmp.data);
    rmp.registerCallbacks(setData);

    return <div className="rnp-wrapper">
        <svg>
            <text x="100%" y="60%">{data.active}</text>
        </svg>
        <svg>
            <text x="100%" y="60%">{data.standby}</text>
        </svg>
        <svg>
            <text x="100%" y="60%">888.888</text>
        </svg>
        <svg>
            <text x="100%" y="60%">888.888</text>
        </svg>
    </div>
}

ReactDOM.render(<RadioManagementPanel />, renderTarget);
