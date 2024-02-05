let values;

global.beforeEach(() => {
    values = {};
});

global.SimVar = {};
global.SimVar.GetSimVarValue = jest.fn((name, _, __) => {
    if (Object.prototype.hasOwnProperty.call(values, name)) {
        return values[name];
    }
    return 0;
});
global.SimVar.SetSimVarValue = jest.fn((name, _, value, __) => new Promise((resolve, _) => {
    values[name] = value;
    resolve();
}));
