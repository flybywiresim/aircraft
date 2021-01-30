import ReactDOM from 'react-dom';
import { renderTarget } from '../util.mjs';
import './style.scss';

import { StatefulSimVar } from './Framework/StatefulSimVar.mjs';
import { RadioManagementPanel } from './Components/RadioManagementPanel.jsx';

function RootInstrumentDisplay() {
    const lightsTestStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'L:XMLVAR_LTS_Test',
        simVarUnit: 'Bool',
        refreshRate: 250,
    });

    return (
        <div className="rmp-wrapper">
            <RadioManagementPanel side="L" lightsTest={lightsTestStatefulSimVar.value} />
            <RadioManagementPanel side="R" lightsTest={lightsTestStatefulSimVar.value} />
        </div>
    );
}

ReactDOM.render(<RootInstrumentDisplay />, renderTarget);
