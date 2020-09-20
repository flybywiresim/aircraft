const A32NX_Util = {};

A32NX_Util.createDeltaTimeCalculator = (startTime) => {
  let lastTime = startTime;

  return () => {
    const nowTime = Date.now();
    const deltaTime = nowTime - lastTime;
    lastTime = nowTime;

    return deltaTime;
  };
};
