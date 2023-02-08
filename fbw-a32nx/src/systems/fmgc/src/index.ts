import { normaliseApproachName } from '@shared/flightplan';
import { FlightPlanManager } from './flightplanning/FlightPlanManager';
import { getFlightPhaseManager } from './flightphase';
import { FlightPlanAsoboSync } from './flightplanning/FlightPlanAsoboSync';
import { GuidanceManager } from './guidance/GuidanceManager';
import { ManagedFlightPlan } from './flightplanning/ManagedFlightPlan';
import { GuidanceController } from './guidance/GuidanceController';
import { NavRadioManager } from './radionav/NavRadioManager';
import { EfisSymbols } from './efis/EfisSymbols';
import { DescentBuilder } from './guidance/vnav/descent/DescentBuilder';
import { DecelPathBuilder } from './guidance/vnav/descent/DecelPathBuilder';
import { VerticalFlightPlanBuilder } from './guidance/vnav/verticalFlightPlan/VerticalFlightPlanBuilder';
import { initComponents, updateComponents, recallMessageById } from './components';
import { WaypointBuilder } from './flightplanning/WaypointBuilder';
import { Navigation } from './navigation/Navigation';

const latlonaltRegEx = new RegExp(/latlonalt/i);
const latlonaltpbhRegex = new RegExp(/latlonaltpbh/i);
const pbhRegex = new RegExp(/pbh/i);
const pid_structRegex = new RegExp(/pid_struct/i);
const xyzRegex = new RegExp(/xyz/i);
const stringRegex = new RegExp(/string/i);
const boolRegex = new RegExp(/boolean|bool/i);
const numberRegex = new RegExp(/number/i);
const defaultSource = '';
SimVar.GetSimVarValue = (name, unit, dataSource = defaultSource) => {
    try {
        // @ts-ignore
        if (simvar) {
            let output;
            const registeredID = SimVar.GetRegisteredId(name, unit, dataSource);

            if (registeredID >= 0) {
                console.log('hi ID');

                if (numberRegex.test(unit)) {
                    // @ts-ignore
                    output = simvar.getValueReg(registeredID);
                } else if (stringRegex.test(unit)) {
                    // @ts-ignore
                    output = simvar.getValueReg_String(registeredID);
                } else if (latlonaltRegEx.test(unit)) {
                    // @ts-ignore
                    output = new LatLongAlt(simvar.getValue_LatLongAlt(name, dataSource));
                } else if (latlonaltpbhRegex.test(unit)) {
                    // @ts-ignore
                    output = new LatLongAltPBH(simvar.getValue_LatLongAltPBH(name, dataSource));
                } else if (pbhRegex.test(unit)) {
                    // @ts-ignore
                    output = new PitchBankHeading(simvar.getValue_PBH(name, dataSource));
                } else if (pid_structRegex.test(unit)) {
                    // @ts-ignore
                    output = new PID_STRUCT(simvar.getValue_PID_STRUCT(name, dataSource));
                } else if (xyzRegex.test(unit)) {
                    // @ts-ignore
                    output = new XYZ(simvar.getValue_XYZ(name, dataSource));
                } else {
                    // @ts-ignore
                    output = simvar.getValueReg(registeredID);
                }
            }
            return output;
        }

        console.warn(`SimVar handler is not defined (${name})`);
    } catch (error) {
        console.warn('ERROR ', error, ` GetSimVarValue ${name} unit : ${unit}`);
        return null;
    }
    return null;
};
SimVar.SetSimVarValue = (name, unit, value, dataSource = defaultSource) => {
    if (value == undefined) {
        console.warn(`${name} : Trying to set a null value`);
        return Promise.resolve();
    }
    try {
        // @ts-ignore
        if (simvar) {
            const regID = SimVar.GetRegisteredId(name, unit, dataSource);
            if (regID >= 0) {
                if (stringRegex.test(unit)) {
                    return Coherent.call('setValueReg_String', regID, value);
                }
                if (boolRegex.test(unit)) {
                    return Coherent.call('setValueReg_Bool', regID, !!value);
                }
                if (numberRegex.test(unit)) {
                    return Coherent.call('setValueReg_Number', regID, value);
                }
                if (latlonaltRegEx.test(unit)) {
                    return Coherent.call('setValue_LatLongAlt', name, value, dataSource);
                }
                if (latlonaltpbhRegex.test(unit)) {
                    return Coherent.call('setValue_LatLongAltPBH', name, value, dataSource);
                }
                if (pbhRegex.test(unit)) {
                    return Coherent.call('setValue_PBH', name, value, dataSource);
                }
                if (pid_structRegex.test(unit)) {
                    return Coherent.call('setValue_PID_STRUCT', name, value, dataSource);
                }
                if (xyzRegex.test(unit)) {
                    return Coherent.call('setValue_XYZ', name, value, dataSource);
                }

                return Coherent.call('setValueReg_Number', regID, value);
            }
        } else {
            console.warn('SimVar handler is not defined');
        }
    } catch (error) {
        console.warn(`error SetSimVarValue ${error}`);
    }
    return Promise.resolve();
};

function initFmgcLoop(baseInstrument: BaseInstrument, flightPlanManager: FlightPlanManager): void {
    initComponents(baseInstrument, flightPlanManager);
}

function updateFmgcLoop(deltaTime: number): void {
    updateComponents(deltaTime);
}

export {
    getFlightPhaseManager,
    FlightPlanManager,
    ManagedFlightPlan,
    FlightPlanAsoboSync,
    GuidanceManager,
    GuidanceController,
    NavRadioManager,
    initFmgcLoop,
    updateFmgcLoop,
    recallMessageById,
    EfisSymbols,
    DescentBuilder,
    DecelPathBuilder,
    VerticalFlightPlanBuilder,
    WaypointBuilder,
    normaliseApproachName,
    Navigation,
};
