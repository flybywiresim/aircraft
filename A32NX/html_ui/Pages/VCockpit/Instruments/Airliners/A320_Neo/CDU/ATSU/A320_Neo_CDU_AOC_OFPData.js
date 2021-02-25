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

const MAX_SEAT_AVAILABLE = 162;
const PAX_WEIGHT = 84;
const BAG_WEIGHT = 20;

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

        let zfwcg = "__._[color]amber";
        let noPax = "___[color]white";
        let paxWeight = "___[color]white";
        let bagWeight = "___[color]white";
        let requestButton = "SEND*[color]cyan";
        let loadButton = "START*[color]cyan";

        if (mcdu.simbrief.sendStatus !== "READY" && mcdu.simbrief.sendStatus !== "DONE") {
            requestButton = "SEND [color]cyan";
        }

        if (mcdu.aocWeight.loading) {
            loadButton = "LOAD [color]cyan";
        }

        const currentZfwcg = mcdu.aocWeight.zfwcg || getZfwcg(mcdu);
        if (currentZfwcg !== undefined) {
            const cgColor = currentZfwcg >= 16 && currentZfwcg <= 40 ? 'cyan' : 'red';
            const size = mcdu.aocWeight.zfwcg ? 'big' : 'small';
            zfwcg = `{${size}}${currentZfwcg.toFixed(1)}{end}[color]${cgColor}`;
        }

        const currentNoPax = mcdu.aocWeight.noPax || mcdu.simbrief.paxCount || 0;
        if (currentNoPax !== undefined) {
            const size = mcdu.aocWeight.noPax ? 'big' : 'small';
            noPax = `{${size}}${currentNoPax}{end}[color]green`;
        }

        const currentPaxWeight = mcdu.aocWeight.paxWeight || mcdu.simbrief.paxWeight || PAX_WEIGHT;
        if (currentPaxWeight !== undefined) {
            const size = currentPaxWeight != PAX_WEIGHT ? 'big' : 'small';
            paxWeight = `{${size}}${currentPaxWeight}{end}[color]green`;
        }

        const currentBagWeight = mcdu.aocWeight.baggageUnitWeight || BAG_WEIGHT;
        if (currentBagWeight !== undefined) {
            const size = currentBagWeight != BAG_WEIGHT ? 'big' : 'small';
            bagWeight = `{${size}}${currentBagWeight}{end}[color]green`;
        }

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

            setPayload(numberOfPax);
        }

        function setPayload(numberOfPax) {
            const noPax = parseInt(numberOfPax);
            const currentBagWeight = mcdu.aocWeight.baggageUnitWeight || BAG_WEIGHT;

            const bagWeightLeft = parseFloat(currentBagWeight) * noPax;

            function fillStation(station, bagWeightLeft) {
                station.currentWeight = Math.min(bagWeightLeft, station.weight);
                bagWeightLeft -= station.currentWeight;
            }

            // FWD BAGGAGE/CONTAINER / AFT BAGGAGE
            fillStation(mcdu.payloadStations["fwdBag"], bagWeightLeft);
            fillStation(mcdu.payloadStations["aftBag"], bagWeightLeft);

            // AFT CONTAINER / AFT BULK
            fillStation(mcdu.payloadStations["aftCont"], 0);
            fillStation(mcdu.payloadStations["aftBulk"], 0);
        }

        function showPaxNo(paxNo) {
            return `{small}{cyan}${paxNo}{end} (${paxNo * currentPaxWeight} ${mcdu.simbrief.units || ''}){end}`;
        }

        const display = [
            ["W&B", "2", "2", "AOC"],
            ["[ROWS 1-6]", "ZFWCG"],
            [showPaxNo(mcdu.paxStations["rows1_6"].pax), zfwcg],
            ["[ROWS 7-13]", "NO PAX"],
            [showPaxNo(mcdu.paxStations["rows7_13"].pax), noPax],
            ["[ROWS 14-20]", "PAX WEIGHT"],
            [showPaxNo(mcdu.paxStations["rows14_20"].pax), paxWeight],
            ["[ROWS 21-27]", "BAG WEIGHT"],
            [showPaxNo(mcdu.paxStations["rows21_27"].pax), bagWeight],
            ["", "OFP REQUEST[color]cyan"],
            [, requestButton],
            ["", "BOARDING/LOAD"],
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

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[1] = (value) => {
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

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                mcdu.aocWeight.paxWeight = PAX_WEIGHT;
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

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                mcdu.aocWeight.baggageUnitWeight = BAG_WEIGHT;
                updateView();
                return true;
            }
            if (value) {
                mcdu.aocWeight.baggageUnitWeight = value;
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
            getSimBriefOfp(mcdu, updateView, () => {
                if (parseInt(mcdu.simbrief.paxWeight) < PAX_WEIGHT) {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                }

                // Reset aocWeight object state
                mcdu.aocWeight = {
                    blockFuel: undefined,
                    estZfw: undefined,
                    taxiFuel: undefined,
                    tripFuel: undefined,
                    payload: undefined,
                    noPax: undefined,
                    baggageUnitWeight: undefined,
                    paxWeight: undefined,
                };

                const baggageUnitWeight = mcdu.simbrief.paxWeight - PAX_WEIGHT;

                mcdu.aocWeight.baggageUnitWeight = baggageUnitWeight;
                mcdu.aocWeight.paxWeight = PAX_WEIGHT;

                setPax(mcdu.simbrief.paxCount);

                updateView();
            });
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[5] = async () => {
            await loadPayload(mcdu);

            updateView();
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

async function loadPayload(mcdu) {
    const currentPaxWeight = mcdu.aocWeight.paxWeight || mcdu.simbrief.paxWeight || PAX_WEIGHT;

    mcdu.aocWeight.loading = true;

    for (const station of Object.values(mcdu.paxStations)) {
        await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, "kilograms", station.pax * currentPaxWeight);
    }

    for (const station of Object.values(mcdu.payloadStations)) {
        await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, "kilograms", station.currentWeight);
    }

    mcdu.aocWeight.loading = false;

    return;
}

async function loadFuel(mcdu, updateView) {
    const currentBlockFuel = mcdu.aocWeight.blockFuel || mcdu.simbrief.blockFuel;

    mcdu.aocWeight.loading = true;
    updateView();

    const outerTankCapacity = 228 + 1; // Left and Right // Value from flight_model.cfg (plus the unusable fuel capacity (GALLONS))
    const innerTankCapacity = 1816 + 7; // Left and Right // Value from flight_model.cfg (plus the unusable fuel capacity (GALLONS))
    const centerTankCapacity = 2179 + 6; // Center // Value from flight_model.cfg (plus the unusable fuel capacity (GALLONS))

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
 * Calculate %MAC ZWFCG based on Empty and Baggage weight only*
 * TODO: Add passengers stations weight into account
 */
function getZfwcg(mcdu) {
    const currentPaxWeight = mcdu.aocWeight.paxWeight || mcdu.simbrief.paxWeight || PAX_WEIGHT;

    const leMacZ = -5.233333; // Value from Debug Weight
    const macSize = 14.0623; // Value from Debug Aircraft Sim Tunning

    const emptyWeight = 90400 * 0.453592; // Value from flight_model.cfg to kgs
    const emptyPosition = -8.75; // Value from flight_model.cfg
    const emptyMoment = emptyPosition * emptyWeight;

    const paxTotalMass = Object.values(mcdu.paxStations).map(station => station.pax * currentPaxWeight).reduce((acc, cur) => acc + cur, 0);
    const paxTotalMoment = Object.values(mcdu.paxStations).map(station => (station.pax * currentPaxWeight) * station.position).reduce((acc, cur) => acc + cur, 0);

    const payloadTotalMass = Object.values(mcdu.payloadStations).map(station => station.currentWeight).reduce((acc, cur) => acc + cur, 0);
    const payloadTotalMoment = Object.values(mcdu.payloadStations).map(station => station.currentWeight * station.position).reduce((acc, cur) => acc + cur, 0);

    const totalMass = emptyWeight + paxTotalMass + payloadTotalMass;
    const totalMoment = emptyMoment + paxTotalMoment + payloadTotalMoment;

    const cgPosition = totalMoment / totalMass;
    const cgPositionToLemac = cgPosition - leMacZ;
    const cgPercentMac = -100 * cgPositionToLemac / macSize;

    return cgPercentMac;
}
