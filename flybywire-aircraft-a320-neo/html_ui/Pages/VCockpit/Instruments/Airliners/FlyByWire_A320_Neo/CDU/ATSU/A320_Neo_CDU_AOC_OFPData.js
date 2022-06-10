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

        // regular update while boarding/de-boarding is running
        mcdu.page.SelfPtr = setTimeout(() => {
            if (boardingStartedByUser) {
                updateView();
            }
        }, mcdu.PageTimeout.Fast);

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
                    setDefaultWeights(0, 0);
                    await SimVar.SetSimVarValue(`L:${station.simVar}_DESIRED`, "Number", value);
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

        async function setTargetCargo(numberOfPax, simbriefFreight) {
            const BAG_WEIGHT = SimVar.GetSimVarValue("L:A32NX_WB_PER_BAG_WEIGHT", "Number");
            const bagWeight = numberOfPax * BAG_WEIGHT;
            const maxLoadInCargoHold = Math.round(NXUnits.kgToUser(9435)); // from flight_model.cfg
            const loadableCargoWeight = Math.min(bagWeight + parseInt(simbriefFreight), maxLoadInCargoHold);

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
                    setDefaultWeights(0, 0);
                    await setTargetPax(value);
                    await setTargetCargo(value, 0);
                    updateView();
                }
            );

        }

        function buildTotalCargoValue() {
            const currentLoad = Object.values(cargoStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}`, "Number")).reduce((acc, cur) => acc + cur);
            const loadTarget = Object.values(cargoStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, "Number")).reduce((acc, cur) => acc + cur);
            const suffix = loadTarget === currentLoad ? "[color]green" : "[color]cyan";
            const unitMaximum = (getUserUnit()) == "Kilograms" ? 9.5 : 20.8;

            return new CDU_SingleValueField(mcdu,
                "number",
                `${(currentLoad / 1000).toFixed(1)} (${(loadTarget / 1000).toFixed(1)})`,
                {
                    emptyValue: "__[color]amber",
                    clearable: true,
                    suffix: suffix,
                    maxLength: 4,
                    minValue: 0.0,
                    maxValue: unitMaximum,
                },
                async (value) => {
                    await setTargetCargo(0, (value * 1000));
                    updateView();
                }
            );
        }

        const display = [
            ["W/B"],
            ["TOTAL PAX", "PAYLOAD"],
            [buildTotalPaxValue(), `${Math.round(getTotalPayload())}[color]green`],
            [paxStations.rows1_6.name, "ZFW"],
            [buildStationValue(paxStations.rows1_6), `${Math.round(getZfw())}[color]green`],
            [paxStations.rows7_13.name, "ZFW CG"],
            [buildStationValue(paxStations.rows7_13), zfwcg],
            [paxStations.rows14_21.name, "CARGO HOLD"],
            [buildStationValue(paxStations.rows14_21), buildTotalCargoValue()],
            [paxStations.rows22_29.name, "OFP REQUEST"],
            [buildStationValue(paxStations.rows22_29), requestButton],
            ["\xa0AOC MENU", "BOARDING\xa0"],
            ["<RETURN", loadButton]
        ];
        mcdu.setTemplate(display);

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[4] = () => {
            getSimBriefOfp(mcdu, updateView, () => {
                setDefaultWeights(mcdu.simbrief.paxWeight, mcdu.simbrief.bagWeight);
                setTargetPax(mcdu.simbrief.paxCount).then(() => {
                    setTargetCargo(mcdu.simbrief.bagCount, mcdu.simbrief.freight).then(() => {
                        updateView();
                    });
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
