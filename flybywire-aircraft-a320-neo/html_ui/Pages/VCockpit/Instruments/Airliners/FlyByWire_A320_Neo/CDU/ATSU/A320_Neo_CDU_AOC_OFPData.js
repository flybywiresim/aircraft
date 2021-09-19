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
 * AOC - OFP WEIGHT
 * Fetch and display weight data to be loaded to the aircraft via the MCDU
 * - You can either fetch the weight from SimBrief or
 * - You can enter/edit manually each field
 */
class CDUAocOfpData {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AOCOfpData;
        mcdu.pageRedrawCallback = () => CDUAocOfpData.ShowPage(mcdu);
        mcdu.activeSystem = 'ATSU';

        function updateView() {
            if (mcdu.page.Current === mcdu.page.AOCOfpData) {
                CDUAocOfpData.ShowPage(mcdu);
            }
        }

        const maxAllowableFuel = 19046; // in kilograms

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
            blockFuel = `{${size}}${Math.round(NXUnits.kgToUser(currentBlockFuel))}{end}[color]cyan`;
        }

        const currentTaxiFuel = mcdu.aocWeight.taxiFuel || mcdu.simbrief.taxiFuel;
        if (currentTaxiFuel) {
            const size = mcdu.aocWeight.taxiFuel ? 'big' : 'small';
            taxiFuel = `{${size}}${Math.round(NXUnits.kgToUser(currentTaxiFuel))}{end}[color]cyan`;
        }

        const currentTripFuel = mcdu.aocWeight.tripFuel || mcdu.simbrief.tripFuel;
        if (currentTripFuel) {
            const size = mcdu.aocWeight.tripFuel ? 'big' : 'small';
            tripFuel = `{${size}}${Math.round(NXUnits.kgToUser(currentTripFuel))}{end}[color]cyan`;
        }

        const display = [
            ["W/B", "1", "2", "AOC"],
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
                mcdu.aocWeight.blockFuel = undefined;
                updateView();
                return true;
            }
            const enteredFuel = NXUnits.userToKg(Math.round(+value));
            if (enteredFuel >= 0 && enteredFuel <= maxAllowableFuel) {
                mcdu.aocWeight.blockFuel = enteredFuel;
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
                mcdu.aocWeight.taxiFuel = undefined;
                updateView();
                return true;
            }
            const enteredFuel = NXUnits.userToKg(Math.round(+value));
            if (enteredFuel >= 0 && enteredFuel <= maxAllowableFuel) {
                mcdu.aocWeight.taxiFuel = enteredFuel;
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
            if (value === FMCMainDisplay.clrValue) {
                mcdu.aocWeight.tripFuel = undefined;
                updateView();
                return true;
            }
            const enteredFuel = NXUnits.userToKg(Math.round(+value));
            if (enteredFuel >= 0 && enteredFuel <= maxAllowableFuel) {
                mcdu.aocWeight.tripFuel = enteredFuel;
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
            const onGround = SimVar.GetSimVarValue("SIM ON GROUND", "Bool");
            const gs = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            const oneEngineRunning = SimVar.GetSimVarValue('GENERAL ENG COMBUSTION:1', 'bool') ||
                SimVar.GetSimVarValue('GENERAL ENG COMBUSTION:2', 'bool');

            if (gs < 1 && onGround && currentBlockFuel && !oneEngineRunning) {
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

        function updateView() {
            if (mcdu.page.Current === mcdu.page.AOCOfpData2) {
                CDUAocOfpData.ShowPage2(mcdu);
            }
        }

        mcdu.refreshPageCallback = () => {
            updateView();
        };
        SimVar.SetSimVarValue("L:FMC_UPDATE_CURRENT_PAGE", "number", 1);

        const boardingStartedByUser = SimVar.GetSimVarValue("L:A32NX_BOARDING_STARTED_BY_USR", "Bool");

        let zfwcg = "__._[color]amber";
        let requestButton = "SEND*[color]cyan";
        let loadButton = "START*[color]cyan";

        if (mcdu.simbrief.sendStatus !== "READY" && mcdu.simbrief.sendStatus !== "DONE") {
            requestButton = "SEND [color]cyan";
        }

        if (boardingStartedByUser) {
            loadButton = "STOP*[color]yellow";
        }

        function buildStationValue(station) {
            const targetPax = SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, "Number");
            const pax = SimVar.GetSimVarValue(`L:${station.simVar}`, "Number");

            const suffix = targetPax === pax ? "[color]green" : "[color]cyan";

            return new CDU_SingleValueField(mcdu,
                "int",
                `${pax} (${targetPax})`,
                {
                    emptyValue: "__[color]amber",
                    suffix: suffix,
                    maxLength: 2,
                    minValue: 0,
                    maxValue: station.seats,
                },
                async (value) => {
                    await SimVar.SetSimVarValue(`L:${station.simVar}_DESIRED`, "Number", value);
                    updateView();
                }
            );
        }

        async function loadFlightCrew() {
            const PILOT_WEIGHT = 84;
            const CREW_BAGGAGE = 20;
            const FLIGHTCREW_WEIGHT = 104 * 2;
            await SimVar.SetSimVarValue("PAYLOAD STATION WEIGHT:1", "kilograms", PILOT_WEIGHT + CREW_BAGGAGE);
            await SimVar.SetSimVarValue("PAYLOAD STATION WEIGHT:2", "kilograms", PILOT_WEIGHT + CREW_BAGGAGE);
        }

        async function setTargetPax(numberOfPax) {

            let paxRemaining = parseInt(numberOfPax);

            async function fillStation(station, percent, paxToFill) {

                const pax = Math.min(Math.round(percent * paxToFill), station.seats);
                station.pax = pax;

                await SimVar.SetSimVarValue(`L:${station.simVar}_DESIRED`, "Number", parseInt(pax));

                paxRemaining -= pax;
            }

            await fillStation(paxStations['rows22_29'], .275 , numberOfPax);
            await fillStation(paxStations['rows14_21'], .275, numberOfPax);
            await fillStation(paxStations['rows7_13'], .240 , numberOfPax);
            await fillStation(paxStations['rows1_6'], 1 , paxRemaining);
            return;
        }

        const currentZfwcg = getZfwcg();
        if (currentZfwcg !== undefined) {
            const cgColor = currentZfwcg >= 16 && currentZfwcg <= 40 ? 'green' : 'red';
            zfwcg = `${currentZfwcg.toFixed(1)}{end}[color]${cgColor}`;
        }

        function buildTotalPaxValue() {
            const currentPax = Object.values(paxStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}`, "Number")).reduce((acc, cur) => acc + cur);
            const paxTarget = Object.values(paxStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, "Number")).reduce((acc, cur) => acc + cur);

            const suffix = paxTarget === currentPax ? "[color]green" : "[color]cyan";

            return new CDU_SingleValueField(mcdu,
                "int",
                `${currentPax} (${paxTarget})`,
                {
                    emptyValue: "__[color]amber",
                    suffix: suffix,
                    maxLength: 3,
                    minValue: 0,
                    maxValue: MAX_SEAT_AVAILABLE,
                },
                async (value) => {
                    await setTargetPax(value);
                    updateView();
                }
            );

        }

        const display = [
            ["W/B", "2", "2", "AOC"],
            ["TOTAL PAX", "PAYLOAD"],
            [buildTotalPaxValue(), `${Math.round(NXUnits.kgToUser(getTotalPayload()))}[color]green`],
            [paxStations.rows1_6.name, "ZFW"],
            [buildStationValue(paxStations.rows1_6), `${Math.round(NXUnits.kgToUser(getZfw()))}[color]green`],
            [paxStations.rows7_13.name, "ZFW CG"],
            [buildStationValue(paxStations.rows7_13), zfwcg],
            [paxStations.rows14_21.name, "CARGO"],
            [buildStationValue(paxStations.rows14_21), `${Math.round(NXUnits.kgToUser(getTotalCargo()))} >[color]inop`],
            [paxStations.rows22_29.name, "OFP REQUEST"],
            [buildStationValue(paxStations.rows22_29), requestButton],
            ["", "BOARDING"],
            ["<AOC MENU", loadButton]
        ];
        mcdu.setTemplate(display);

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[4] = () => {
            getSimBriefOfp(mcdu, updateView, () => {
                setTargetPax(mcdu.simbrief.paxCount).then(() => {
                    updateView();
                });
            });
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[5] = async () => {
            loadFlightCrew();
            await SimVar.SetSimVarValue("L:A32NX_BOARDING_STARTED_BY_USR", "Bool", !boardingStartedByUser);

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

async function loadFuel(mcdu, updateView) {
    const currentBlockFuel = mcdu.aocWeight.blockFuel || mcdu.simbrief.blockFuel;

    mcdu.aocWeight.loading = true;
    updateView();

    const outerTankCapacity = 228; // Left and Right // Value from flight_model.cfg (GALLONS)
    const innerTankCapacity = 1816; // Left and Right // Value from flight_model.cfg (GALLONS)
    const centerTankCapacity = 2179; // Center // Value from flight_model.cfg (GALLONS)

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

const payloadConstruct = new A32NX_PayloadConstructor();
const paxStations = payloadConstruct.paxStations;
const cargoStations = payloadConstruct.payloadStations;

const MAX_SEAT_AVAILABLE = 174;
const PAX_WEIGHT = 84;
const BAG_WEIGHT = 20;

/**
     * Calculate %MAC ZWFCG of all stations
     */
function getZfwcg() {
    const currentPaxWeight = PAX_WEIGHT + BAG_WEIGHT;

    const leMacZ = -5.386; // Accurate to 3 decimals, replaces debug weight values
    const macSize = 13.454; // Accurate to 3 decimals, replaces debug weight values

    const emptyWeight = 101990 * 0.453592; // Value from flight_model.cfg to kgs
    const emptyPosition = -8.75; // Value from flight_model.cfg
    const emptyMoment = emptyPosition * emptyWeight;

    const paxTotalMass = Object.values(paxStations).map((station) => (SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, "Number") * currentPaxWeight)).reduce((acc, cur) => acc + cur, 0);
    const paxTotalMoment = Object.values(paxStations).map((station) => (SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, "Number") * currentPaxWeight) * station.position).reduce((acc, cur) => acc + cur, 0);

    const payloadTotalMass = Object.values(cargoStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}`, "Number")).reduce((acc, cur) => acc + cur, 0);
    const payloadTotalMoment = Object.values(cargoStations).map((station) => (SimVar.GetSimVarValue(`L:${station.simVar}`, "Number") * station.position)).reduce((acc, cur) => acc + cur, 0);

    const totalMass = emptyWeight + paxTotalMass + payloadTotalMass;
    const totalMoment = emptyMoment + paxTotalMoment + payloadTotalMoment;

    const cgPosition = totalMoment / totalMass;
    const cgPositionToLemac = cgPosition - leMacZ;
    const cgPercentMac = -100 * (cgPositionToLemac / macSize);

    return cgPercentMac;
}

function getTotalCargo() {
    const cargoTotalMass = Object.values(cargoStations).filter((station) => station.visible).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}`, "Number")).reduce((acc, cur) => acc + cur, 0);

    return cargoTotalMass;
}

function getTotalPayload() {
    const currentPaxWeight = PAX_WEIGHT + BAG_WEIGHT;

    const paxTotalMass = Object.values(paxStations).map((station) => (SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, "Number") * currentPaxWeight)).reduce((acc, cur) => acc + cur, 0);
    const cargoTotalMass = getTotalCargo();

    return paxTotalMass + cargoTotalMass;
}

function getZfw() {
    const emptyWeight = 101990 * 0.453592; // Value from flight_model.cfg to kgs
    return emptyWeight + getTotalPayload();
}
