class CDUAvailableFlightPlanPage {
    static ShowPage(mcdu, offset = 0) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AvailableFlightPlanPage;
        let fromTo = "NO ORIGIN/DEST";
        const hasCoRoutes = mcdu.coRoutes.routes.length() > 0;
        if (mcdu.flightPlanManager.getOrigin()) {
            if (mcdu.flightPlanManager.getDestination()) {
                fromTo = mcdu.flightPlanManager.getOrigin().ident + "/" + mcdu.flightPlanManager.getDestination().ident;
            }
        }
        if (hasCoRoutes) {
            const currentRoute = 1;
            const coRoutesListSize = mcdu.coRoutes.routes.length();
            const {navlog} = mcdu.coRoute.routes[currentRoute];

            const scrollText = [];
            const scrollWindow = [];
            const rowsCount = 9;
            const columnPos = 0;
            const rowPos = 0;

            const procedures = new Set(navlog.filter(fix => fix.is_sid_star === "1").map(fix => fix.via_airway));

            for (let i = 0; i < navlog.length; i++) {
                const fix = navlog[i];
                const nextFix = navlog[i + 1];

                if (fix.is_sid_star === '1') {
                    continue;
                }
                if (["TOP OF CLIMB", "TOP OF DESCENT"].includes(fix.name)) {
                    continue;
                }

                //TODO: figure this shit out
                // DCT
                if (fix.via_airway === 'DCT') {
                    scrollWindow[rowsCount] = [];
                }

                // Last Fix of airway
                if (nextFix.via_airway !== fix.via_airway) {
                    scrollWindow[rowsCount] = [];
                    continue;
                }

            }

            mcdu.setTemplate([
                ["","ROUTE", `${currentRoute}/${coRoutesListSize}`],
                ["CO RTE", "", "FROM/TO"],
                ["TODO", "", fromTo],
                ...scrollText,
                ["<RETURN", "", "INSERT*[color]amber"]
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
}
