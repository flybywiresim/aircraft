/**
 * Value is rounded to 1000 and fixed to 1 decimal
 * @param {number | string} value
 */
function formatWeight(value) {
    return (+value).toFixed(1);
}

class CDUAocInit {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUAocInit.ShowPage(fmc, mcdu);
        }, 'ATSU');

        let fltNbr = '_______[color]amber';
        let originIcao = '____[color]amber';
        let destinationIcao = '____[color]amber';
        let ete = "____[color]amber";
        let fob = `{small}---.-{end}[color]white`;
        let requestButton = "INIT DATA REQ*[color]cyan";
        let gmt = "0000[color]green";

        const seconds = Math.floor(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
        gmt = `{small}${FMCMainDisplay.secondsTohhmm(seconds)}{end}[color]green`;

        if (fmc.simbrief.sendStatus !== "READY" && fmc.simbrief.sendStatus !== "DONE") {
            requestButton = "INIT DATA REQ [color]cyan";
        }
        if (fmc.simbrief.originIcao) {
            originIcao = `${fmc.simbrief.originIcao}[color]cyan`;
        }
        if (fmc.simbrief.destinationIcao) {
            destinationIcao = `${fmc.simbrief.destinationIcao}[color]cyan`;
        }
        if (fmc.simbrief.icao_airline || fmc.simbrief.flight_number) {
            fltNbr = `{small}${fmc.simbrief.icao_airline}${fmc.simbrief.flight_number}{end}[color]green`;
        }
        if (fmc.simbrief.ete) {
            ete = `${FMCMainDisplay.secondsTohhmm(fmc.simbrief.ete)}[color]cyan`;
        }

        const currentFob = formatWeight(NXUnits.kgToUser(fmc.getFOB()));
        if (currentFob) {
            fob = `{small}${currentFob}{end}[color]green`;
        }

        const display = [
            ["INIT/REVIEW", "1", "2", "AOC"],
            ["FMC FLT NO", "GMT"],
            [fltNbr, gmt],
            ["DEP"],
            [originIcao],
            ["DEST"],
            [destinationIcao, "CREW DETAILS>[color]inop"],
            ["FOB"],
            ["   " + fob],
            ["ETE"],
            [ete, requestButton],
            ["", "ADVISORY "],
            ["<AOC MENU"]
        ];
        mcdu.setTemplate(display);

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = () => {
            // Crew Details
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
            CDUAocInit.ShowPage2(fmc, mcdu);
        };
    }

    static ShowPage2(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUAocInit.ShowPage2(fmc, mcdu);
        }, 'ATSU');

        const currentFob = formatWeight(NXUnits.kgToUser(mcdu.getFOB()));

        /**
            GMT: is the current zulu time
            FLT time: is wheels up to wheels down... so basically shows 0000 as soon as you are wheels up, counts up and then stops timing once you are weight on wheels again
            Out: is when you set the brakes to off...
            Doors: When the last door closes
            Off: remains blank until Take off time
            On: remains blank until Landing time
            In: remains blank until brakes set to park AND the first door opens
         */
        let fob = `{small}---.-{end}[color]white`;
        let fltTime = `----[color]white`;
        let outTime = `----[color]white`;
        let doorsTime = `----[color]white`;
        let offTime = `----[color]white`;
        let onTime = `----[color]white`;
        let inTime = `----[color]white`;
        let blockTime = `----[color]white`;
        let gmt = "0000[color]green";

        const seconds = Math.floor(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
        gmt = `{small}${FMCMainDisplay.secondsTohhmm(seconds)}{end}[color]green`;

        if (currentFob) {
            fob = `{small}${currentFob}{end}[color]green`;
        }
        if (fmc.aocTimes.out) {
            outTime = `${FMCMainDisplay.secondsTohhmm(fmc.aocTimes.out)}[color]green`;
        }
        if (fmc.aocTimes.doors) {
            doorsTime = `${FMCMainDisplay.secondsTohhmm(fmc.aocTimes.doors)}[color]green`;
        }
        if (fmc.aocTimes.off) {
            offTime = `${FMCMainDisplay.secondsTohhmm(fmc.aocTimes.off)}[color]green`;
            let currentfltTime = 0;
            if (fmc.aocTimes.on) {
                currentfltTime = fmc.aocTimes.on - fmc.aocTimes.off;
            } else {
                currentfltTime = seconds - fmc.aocTimes.off;
            }
            fltTime = `${FMCMainDisplay.secondsTohhmm(currentfltTime)}[color]green`;
        }
        if (fmc.aocTimes.on) {
            onTime = `${FMCMainDisplay.secondsTohhmm(fmc.aocTimes.on)}[color]green`;
        }
        if (fmc.aocTimes.in) {
            inTime = `${FMCMainDisplay.secondsTohhmm(fmc.aocTimes.in)}[color]green`;
        }
        if (fmc.simbrief["blockTime"]) {
            blockTime = `${FMCMainDisplay.secondsTohhmm(fmc.simbrief.blockTime)}[color]green`;
        }

        const display = [
            ["INIT/REVIEW", "2", "2", "AOC"],
            [" OUT", "OFF ", "DOORS"],
            [outTime, offTime, doorsTime],
            [" ON", "IN ", "GMT"],
            [onTime, inTime, gmt],
            [" BLK TIME", "FLT TIME "],
            [blockTime, fltTime],
            [" FUEL REM", "LDG PILOT "],
            ["   " + fob, "-------"],
            ["", ""],
            ["*AUTOLAND <{small}n{end}>[color]cyan"],
            ["", "ADVISORY "],
            ["<AOC MENU"]
        ];
        mcdu.setTemplate(display);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(fmc, mcdu);
        };

        mcdu.onPrevPage = () => {
            CDUAocInit.ShowPage(fmc, mcdu);
        };
    }
}
