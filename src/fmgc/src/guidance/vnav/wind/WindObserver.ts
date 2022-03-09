import { WindVector } from '@fmgc/guidance/vnav/wind';
import { Arinc429Word } from '@shared/arinc429';

export class WindObserver {
    constructor(private irsIndex: number) {

    }

    get(): WindVector | null {
        const windDirection = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${this.irsIndex}_WIND_DIRECTION`);
        const windVelocity = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${this.irsIndex}_WIND_VELOCITY`);

        if (!windDirection.isNormalOperation() || !windVelocity.isNormalOperation()) {
            return null;
        }

        return new WindVector(windDirection.value, windVelocity.value);
    }
}
