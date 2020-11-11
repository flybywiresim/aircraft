(function () {
    const originalGetSimVarValue = SimVar.GetSimVarValue;

    // Uncomment one of the lines below to switch to that form of SimVar usage.
    // It will activate 10 seconds after the panel comes "online", so that any startup logic that must affect
    // the sim's SimVars can still run.

    // setTimeout(useInMemoryStorage, 10000);
    // setTimeout(useLocalStorage, 10000);

    function useInMemoryStorage() {
        const simvarValues = {};
        SimVar.GetSimVarValue = function (name, unit, dataSource = "") {
            if (simvarValues[name] !== undefined) {
                return simvarValues[name];
            } else {
                const value = originalGetSimVarValue(name, unit, dataSource);
                simvarValues[name] = value;

                return value;
            }
        };

        SimVar.SetSimVarValue = function SetSimVarValue(name, unit, value, dataSource = "") {
            simvarValues[name] = value;
        };
    }

    function useLocalStorage() {
        SimVar.GetSimVarValue = function (name, unit, dataSource = "") {
            const item = localStorage.getItem(name);
            if (item !== null) {
                switch (unit) {
                    case "Text":
                    case "string":
                        return item;
                    default:
                        return Number(item);
                }
                return item;
            } else {
                const value = originalGetSimVarValue(name, unit, dataSource);
                localStorage.setItem(name, value);

                return value;
            }
        };

        SimVar.SetSimVarValue = function SetSimVarValue(name, unit, value, dataSource = "") {
            localStorage.setItem(name, value);
        };
    }
})();