/**
 * Value is rounded to 1000 and fixed to 1 decimal
 * @param {number | string} value
 */
function formatWeight(value) {
    return (+value).toFixed(1);
}

class CDUAocInit {
    static CreateDataBlock() {
        return {
            requestedData: false,
            flightPlan: null,
        };
    }

    static ShowPage(mcdu, data = CDUAocInit.CreateDataBlock()) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AOCInit;
        mcdu.pageRedrawCallback = () => CDUAocInit.ShowPage(mcdu);
        mcdu.activeSystem = 'ATSU';

        let fltNbr = '_______[color]amber';
        let originIcao = '____[color]amber';
        let destinationIcao = '____[color]amber';
        let ete = "____[color]amber";
        let fob = `{small}---.-{end}[color]white`;
        let requestButton = "INIT DATA REQ*[color]cyan";
        if (data.requestedData === true) {
            requestButton = "INIT DATA REQ\xa0[color]cyan";
        }
        let gmt = "0000[color]green";

        const seconds = Math.floor(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
        gmt = `{small}${FMCMainDisplay.secondsTohhmm(seconds)}{end}[color]green`;

        function updateView() {
            if (mcdu.page.Current === mcdu.page.AOCInit) {
                CDUAocInit.ShowPage(mcdu, data);
            }
        }

        // regular update due to showing time on this page
        mcdu.page.SelfPtr = setTimeout(() => {
            updateView();
        }, mcdu.PageTimeout.Default);

        if (data.flightPlan) {
            originIcao = `${data.flightPlan.Origin.icao}[color]cyan`;
            destinationIcao = `${data.flightPlan.Destination.icao}[color]cyan`;
            fltNbr = `{small}${data.flightPlan.Flightnumber}{end}[color]green`;
            ete = `${FMCMainDisplay.secondsTohhmm(data.flightPlan.EstimatedTimeEnroute)}[color]cyan`;
        }

        const currentFob = formatWeight(NXUnits.kgToUser(mcdu.getFOB()));
        if (currentFob) {
            fob = `{small}${currentFob}{end}[color]green`;
        }

        mcdu.setTemplate([
            ["INIT/REVIEW", "1", "2", "AOC"],
            ["\xa0FMC FLT NO", "GMT\xa0"],
            [fltNbr, gmt],
            ["\xa0DEP"],
            [originIcao],
            ["\xa0DEST"],
            [destinationIcao, "CREW DETAILS>[color]inop"],
            ["\xa0FOB"],
            ["   " + fob],
            ["\xa0ETE"],
            [ete, requestButton],
            ["", "ADVISORY\xa0"],
            ["<AOC MENU"]
        ]);

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
            if (data.requestedData === false) {
                data.requestedData = true;

                const onRequestSent = () => {};
                mcdu.atsu.receiveFlightPlan(onRequestSent).then((response) => {
                    if (response[0] === AtsuCommon.AtsuStatusCodes.Ok) {
                        data.flightPlan = response[1];
                    }

                    data.requestedData = false;
                    CDUAocInit.ShowPage(mcdu, data);
                });

                CDUAocInit.ShowPage(mcdu, data);
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };

        mcdu.onNextPage = () => {
            CDUAocInit.ShowPage2(mcdu, data);
        };
    }

    static ShowPage2(mcdu, data = CDUAocInit.CreateDataBlock()) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AOCInit2;
        mcdu.activeSystem = 'ATSU';

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
        if (mcdu.aocTimes.out) {
            outTime = `${FMCMainDisplay.secondsTohhmm(mcdu.aocTimes.out)}[color]green`;
        }
        if (mcdu.aocTimes.doors) {
            doorsTime = `${FMCMainDisplay.secondsTohhmm(mcdu.aocTimes.doors)}[color]green`;
        }
        if (mcdu.aocTimes.off) {
            offTime = `${FMCMainDisplay.secondsTohhmm(mcdu.aocTimes.off)}[color]green`;
            let currentfltTime = 0;
            if (mcdu.aocTimes.on) {
                currentfltTime = mcdu.aocTimes.on - mcdu.aocTimes.off;
            } else {
                currentfltTime = seconds - mcdu.aocTimes.off;
            }
            fltTime = `${FMCMainDisplay.secondsTohhmm(currentfltTime)}[color]green`;
        }
        if (mcdu.aocTimes.on) {
            onTime = `${FMCMainDisplay.secondsTohhmm(mcdu.aocTimes.on)}[color]green`;
        }
        if (mcdu.aocTimes.in) {
            inTime = `${FMCMainDisplay.secondsTohhmm(mcdu.aocTimes.in)}[color]green`;
        }
        if (mcdu.simbrief["blockTime"]) {
            blockTime = `${FMCMainDisplay.secondsTohhmm(mcdu.simbrief.blockTime)}[color]green`;
        }

        function updateView() {
            if (mcdu.page.Current === mcdu.page.AOCInit2) {
                CDUAocInit.ShowPage2(mcdu, data);
            }
        }

        mcdu.setTemplate([
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
        ]);

        // regular update due to showing time on this page
        mcdu.page.SelfPtr = setTimeout(() => {
            updateView();
        }, mcdu.PageTimeout.Default);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };

        mcdu.onPrevPage = () => {
            CDUAocInit.ShowPage(mcdu, data);
        };

        updateView();
    }
}
