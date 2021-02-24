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

MAX_SEAT_AVAILABLE = 162;

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

        // max_number_of_stations = 10 ; Number of payload stations
        // station_load.0 = 185, 42.36, 0, 0, PILOT, 1
        // station_load.1 = 185, 42.36, 0, 0, FIRST OFFICER, 2
        // station_load.2 = 3704, 21.98, 0, 0, ECONOMY ROWS 1-6 (seats: 36 max: 6670lbs/3024kg), 0
        // station_load.3 = 6296, 2.86, 0, 0, ECONOMY ROWS 7-13 (seats: 42 max: 7780lb/3530kg), 0
        // station_load.4 = 7778, -15.34, 0, 0, ECONOMY ROWS 14-20 (seats: 42 max: 7780lb/3530kg), 0
        // station_load.5 = 7778, -32.81, 0, 0, ECONOMY ROWS 21-27 (seats: 42 max: 7780lb/3530kg), 0
        // station_load.6 = 7500, 18.28, 0, 0, FWD BAGGAGE/CONTAINER (max: 7500lb/3402kg), 0
        // station_load.7 = 0, -15.96, 0, 0, AFT CONTAINER (max: 5350lb/2426kg), 0
        // station_load.8 = 4652, -27.10, 0, 0, AFT BAGGAGE (max: 4650lb/2110kg), 0
        // station_load.9 = 0, -37.35, 0, 0, COMP 5 - AFT BULK/LOOSE (max: 3300lb/1497kg), 0

        setEstimatedBaggagePayload(mcdu);

        const payload = "_____[color]amber";
        const estZfw = "--.-[color]white";
        let zfwcg = "__._[color]amber";
        let noPax = "---[color]white";
        let paxWeight = "---[color]white";
        let requestButton = "SEND*[color]cyan";
        let loadButton = "LOAD*[color]cyan";

        if (mcdu.simbrief.sendStatus !== "READY" && mcdu.simbrief.sendStatus !== "DONE") {
            requestButton = "SEND [color]cyan";
        }

        if (mcdu.aocWeight.loading) {
            loadButton = "LOAD [color]cyan";
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

        const currentPaxWeight = mcdu.aocWeight.paxWeight || mcdu.simbrief.paxWeight;
        if (currentPaxWeight) {
            const size = mcdu.aocWeight.paxWeight ? 'big' : 'small';
            paxWeight = `{${size}}${currentPaxWeight}{end}[color]green`;
        }

        // const currentPayload = mcdu.aocWeight.payload || mcdu.simbrief.payload;
        // if (currentPayload) {
        //     const size = mcdu.aocWeight.payload ? 'big' : 'small';
        //     payload = `{${size}}${Math.round(currentPayload * mcdu._conversionWeight)}{end}[color]cyan`;

        //     // Update ZFW as well
        //     const emptyWeight = 41000;
        //     const actualZfw = emptyWeight + (+currentPayload);
        //     estZfw = `{${size}}${formatWeightInTons(actualZfw * mcdu._conversionWeight)}{end}[color]cyan`;
        // }

        function updateView() {
            if (mcdu.page.Current === mcdu.page.AOCOfpData2) {
                CDUAocOfpData.ShowPage2(mcdu);
            }
        }

        function setPax(numberOfPax) {
            let paxLeft = parseInt(numberOfPax);

            function fillStation(station, paxToFill) {
                station.pax = Math.min(paxToFill, station.seats);
                paxLeft -= station.pax;
            }

            fillStation(mcdu.paxStations["rows21_27"], paxLeft);
            fillStation(mcdu.paxStations["rows14_20"], paxLeft);

            const toBeFilledInLastStations = paxLeft / 2;
            fillStation(mcdu.paxStations["rows7_13"], toBeFilledInLastStations);
            fillStation(mcdu.paxStations["rows1_6"], toBeFilledInLastStations);
        }

        function showPaxNo(paxNo) {
            console.log(paxNo);
            console.log(currentPaxWeight);
            return `{small}{cyan}${paxNo}{end} (${paxNo * currentPaxWeight} ${mcdu.simbrief.units || ''}){end}`;
        }

        const display = [
            ["W&B", "2", "2", "AOC"],
            ["[ROWS 1-6]", "ZFW"],
            [showPaxNo(mcdu.paxStations["rows1_6"].pax), estZfw],
            ["[ROWS 7-13]", "ZFWCG"],
            [showPaxNo(mcdu.paxStations["rows7_13"].pax), zfwcg],
            ["[ROWS 14-20]", "NO PAX"],
            [showPaxNo(mcdu.paxStations["rows14_20"].pax), noPax],
            ["[ROWS 21-27]", "PAX WEIGHT"],
            [showPaxNo(mcdu.paxStations["rows21_27"].pax), paxWeight],
            ["", "OFP REQUEST[color]cyan"],
            [, requestButton],
            ["", "WEIGHT"],
            ["<AOC MENU", loadButton]
        ];
        mcdu.setTemplate(display);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[0] = (value) => {
            const station = mcdu.paxStations["rows1_6"];
            if (value === FMCMainDisplay.clrValue) {
                station.pax = 0;
                updateView();
                return true;
            }
            if (value >= 0 && value <= station.seats) {
                station.pax = parseInt(value);
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
            const station = mcdu.paxStations["rows7_13"];
            if (value === FMCMainDisplay.clrValue) {
                station.pax = 0;
                updateView();
                return true;
            }
            if (value >= 0 && value <= station.seats) {
                station.pax = parseInt(value);
                updateView();
                return true;
            }
            mcdu.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[2] = (value) => {
            const station = mcdu.paxStations["rows14_20"];
            if (value === FMCMainDisplay.clrValue) {
                station.pax = 0;
                updateView();
                return true;
            }
            if (value >= 0 && value <= station.seats) {
                station.pax = parseInt(value);
                updateView();
                return true;
            }
            mcdu.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[3] = (value) => {
            const station = mcdu.paxStations["rows21_27"];
            if (value === FMCMainDisplay.clrValue) {
                station.pax = 0;
                updateView();
                return true;
            }
            if (value >= 0 && value <= station.seats) {
                station.pax = parseInt(value);
                updateView();
                return true;
            }
            mcdu.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        };

        // mcdu.rightInputDelay[1] = () => {
        //     return mcdu.getDelayBasic();
        // };
        // mcdu.onRightInput[1] = (value) => {
        //     if (value === FMCMainDisplay.clrValue) {
        //         mcdu.aocWeight.zfwcg = undefined;
        //         setEstimatedBaggagePayload(mcdu);
        //         updateView();
        //         return true;
        //     }
        //     const minAllowableZfwcg = 16;
        //     const maxAllowableZfwcg = 40;

        //     if (value >= minAllowableZfwcg && value <= maxAllowableZfwcg) {
        //         mcdu.aocWeight.zfwcg = +value;
        //         mcdu.aocWeight.rearBag = undefined;
        //         mcdu.aocWeight.fwdBag = undefined;
        //         setEstimatedBaggagePayload(mcdu);
        //         updateView();
        //         return true;
        //     }
        //     mcdu.addNewMessage(NXSystemMessages.notAllowed);
        //     return false;
        // };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                mcdu.aocWeight.noPax = 0;
                setPax(0);
                updateView();
                return true;
            }
            if (value >= 0 && value <= MAX_SEAT_AVAILABLE) {
                mcdu.aocWeight.noPax = value;
                setPax(value);
                updateView();
                return true;
            }
            mcdu.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        };

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                mcdu.aocWeight.paxWeight = undefined;
                updateView();
                return true;
            }
            if (value) {
                mcdu.aocWeight.paxWeight = value;
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

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[5] = async () => {
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
    // max_number_of_stations = 10 ; Number of payload stations
    // station_load.0 = 185, 42.36, 0, 0, PILOT, 1
    // station_load.1 = 185, 42.36, 0, 0, FIRST OFFICER, 2
    // station_load.2 = 3704, 21.98, 0, 0, ECONOMY ROWS 1-6 (seats: 36 max: 6670lbs/3024kg), 0
    // station_load.3 = 6296, 2.86, 0, 0, ECONOMY ROWS 7-13 (seats: 42 max: 7780lb/3530kg), 0
    // station_load.4 = 7778, -15.34, 0, 0, ECONOMY ROWS 14-20 (seats: 42 max: 7780lb/3530kg), 0
    // station_load.5 = 7778, -32.81, 0, 0, ECONOMY ROWS 21-27 (seats: 42 max: 7780lb/3530kg), 0
    // station_load.6 = 7500, 18.28, 0, 0, FWD BAGGAGE/CONTAINER (max: 7500lb/3402kg), 0
    // station_load.7 = 0, -15.96, 0, 0, AFT CONTAINER (max: 5350lb/2426kg), 0
    // station_load.8 = 4652, -27.10, 0, 0, AFT BAGGAGE (max: 4650lb/2110kg), 0
    // station_load.9 = 0, -37.35, 0, 0, COMP 5 - AFT BULK/LOOSE (max: 3300lb/1497kg), 0

    console.log('loadBaggagePayload');
    const currentPaxWeight = mcdu.aocWeight.paxWeight || mcdu.simbrief.paxWeight;

    for (var [stationName, station] of Object.entries(mcdu.paxStations)) {
        console.log(`PAYLOAD STATION WEIGHT:${station.stationIndex}`);
        console.log(station.pax);
        console.log(currentPaxWeight);
        SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, "kilograms", station.pax * currentPaxWeight);
    }

    // const FORWARD_BAGGAGE_INDEX = 3 + 1; // Value from flight_model.cfg
    // const REAR_BAGGAGE_INDEX = 5 + 1; // Value from flight_model.cfg

    // const currentfwdBag = getCurrentFwdBag(mcdu);
    // const currentRearBag = getCurrentRearBag(mcdu);

    // mcdu.aocWeight.loading = true;
    // updateView();

    // const payloadCount = SimVar.GetSimVarValue("PAYLOAD STATION COUNT", "number");
    // for (let i = 1; i <= payloadCount; i++) {
    //     switch (i) {
    //         case FORWARD_BAGGAGE_INDEX: {
    //             await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${i}`, "kilograms", +currentfwdBag);
    //             break;
    //         }
    //         case REAR_BAGGAGE_INDEX: {
    //             await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${i}`, "kilograms", +currentRearBag);
    //             break;
    //         }
    //         default: {
    //             await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${i}`, "kilograms", 0);
    //             break;
    //         }
    //     }
    // }

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
 * TODO: Add passengers stations weight into account
 */
function getZfwcg(mcdu) {
    const currentPaxWeight = mcdu.aocWeight.paxWeight || mcdu.simbrief.paxWeight;

    const leMacZ = -5.233333; // Value from Debug Weight
    const macSize = 14.0623; // Value from Debug Aircraft Sim Tunning

    const EMPTY_AIRCRAFT_WEIGHT = 90400 * 0.453592; // Value from flight_model.cfg to kgs
    const EMPTY_AIRCRAFT_POSITION = -8.75; // Value from flight_model.cfg
    const emptyAircraftMoment = EMPTY_AIRCRAFT_POSITION * EMPTY_AIRCRAFT_WEIGHT;

    const totalMass = Object.entries(mcdu.paxStations).map(([stationName, station]) => station.pax * currentPaxWeight).reduce((acc, cur) => acc + cur, 0) + EMPTY_AIRCRAFT_WEIGHT;
    const totalMoment = Object.entries(mcdu.paxStations).map(([stationName, station]) => (station.pax * currentPaxWeight) * station.position).reduce((acc, cur) => acc + cur, 0) + emptyAircraftMoment;

    console.log('totalMass', totalMass);
    console.log('totalMoment', totalMoment);

    const cgPosition = totalMoment / totalMass;

    const cgPositionToLemac = cgPosition - leMacZ;

    const cgPercentMac = -100 * cgPositionToLemac / macSize;

    return cgPercentMac;
}
