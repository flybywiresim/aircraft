export class Icao {
    static getIdent(icao: string): string {
        return icao.substring(7);
    }

    static create(type: string, region: string, airport: string, ident: string): string {
        return type + region.padEnd(2, ' ') + airport.padEnd(4, ' ') + ident.padEnd(5, ' ');
    }
}
