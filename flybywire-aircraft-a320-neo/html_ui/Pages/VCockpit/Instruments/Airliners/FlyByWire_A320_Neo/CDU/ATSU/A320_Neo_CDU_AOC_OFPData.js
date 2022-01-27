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
        mcdu.activeSystem = 'ATSU';

        function updateView() {
            if (mcdu.page.Current === mcdu.page.AOCOfpData) {
                CDUAocOfpData.ShowPage(mcdu);
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
                    await setTargetCargo(value, '');
                    updateView();
                }
            );
        }

        async function setTargetPax(numberOfPax) {

            let paxRemaining = parseInt(numberOfPax);

            async function fillStation(station, percent, paxToFill) {

                const pax = Math.min(Math.trunc(percent * paxToFill), station.seats);
                station.pax = pax;

                await SimVar.SetSimVarValue(`L:${station.simVar}_DESIRED`, "Number", parseInt(pax));

                paxRemaining -= pax;
            }

            await fillStation(paxStations['rows22_29'], .28 , numberOfPax);
            await fillStation(paxStations['rows14_21'], .28, numberOfPax);
            await fillStation(paxStations['rows7_13'], .25 , numberOfPax);
            await fillStation(paxStations['rows1_6'], 1 , paxRemaining);
            return;
        }

        async function setTargetCargo(numberOfPax, simbriefCargo) {
            const bagWeight = numberOfPax * 20;
            const maxLoadInCargoHold = 9435; // from flight_model.cfg
            const maxTotalPayload = 21800; // from flight_model.cfg
            let loadableCargoWeight = undefined;

            if (simbriefCargo == 0) {
                loadableCargoWeight = bagWeight;
            } else if ((simbriefCargo + bagWeight + (numberOfPax * PAX_WEIGHT)) > maxTotalPayload) {
                loadableCargoWeight = maxTotalPayload - (numberOfPax * PAX_WEIGHT);
            } else {
                loadableCargoWeight = simbriefCargo + bagWeight;
            }
            let remainingWeight = loadableCargoWeight;

            async function fillCargo(station, percent, loadableCargoWeight) {

                const weight = Math.round(percent * loadableCargoWeight);
                station.load = weight;
                remainingWeight -= weight;
                await SimVar.SetSimVarValue(`L:${station.simVar}_DESIRED`, "Number", parseInt(weight));

            }

            await fillCargo(cargoStations['fwdBag'], .361 , loadableCargoWeight);
            await fillCargo(cargoStations['aftBag'], .220, loadableCargoWeight);
            await fillCargo(cargoStations['aftCont'], .251, loadableCargoWeight);
            await fillCargo(cargoStations['aftBulk'], 1, remainingWeight);
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
                    await setTargetCargo(value, '');
                    updateView();
                }
            );

        }

        function buildTotalCargoValue() {
            const currentLoad = Object.values(cargoStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}`, "Number")).reduce((acc, cur) => acc + cur);
            const loadTarget = Object.values(cargoStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, "Number")).reduce((acc, cur) => acc + cur);
            const paxTarget = Object.values(paxStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, "Number")).reduce((acc, cur) => acc + cur);
            const suffix = loadTarget === currentLoad ? "[color]green" : "[color]cyan";

            return new CDU_SingleValueField(mcdu,
                "number",
                `${(currentLoad / 1000).toFixed(1)} (${(loadTarget / 1000).toFixed(1)})`,
                {
                    emptyValue: "__[color]amber",
                    clearable: true,
                    suffix: suffix,
                    maxLength: 4,
                    minValue: 0.0,
                    maxValue: 9.4,
                },
                async (value) => {
                    await setTargetPax(paxTarget);
                    await setTargetCargo(paxTarget, (value * 1000));
                    updateView();
                }
            );

        }

        const display = [
            ["W/B"],
            ["TOTAL PAX", "PAYLOAD"],
            [buildTotalPaxValue(), `${Math.round(NXUnits.kgToUser(getTotalPayload()))}[color]green`],
            [paxStations.rows1_6.name, "ZFW"],
            [buildStationValue(paxStations.rows1_6), `${Math.round(NXUnits.kgToUser(getZfw()))}[color]green`],
            [paxStations.rows7_13.name, "ZFW CG"],
            [buildStationValue(paxStations.rows7_13), zfwcg],
            [paxStations.rows14_21.name, "CARGO HOLD"],
            [buildStationValue(paxStations.rows14_21), buildTotalCargoValue()],
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
                setTargetCargo(mcdu.simbrief.paxCount, parseInt(mcdu.simbrief.cargo)).then(() => {
                    updateView();
                });
            });
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[5] = async () => {
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

const payloadConstruct = new A32NX_PayloadConstructor();
const paxStations = payloadConstruct.paxStations;
const cargoStations = payloadConstruct.cargoStations;

const MAX_SEAT_AVAILABLE = 174;
const PAX_WEIGHT = 84;
const BAG_WEIGHT = 20;

/**
     * Calculate %MAC ZWFCG of all stations
     */
function getZfwcg() {
    const currentPaxWeight = PAX_WEIGHT;

    const leMacZ = -5.386; // Accurate to 3 decimals, replaces debug weight values
    const macSize = 13.454; // Accurate to 3 decimals, replaces debug weight values

    const emptyWeight = (SimVar.GetSimVarValue("EMPTY WEIGHT", "Kilograms"));
    const emptyPosition = -8.75; // Value from flight_model.cfg
    const emptyMoment = emptyPosition * emptyWeight;

    const paxTotalMass = Object.values(paxStations).map((station) => (SimVar.GetSimVarValue(`L:${station.simVar}`, "Number") * currentPaxWeight)).reduce((acc, cur) => acc + cur, 0);
    const paxTotalMoment = Object.values(paxStations).map((station) => (SimVar.GetSimVarValue(`L:${station.simVar}`, "Number") * currentPaxWeight) * station.position).reduce((acc, cur) => acc + cur, 0);

    const cargoTotalMass = Object.values(cargoStations).map((station) => SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, "Number")).reduce((acc, cur) => acc + cur, 0);
    const cargoTotalMoment = Object.values(cargoStations).map((station) => (SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, "Number") * station.position)).reduce((acc, cur) => acc + cur, 0);

    const totalMass = emptyWeight + paxTotalMass + cargoTotalMass;
    const totalMoment = emptyMoment + paxTotalMoment + cargoTotalMoment;

    const cgPosition = totalMoment / totalMass;
    const cgPositionToLemac = cgPosition - leMacZ;
    const cgPercentMac = -100 * (cgPositionToLemac / macSize);

    return cgPercentMac;
}

function getTotalCargo() {
    const cargoTotalMass = Object.values(cargoStations).filter((station) => station.visible).map((station) => SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, "Number")).reduce((acc, cur) => acc + cur, 0);

    return cargoTotalMass;
}

function getTotalPayload() {
    const currentPaxWeight = PAX_WEIGHT;

    const paxTotalMass = Object.values(paxStations).map((station) => (SimVar.GetSimVarValue(`L:${station.simVar}`, "Number") * currentPaxWeight)).reduce((acc, cur) => acc + cur, 0);
    const cargoTotalMass = getTotalCargo();

    return paxTotalMass + cargoTotalMass;
}

function getZfw() {
    const emptyWeight = (SimVar.GetSimVarValue("EMPTY WEIGHT", "Kilograms"));
    return emptyWeight + getTotalPayload();
}
