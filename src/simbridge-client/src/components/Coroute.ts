import { simbridgeUrl } from '../common';
import { CoRouteDto } from '../Coroute/coroute';

/**
 * Class responsible for retrieving data related to company routes from SimBridge
 */
export class CompanyRoute {
    /**
     * Used to retrieve a given company route
     * @param route The routename in question
     * @returns Returns the CoRoute DTO
     */
    public static async getCoRoute(route: String): Promise<CoRouteDto> {
        if (route) {
            const response = await fetch(`${simbridgeUrl}/api/v1/coroute?rteNum=${route}`);
            if (response.status === 200) {
                response.json();
            }
            throw new Error('Server Error');
        }
        throw new Error('No Company route provided');
    }

    /**
     * Used to retrieve a list of company routes for a given origin and dest
     * @param origin the origin
     * @param dest the destination
     * @returns Returns a list of CoRoute DTOs
     */
    public static async getRouteList(origin: String, dest: String): Promise<CoRouteDto[]> {
        if (origin || dest) {
            const response = await fetch(`${simbridgeUrl}/api/v1/coroute/list?origin=${origin}&destination=${dest}`);
            if (response.ok) {
                response.json();
            }
            throw new Error('Server Error');
        }
        throw new Error('Origin or Destination missing');
    }
}
