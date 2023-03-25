// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, KeyEvents, KeyEventData } from 'msfssdk';
import { Arinc429Register } from '@shared/arinc429';
import { FmgcFlightPhase } from '@shared/flightphase';

export class BaroHandler {
    private readonly fm1TransAlt = Arinc429Register.empty();

    private readonly fm2TransAlt = Arinc429Register.empty();

    private readonly altitude = Arinc429Register.empty();

    constructor(private readonly bus: EventBus) {}

    public connectedCallback(): void {
        this.bus.getSubscriber<KeyEvents>().on('key_intercept').handle(this.handleKey.bind(this));
    }

    private async handleKey(ev: KeyEventData): Promise<void> {
        if (ev.key === 'BAROMETRIC') {
            // FIXME handle F/O side separately in future when it's split off

            const fmFlightPhase = SimVar.GetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'number');
            const climb = fmFlightPhase <= FmgcFlightPhase.Climb;

            // try all the ADRs until we find a healthy one
            this.altitude.set(0);
            for (let n = 1; n <= 3; n++) {
                if (climb && !this.altitude.isNormalOperation()) {
                    // use baro correct alt as we're climbing through the transition alt
                    this.altitude.setFromSimVar(`L:A32NX_ADIRS_ADR_${n}_BARO_CORRECTED_ALTITUDE_1`);
                }
                if (!climb && !this.altitude.isNormalOperation()) {
                    // use pressure alt as we're descending through the transition level
                    this.altitude.setFromSimVar(`L:A32NX_ADIRS_ADR_${n}_ALTITUDE`);
                }
            }

            if (!this.altitude.isNormalOperation()) {
                // we can't do anything as there are no healthy ADRs
                return;
            }

            // FIXME remove this when preset is re-enabled
            // eslint-disable-next-line prefer-const
            let presetQnh = 0;
            if (climb) {
                this.fm1TransAlt.setFromSimVar('L:A32NX_FM1_TRANS_ALT');
                this.fm2TransAlt.setFromSimVar('L:A32NX_FM2_TRANS_ALT');
            } else {
                this.fm1TransAlt.setFromSimVar('L:A32NX_FM1_TRANS_LEVEL');
                this.fm2TransAlt.setFromSimVar('L:A32NX_FM2_TRANS_LEVEL');
                // FIXME need to implement altimeters correctly so we don't upset the altimeter causing ALT* or something
                // presetQnh = SimVar.GetSimVarValue('L:A32NX_DESTINATION_QNH', 'millibar');
            }
            const transAlt = this.fm1TransAlt.valueOr(null) ?? this.fm2TransAlt.valueOr(18000);

            const useStdAlt = this.altitude.value >= transAlt;

            if (useStdAlt) {
                // preset the destination QNH if available
                if (presetQnh > Number.EPSILON) {
                    await this.setStdAlt(false);
                    await this.setQnh(presetQnh);
                }
                await this.setStdAlt(true);
            } else {
                const qnh = SimVar.GetSimVarValue('SEA LEVEL PRESSURE', 'millibar');
                await this.setQnh(qnh);
                await this.setStdAlt(false);
            }
        }
    }

    /** rounds an hPa value to the nearest hPa and converts to kohlsman form (x16) */
    private getKohlsmanHpa(hpa: number): number {
        return Math.round(hpa) * 16;
    }

    /** rounds an hPa value to the nearest in.Hg * 100 and converts to kohlsman form (x16) */
    private getKohlsmanInHg(hpa: number): number {
        return Math.round(16 * Math.round(hpa * 3386.39) / 3386.39);
    }

    private async setQnh(qnh: number): Promise<void> {
        const hpaCapt = SimVar.GetSimVarValue('L:XMLVAR_Baro_Selector_HPA_1', 'number') > 0;
        let kohlsmanQnhCapt: number;
        if (hpaCapt) {
            kohlsmanQnhCapt = this.getKohlsmanHpa(qnh);
        } else {
            kohlsmanQnhCapt = this.getKohlsmanInHg(qnh);
        }

        let kohlsmanQnhIsis: number;
        const hpaIsis = SimVar.GetSimVarValue('L:A32NX_ISIS_BARO_UNIT_INHG', 'number') < 1;
        if (hpaIsis) {
            kohlsmanQnhIsis = this.getKohlsmanHpa(qnh);
        } else {
            kohlsmanQnhIsis = this.getKohlsmanInHg(qnh);
        }

        await Promise.all([
            // set PFD qnh
            Coherent.call('TRIGGER_KEY_EVENT', 'KOHLSMAN_SET', true, kohlsmanQnhCapt, 1, 0),
            // set ISIS qnh
            Coherent.call('TRIGGER_KEY_EVENT', 'KOHLSMAN_SET', true, kohlsmanQnhIsis, 2, 0),
        ]);
    }

    private async setStdAlt(stdAlt: boolean): Promise<void> {
        await Promise.all([
            // set PFD STD or QNH
            SimVar.SetSimVarValue('L:XMLVAR_Baro1_Mode', 'number', stdAlt ? 3 : 1),
            SimVar.SetSimVarValue('KOHLSMAN SETTING STD:1', 'number', stdAlt ? 1 : 0),
            // set ISIS STD or QNH
            SimVar.SetSimVarValue('KOHLSMAN SETTING STD:2', 'number', stdAlt ? 1 : 0),
        ]);
    }
}
