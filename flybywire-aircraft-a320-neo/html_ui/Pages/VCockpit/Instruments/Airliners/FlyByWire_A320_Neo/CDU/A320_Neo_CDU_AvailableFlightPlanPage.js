class CDUAvailableFlightPlanPage {
    static ShowPage(mcdu, offset = 0, currentRoute = 1) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AvailableFlightPlanPage;
        let fromTo = "NO ORIGIN/DEST";
        const hasCoRoutes = mcdu.coRoute.routes.length > 0;
        if (mcdu.flightPlanManager.getOrigin()) {
            if (mcdu.flightPlanManager.getDestination()) {
                fromTo = mcdu.flightPlanManager.getOrigin().ident + "/" + mcdu.flightPlanManager.getDestination().ident;
            }
        }
        if (hasCoRoutes) {
            const coRoutesListSize = mcdu.coRoute.routes.length;

            // Page Management
            if (currentRoute < 1) {
                currentRoute = coRoutesListSize;
            }
            if (currentRoute > coRoutesListSize) {
                currentRoute = 1;
            }

            const {navlog, routeName} = mcdu.coRoute.routes[currentRoute - 1];

            let scrollText = [];
            var routeArray = [];
            const scrollLimit = 9;
            let columnPos = 0;
            let rowPos = 0;

            // Scroll Text builder
            for (let i = 0; i < navlog.length; i++) {
                const fix = navlog[i];
                const nextFix = navlog[i + 1];

                if (fix.is_sid_star === '1') {
                    continue;
                }

                if (["TOP OF CLIMB", "TOP OF DESCENT"].includes(fix.name)) {
                    continue;
                }

                if (!nextFix) {
                    continue;
                }

                if (fix.via_airway === 'DCT' && nextFix.via_airway === 'DCT') {
                    switch (columnPos) {
                        case 1:
                            routeArray[rowPos] = [
                                "",
                                "",
                                `${routeArray[rowPos][2]}` + " " + `{green}{big}${fix.via_airway.concat("@".repeat(5 - fix.via_airway.length))}{end}{end}` + " " + `{small}${fix.ident.concat("@".repeat(5 - fix.ident.length))}{end}`
                            ];
                            columnPos = 2;
                            break;
                        case 2:
                            routeArray[rowPos] = ["", "",`${routeArray[rowPos][2]}` + " " + `{green}{big}${fix.via_airway.concat("@".repeat(5 - fix.via_airway.length))}{end}`];
                            routeArray[rowPos + 1] = ["", "", `{small}${fix.ident.concat("@".repeat(5 - fix.ident.length))}{end}`];
                            columnPos = 1;
                            rowPos++;
                            break;
                    }

                    continue;
                }

                if (nextFix.via_airway !== fix.via_airway) {
                    switch (columnPos) {
                        case 0:
                            routeArray[rowPos] = ["","",`{small}${fix.ident.concat("@".repeat(5 - fix.ident.length))}{end}`];
                            columnPos = 1;
                            break;
                        case 1:
                            routeArray[rowPos] = [
                                "",
                                "",
                                `${routeArray[rowPos][2]}` + " " + `{green}{big}${fix.via_airway.concat("@".repeat(5 - fix.via_airway.length))}{end}{end}` + " " + `{small}${fix.ident.concat("@".repeat(5 - fix.ident.length))}{end}`
                            ];
                            columnPos = 2;
                            break;
                        case 2:
                            routeArray[rowPos] = [
                                "",
                                "",
                                `${routeArray[rowPos][2]}` + " " + `{green}{big}${fix.via_airway.concat("@".repeat(5 - fix.via_airway.length))}{end}{end}`
                            ];
                            routeArray[rowPos + 1] = ["","",`{small}${fix.ident.concat("@".repeat(5 - fix.ident.length))}{end}`];
                            columnPos = 1;
                            rowPos++;
                            break;
                    }
                    continue;
                }
            }

            /* row character width management,
             uses @ as a delim for adding spaces in short airways/waypoints */
            routeArray.forEach((line, index) => {
                const excludedLength = line[2].replace(/{small}|{green}|{end}|{big}|/g,'').length;
                if (excludedLength < 23) {
                    // Add spaces to make up lack of row width
                    const adjustedLine = line[2] + "{sp}".repeat(23 - excludedLength);
                    routeArray[index] = ["", "", adjustedLine];
                }
                // Add spaces for short airways/waypoints smaller than 5 characters
                routeArray[index] = ["", "", routeArray[index][2].replace(/@/g, '{sp}')];
            });

            // Offset Management
            const routeArrayLength = routeArray.length;
            if (offset < 0) {
                offset = 0;
            };
            if (offset > (routeArrayLength - 9)) {
                offset = routeArrayLength - 9;
            };
            scrollText = routeArrayLength > 9 ?
                [...routeArray.slice(0 + offset, 9 + offset)]
                : [...routeArray, ...CDUAvailableFlightPlanPage.insertEmptyRows(scrollLimit - routeArray.length)];

            mcdu.setTemplate([
                [`{sp}{sp}{sp}{sp}{sp}ROUTE{sp}{sp}{small}${currentRoute}/${coRoutesListSize}{end}`],
                ["{sp}CO RTE", "FROM/TO{sp}{sp}" ],
                [`${routeName}[color]cyan`, `${fromTo}[color]cyan`],
                ...scrollText,
                ["<RETURN", "INSERT*[color]amber"]
            ]);

            mcdu.onPrevPage = () => {
                CDUAvailableFlightPlanPage.ShowPage(mcdu, 0, currentRoute - 1);
            };
            mcdu.onNextPage = () => {
                CDUAvailableFlightPlanPage.ShowPage(mcdu, 0, currentRoute + 1);
            };
            mcdu.onDown = () => {//on page down decrement the page offset.
                CDUAvailableFlightPlanPage.ShowPage(mcdu, offset - 1, currentRoute);
            };
            mcdu.onUp = () => {
                CDUAvailableFlightPlanPage.ShowPage(mcdu, offset + 1, currentRoute);
            };

            mcdu.onLeftInput[5] = () => {
                mcdu.coRoute.routes = [];
                CDUInitPage.ShowPage1(mcdu);
            };

            mcdu.onRightInput[5] = () => {
                const selectedRoute = mcdu.coRoute.routes[currentRoute - 1];
                mcdu.coRoute.routeNumber = routeName;
                mcdu.coRoute["originIcao"] = selectedRoute.originIcao;
                mcdu.coRoute["destinationIcao"] = selectedRoute.destinationIcao;
                mcdu.coRoute["route"] = selectedRoute.route;
                if (selectedRoute.alternateIcao) {
                    mcdu.coRoute["alternateIcao"] = selectedRoute.alternateIcao;
                }
                mcdu.coRoute["navlog"] = selectedRoute.navlog;
                mcdu.addNewMessage(NXSystemMessages.uplinkInsertInProg);
                setTimeout(async () => {
                    await insertCoRoute(mcdu);
                    mcdu.addNewMessage(NXFictionalMessages.crteActFplnUplink);
                    CDUInitPage.ShowPage1(mcdu);
                }, mcdu.getDelayRouteChange());

            };
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
