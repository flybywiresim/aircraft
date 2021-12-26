const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function findNewMonthIndex(index) {
    if (index === 0) {
        return 11;
    } else {
        return index - 1;
    }
}

function lessThan10(num) {
    if (num < 10) {
        return `0${num}`;
    } else {
        return num;
    }
}

function calculateActiveDate(date) {
    if (date.length === 13) {
        const startMonth = date.slice(0, 3);
        const startDay = date.slice(3, 5);

        const endMonth = date.slice(5, 8);
        const endDay = date.slice(8, 10);

        return `${startDay}${startMonth}-${endDay}${endMonth}`;
    } else {
        return date;
    }
}

function calculateSecDate(date) {
    if (date.length === 13) {
        const primStartMonth = date.slice(0, 3);
        const primStartDay = date.slice(3, 5);

        const primStartMonthIndex = months.findIndex((item) => item === primStartMonth);

        if (primStartMonthIndex === -1) {
            return "ERR";
        }

        let newEndMonth = primStartMonth;
        let newEndDay = primStartDay - 1;

        let newStartDay = newEndDay - 27;
        let newStartMonth = primStartMonth;

        if (newEndDay === 0) {
            newEndMonth = months[findNewMonthIndex(primStartMonthIndex)];
            newEndDay = monthLength[findNewMonthIndex(primStartMonthIndex)];
        }

        if (newStartDay <= 0) {
            newStartMonth = months[findNewMonthIndex(primStartMonthIndex)];
            newStartDay = monthLength[findNewMonthIndex(primStartMonthIndex)] + newStartDay;
        }

        return `${lessThan10(newStartDay)}${newStartMonth}-${lessThan10(newEndDay)}${newEndMonth}`;
    } else {
        return "ERR";
    }

}

class CDUIdentPage {
    static ShowPage(mcdu, confirmDeleteAll = false) {
        const date = mcdu.getNavDataDateRange();
        const stored = mcdu.dataManager.numberOfStoredElements();
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.IdentPage;
        mcdu.activeSystem = 'FMGC';
        mcdu.setTemplate([
            ["A320-200"],//This aircraft code is correct and does not include the engine type.
            ["\xa0ENG"],
            ["LEAP-1A26[color]green"],
            ["\xa0ACTIVE NAV DATA BASE"],
            ["\xa0" + calculateActiveDate(date) + "[color]cyan", "AIRAC[color]green"],
            ["\xa0SECOND NAV DATA BASE"],
            ["{small}{" + calculateSecDate(date) + "{end}[color]inop"],
            ["", "STORED\xa0\xa0\xa0\xa0"],
            ["", `{green}${stored.routes.toFixed(0).padStart(2, '0')}{end}{small}RTES{end}\xa0{green}${stored.runways.toFixed(0).padStart(2, '0')}{end}{small}RWYS{end}`],
            ["CHG CODE", `{green}{big}${stored.waypoints.toFixed(0).padStart(2, '0')}{end}{end}{small}WPTS{end}\xa0{green}{big}${stored.navaids.toFixed(0).padStart(2, '0')}{end}{end}{small}NAVS{end}`],
            ["{small}[  ]{end}[color]inop", confirmDeleteAll ? '{amber}CONFIRM DEL*{end}' : '{cyan}DELETE ALL}{end}'],
            ["IDLE/PERF", "SOFTWARE"],
            ["+0.0/+0.0[color]green", "STATUS/XLOAD>[color]inop"]
        ]);

        // DELETE ALL
        mcdu.onRightInput[4] = () => {
            if (confirmDeleteAll) {
                const allDeleted = mcdu.dataManager.deleteAllStoredWaypoints();
                if (!allDeleted) {
                    mcdu.addNewMessage(NXSystemMessages.fplnElementRetained);
                }
                CDUIdentPage.ShowPage(mcdu);
            } else {
                CDUIdentPage.ShowPage(mcdu, true);
            }
        };
    }
}
