import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from 'msfssdk';

export type EWDSimvars = {
    acEssBus: boolean;
    ewdPotentiometer: number;
    autoThrustCommand1: number;
    autoThrustCommand2: number;
    autoThrustLimit: number;
    autoThrustLimitToga: number;
    autoThrustLimitType: number;
    autoThrustMode: number;
    autoThrustStatus: number;
    autoThrustTLA1: number;
    autoThrustTLA2: number;
    autoThrustWarningToga: boolean;
    packs1Supplying: boolean;
    packs2Supplying: boolean;
    engine1AntiIce: boolean;
    engine1EGT: number;
    engine1Fadec: boolean;
    engine1N1: number;
    engine1Reverse: boolean;
    engine1ReverseNozzle: number;
    engine1State: number;
    engine2AntiIce: boolean;
    engine2EGT: number;
    engine2Fadec: boolean;
    engine2N1: number;
    engine2Reverse: boolean;
    engine2ReverseNozzle: number;
    engine2State: number;
    wingAntiIce: boolean;
    apuBleedPressure: number;
    left1LandingGear: boolean;
    right1LandingGear: boolean;
    throttle1Position: number;
    throttle2Position: number;
    fwcFlightPhase: number;
    idleN1: number;
    flexTemp: number;
    satRaw: number;
}

export enum EWDVars {
    acEssBus = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
    ewdPotentiometer = 'LIGHT POTENTIOMETER:92',
    autoThrustCommand1 = 'L:A32NX_AUTOTHRUST_N1_COMMANDED:1',
    autoThrustCommand2 = 'L:A32NX_AUTOTHRUST_N1_COMMANDED:2',
    autoThrustLimit = 'L:A32NX_AUTOTHRUST_THRUST_LIMIT',
    autoThrustLimitToga = 'L:A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA',
    autoThrustLimitType = 'L:A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE',
    autoThrustMode = 'L:A32NX_AUTOTHRUST_MODE',
    autoThrustStatus = 'L:A32NX_AUTOTHRUST_STATUS',
    autoThrustTLA1 = 'L:A32NX_AUTOTHRUST_TLA_N1:1',
    autoThrustTLA2 = 'L:A32NX_AUTOTHRUST_TLA_N1:2',
    autoThrustWarningToga = 'L:A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_TOGA',
    packs1Supplying = 'L:A32NX_COND_PACK_FLOW_VALVE_1_IS_OPEN',
    packs2Supplying = 'L:A32NX_COND_PACK_FLOW_VALVE_2_IS_OPEN',
    engine1AntiIce = 'L:XMLVAR_Momentary_PUSH_OVHD_ANTIICE_ENG1_Pressed',
    engine1EGT = 'L:A32NX_ENGINE_EGT:1',
    engine1Fadec = 'L:A32NX_FADEC_POWERED_ENG1',
    engine1N1 = 'L:A32NX_ENGINE_N1:1',
    engine1Reverse = 'L:A32NX_AUTOTHRUST_REVERSE:1',
    engine1ReverseNozzle = 'A:TURB ENG REVERSE NOZZLE PERCENT:1',
    engine1State = 'L:A32NX_ENGINE_STATE:1',
    engine2AntiIce = 'L:XMLVAR_Momentary_PUSH_OVHD_ANTIICE_ENG2_Pressed',
    engine2EGT = 'L:A32NX_ENGINE_EGT:2',
    engine2Fadec = 'L:A32NX_FADEC_POWERED_ENG2',
    engine2N1 = 'L:A32NX_ENGINE_N1:2',
    engine2Reverse = 'L:A32NX_AUTOTHRUST_REVERSE:2',
    engine2ReverseNozzle = 'A:TURB ENG REVERSE NOZZLE PERCENT:2',
    engine2State = 'L:A32NX_ENGINE_STATE:2',
    wingAntiIce = 'L:A32NX_PNEU_WING_ANTI_ICE_SYSTEM_SELECTED',
    apuBleedPressure = 'L:APU_BLEED_PRESSURE',
    left1LandingGear = 'L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED',
    right1LandingGear = 'L:A32NX_LGCIU_1_RIGHT_GEAR_COMPRESSED',
    throttle1Position = 'L:XMLVAR_Throttle1Position',
    throttle2Position = 'L:XMLVAR_Throttle2Position',
    fwcFlightPhase = 'L:A32NX_FWC_FLIGHT_PHASE',
    idleN1 = 'L:A32NX_ENGINE_IDLE_N1',
    flexTemp = 'L:AIRLINER_TO_FLEX_TEMP',
    satRaw = 'L:A32NX_ADIRS_ADR_1_STATIC_AIR_TEMPERATURE',
}

export class EWDSimvarPublisher extends SimVarPublisher<EWDSimvars> {
    private static simvars = new Map<keyof EWDSimvars, SimVarDefinition>([
        ['acEssBus', { name: EWDVars.acEssBus, type: SimVarValueType.Bool }],
        ['ewdPotentiometer', { name: EWDVars.ewdPotentiometer, type: SimVarValueType.Number }],
        ['autoThrustCommand1', { name: EWDVars.autoThrustCommand1, type: SimVarValueType.Number }],
        ['autoThrustCommand2', { name: EWDVars.autoThrustCommand2, type: SimVarValueType.Number }],
        ['autoThrustLimit', { name: EWDVars.autoThrustLimit, type: SimVarValueType.Number }],
        ['autoThrustLimitToga', { name: EWDVars.autoThrustLimitToga, type: SimVarValueType.Number }],
        ['autoThrustLimitType', { name: EWDVars.autoThrustLimitType, type: SimVarValueType.Enum }],
        ['autoThrustMode', { name: EWDVars.autoThrustMode, type: SimVarValueType.Enum }],
        ['autoThrustStatus', { name: EWDVars.autoThrustStatus, type: SimVarValueType.Enum }],
        ['autoThrustTLA1', { name: EWDVars.autoThrustTLA1, type: SimVarValueType.Number }],
        ['autoThrustTLA2', { name: EWDVars.autoThrustTLA2, type: SimVarValueType.Number }],
        ['autoThrustWarningToga', { name: EWDVars.autoThrustWarningToga, type: SimVarValueType.Bool }],
        ['packs1Supplying', { name: EWDVars.packs1Supplying, type: SimVarValueType.Bool }],
        ['packs2Supplying', { name: EWDVars.packs2Supplying, type: SimVarValueType.Bool }],
        ['engine1AntiIce', { name: EWDVars.engine1AntiIce, type: SimVarValueType.Bool }],
        ['engine1EGT', { name: EWDVars.engine1EGT, type: SimVarValueType.Number }],
        ['engine1Fadec', { name: EWDVars.engine1Fadec, type: SimVarValueType.Bool }],
        ['engine1N1', { name: EWDVars.engine1N1, type: SimVarValueType.Number }],
        ['engine1Reverse', { name: EWDVars.engine1Reverse, type: SimVarValueType.Bool }],
        ['engine1ReverseNozzle', { name: EWDVars.engine1ReverseNozzle, type: SimVarValueType.Number }],
        ['engine1State', { name: EWDVars.engine1State, type: SimVarValueType.Enum }],
        ['engine2AntiIce', { name: EWDVars.engine2AntiIce, type: SimVarValueType.Bool }],
        ['engine2EGT', { name: EWDVars.engine2EGT, type: SimVarValueType.Number }],
        ['engine2Fadec', { name: EWDVars.engine2Fadec, type: SimVarValueType.Bool }],
        ['engine2N1', { name: EWDVars.engine2N1, type: SimVarValueType.Number }],
        ['engine2Reverse', { name: EWDVars.engine2Reverse, type: SimVarValueType.Bool }],
        ['engine2ReverseNozzle', { name: EWDVars.engine2ReverseNozzle, type: SimVarValueType.Number }],
        ['engine2State', { name: EWDVars.engine2State, type: SimVarValueType.Enum }],
        ['wingAntiIce', { name: EWDVars.wingAntiIce, type: SimVarValueType.Bool }],
        ['apuBleedPressure', { name: EWDVars.apuBleedPressure, type: SimVarValueType.PSI }],
        ['left1LandingGear', { name: EWDVars.left1LandingGear, type: SimVarValueType.Bool }],
        ['right1LandingGear', { name: EWDVars.right1LandingGear, type: SimVarValueType.Bool }],
        ['throttle1Position', { name: EWDVars.throttle1Position, type: SimVarValueType.Number }],
        ['throttle2Position', { name: EWDVars.throttle2Position, type: SimVarValueType.Number }],
        ['fwcFlightPhase', { name: EWDVars.fwcFlightPhase, type: SimVarValueType.Enum }],
        ['idleN1', { name: EWDVars.idleN1, type: SimVarValueType.Number }],
        ['flexTemp', { name: EWDVars.flexTemp, type: SimVarValueType.Number }],
        ['satRaw', { name: EWDVars.satRaw, type: SimVarValueType.Number }],
    ])

    public constructor(bus: EventBus) {
        super(EWDSimvarPublisher.simvars, bus);
    }
}
