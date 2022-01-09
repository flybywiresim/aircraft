class NXLocalApi {
    static getCoRoute(route) {
        if (route) {
            return fetch(`${NXLocalApi.url}/coroute?rteNum=${route}`)
                .then((response) => {
                    return response;
                });
        } else {
            throw ("No Company Route provided");
        }

    }
}
NXLocalApi.url = "http://localhost:3838";
