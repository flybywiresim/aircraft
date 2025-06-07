/**
 * taken from the AAU1 G3000
 * The purpose is to reduce the amount of string allocations caused by `.toLowerCase()`
 */

const latlonaltRegEx = /^latlonalt$/i;
const latlonaltpbhRegex = /^latlonaltpbh$/i;
const pbhRegex = /^pbh$/i;
const pid_structRegex = /^pid_struct$/i;
const xyzRegex = /^xyz$/i;
const stringRegex = /^string$/i;
const boolRegex = /^boolean$|^bool$/i;
const numberRegex = /^number$/i;
const defaultSource = '';

SimVar.GetSimVarValue = (name, unit, dataSource = defaultSource) => {
    try {
        if (simvar) {
            let output;
            const registeredID = SimVar.GetRegisteredId(name, unit, dataSource);

            if (registeredID >= 0) {
                if (numberRegex.test(unit)) {
                    output = simvar.getValueReg(registeredID);
                } else if (stringRegex.test(unit)) {
                    output = simvar.getValueReg_String(registeredID);
                } else if (latlonaltRegEx.test(unit)) {
                    output = new LatLongAlt(simvar.getValue_LatLongAlt(name, dataSource));
                } else if (latlonaltpbhRegex.test(unit)) {
                    output = new LatLongAltPBH(simvar.getValue_LatLongAltPBH(name, dataSource));
                } else if (pbhRegex.test(unit)) {
                    output = new PitchBankHeading(simvar.getValue_PBH(name, dataSource));
                } else if (pid_structRegex.test(unit)) {
                    output = new PID_STRUCT(simvar.getValue_PID_STRUCT(name, dataSource));
                } else if (xyzRegex.test(unit)) {
                    output = new XYZ(simvar.getValue_XYZ(name, dataSource));
                } else {
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
