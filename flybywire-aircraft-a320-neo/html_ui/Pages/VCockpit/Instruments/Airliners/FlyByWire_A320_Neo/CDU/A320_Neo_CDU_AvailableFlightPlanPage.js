class CDUAvailableFlightPlanPage {
    static ShowPage(mcdu, offset = 0) {
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
            const currentRoute = 1;
            const coRoutesListSize = mcdu.coRoute.routes.length;
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

                // TODO: Create some kind of styler function
                // TODO: Clear routes list if new from/to entered
                // TODO: Imeplement pages
                if (nextFix.via_airway !== fix.via_airway) {
                    switch (columnPos) {
                        case 0:
                            routeArray[rowPos] = [fix.ident];
                            columnPos = 1;
                            break;
                        case 1:
                            console.log("routeArray: ", routeArray);
                            console.log("rowPos: ", routeArray[rowPos]);
                            routeArray[rowPos] = [`{sp}{small}${routeArray[rowPos][0]}` + "{sp}" + `{green}{big}${fix.via_airway}{end}`, `${fix.ident}`];
                            columnPos = 2;
                            break;
                        case 2:
                            routeArray[rowPos] = [`${routeArray[rowPos][0]}`, routeArray[rowPos][1] + "{sp}" + `{green}{big}${fix.via_airway}{end}{sp}{sp}`];
                            routeArray[rowPos + 1] = [`{sp}{small}${fix.ident}{end}`];
                            columnPos = 1;
                            rowPos++;
                            break;
                    }
                    continue;
                }
            }

            //TODO: Implement offset
            scrollText = routeArray.length > 9 ?
                [...routeArray.slice(0, 9)]
                : [...routeArray, ...CDUAvailableFlightPlanPage.insertEmptyRows(scrollLimit - routeArray.length)];
            console.log(scrollText);
            mcdu.setTemplate([
                [`ROUTE{small}{right}${currentRoute}/${coRoutesListSize}{end}`],
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
