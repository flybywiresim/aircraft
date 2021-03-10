const REFUEL_FACTOR = 1;

class A32NX_Refuel {
    constructor() {}

    init() { }

    defuelTank(multiplier) {
        return -REFUEL_FACTOR * multiplier;
    }
    refuelTank(multiplier) {
        return REFUEL_FACTOR * multiplier;
    }

    update(_deltaTime) {
        const gs = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
        if (gs > 0.1) {
            return;
        }
        const onGround = SimVar.GetSimVarValue("SIM ON GROUND", "Bool");
        const eng1Running = SimVar.GetSimVarValue("ENG COMBUSTION:1", "Bool");
        const eng2Running = SimVar.GetSimVarValue("ENG COMBUSTION:2", "Bool");
        if (!onGround || eng1Running || eng2Running) {
            return;
        }
        const refuelRate = SimVar.GetSimVarValue("L:A32NX_REFUEL_RATE_SETTING", "Number");
        const centerTarget = SimVar.GetSimVarValue("L:A32NX_FUEL_CENTER_DESIRED", "Number");
        const LInnTarget = SimVar.GetSimVarValue("L:A32NX_FUEL_LEFT_MAIN_DESIRED", "Number");
        const LOutTarget = SimVar.GetSimVarValue("L:A32NX_FUEL_LEFT_AUX_DESIRED", "Number");
        const RInnTarget = SimVar.GetSimVarValue("L:A32NX_FUEL_RIGHT_MAIN_DESIRED", "Number");
        const ROutTarget = SimVar.GetSimVarValue("L:A32NX_FUEL_RIGHT_AUX_DESIRED", "Number");
        const centerCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons");
        const LInnCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons");
        const LOutCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK LEFT AUX QUANTITY", "Gallons");
        const RInnCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons");
        const ROutCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK RIGHT AUX QUANTITY", "Gallons");
        let centerCurrent = Math.round(centerCurrentSimVar);
        let LInnCurrent = Math.round(LInnCurrentSimVar);
        let LOutCurrent = Math.round(LOutCurrentSimVar);
        let RInnCurrent = Math.round(RInnCurrentSimVar);
        let ROutCurrent = Math.round(ROutCurrentSimVar);
        if (refuelRate == 2) {
            SimVar.SetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons", centerTarget);
            SimVar.SetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons", LInnTarget);
            SimVar.SetSimVarValue("FUEL TANK LEFT AUX QUANTITY", "Gallons", LOutTarget);
            SimVar.SetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons", RInnTarget);
            SimVar.SetSimVarValue("FUEL TANK RIGHT AUX QUANTITY", "Gallons", ROutTarget);
            return;
        }
        let multiplier = 1 * REFUEL_FACTOR;
        if (refuelRate == 1) {
            multiplier = 5 * REFUEL_FACTOR;
        }
        SimVar.SetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons", (centerCurrent - 1));
        //DEFUELING (center tank first, then main, then aux)
        if (centerCurrent > centerTarget) {
            centerCurrent += defuelTank(multiplier);
            if (centerCurrent < centerTarget) {
                centerCurrent = centerTarget;
            }
            SimVar.SetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons", centerCurrent);
            if (centerCurrent != centerTarget) {
                return;
            }
        }
        if (LInnCurrent > LInnTarget || RInnCurrent > RInnTarget) {
            LInnCurrent += defuelTank(multiplier);
            RInnCurrent += defuelTank(multiplier);
            if (LInnCurrent < LInnTarget) {
                LInnCurrent = LInnTarget;
            }
            if (RInnCurrent < RInnTarget) {
                RInnCurrent = RInnTarget;
            }
            SimVar.SetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons", RInnTarget);
            SimVar.SetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons", LInnTarget);
            if (LInnCurrent != LInnTarget || RInnCurrent != RInnTarget) {
                return;
            }
        }
        if (LOutCurrent > LOutTarget || ROutCurrent > ROutTarget) {
            LOutCurrent += defuelTank(multiplier);
            ROutCurrent += defuelTank(multiplier);
            if (LOutCurrent < LOutTarget) {
                LOutCurrent = LOutTarget;
            }
            if (ROutCurrent < ROutTarget) {
                ROutCurrent = ROutTarget;
            }
            SimVar.SetSimVarValue("FUEL TANK RIGHT AUX QUANTITY", "Gallons", ROutTarget);
            SimVar.SetSimVarValue("FUEL TANK LEFT AUX QUANTITY", "Gallons", LOutTarget);
            if (LOutCurrent != LOutTarget || ROutCurrent != ROutTarget) {
                return;
            }
        }
        // REFUELING (aux first, then main, then center tank)
        if (LOutCurrent < LOutTarget || ROutCurrent < ROutTarget) {
            LOutCurrent += refuelTank(multiplier);
            ROutCurrent += refuelTank(multiplier);
            if (LOutCurrent > LOutTarget) {
                LOutCurrent = LOutTarget;
            }
            if (ROutCurrent > ROutTarget) {
                ROutCurrent = ROutTarget;
            }
            SimVar.SetSimVarValue("FUEL TANK RIGHT AUX QUANTITY", "Gallons", ROutTarget);
            SimVar.SetSimVarValue("FUEL TANK LEFT AUX QUANTITY", "Gallons", LOutTarget);
            if (LOutCurrent != LOutTarget || ROutCurrent != ROutTarget) {
                return;
            }
        }
        if (LInnCurrent < LInnTarget || RInnCurrent < RInnTarget) {
            LInnCurrent += refuelTank(multiplier);
            RInnCurrent += refuelTank(multiplier);
            if (LInnCurrent > LInnTarget) {
                LInnCurrent = LInnTarget;
            }
            if (RInnCurrent > RInnTarget) {
                RInnCurrent = RInnTarget;
            }
            SimVar.SetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons", RInnTarget);
            SimVar.SetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons", LInnTarget);
            if (LInnCurrent != LInnTarget || RInnCurrent != RInnTarget) {
                return;
            }
        }
        if (centerCurrent < centerTarget) {
            centerCurrent += refuelTank(multiplier);
            if (centerCurrent > centerTarget) {
                centerCurrent = centerTarget;
            }
            SimVar.SetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons", centerCurrent);
            if (centerCurrent != centerTarget) {
                return;
            }
        }
    }
}
