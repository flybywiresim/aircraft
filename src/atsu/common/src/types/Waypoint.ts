export class Waypoint {
    public ident: string = '';

    public altitude: number = 0;

    public utc: number = 0;

    constructor(ident: string) {
        this.ident = ident;
    }
}
