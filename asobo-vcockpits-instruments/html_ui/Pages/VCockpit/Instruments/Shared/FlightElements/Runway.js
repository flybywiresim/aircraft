class Runway {
    constructor() {
        this.designatorCharPrimary = 0;
        this.designatorCharSecondary = 0;
        this.cosDirection = 0;
        this.sinDirection = 0;
    }
    splitIfTwoWays() {
        const splitRunways = [];
        const designations = this.designation.split("-");
        for (let i = 0; i < designations.length; i++) {
            const newRunway = new Runway();
            newRunway.designation = designations[i];
            const runwayNumber = parseInt(newRunway.designation);
            if (i === 0) {
                if (this.designatorCharPrimary === 1) {
                    newRunway.designation += "L";
                }
                if (this.designatorCharPrimary === 2) {
                    newRunway.designation += "R";
                }
                if (this.designatorCharPrimary === 3) {
                    newRunway.designation += "C";
                }
            }
            if (i === 1) {
                if (this.designatorCharSecondary === 1) {
                    newRunway.designation += "L";
                }
                if (this.designatorCharSecondary === 2) {
                    newRunway.designation += "R";
                }
                if (this.designatorCharSecondary === 3) {
                    newRunway.designation += "C";
                }
            }
            newRunway.latitude = this.latitude;
            newRunway.longitude = this.longitude;
            newRunway.elevation = this.elevation;
            newRunway.direction = this.direction;
            newRunway.length = this.length;
            newRunway.width = this.width;
            newRunway.surface = this.surface;
            newRunway.lighting = this.lighting;
            newRunway.primaryILSFrequency = i == 0 ? this.primaryILSFrequency : this.secondaryILSFrequency;
            let delta = Math.abs(runwayNumber * 10 - newRunway.direction);
            if (delta >= 30) {
                newRunway.direction += 180;
                if (newRunway.direction >= 360) {
                    newRunway.direction -= 360;
                }
            }
            while (delta >= 360) {
                delta -= 360;
            }
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
                break;
            case 1:
                return "Concrete";
                break;
            case 2:
                return "Asphalt";
                break;
            case 101:
                return "Grass";
                break;
            case 102:
                return "Turf";
                break;
            case 103:
                return "Dirt";
                break;
            case 104:
                return "Coral";
                break;
            case 105:
                return "Gravel";
                break;
            case 106:
                return "Oil Treated";
                break;
            case 107:
                return "Steel";
                break;
            case 108:
                return "Bituminus";
                break;
            case 109:
                return "Brick";
                break;
            case 110:
                return "Macadam";
                break;
            case 111:
                return "Planks";
                break;
            case 112:
                return "Sand";
                break;
            case 113:
                return "Shale";
                break;
            case 114:
                return "Tarmac";
                break;
            case 115:
                return "Snow";
                break;
            case 116:
                return "Ice";
                break;
            case 201:
                return "Water";
                break;
            default:
                return "Unknown";
                break;
        }
    }
}
//# sourceMappingURL=Runway.js.map