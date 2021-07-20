/* global jest */
let values;

global.beforeEach(() => {
    values = {};
});

global.SimVar = {};
global.SimVar.GetSimVarValue = jest.fn((name, unit, dataSource) => {
    return values[name];
});
global.SimVar.SetSimVarValue = jest.fn((name, unit, value, dataSource) => {
    values[name] = value;
});
