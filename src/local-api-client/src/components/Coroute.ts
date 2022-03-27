import { localApiUrl } from '../common';

export class CompanyRoute {
    public static async getCoRoute(route: String): Promise<Response> {
        if (route) {
            const response = await fetch(`${localApiUrl}/api/v1/coroute?rteNum=${route}`);
            return response;
        }
        throw new Error('No Company route provided');
    }

    public static async getRouteList(origin: String, dest: String): Promise<Response> {
        const response = await fetch(`${localApiUrl}/api/v1/coroute/list?origin=${origin}&destination=${dest}`);
        return response;
    }
}
