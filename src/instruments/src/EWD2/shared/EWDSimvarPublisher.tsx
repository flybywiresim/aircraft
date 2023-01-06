import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from 'msfssdk';

export type EWDSimvars = {
    acEssBus: boolean;
    ewdPotentiometer: number;
    autoThrustMode: number;
    autoThrustStatus: number;
    packs1Supplying: boolean;
    packs2Supplying: boolean;
    engine1AntiIce: boolean;
    engine1Fadec: boolean;
    engine1N1: number;
    engine1State: number;
    engine2AntiIce: boolean;
    engine2Fadec: boolean;
    engine2N1: number;
    engine2State: number;
    wingAntiIce: boolean;
    apuBleedPressure: number;
    left1LandingGear: boolean;
    right1LandingGear: boolean;
    throttle1Position: number;
    throttle2Position: number;
    fwcFlightPhase: number;
    idleN1: number;
}

export enum EWDVars {
    acEssBus = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
    ewdPotentiometer = 'LIGHT POTENTIOMETER:92',
    autoThrustMode = 'L:A32NX_AUTOTHRUST_MODE',
    autoThrustStatus = 'L:A32NX_AUTOTHRUST_STATUS',
    packs1Supplying = 'L:A32NX_COND_PACK_FLOW_VALVE_1_IS_OPEN',
    packs2Supplying = 'L:A32NX_COND_PACK_FLOW_VALVE_2_IS_OPEN',
    engine1AntiIce = 'L:XMLVAR_Momentary_PUSH_OVHD_ANTIICE_ENG1_Pressed',
    engine1N1 = 'L:A32NX_ENGINE_N1:1',
    engine1State = 'L:A32NX_ENGINE_STATE:1',
    engine2AntiIce = 'L:XMLVAR_Momentary_PUSH_OVHD_ANTIICE_ENG2_Pressed',
    engine2N1 = 'L:A32NX_ENGINE_N1:2',
    engine2State = 'L:A32NX_ENGINE_STATE:2',
    wingAntiIce = 'L:A32NX_PNEU_WING_ANTI_ICE_SYSTEM_SELECTED',
    apuBleedPressure = 'L:APU_BLEED_PRESSURE',
    left1LandingGear = 'L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED',
    right1LandingGear = 'L:A32NX_LGCIU_1_RIGHT_GEAR_COMPRESSED',
    throttle1Position = 'L:XMLVAR_Throttle1Position',
    throttle2Position = 'L:XMLVAR_Throttle2Position',
    fwcFlightPhase = 'L:A32NX_FWC_FLIGHT_PHASE',
    idleN1 = 'L:A32NX_ENGINE_IDLE_N1',
}

export class EWDSimvarPublisher extends SimVarPublisher<EWDSimvars> {
    private static simvars = new Map<keyof EWDSimvars, SimVarDefinition>([
        ['acEssBus', { name: EWDVars.acEssBus, type: SimVarValueType.Bool }],
        ['ewdPotentiometer', { name: EWDVars.ewdPotentiometer, type: SimVarValueType.Number }],
        ['autoThrustMode', { name: EWDVars.autoThrustMode, type: SimVarValueType.Enum }],
        ['autoThrustStatus', { name: EWDVars.autoThrustStatus, type: SimVarValueType.Enum }],
        ['packs1Supplying', { name: EWDVars.packs1Supplying, type: SimVarValueType.Bool }],
        ['packs2Supplying', { name: EWDVars.packs2Supplying, type: SimVarValueType.Bool }],
        ['engine1AntiIce', { name: EWDVars.engine1AntiIce, type: SimVarValueType.Bool }],
        ['engine1N1', { name: EWDVars.engine1N1, type: SimVarValueType.Number }],
        ['engine1State', { name: EWDVars.engine1State, type: SimVarValueType.Enum }],
        ['engine2AntiIce', { name: EWDVars.engine2AntiIce, type: SimVarValueType.Bool }],
        ['engine2N1', { name: EWDVars.engine2N1, type: SimVarValueType.Number }],
        ['engine2State', { name: EWDVars.engine2State, type: SimVarValueType.Enum }],
        ['wingAntiIce', { name: EWDVars.wingAntiIce, type: SimVarValueType.Bool }],
        ['apuBleedPressure', { name: EWDVars.apuBleedPressure, type: SimVarValueType.PSI }],
        ['left1LandingGear', { name: EWDVars.left1LandingGear, type: SimVarValueType.Bool }],
        ['right1LandingGear', { name: EWDVars.right1LandingGear, type: SimVarValueType.Bool }],
        ['throttle1Position', { name: EWDVars.throttle1Position, type: SimVarValueType.Number }],
        ['throttle2Position', { name: EWDVars.throttle2Position, type: SimVarValueType.Number }],
        ['fwcFlightPhase', { name: EWDVars.fwcFlightPhase, type: SimVarValueType.Enum }],
        ['idleN1', { name: EWDVars.idleN1, type: SimVarValueType.Number }],
    ])

    public constructor(bus: EventBus) {
        super(EWDSimvarPublisher.simvars, bus);
    }
}
