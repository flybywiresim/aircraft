// MSFS base file
// Modified by FlyByWire Sim 2021
// Licensed under Xbox Game Content Usage Rules

class Runway {
    constructor() {
        this.designatorCharPrimary = 0;
        this.designatorCharSecondary = 0;
        this.cosDirection = 0;
        this.sinDirection = 0;
    }

    designatorChar(designator) {
        switch (designator) {
            case RunwayDesignator.RUNWAY_DESIGNATOR_LEFT:
                return "L";
            case RunwayDesignator.RUNWAY_DESIGNATOR_RIGHT:
                return "R";
            case RunwayDesignator.RUNWAY_DESIGNATOR_CENTER:
                return "C";
            default:
                return "";
        }
    }

    splitIfTwoWays() {
        const splitRunways = [];
        const designations = this.designation.split("-");
        for (let i = 0; i < designations.length; i++) {
            const newRunway = new Runway();
            newRunway.designation = designations[i];
            if (i === 0) {
                newRunway.designation += this.designatorChar(this.designatorCharPrimary);
                newRunway.direction = this.direction;
            }
            if (i === 1) {
                newRunway.designation += this.designatorChar(this.designatorCharSecondary);
                newRunway.direction = Avionics.Utils.clampAngle(this.direction + 180);
            }
            newRunway.latitude = this.latitude;
            newRunway.longitude = this.longitude;
            newRunway.elevation = this.elevation;
            newRunway.length = this.length;
            newRunway.width = this.width;
            newRunway.surface = this.surface;
            newRunway.lighting = this.lighting;
            newRunway.primaryILSFrequency = i == 0 ? this.primaryILSFrequency : this.secondaryILSFrequency;
            newRunway.beginningCoordinates = Avionics.Utils.bearingDistanceToCoordinates(newRunway.direction - 180, this.length / 1852 * 0.5, this.latitude, this.longitude);
            newRunway.endCoordinates = Avionics.Utils.bearingDistanceToCoordinates(newRunway.direction, this.length / 1852 * 0.5, this.latitude, this.longitude);
            splitRunways.push(newRunway);
        }
        return splitRunways;
    }

    getSurfaceString() {
        switch (this.surface) {
            case 0:
                return "Unknown";
            case 1:
                return "Concrete";
            case 2:
                return "Asphalt";
            case 101:
                return "Grass";
            case 102:
                return "Turf";
            case 103:
                return "Dirt";
            case 104:
                return "Coral";
            case 105:
                return "Gravel";
            case 106:
                return "Oil Treated";
            case 107:
                return "Steel";
            case 108:
                return "Bituminus";
            case 109:
                return "Brick";
            case 110:
                return "Macadam";
            case 111:
                return "Planks";
            case 112:
                return "Sand";
            case 113:
                return "Shale";
            case 114:
                return "Tarmac";
            case 115:
                return "Snow";
            case 116:
                return "Ice";
            case 201:
                return "Water";
            default:
                return "Unknown";
        }
    }
}
