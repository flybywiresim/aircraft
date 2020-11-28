/**
 * Value is rounded to 1000 and fixed to 1 decimal
 * @param {number | string} value
 */
function formatWeightInTons(value) {
    return (+value / 1000).toFixed(1);
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

        let blockFuel = "_____[color]red";
        let taxiFuel = "____[color]red";
        let tripFuel = "_____[color]red";
        let estZfw = "__._[color]red";
        let payload = "_____[color]red";
        let requestButton = "SEND*[color]blue";

        if (mcdu.simbrief.sendStatus !== "READY" && mcdu.simbrief.sendStatus !== "DONE") {
            requestButton = "SEND [color]blue";
        }

        const cgPercent = SimVar.GetSimVarValue("CG PERCENT", "percent");

        const cgColor = cgPercent >= 16 && cgPercent <= 40 ? 'green' : 'red';
        const cg = `{small}${cgPercent.toFixed(1)}{end}[color]${cgColor}`;

        const currentBlockFuel = mcdu.aocWeight.blockFuel || mcdu.simbrief.blockFuel;
        if (currentBlockFuel) {
            const size = mcdu.aocWeight.blockFuel ? 'big' : 'small';
            blockFuel = `{${size}}${currentBlockFuel}{end}[color]blue`;
        }

        const currentEstZfw = mcdu.aocWeight.estZfw || mcdu.simbrief.estZfw;
        if (currentEstZfw) {
            const size = mcdu.aocWeight.estZfw ? 'big' : 'small';
            estZfw = `{${size}}${formatWeightInTons(currentEstZfw)}{end}[color]blue`;
        }

        const currentTaxiFuel = mcdu.aocWeight.taxiFuel || mcdu.simbrief.taxiFuel;
        if (currentTaxiFuel) {
            const size = mcdu.aocWeight.taxiFuel ? 'big' : 'small';
            taxiFuel = `{${size}}${currentTaxiFuel}{end}[color]blue`;
        }

        const currentTripFuel = mcdu.aocWeight.tripFuel || mcdu.simbrief.tripFuel;
        if (currentTripFuel) {
            const size = mcdu.aocWeight.tripFuel ? 'big' : 'small';
            tripFuel = `{${size}}${currentTripFuel}{end}[color]blue`;
        }

        const currentPayload = mcdu.aocWeight.payload || mcdu.simbrief.payload;
        if (currentPayload) {
            const size = mcdu.aocWeight.payload ? 'big' : 'small';
            payload = `{${size}}${currentPayload}{end}[color]blue`;
        }

        const display = [
            ["OFP WT/BAL", undefined, undefined, "AOC"],
            ["BLOCK FUEL", "ZFW"],
            [blockFuel, estZfw],
            ["TAXI FUEL", "CG"],
            [taxiFuel, cg],
            ["TRIP FUEL", "PAYLOAD"],
            [tripFuel, payload],
            ["PAYLOAD"],
            ["*LOAD[color]blue", "PRINT*[color]inop"],
            ["REFUEL", "OFP REQUEST[color]blue"],
            ["*LOAD[color]blue", requestButton],
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
            if (enteredFuel > 0 && enteredFuel <= maxAllowableFuel) {
                mcdu.aocWeight.blockFuel = enteredFuel.toString();
                updateView();
                return true;
            }
            mcdu.showErrorMessage(mcdu.defaultInputErrorMessage);
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
            if (enteredFuel > 0 && enteredFuel <= maxAllowableFuel) {
                mcdu.aocWeight.taxiFuel = enteredFuel.toString();
                updateView();
                return true;
            }
            mcdu.showErrorMessage(mcdu.defaultInputErrorMessage);
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
            if (enteredFuel > 0 && enteredFuel <= maxAllowableFuel) {
                mcdu.aocWeight.tripFuel = enteredFuel.toString();
                updateView();
                return true;
            }
            mcdu.showErrorMessage(mcdu.defaultInputErrorMessage);
            return false;
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[3] = async () => {
            if (currentPayload) {
                const pilotWeightInPounds = 200; // One pilot
                const currentPayloadInPounds = (+currentPayload * 2.20462) - (pilotWeightInPounds * 2); // kg to pounds minus two pilots

                const payloadCount = SimVar.GetSimVarValue("PAYLOAD STATION COUNT", "number");
                for (let i = 1; i <= payloadCount; i++) {
                    if (i === 1 || i === 2) {
                        // Pilots
                        await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${i}`, "Pounds", pilotWeightInPounds);
                    } else {
                        await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${i}`, "Pounds", currentPayloadInPounds / 4);
                    }
                }

                updateView();
            }
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[1] = async () => {
            if (currentPayload) {
                const pilotWeightInPounds = 200; // One pilot
                const currentPayloadInPounds = (+currentPayload * 2.20462) - (pilotWeightInPounds * 2); // kg to pounds minus two pilots

                const payloadCount = SimVar.GetSimVarValue("PAYLOAD STATION COUNT", "number");
                for (let i = 1; i <= payloadCount; i++) {
                    if (i === 1 || i === 2) {
                        // Pilots
                        await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${i}`, "Pounds", pilotWeightInPounds);
                    } else {
                        await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${i}`, "Pounds", currentPayloadInPounds / 4);
                    }
                }

                updateView();
            }
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[4] = async () => {
            if (currentBlockFuel) {
                const outerTankCapacity = 200; // Left and Right
                const innerTankCapacity = 1800; // Left and Right
                const centerTankCapacity = 3000; // Center

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
    }
}
