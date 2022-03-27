import { NXDataStore } from '@shared/persistence';

export abstract class LocalApiClient {
    private static localApiUrl: String = `http://localhost:${NXDataStore.get('CONFIG_LOCAL_API_PORT', '8380')}`

    static async getCoRoute(route: String): Promise<Response> {
        if (route) {
            const response = await fetch(`${this.localApiUrl}/api/v1/coroute?rteNum=${route}`);
            return response;
        }
        throw new Error('No Company route provided');
    }

    static async getRouteList(origin: String, dest: String): Promise<Response> {
        const response = await fetch(`${this.localApiUrl}/api/v1/coroute/list?origin=${origin}&destination=${dest}`);
        return response;
    }
}
