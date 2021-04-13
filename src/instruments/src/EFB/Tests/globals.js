/* eslint-disable */

const simvars = {
    'ATC FLIGHT NUMBER': 'AB123',
    'GPS POSITION LAT': 0,
    'L:APU_GEN_ONLINE': false,
    'EXTERNAL POWER AVAILABLE:1': false,
    'EXTERNAL POWER ON': false,
    'L:A32NX_COLD_AND_DARK_SPAWN': true,
};

function triggerSimVarUpdate() {
    console.log('New Simvars 🍔', simvars);
    const parent = document.getElementById('parent');
    const event = new CustomEvent('update');
    parent.dispatchEvent(event);
}

Simplane = {
    getEngineActive(_) {
        return false;
    },
};

SimVar = {
    GetSimVarValue(s) {
        const result = simvars[s];
        console.log(`🍙 Returning Simvar ${s} = ${result}`);
        return result;
    },
};

setTimeout(() => {
    simvars['EXTERNAL POWER ON'] = true;
    simvars['EXTERNAL POWER AVAILABLE:1'] = true;
    triggerSimVarUpdate();
}, 500);
