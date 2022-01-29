class CDUAvailableFlightPlanPage {
    static ShowPage(mcdu, offset = 0, currentRoute = 1) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AvailableFlightPlanPage;
        let fromTo = "NO ORIGIN/DEST";
        console.log(mcdu.coRoute.routes.length);
        const hasCoRoutes = mcdu.coRoute.routes.length > 0;
        if (mcdu.flightPlanManager.getOrigin()) {
            if (mcdu.flightPlanManager.getDestination()) {
                fromTo = mcdu.flightPlanManager.getOrigin().ident + "/" + mcdu.flightPlanManager.getDestination().ident;
            }
        }
        if (hasCoRoutes) {
            const coRoutesListSize = mcdu.coRoute.routes.length;
            if (currentRoute < 1) {
                currentRoute = coRoutesListSize;
            }
            if (currentRoute > coRoutesListSize) {
                currentRoute = 1;
            }
            const {navlog, routeName} = mcdu.coRoute.routes[currentRoute - 1];

            let scrollText = [];
            const routeArray = [];
            const scrollLimit = 9;
            let columnPos = 0;
            let rowPos = 0;

            const procedures = new Set(navlog.filter(fix => fix.is_sid_star === "1").map(fix => fix.via_airway));

            for (let i = 0; i < navlog.length; i++) {
                const fix = navlog[i];
                const nextFix = navlog[i + 1];

                //console.log("fix: ",fix);
                //console.log("nextFix: ",nextFix);

                if (fix.is_sid_star === '1') {
                    continue;
                }

                if (["TOP OF CLIMB", "TOP OF DESCENT"].includes(fix.name)) {
                    continue;
                }

                if (!nextFix) {
                    continue;
                }

                // TODO: Clear routes list if new from/to entered
                if (fix.via_airway === 'DCT' && nextFix.via_airway === 'DCT') {
                    console.log(`concurrent DCT, inserting airway: ${fix.via_airway} and ident in new row: ${fix.ident}`);
                    routeArray[rowPos] = ["", "",`${routeArray[rowPos][2]}` + " " + `{green}{big}${fix.via_airway}{end}`];
                    routeArray[rowPos + 1] = ["", "", `{small}${fix.ident}{end}`];
                    columnPos = 1;
                    rowPos++;
                    continue;
                }

                if (nextFix.via_airway !== fix.via_airway) {
                    switch (columnPos) {
                        case 0:
                            console.log("Inserting first waypoint:", fix.ident);
                            routeArray[rowPos] = ["","",`${fix.ident}${"@".repeat(5 - fix.ident.length)}`];
                            columnPos = 1;
                            break;
                        case 1:
                            console.log(`Case 1, inserting airway: ${fix.via_airway} and ending waypoint: ${fix.ident}`);
                            routeArray[rowPos] = [
                                "",
                                "",
                                `{small}${routeArray[rowPos][2]}{end}` + " " + `{green}{big}${fix.via_airway}${"@".repeat(5 - fix.via_airway.length)}{end}{end}` + " " + `${fix.ident}${"@".repeat(5 - fix.ident.length)}`
                            ];
                            columnPos = 2;
                            break;
                        case 2:
                            console.log(`Case 2, inserting airway: ${fix.via_airway} and ident in new row: ${fix.ident}`);
                            routeArray[rowPos] = [
                                "",
                                "",
                                `${routeArray[rowPos][2]}` + " " + `{green}{big}${fix.via_airway}${"@".repeat(5 - fix.via_airway.length)}{end}{end}`
                            ];
                            routeArray[rowPos + 1] = ["","",`{small}${fix.ident}${"@".repeat(5 - fix.ident.length)}{end}`];
                            columnPos = 1;
                            rowPos++;
                            break;
                    }
                    continue;
                }

                mcdu.onPrevPage = () => {
                    CDUAvailableFlightPlanPage.ShowPage(mcdu, offset, currentRoute - 1);
                };
                mcdu.onNextPage = () => {
                    CDUAvailableFlightPlanPage.ShowPage(mcdu, offset, currentRoute + 1);
                };
                //TODO: Insert route
            }

            routeArray.forEach((line, index) => {
                const excludedLength = line[2].replace(/{sp}|{small}|{green}|{end}|{big}|/g,'');
                if (excludedLength.length < 23) {
                    console.log(`Excluded line: ${excludedLength} excluded length: ${excludedLength.length}`);
                    console.log(`adding ${23 - excludedLength.length } spaces`);
                    routeArray[index] = ["", "", line[2] + "{sp}".repeat(23 - excludedLength.length)];
                }
                console.log(`before: ${routeArray[index]}`);
                //FIXME: Why is this omitting existing {sp} ?!
                //FIXME: Why is this only inserting one {sp} e.g @@
                routeArray[index] = ["", "", line[2].replace(/@/ig, "{sp}")];
                console.log(`after: ${routeArray[index]}`);
            });

            //TODO: Implement offset
            scrollText = routeArray.length > 9 ?
                [...routeArray.slice(0, 9)]
                : [...routeArray, ...CDUAvailableFlightPlanPage.insertEmptyRows(scrollLimit - routeArray.length)];

            console.log(scrollText);
            mcdu.setTemplate([
                [`{sp}{sp}{sp}{sp}{sp}ROUTE{sp}{sp}{small}${currentRoute}/${coRoutesListSize}{end}`],
                ["{sp}CO RTE", "FROM/TO{sp}{sp}" ],
                [`${routeName}[color]cyan`, `${fromTo}[color]cyan`],
                ...scrollText,
                ["<RETURN", "INSERT*[color]amber"]
            ]);
        } else {
            mcdu.setTemplate([
                [fromTo],
                [""],
                ["NONE[color]green"],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""],
                ["<RETURN"]
            ]);
        }

        mcdu.onLeftInput[5] = () => {
            CDUInitPage.ShowPage1(mcdu);
        };
    }

    static insertEmptyRows(rowsToInsert) {
        const array = [];
        for (let i = 0; i < rowsToInsert; i++) {
            array.push([""]);
        }
        return array;
    }
}
