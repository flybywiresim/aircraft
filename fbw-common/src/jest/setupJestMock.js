let values;

global.beforeEach(() => {
  values = {};
});

global.SimVar = {};
global.SimVar.GetSimVarValue = jest.fn((name, _, __) => {
  if (Object.prototype.hasOwnProperty.call(values, name)) {
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

global.Facilities = {
  getMagVar(_lat, _lon) {
    return 0; // FIXME ship magnetic model
  },
};
