export class InertialDistanceAlongTrack {
    private lastUpdate: number = 0;

    private currentDistanceAlongTrack: number = 0;

    updateCorrectInformation(actualDistanceAlongTrack: NauticalMiles) {
        this.currentDistanceAlongTrack = actualDistanceAlongTrack;

        this.lastUpdate = Date.now();
    }

    update() {
        // Should probably use ADR data here
        const groundSpeed = SimVar.GetSimVarValue('GPS GROUND SPEED', 'Knots');

        this.currentDistanceAlongTrack += groundSpeed * (Date.now() - this.lastUpdate) / 1000 / 60 / 60;

        this.lastUpdate = Date.now();
    }

    get() {
        return this.currentDistanceAlongTrack;
    }
}
