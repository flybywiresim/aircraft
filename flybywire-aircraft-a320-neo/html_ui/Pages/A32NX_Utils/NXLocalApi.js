class NXLocalApi {
    static getCoRoute(route) {
        if (route) {
            return fetch(`${NXLocalApi.url}/coroute?rteNum=${route}`)
                .then((response) => {
                    if (!response.ok) {
                        throw new HttpError(response.statusText);
                    }
                    return response.json();
                });
        } else {
            throw ("No Company Route provided");
        }

    }
}
NXLocalApi.url = "http://localhost:3838";
