/* global jest */
let values;

global.beforeEach(() => {
    values = {};
    global.SimVar = {};
    // MSFS SDK overrides those with a custom implementation, hence need to recreate it before every test
    global.SimVar.GetSimVarValue = jest.fn((name, _, __) => {
        if (values.hasOwnProperty(name)) {
            return values[name];
        } else {
            return 0;
        }
});

global.SimVar.SetSimVarValue = jest.fn((name, _, value, __) => {
    return new Promise((resolve, _) => {
        values[name] = value;
        resolve();
    });
});

});

global.SimVar = {};
global.SimVar.GetSimVarValue = jest.fn((name, _, __) => {
    if (values.hasOwnProperty(name)) {
        return values[name];
    } else {
        return 0;
    }
});

global.SimVar.SetSimVarValue = jest.fn((name, _, value, __) => {
    return new Promise((resolve, _) => {
        values[name] = value;
        resolve();
    });
});



global.RunwayDesignator = jest.mock();
global.Avionics = jest.mock();
global.Avionics = jest.mock();
global.Simplane = jest.mock();
global.Simplane.getIsGrounded = jest.fn();
global.Simplane.getEngineThrottleMode = jest.fn();
global.ThrottleMode = jest.mock();
global.Simplane.getAltitude = jest.fn();
global.Simplane.getGroundSpeed = jest.fn();

global.Avionics.Utils = jest.mock();
global.document = jest.mock();
global.document.getElementById = jest.fn();
global.GetStoredData = jest.fn(() => "hi");
global.BaseInstrument = jest.fn();
