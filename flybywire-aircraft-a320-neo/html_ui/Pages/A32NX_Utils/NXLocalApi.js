class NXLocalApi {
    static getCoRoute(route) {
        if (!route) {
            throw ("No Company Route provided");
        }

        return fetch(`${NXLocalApi.url}/coroute?rteNum=${route}`)
            .then((response) => {
                if (!response.ok) {
                    throw (response);
                }
                response.json();
            });

    }
}
NXLocalApi.url = "localhost:3838";
