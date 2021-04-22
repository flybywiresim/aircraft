class A32NX_Electricity {
    constructor() {
        this.batteryOnDuration = 0;
        /**
         * Initialises the infinite battery to which buses that are powered are connected
         * to simulate availability of electricity.
         *
         * Depending on the loading order in the simulator, this function is sometimes
         * called too early, causing the battery to not be on despite turning it on.
         * Therefore, we check if the infinite battery is on for at least a whole minute
         * before stopping this initialisation.
         */
        this.initialiseInfiniteBattery = (deltaTime) => {
            const infiniteBatteryNumber = 1;
            if (!this.batteryIsOn(infiniteBatteryNumber)) {
                this.batteryOnDuration = 0;
                this.turnBatteryOn(infiniteBatteryNumber);
            } else {
                this.batteryOnDuration += deltaTime;
            }

            const oneMinute = 60000;
            if (this.batteryOnDuration >= oneMinute) {
                this.initialiseInfiniteBattery = () => {};
            }
        };
    }

    update(deltaTime) {
        this.initialiseInfiniteBattery(deltaTime);
    }

    batteryIsOn(number) {
        return !!SimVar.GetSimVarValue("A:ELECTRICAL MASTER BATTERY:" + number, "Bool");
    }

    turnBatteryOn(number) {
        SimVar.SetSimVarValue("K:TOGGLE_MASTER_BATTERY", "Number", number);
    }
}
