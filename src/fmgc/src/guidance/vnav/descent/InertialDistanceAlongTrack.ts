export class InertialDistanceAlongTrack {
    private lastUpdate: number = 0;

    private lastUpdateWithCorrectInformation: number = 0;

    private currentDistanceAlongTrack: number = 0;

    private groundSpeedModifier: number = 0;

    // Alpha beta constants for Alpha beta filter
    private alpha: number = 1;

    private beta: number = 0;

    updateCorrectInformation(actualDistanceAlongTrack: NauticalMiles) {
        const residual = actualDistanceAlongTrack - this.currentDistanceAlongTrack;

        this.currentDistanceAlongTrack += this.alpha * residual;
        this.groundSpeedModifier = this.beta * residual / (Date.now() - this.lastUpdateWithCorrectInformation);

        this.lastUpdate = Date.now();
        this.lastUpdateWithCorrectInformation = Date.now();
    }

    update() {
        // Should probably use ADR data here
        const groundSpeed = SimVar.GetSimVarValue('GPS GROUND SPEED', 'Knots');

        this.currentDistanceAlongTrack += (groundSpeed + this.groundSpeedModifier) * (Date.now() - this.lastUpdate) / 1000 / 60 / 60;

        this.lastUpdate = Date.now();
    }

    get() {
        return this.currentDistanceAlongTrack;
    }
}
