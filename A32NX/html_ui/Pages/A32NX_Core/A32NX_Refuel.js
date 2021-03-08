const REFUEL_FACTOR = 0.0001;

class A32NX_Refuel {
    constructor() {}

    init() { }

    refuelOrDefuelTank(current, target, multiplier) {
        if (target > current) {
            current += REFUEL_FACTOR * multiplier;
            if (current > target) {
                current = target;
            }
        }
        if (target < current) {
            current -= REFUEL_FACTOR * multiplier;
            if (current < target) {
                current = target;
            }
        }
        return current;
    }
    defuelTank(current, target, multiplier) {
        current -= REFUEL_FACTOR * multiplier;
        if (current < target) {
            current = target;
        }
        return current;
    }
    refuelTank(current, target, multiplier) {
        current += REFUEL_FACTOR * multiplier;
        if (current > target) {
            current = target;
        }
        return current;
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
        const centerTarget = SimVar.GetSimVarValue("FUEL TANK CENTER DESIRED", "Gallons");
        const LInnTarget = SimVar.GetSimVarValue("FUEL TANK LEFT MAIN DESIRED", "Gallons");
        const LOutTarget = SimVar.GetSimVarValue("FUEL TANK LEFT AUX DESIRED", "Gallons");
        const RInnTarget = SimVar.GetSimVarValue("FUEL TANK RIGHT MAIN DESIRED", "Gallons");
        const ROutTarget = SimVar.GetSimVarValue("FUEL TANK RIGHT AUX DESIRED", "Gallons");
        const centerCurrent = SimVar.GetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons");
        const LInnCurrent = SimVar.GetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons");
        const LOutCurrent = SimVar.GetSimVarValue("FUEL TANK LEFT AUX QUANTITY", "Gallons");
        const RInnCurrent = SimVar.GetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons");
        const ROutCurrent = SimVar.GetSimVarValue("FUEL TANK RIGHT AUX QUANTITY", "Gallons");
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
        //DEFUELING (center tank first, then main, then aux)
        if (centerCurrent > centerTarget) {
            centerCurrent = defuelTank(centerCurrent, centerTarget, multiplier);
            SimVar.SetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons", centerCurrent);
            if (centerCurrent != centerTarget) {
                return;
            }
        }
        if (LInnCurrent > LInnTarget || RInnCurrent > RInnTarget) {
            LInnCurrent = defuelTank(LInnCurrent, LInnTarget, multiplier);
            RInnCurrent = defuelTank(RInnCurrent, RInnTarget, multiplier);
            SimVar.SetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons", RInnTarget);
            SimVar.SetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons", LInnTarget);
            if (LInnCurrent != LInnTarget || RInnCurrent != RInnTarget) {
                return;
            }
        }
        //REFUELING OR DEFUELING FOR AUX TANKS
        LOutCurrent = refuelOrDefuelTank(LOutCurrent, LOutTarget, multiplier);
        ROutCurrent = refuelOrDefuelTank(ROutCurrent, ROutTarget, multiplier);
        SimVar.SetSimVarValue("FUEL TANK LEFT AUX QUANTITY", "Gallons", LOutCurrent);
        SimVar.SetSimVarValue("FUEL TANK RIGHT AUX QUANTITY", "Gallons", ROutCurrent);
        if (LOutTarget != LOutCurrent || ROutTarget != ROutCurrent) {
            return;
        }
        // REFUELING (aux first, then main, then center tank)
        if (LInnCurrent < LInnTarget || RInnCurrent < RInnTarget) {
            LInnCurrent = refuelTank(LInnCurrent, LInnTarget, multiplier);
            RInnCurrent = refuelTank(RInnCurrent, RInnTarget, multiplier);
            SimVar.SetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons", RInnTarget);
            SimVar.SetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons", LInnTarget);
            if (LInnCurrent != LInnTarget || RInnCurrent != RInnTarget) {
                return;
            }
        }
        if (centerCurrent < centerTarget) {
            centerCurrent = refuelTank(centerCurrent, centerTarget, multiplier);
            SimVar.SetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons", centerCurrent);
            if (centerCurrent != centerTarget) {
                return;
            }
        }
    }
}
