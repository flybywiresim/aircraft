import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from 'msfssdk';
import {
    AdirsSimVarDefinitions,
    AdirsSimVars,
    SwitchingPanelSimVarsDefinitions,
    SwitchingPanelVSimVars,
} from '../MsfsAvionicsCommon/SimVarTypes';

export type NDSimvars = AdirsSimVars & SwitchingPanelVSimVars & {
    elec: number;
    elecFo: number;
    potentiometerCaptain: number;
    potentiometerFo: number;
    toWptIdent0Captain: number;
    toWptIdent1Captain: number;
    toWptBearingCaptain: Degrees;
  }

export enum NDVars {
    elec = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
    elecFo = 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED',
    potentiometerCaptain = 'LIGHT POTENTIOMETER:89',
    potentiometerFo = 'LIGHT POTENTIOMETER:91',
    toWptIdent0Captain = 'L:A32NX_EFIS_L_TO_WPT_IDENT_0',
    toWptIdent1Captain = 'L:A32NX_EFIS_L_TO_WPT_IDENT_1',
    toWptBearingCaptain = 'L:A32NX_EFIS_L_TO_WPT_BEARING',
  }

/** A publisher to poll and publish nav/com simvars. */
export class NDSimvarPublisher extends SimVarPublisher<NDSimvars> {
    private static simvars = new Map<keyof NDSimvars, SimVarDefinition>([
        ...AdirsSimVarDefinitions,
        ...SwitchingPanelSimVarsDefinitions,
        ['elec', { name: NDVars.elec, type: SimVarValueType.Bool }],
        ['elecFo', { name: NDVars.elecFo, type: SimVarValueType.Bool }],
        ['potentiometerCaptain', { name: NDVars.potentiometerCaptain, type: SimVarValueType.Number }],
        ['potentiometerFo', { name: NDVars.potentiometerFo, type: SimVarValueType.Number }],
        ['toWptIdent0Captain', { name: NDVars.toWptIdent0Captain, type: SimVarValueType.Number }],
        ['toWptIdent1Captain', { name: NDVars.toWptIdent1Captain, type: SimVarValueType.Number }],
        ['toWptBearingCaptain', { name: NDVars.toWptBearingCaptain, type: SimVarValueType.Degree }],
    ])

    public constructor(bus: EventBus) {
        super(NDSimvarPublisher.simvars, bus);
    }
}
