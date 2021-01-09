/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
function getCurrentFwdBag(mcdu) {
    return mcdu.aocWeight.fwdBag !== undefined ? +mcdu.aocWeight.fwdBag : +mcdu.aocWeight.estFwdBag; // number | NaN
}

/**
 * @return {number | NaN} currentRearBag
 */
function getCurrentRearBag(mcdu) {
    return mcdu.aocWeight.rearBag !== undefined ? +mcdu.aocWeight.rearBag : +mcdu.aocWeight.estRearBag;
}

/**
 * @return {number | NaN} currentPayload
 */
function getCurrentPayload(mcdu) {
    return mcdu.aocWeight.payload !== undefined ? +mcdu.aocWeight.payload : +mcdu.simbrief.payload;
}

/**
 * AOC - OFP WEIGHT
 * Fetch and display weight data to be loaded to the aircraft via the MCDU
 * - You can either fetch the weight from SimBrief or
 * - You can enter/edit manually each field
 */
class CDUAocOfpData {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AOCOfpData;
        mcdu.activeSystem = 'ATSU';

        function updateView() {
            if (mcdu.page.Current === mcdu.page.AOCOfpData) {
                CDUAocOfpData.ShowPage(mcdu);
            }
        }

        let blockFuel = "_____[color]amber";
        let taxiFuel = "____[color]amber";
        let tripFuel = "_____[color]amber";
        let requestButton = "SEND*[color]cyan";
        let loadButton = "*LOAD[color]cyan";

        if (mcdu.simbrief.sendStatus !== "READY" && mcdu.simbrief.sendStatus !== "DONE") {
            requestButton = "SEND [color]cyan";
        }

        if (mcdu.aocWeight.loading) {
            loadButton = " LOAD[color]cyan";
        }

        const currentBlockFuel = mcdu.aocWeight.blockFuel || mcdu.simbrief.blockFuel;
        if (currentBlockFuel) {
            const size = mcdu.aocWeight.blockFuel ? 'big' : 'small';
            blockFuel = `{${size}}${Math.round(currentBlockFuel * mcdu._conversionWeight)}{end}[color]cyan`;
        }

        const currentTaxiFuel = mcdu.aocWeight.taxiFuel || mcdu.simbrief.taxiFuel;
        if (currentTaxiFuel) {
            const size = mcdu.aocWeight.taxiFuel ? 'big' : 'small';
            taxiFuel = `{${size}}${Math.round(currentTaxiFuel * mcdu._conversionWeight)}{end}[color]cyan`;
        }

        const currentTripFuel = mcdu.aocWeight.tripFuel || mcdu.simbrief.tripFuel;
        if (currentTripFuel) {
            const size = mcdu.aocWeight.tripFuel ? 'big' : 'small';
            tripFuel = `{${size}}${Math.round(currentTripFuel * mcdu._conversionWeight)}{end}[color]cyan`;
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
                mcdu.aocWeight.blockFuel = "";
                updateView();
                return true;
            }
            const maxAllowableFuel = 21273;
            const enteredFuel = Math.round(+value);
            if (enteredFuel >= 0 && enteredFuel <= maxAllowableFuel) {
                mcdu.aocWeight.blockFuel = enteredFuel.toString();
                updateView();
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
                mcdu.aocWeight.taxiFuel = "";
                updateView();
                return true;
            }
            const maxAllowableFuel = 21273;
            const enteredFuel = Math.round(+value);
            if (enteredFuel >= 0 && enteredFuel <= maxAllowableFuel) {
                mcdu.aocWeight.taxiFuel = enteredFuel.toString();
                updateView();
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
                mcdu.aocWeight.tripFuel = "";
                updateView();
                return true;
            }
            const maxAllowableFuel = 21273;
            const enteredFuel = Math.round(+value);
            if (enteredFuel >= 0 && enteredFuel <= maxAllowableFuel) {
                mcdu.aocWeight.tripFuel = enteredFuel.toString();
                updateView();
                return true;
            }
            mcdu.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[4] = async () => {
            if (currentBlockFuel) {
                loadFuel(mcdu, updateView);

                updateView();
            }
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[4] = () => {
            getSimBriefOfp(mcdu, updateView);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };

        mcdu.onNextPage = () => {
            CDUAocOfpData.ShowPage2(mcdu);
        };
    }

    static ShowPage2(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AOCOfpData2;
        mcdu.activeSystem = 'ATSU';

        setEstimatedBaggagePayload(mcdu);

        let payload = "_____[color]amber";
        let estZfw = "--.-[color]white";
        let zfwcg = "__._[color]amber";
        let fwdBag = "__._[color]amber";
        let rearBag = "__._[color]amber";
        let noPax = "---[color]white";
        let requestButton = "SEND*[color]cyan";
        let loadButton = "*LOAD[color]cyan";

        if (mcdu.simbrief.sendStatus !== "READY" && mcdu.simbrief.sendStatus !== "DONE") {
            requestButton = "SEND [color]cyan";
        }

        if (mcdu.aocWeight.loading) {
            loadButton = " LOAD[color]cyan";
        }

        const currentZfwcg = mcdu.aocWeight.zfwcg || getZfwcg(mcdu);
        if (currentZfwcg) {
            const cgColor = currentZfwcg >= 16 && currentZfwcg <= 40 ? 'cyan' : 'red';
            const size = mcdu.aocWeight.zfwcg ? 'big' : 'small';
            zfwcg = `{${size}}${currentZfwcg.toFixed(1)}{end}[color]${cgColor}`;
        }

        const currentNoPax = mcdu.aocWeight.noPax || mcdu.simbrief.paxCount;
        if (currentNoPax) {
            const size = mcdu.aocWeight.noPax ? 'big' : 'small';
            noPax = `{${size}}${currentNoPax}{end}[color]green`;
        }

        const currentPayload = mcdu.aocWeight.payload || mcdu.simbrief.payload;
        if (currentPayload) {
            const size = mcdu.aocWeight.payload ? 'big' : 'small';
            payload = `{${size}}${Math.round(currentPayload * mcdu._conversionWeight)}{end}[color]cyan`;

            // Update ZFW as well
            const emptyWeight = 41000;
            const actualZfw = emptyWeight + (+currentPayload);
            estZfw = `{${size}}${formatWeightInTons(actualZfw * mcdu._conversionWeight)}{end}[color]cyan`;
        }

        const currentfwdBag = getCurrentFwdBag(mcdu);
        if (!isNaN(currentfwdBag)) {
            const size = mcdu.aocWeight.fwdBag ? 'big' : 'small';
            fwdBag = `{${size}}${Math.round(currentfwdBag * mcdu._conversionWeight)}{end}[color]cyan`;
        }

        const currentRearBag = getCurrentRearBag(mcdu);
        if (!isNaN(currentRearBag)) {
            const size = mcdu.aocWeight.rearBag ? 'big' : 'small';
            rearBag = `{${size}}${Math.round(currentRearBag * mcdu._conversionWeight)}{end}[color]cyan`;
        }

        function updateView() {
            if (mcdu.page.Current === mcdu.page.AOCOfpData2) {
                CDUAocOfpData.ShowPage2(mcdu);
            }
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
                mcdu.aocWeight.payload = undefined;
                mcdu.aocWeight.fwdBag = undefined;
                mcdu.aocWeight.rearBag = undefined;
                updateView();
                return true;
            }
            const maxAllowablePayload = 34327;
            const enteredPayload = Math.round(+value);
            if (enteredPayload >= 0 && enteredPayload <= maxAllowablePayload) {
                mcdu.aocWeight.payload = enteredPayload.toString();
                mcdu.aocWeight.fwdBag = undefined;
                mcdu.aocWeight.rearBag = undefined;
                updateView();
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
                mcdu.aocWeight.fwdBag = undefined;
                updateView();
                return true;
            }
            const maxAllowablePayload = 34327;
            const currentRearBag = !isNaN(getCurrentRearBag(mcdu)) ? getCurrentRearBag(mcdu) : 0;

            const enteredFwdBag = Math.round(+value);
            const actualPayload = enteredFwdBag + (+currentRearBag);

            if (actualPayload >= 0 && actualPayload <= maxAllowablePayload) {
                mcdu.aocWeight.fwdBag = enteredFwdBag.toString();
                mcdu.aocWeight.rearBag = currentRearBag.toString();
                mcdu.aocWeight.zfwcg = undefined;
                updatePayloadValue();
                updateView();
                return true;
            }
            mcdu.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        };

        function updatePayloadValue() {
            const currentFwdBag = getCurrentFwdBag(mcdu);
            const currentRearBag = getCurrentRearBag(mcdu);

            const actualPayload = (+currentFwdBag) + (+currentRearBag);

            mcdu.aocWeight.payload = actualPayload.toString();

            updateView();
        }

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                mcdu.aocWeight.rearBag = undefined;
                updatePayloadValue();
                updateView();
                return true;
            }
            const maxAllowablePayload = 34327;
            const currentFwdBag = !isNaN(getCurrentFwdBag(mcdu)) ? getCurrentFwdBag(mcdu) : 0;

            const enteredRearBag = Math.round(+value);
            const actualPayload = enteredRearBag + (+currentFwdBag);

            if (actualPayload >= 0 && actualPayload <= maxAllowablePayload) {
                mcdu.aocWeight.rearBag = enteredRearBag.toString();
                mcdu.aocWeight.fwdBag = currentFwdBag.toString();
                mcdu.aocWeight.zfwcg = undefined;
                updatePayloadValue();
                updateView();
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
                mcdu.aocWeight.zfwcg = undefined;
                setEstimatedBaggagePayload(mcdu);
                updateView();
                return true;
            }
            const minAllowableZfwcg = 16;
            const maxAllowableZfwcg = 40;

            if (value >= minAllowableZfwcg && value <= maxAllowableZfwcg) {
                mcdu.aocWeight.zfwcg = +value;
                mcdu.aocWeight.rearBag = undefined;
                mcdu.aocWeight.fwdBag = undefined;
                setEstimatedBaggagePayload(mcdu);
                updateView();
                return true;
            }
            mcdu.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[4] = () => {
            getSimBriefOfp(mcdu, updateView);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[4] = async () => {
            if (currentPayload) {
                await loadBaggagePayload(mcdu, updateView);

                updateView();
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };

        mcdu.onPrevPage = () => {
            CDUAocOfpData.ShowPage(mcdu);
        };
    }
}

function setEstimatedBaggagePayload(mcdu) {
    if (mcdu.aocWeight.fwdBag !== undefined || mcdu.aocWeight.rearBag !== undefined) {
        return;
    }

    const currentPayload = getCurrentPayload(mcdu);

    if (isNaN(currentPayload)) {
        return;
    }

    const {forwardBaggageWeight, rearBaggageWeight} = getDistributedBaggagePayload(currentPayload, mcdu.aocWeight.zfwcg);

    mcdu.aocWeight.estFwdBag = forwardBaggageWeight;
    mcdu.aocWeight.estRearBag = rearBaggageWeight;
}

async function loadBaggagePayload(mcdu, updateView) {
    const FORWARD_BAGGAGE_INDEX = 3 + 1; // Value from flight_model.cfg
    const REAR_BAGGAGE_INDEX = 5 + 1; // Value from flight_model.cfg

    const currentfwdBag = getCurrentFwdBag(mcdu);
    const currentRearBag = getCurrentRearBag(mcdu);

    mcdu.aocWeight.loading = true;
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

    mcdu.aocWeight.loading = false;
    updateView();

    return;
}

async function loadFuel(mcdu, updateView) {
    const currentBlockFuel = mcdu.aocWeight.blockFuel || mcdu.simbrief.blockFuel;

    mcdu.aocWeight.loading = true;
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

    mcdu.updateFuelVars();

    mcdu.aocWeight.loading = false;
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
function getZfwcg(mcdu) {
    const leMacZ = -5.233333; // Value from Debug Weight
    const macSize = 14.0623; // Value from Debug Aircraft Sim Tunning

    const EMPTY_AIRCRAFT_WEIGHT = 90400 * 0.453592; // Value from flight_model.cfg to kgs
    const EMPTY_AIRCRAFT_POSITION = -9; // Value from flight_model.cfg
    const FORWARD_BAGGAGE_POSITION = 21.825772; // Value from flight_model.cfg
    const REAR_BAGGAGE_POSITION = -35.825745; // Value from flight_model.cfg

    const currentfwdBag = getCurrentFwdBag(mcdu);
    const currentRearBag = getCurrentRearBag(mcdu);

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
