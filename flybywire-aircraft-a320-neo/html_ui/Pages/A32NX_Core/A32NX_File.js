/**
 * Fetches the coRoute information and stores on FMCMainDisplay object
 * @param {FMCMainDisplay} mcdu
 * @param {string} coRoute
 * @param {() => void} updateView
 * @returns
 */
const getCoRoute = async (mcdu, coRoute, updateView) => {
    return NXLocalApi.getCoRoute(coRoute)
        .then(response => {
            switch (response.status) {
                case 422:
                    mcdu.addNewMessage(NXFictionalMessages.authErr);
                    return false;
                case 404:
                    mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                    return false;
                case 500:
                    mcdu.addNewMessage(NXFictionalMessages.unknownDownlinkErr);
                    return false;
                case 200:
                    return response.json().then(data => {
                        mcdu.coRoute["originIcao"] = data.origin.icao_code;
                        mcdu.coRoute["destinationIcao"] = data.destination.icao_code;
                        mcdu.coRoute["route"] = data.general.route;
                        if (data.alternate) {
                            mcdu.coRoute["alternateIcao"] = data.alternate.icao_code;
                        }
                        mcdu.coRoute["navlog"] = data.navlog.fix;
                        return true;
                    });
                default:
                    mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                    return false;
            }
        })
        .catch(_err => {
            console.error(_err);
            mcdu.addNewMessage(NXFictionalMessages.noResponse);
            updateView();
            return false;
        });
};

const getRouteList = async (mcdu) => {
    const origin = mcdu.flightPlanManager.getOrigin().ident;
    const dest = mcdu.flightPlanManager.getDestination().ident;
    return NXLocalApi.getRouteList(origin, dest)
        .then(response => {
            response.json().then(data => {
                data.forEach((route) => {
                    mcdu.coRoute.routes.push({
                        originIcao: route.origin.icao_code,
                        destinationIcao: route.origin.icao_code,
                        alternateIcao: route.alternate ? route.alternate : undefined,
                        route: route.general.route,
                        navlog: route.navlog.fix
                    });
                });
            });
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

            if (alternateIcao) {
                await mcdu.tryUpdateAltDestination(alternateIcao);
            }

            await uplinkRoute(mcdu, true);
            if (mcdu.page.Current === mcdu.page.InitPageA) {
                CDUInitPage.ShowPage1(mcdu);
            }
        }
    });
};
