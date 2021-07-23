/**
 * Value is rounded to 1000 and fixed to 1 decimal
 * @param {number | string} value
 */
function formatWeightInTons(value) {
    return (+value / 1000).toFixed(1);
}

/**
 * @return {number | NaN} currentFwdBag
 */
function getCurrentFwdBag(fmc) {
    return fmc.aocWeight.fwdBag !== undefined ? +fmc.aocWeight.fwdBag : +fmc.aocWeight.estFwdBag; // number | NaN
}

/**
 * @return {number | NaN} currentRearBag
 */
function getCurrentRearBag(fmc) {
    return fmc.aocWeight.rearBag !== undefined ? +fmc.aocWeight.rearBag : +fmc.aocWeight.estRearBag;
}

/**
 * @return {number | NaN} currentPayload
 */
function getCurrentPayload(fmc) {
    return fmc.aocWeight.payload !== undefined ? +fmc.aocWeight.payload : +fmc.simbrief.payload;
}

/**
 * AOC - OFP WEIGHT
 * Fetch and display weight data to be loaded to the aircraft via the MCDU
 * - You can either fetch the weight from SimBrief or
 * - You can enter/edit manually each field
 */
class CDUAocOfpData {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUAocOfpData.ShowPage(fmc, mcdu);
        });

        const maxAllowableFuel = 19046; // in kilograms

        let blockFuel = "_____[color]amber";
        let taxiFuel = "____[color]amber";
        let tripFuel = "_____[color]amber";
        let requestButton = "SEND*[color]cyan";
        let loadButton = "*LOAD[color]cyan";

        if (fmc.simbrief.sendStatus !== "READY" && fmc.simbrief.sendStatus !== "DONE") {
            requestButton = "SEND [color]cyan";
        }

        if (fmc.aocWeight.loading) {
            loadButton = " LOAD[color]cyan";
        }

        const currentBlockFuel = fmc.aocWeight.blockFuel || fmc.simbrief.blockFuel;
        if (currentBlockFuel) {
            const size = mcdu.aocWeight.blockFuel ? 'big' : 'small';
            blockFuel = `{${size}}${Math.round(NXUnits.kgToUser(currentBlockFuel))}{end}[color]cyan`;
        }

        const currentTaxiFuel = fmc.aocWeight.taxiFuel || fmc.simbrief.taxiFuel;
        if (currentTaxiFuel) {
            const size = fmc.aocWeight.taxiFuel ? 'big' : 'small';
            taxiFuel = `{${size}}${Math.round(NXUnits.kgToUser(currentTaxiFuel))}{end}[color]cyan`;
        }

        const currentTripFuel = fmc.aocWeight.tripFuel || fmc.simbrief.tripFuel;
        if (currentTripFuel) {
            const size = fmc.aocWeight.tripFuel ? 'big' : 'small';
            tripFuel = `{${size}}${Math.round(NXUnits.kgToUser(currentTripFuel))}{end}[color]cyan`;
        }

        const display = [
            ["PERF/W&B", "1", "2", "AOC"],
            ["BLOCK FUEL"],
            [blockFuel],
            ["TAXI FUEL"],
            [taxiFuel],
            ["TRIP FUEL"],
            [tripFuel],
            [""],
            ["", "PRINT*[color]inop"],
            ["REFUEL", "OFP REQUEST[color]cyan"],
            [loadButton, requestButton],
            [""],
            ["<AOC MENU"]
        ];
        mcdu.setTemplate(display);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                fmc.aocWeight.blockFuel = undefined;
                mcdu.requestUpdate();
                return true;
            }
            const enteredFuel = NXUnits.userToKg(Math.round(+value));
            if (enteredFuel >= 0 && enteredFuel <= maxAllowableFuel) {
                fmc.aocWeight.blockFuel = enteredFuel;
                mcdu.requestUpdate();
                return true;
            }
            mcdu.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                fmc.aocWeight.taxiFuel = undefined;
                mcdu.requestUpdate();
                return true;
            }
            const enteredFuel = NXUnits.userToKg(Math.round(+value));
            if (enteredFuel >= 0 && enteredFuel <= maxAllowableFuel) {
                fmc.aocWeight.taxiFuel = enteredFuel;
                mcdu.requestUpdate();
                return true;
            }
            mcdu.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                fmc.aocWeight.tripFuel = undefined;
                mcdu.requestUpdate();
                return true;
            }
            const enteredFuel = NXUnits.userToKg(Math.round(+value));
            if (enteredFuel >= 0 && enteredFuel <= maxAllowableFuel) {
                fmc.aocWeight.tripFuel = enteredFuel;
                mcdu.requestUpdate();
                return true;
            }
            mcdu.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[4] = async () => {
            const onGround = SimVar.GetSimVarValue("SIM ON GROUND", "Bool");
            const gs = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            const oneEngineRunning = SimVar.GetSimVarValue('GENERAL ENG COMBUSTION:1', 'bool') ||
                SimVar.GetSimVarValue('GENERAL ENG COMBUSTION:2', 'bool');

            if (gs < 1 && onGround && currentBlockFuel && !oneEngineRunning) {
                loadFuel(fmc, () => mcdu.requestUpdate());

                mcdu.requestUpdate();
            }
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[4] = () => {
            getSimBriefOfp(fmc, mcdu, () => {
                mcdu.requestUpdate();
            });
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(fmc, mcdu);
        };

        mcdu.onNextPage = () => {
            CDUAocOfpData.ShowPage2(fmc, mcdu);
        };
    }

    static ShowPage2(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUAocOfpData.ShowPage2(fmc, mcdu);
        }, 'ATSU');

        const maxAllowablePayload = 34327; // in kilograms

        setEstimatedBaggagePayload(fmc);

        let payload = "_____[color]amber";
        let estZfw = "--.-[color]white";
        let zfwcg = "__._[color]amber";
        let fwdBag = "__._[color]amber";
        let rearBag = "__._[color]amber";
        let noPax = "---[color]white";
        let requestButton = "SEND*[color]cyan";
        let loadButton = "*LOAD[color]cyan";

        if (fmc.simbrief.sendStatus !== "READY" && fmc.simbrief.sendStatus !== "DONE") {
            requestButton = "SEND [color]cyan";
        }

        if (fmc.aocWeight.loading) {
            loadButton = " LOAD[color]cyan";
        }

        const currentZfwcg = fmc.aocWeight.zfwcg || getZfwcg(fmc);
        if (currentZfwcg) {
            const cgColor = currentZfwcg >= 16 && currentZfwcg <= 40 ? 'cyan' : 'red';
            const size = fmc.aocWeight.zfwcg ? 'big' : 'small';
            zfwcg = `{${size}}${currentZfwcg.toFixed(1)}{end}[color]${cgColor}`;
        }

        const currentNoPax = fmc.aocWeight.noPax || fmc.simbrief.paxCount;
        if (currentNoPax) {
            const size = fmc.aocWeight.noPax ? 'big' : 'small';
            noPax = `{${size}}${currentNoPax}{end}[color]green`;
        }

        const currentPayload = fmc.aocWeight.payload || fmc.simbrief.payload;
        if (currentPayload) {
            const size = fmc.aocWeight.payload ? 'big' : 'small';
            payload = `{${size}}${Math.round(NXUnits.kgToUser(currentPayload))}{end}[color]cyan`;

            // Update ZFW as well
            const emptyWeight = 41000;
            const actualZfw = emptyWeight + (+currentPayload);
            estZfw = `{${size}}${formatWeightInTons(NXUnits.kgToUser(actualZfw))}{end}[color]cyan`;
        }

        const currentfwdBag = getCurrentFwdBag(fmc);
        if (!isNaN(currentfwdBag)) {
            const size = fmc.aocWeight.fwdBag ? 'big' : 'small';
            fwdBag = `{${size}}${Math.round(NXUnits.kgToUser(currentfwdBag))}{end}[color]cyan`;
        }

        const currentRearBag = getCurrentRearBag(fmc);
        if (!isNaN(currentRearBag)) {
            const size = fmc.aocWeight.rearBag ? 'big' : 'small';
            rearBag = `{${size}}${Math.round(NXUnits.kgToUser(currentRearBag))}{end}[color]cyan`;
        }

        const display = [
            ["PERF/W&B", "2", "2", "AOC"],
            ["PAYLOAD", "ZFW"],
            [payload, estZfw],
            ["FWD BAG", "ZFWCG"],
            [fwdBag, zfwcg],
            ["REAR BAG", "NO PAX"],
            [rearBag, noPax],
            [""],
            ["", "PRINT*[color]inop"],
            ["PAYLOAD", "OFP REQUEST[color]cyan"],
            [loadButton, requestButton],
            [""],
            ["<AOC MENU"]
        ];
        mcdu.setTemplate(display);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                fmc.aocWeight.payload = undefined;
                fmc.aocWeight.fwdBag = undefined;
                fmc.aocWeight.rearBag = undefined;
                mcdu.requestUpdate();
                return true;
            }
            const enteredPayload = NXUnits.userToKg(Math.round(+value));
            if (enteredPayload >= 0 && enteredPayload <= maxAllowablePayload) {
                fmc.aocWeight.payload = enteredPayload;
                fmc.aocWeight.fwdBag = undefined;
                fmc.aocWeight.rearBag = undefined;
                mcdu.requestUpdate();
                return true;
            }
            mcdu.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                fmc.aocWeight.fwdBag = undefined;
                mcdu.requestUpdate();
                return true;
            }
            const currentRearBag = !isNaN(getCurrentRearBag(fmc)) ? getCurrentRearBag(fmc) : 0;
            const enteredFwdBag = NXUnits.userToKg(Math.round(+value));
            const actualPayload = enteredFwdBag + (+currentRearBag);

            if (enteredFwdBag >= 0 && actualPayload >= 0 && actualPayload <= maxAllowablePayload) {
                fmc.aocWeight.fwdBag = enteredFwdBag;
                mfmc.aocWeight.rearBag = currentRearBag;
                fmc.aocWeight.zfwcg = undefined;
                updatePayloadValue();
                mcdu.requestUpdate();
                return true;
            }
            mcdu.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        };

        function updatePayloadValue() {
            const currentFwdBag = getCurrentFwdBag(fmc);
            const currentRearBag = getCurrentRearBag(fmc);

            const actualPayload = (+currentFwdBag) + (+currentRearBag);

            fmc.aocWeight.payload = actualPayload;

            mcdu.requestUpdate();
        }

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                fmc.aocWeight.rearBag = undefined;
                updatePayloadValue();
                mcdu.requestUpdate();
                return true;
            }
            const currentFwdBag = !isNaN(getCurrentFwdBag(fmc)) ? getCurrentFwdBag(fmc) : 0;

            const enteredRearBag = NXUnits.userToKg(Math.round(+value));
            const actualPayload = enteredRearBag + (+currentFwdBag);

            if (enteredRearBag >= 0 && actualPayload >= 0 && actualPayload <= maxAllowablePayload) {
                fmc.aocWeight.rearBag = enteredRearBag;
                fmc.aocWeight.fwdBag = currentFwdBag;
                fmc.aocWeight.zfwcg = undefined;
                updatePayloadValue();
                mcdu.requestUpdate();
                return true;
            }
            mcdu.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                fmc.aocWeight.zfwcg = undefined;
                setEstimatedBaggagePayload(fmc);
                mcdu.requestUpdate();
                return true;
            }
            const minAllowableZfwcg = 16;
            const maxAllowableZfwcg = 40;

            if (value >= minAllowableZfwcg && value <= maxAllowableZfwcg) {
                fmc.aocWeight.zfwcg = +value;
                fmc.aocWeight.rearBag = undefined;
                fmc.aocWeight.fwdBag = undefined;
                setEstimatedBaggagePayload(fmc);
                mcdu.requestUpdate();
                return true;
            }
            mcdu.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[4] = () => {
            getSimBriefOfp(fmc, mcdu, () => mcdu.requestUpdate());
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[4] = async () => {
            if (currentPayload) {
                await loadBaggagePayload(fmc, () => mcdu.requestUpdate());

                mcdu.requestUpdate();
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(fmc, mcdu);
        };

        mcdu.onPrevPage = () => {
            CDUAocOfpData.ShowPage(fmc, mcdu);
        };
    }
}

function setEstimatedBaggagePayload(fmc) {
    if (fmc.aocWeight.fwdBag !== undefined || fmc.aocWeight.rearBag !== undefined) {
        return;
    }

    const currentPayload = getCurrentPayload(fmc);

    if (isNaN(currentPayload)) {
        return;
    }

    const {
        forwardBaggageWeight,
        rearBaggageWeight
    } = getDistributedBaggagePayload(currentPayload, fmc.aocWeight.zfwcg);

    fmc.aocWeight.estFwdBag = forwardBaggageWeight;
    fmc.aocWeight.estRearBag = rearBaggageWeight;
}

async function loadBaggagePayload(fmc, updateView) {
    const FORWARD_BAGGAGE_INDEX = 3 + 1; // Value from flight_model.cfg
    const REAR_BAGGAGE_INDEX = 5 + 1; // Value from flight_model.cfg

    const currentfwdBag = getCurrentFwdBag(fmc);
    const currentRearBag = getCurrentRearBag(fmc);

    fmc.aocWeight.loading = true;
    updateView();

    const payloadCount = SimVar.GetSimVarValue("PAYLOAD STATION COUNT", "number");
    for (let i = 1; i <= payloadCount; i++) {
        switch (i) {
            case FORWARD_BAGGAGE_INDEX: {
                await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${i}`, "kilograms", +currentfwdBag);
                break;
            }
            case REAR_BAGGAGE_INDEX: {
                await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${i}`, "kilograms", +currentRearBag);
                break;
            }
            default: {
                await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${i}`, "kilograms", 0);
                break;
            }
        }
    }

    fmc.aocWeight.loading = false;
    updateView();

    return;
}

async function loadFuel(fmc, updateView) {
    const currentBlockFuel = fmc.aocWeight.blockFuel || fmc.simbrief.blockFuel;

    fmc.aocWeight.loading = true;
    updateView();

    const outerTankCapacity = 228; // Left and Right // Value from flight_model.cfg
    const innerTankCapacity = 1816; // Left and Right // Value from flight_model.cfg
    const centerTankCapacity = 2179; // Center // Value from flight_model.cfg

    const fuelWeightPerGallon = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilograms");
    let currentBlockFuelInGallons = +currentBlockFuel / +fuelWeightPerGallon;

    const outerTankFill = Math.min(outerTankCapacity, currentBlockFuelInGallons / 2);
    await SimVar.SetSimVarValue(`FUEL TANK LEFT AUX QUANTITY`, "Gallons", outerTankFill);
    await SimVar.SetSimVarValue(`FUEL TANK RIGHT AUX QUANTITY`, "Gallons", outerTankFill);
    currentBlockFuelInGallons -= outerTankFill * 2;

    const innerTankFill = Math.min(innerTankCapacity, currentBlockFuelInGallons / 2);
    await SimVar.SetSimVarValue(`FUEL TANK LEFT MAIN QUANTITY`, "Gallons", innerTankFill);
    await SimVar.SetSimVarValue(`FUEL TANK RIGHT MAIN QUANTITY`, "Gallons", innerTankFill);
    currentBlockFuelInGallons -= innerTankFill * 2;

    const centerTankFill = Math.min(centerTankCapacity, currentBlockFuelInGallons);
    await SimVar.SetSimVarValue(`FUEL TANK CENTER QUANTITY`, "Gallons", centerTankFill);
    currentBlockFuelInGallons -= centerTankFill;

    fmc.updateFuelVars();

    fmc.aocWeight.loading = false;
    updateView();
}

/**
 * Calculate the baggage payload distribution to achieve target CG
 * @param {number} payload in pound
 * @param {number} percentMacTarget Target %MAC CG / 100
 */
function getDistributedBaggagePayload(payload = 0, percentMacTarget = 30) {
    const leMacZ = -5.233333; // Value from Debug Weight
    const macSize = 14.0623; // Value from Debug Aircraft Sim Tunning
    const EMPTY_AIRCRAFT_WEIGHT = 90400 * 0.453592; // Value from flight_model.cfg to kgs
    const EMPTY_AIRCRAFT_POSITION = -9; // Value from flight_model.cfg
    const FORWARD_BAGGAGE_POSITION = 21.825772; // Value from flight_model.cfg
    const REAR_BAGGAGE_POSITION = -35.825745; // Value from flight_model.cfg

    const cgTarget = leMacZ - (macSize * (percentMacTarget / 100));

    const rearBaggageWeight = -1 * ((-(EMPTY_AIRCRAFT_WEIGHT * (EMPTY_AIRCRAFT_POSITION - cgTarget) + payload * (FORWARD_BAGGAGE_POSITION - cgTarget))) / (FORWARD_BAGGAGE_POSITION - REAR_BAGGAGE_POSITION));
    const forwardBaggageWeight = -1 * ((EMPTY_AIRCRAFT_WEIGHT * (EMPTY_AIRCRAFT_POSITION - cgTarget) + payload * (REAR_BAGGAGE_POSITION - cgTarget))) / (FORWARD_BAGGAGE_POSITION - REAR_BAGGAGE_POSITION);

    return {forwardBaggageWeight, rearBaggageWeight};
}

/**
 * Calculate %MAC ZWFCG based on Empty and Baggage weight only*
 * TODO: Add passengers sections weight into account
 */
function getZfwcg(fmc) {
    const leMacZ = -5.233333; // Value from Debug Weight
    const macSize = 14.0623; // Value from Debug Aircraft Sim Tunning

    const EMPTY_AIRCRAFT_WEIGHT = 90400 * 0.453592; // Value from flight_model.cfg to kgs
    const EMPTY_AIRCRAFT_POSITION = -9; // Value from flight_model.cfg
    const FORWARD_BAGGAGE_POSITION = 21.825772; // Value from flight_model.cfg
    const REAR_BAGGAGE_POSITION = -35.825745; // Value from flight_model.cfg

    const currentfwdBag = getCurrentFwdBag(fmc);
    const currentRearBag = getCurrentRearBag(fmc);

    if (isNaN(currentfwdBag) || isNaN(currentRearBag)) {
        return null;
    }

    const emptyAircraftMoment = EMPTY_AIRCRAFT_POSITION * EMPTY_AIRCRAFT_WEIGHT;
    const forwardBaggageMoment = FORWARD_BAGGAGE_POSITION * currentfwdBag;
    const rearBaggageMoment = REAR_BAGGAGE_POSITION * currentRearBag;

    const totalMass = EMPTY_AIRCRAFT_WEIGHT + currentfwdBag + currentRearBag;
    const totalMoment = emptyAircraftMoment + forwardBaggageMoment + rearBaggageMoment;

    const cgPosition = totalMoment / totalMass;

    const cgPositionToLemac = cgPosition - leMacZ;

    const cgPercentMac = -100 * cgPositionToLemac / macSize;

    return cgPercentMac;
}
