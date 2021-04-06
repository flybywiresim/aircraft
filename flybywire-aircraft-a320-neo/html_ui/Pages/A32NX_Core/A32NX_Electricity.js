class A32NX_Electricity {
    constructor() {
        /**
         * Initialises the infinite battery to which buses that are powered are connected
         * to simulate availability of electricity.
         *
         * This function cannot be called on init, as the sim's default ELEC state seemingly hasn't
         * fully initialised by that point.
         *
         * Internally the function ensures it's cheap to execute by only retrieving sim variables
         * the first time it is called.
         */
        this.initialiseInfiniteBattery = () => {
            const infiniteBatteryNumber = 1;
            if (!SimVar.GetSimVarValue("A:ELECTRICAL MASTER BATTERY:" + infiniteBatteryNumber, "Bool")) {
                SimVar.SetSimVarValue("K:TOGGLE_MASTER_BATTERY", "Number", infiniteBatteryNumber);
            }

            this.initialiseInfiniteBattery = () => {};
        };
    }

    update() {
        this.initialiseInfiniteBattery();
    }
}
