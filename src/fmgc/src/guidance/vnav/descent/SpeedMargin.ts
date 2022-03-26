import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';

export class SpeedMargin {
    private vmo: Knots = 350;

    private mmo: Mach = 0.82;

    constructor(private observer: VerticalProfileComputationParametersObserver) { }

    getTarget(indicatedAirspeed: Knots, targetSpeed: Knots): Knots {
        const [lowerMargin, upperMargin] = this.getMargins(targetSpeed);

        return Math.max(Math.min(indicatedAirspeed, upperMargin), lowerMargin);
    }

    getMargins(currentTarget: Knots): [Knots, Knots] {
        const vmax = SimVar.GetSimVarValue('L:A32NX_SPEEDS_VMAX', 'number');

        const vls = SimVar.GetSimVarValue('L:A32NX_SPEEDS_VLS', 'number');
        const f = SimVar.GetSimVarValue('L:A32NX_SPEEDS_F', 'number');
        const s = SimVar.GetSimVarValue('L:A32NX_SPEEDS_S', 'number');
        const vmin = Math.max(vls, f, s);

        const mmoAsIas = SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', this.mmo);

        const distanceToUpperMargin = this.observer.get().managedDescentSpeed - currentTarget > 1 ? 5 : 20;

        return [
            Math.max(vmin, Math.min(currentTarget - 20, vmax, this.vmo - 3, mmoAsIas - 0.006)),
            Math.max(vmin, Math.min(vmax, this.vmo - 3, mmoAsIas - 0.006, currentTarget + distanceToUpperMargin)),
        ];
    }
}
