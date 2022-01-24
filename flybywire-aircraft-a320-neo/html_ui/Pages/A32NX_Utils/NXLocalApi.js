class NXLocalApi {
    static async getCoRoute(route) {
        if (route) {
            const response = await fetch(`${NXLocalApi.url}/coroute?rteNum=${route}`);
            return response;
        } else {
            throw ("No Company Route provided");
        }

    }

    static async getRouteList(origin, dest) {
        const response = await fetch(`${NXLocalApi.url}/coroute/list?origin=${origin}&destination=${dest}`);
        return response;
    }
}
NXLocalApi.url = "http://localhost:3838";
