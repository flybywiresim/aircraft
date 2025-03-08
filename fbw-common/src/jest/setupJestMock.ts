import { vitest, beforeEach } from 'vitest';

let values;

beforeEach(() => {
  values = {};
});

global.Coherent = {
  on: () => ({
    clear() {},
  }),
  call: async <T>() => new Promise<T>(() => {}),
};

global.RegisterViewListener = () => ({
  call() {},
  triggerToAllSubscribers: () => {},
});

global.RegisterGenericDataListener = () => ({
  send() {},
});

global.GetStoredData = () => '';
global.SetStoredData = () => {};

global.simvar = {
  getValueReg: () => 0,
};
global.SimVar = {};
global.SimVar.GetRegisteredId = () => 0;
global.SimVar.GetSimVarValue = vitest.fn((name, _, __) => {
  if (Object.prototype.hasOwnProperty.call(values, name)) {
    return values[name];
  } else {
    return 0;
  }
});

global.SimVar.SetSimVarValue = vitest.fn((name, _, value, __) => {
  return new Promise<void>((resolve, _) => {
    values[name] = value;
    resolve();
  });
});

global.Facilities = {
  getMagVar(_lat, _lon) {
    return 0; // FIXME ship magnetic model
  },
};

global.BaseInstrument = class {};

global.Avionics = {
  Utils: {
    DEG2RAD: Math.PI / 180,
  },
};

global.RunwayDesignator = {
  RUNWAY_DESIGNATOR_NONE: 0,
  RUNWAY_DESIGNATOR_LEFT: 1,
  RUNWAY_DESIGNATOR_RIGHT: 2,
  RUNWAY_DESIGNATOR_CENTER: 3,
  RUNWAY_DESIGNATOR_WATER: 4,
  RUNWAY_DESIGNATOR_A: 5,
  RUNWAY_DESIGNATOR_B: 6,
};
