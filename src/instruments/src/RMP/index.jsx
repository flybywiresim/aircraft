import ReactDOM from 'react-dom';
import { renderTarget } from '../util.js';
import './style.scss';

import { SevenSegmentDisplay } from './Components/SevenSegmentDisplay.jsx';
import SimVarProvider, { useSimVar } from '../Framework/SimVarProvider.tsx';

function RootInstrumentDisplay() {
    const [lightsTest] = useSimVar('L:XMLVAR_LTS_Test', 'Bool');
    const [toggleSwitch] = useSimVar('L:A32NX_RMP_L_TOGGLE_SWITCH', 'Bool');

    console.log("lightsTest: " + lightsTest);

    return (
        <div className="rmp-wrapper">
            <SevenSegmentDisplay type="string" value={toggleSwitch ? '123.455' : ''} lightsTest={lightsTest} />
            <SevenSegmentDisplay type="string" value={toggleSwitch ? '123.455' : ''} lightsTest={lightsTest} />
            {/* <RadioManagementPanel side="L" lightsTest={lightsTestStatefulSimVar.value} /> */}
            {/* <RadioManagementPanel side="R" lightsTest={lightsTestStatefulSimVar.value} /> */}
        </div>
    );
}

ReactDOM.render(<SimVarProvider><RootInstrumentDisplay /></SimVarProvider>, renderTarget);
