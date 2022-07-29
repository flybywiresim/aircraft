import { simbridgeUrl } from '../common';

/**
 * Class responsible for retrieving data related to company routes from SimBridge
 */
export class CompanyRoute {
    /**
     * Used to retrieve a given company route
     * @param route The routename in question
     * @returns On succesful response, response body contains JSON of company route
     */
    public static async getCoRoute(route: String): Promise<Response> {
        if (route) {
            const response = await fetch(`${simbridgeUrl}/api/v1/coroute?rteNum=${route}`);
            return response;
        }
        throw new Error('No Company route provided');
    }

    /**
     * Used to retrieve a list of company routes for a given origin and dest
     * @param origin the origin
     * @param dest the destination
     * @returns On succesful response, response body contains JSON array of company routes under the given origin and dest
     */
    public static async getRouteList(origin: String, dest: String): Promise<Response> {
        if (origin || dest) {
            const response = await fetch(`${simbridgeUrl}/api/v1/coroute/list?origin=${origin}&destination=${dest}`);
            return response;
        }
        throw new Error('Origin or Destination missing');
    }
}
