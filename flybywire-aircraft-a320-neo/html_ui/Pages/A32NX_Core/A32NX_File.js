/**
 * Fetches the coRoute information and stores on FMCMainDisplay object
 * @param {FMCMainDisplay} mcdu
 * @param {string} coRoute
 * @param {() => void} updateView
 * @returns
 */
const getCoRoute = (mcdu, coRoute, updateView) => {
    return NXLocalApi.getCoRoute(coRoute)
        .then(data => {
            mcdu.coRoute["originIcao"] = data.origin.icao_code;
            mcdu.coRoute["destinationIcao"] = data.destination.icao_code;
            mcdu.coRoute["route"] = data.general.route;
            mcdu.coRoute["alternateIcao"] = data.alternate.icao_code;
            mcdu.coRoute["navlog"] = data.navlog.fix;
            return mcdu.coRoute;

        })
        .catch(_err => {
            console.log(_err.message);
            mcdu.addNewMessage(NXSystemMessages.notInDatabase);
            updateView();
        });
};

/**
 * Inserts the located company route's origin, destination and if provided alternate.
 * @param {FMCMainDisplay} mcdu
 */
const insertCoRoute = (mcdu) => {
    const {
        originIcao,
        destinationIcao,
        alternateIcao,
    } = mcdu.coRoute;

    const fromTo = `${originIcao}/${destinationIcao}`;

    mcdu.tryUpdateFromTo(fromTo, async (result) => {
        if (result) {
            CDUPerformancePage.UpdateThrRedAccFromOrigin(mcdu);
            CDUPerformancePage.UpdateEngOutAccFromOrigin(mcdu);

            await mcdu.tryUpdateAltDestination(alternateIcao);
            setTimeout(async () => {
                await uplinkRoute(mcdu, true);
            });
            if (mcdu.page.Current === mcdu.page.InitPageA) {
                CDUInitPage.ShowPage1(mcdu);
            }
        }
    });
};
