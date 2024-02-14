// One can rightfully argue that this constant shouldn't be located in @flybywiresim/failures.
// Once we create an A320 specific package, such as @flybywiresim/a320, we can move it there.
import { FailureDefinition } from "@flybywiresim/fbw-sdk";

export const A380Failure = Object.freeze({
    TransformerRectifier1: 24000,
    TransformerRectifier2: 24001,
    TransformerRectifierEssential: 24002,

    GreenReservoirLeak: 29000,
    BlueReservoirLeak: 29001,
    YellowReservoirLeak: 29002,
    GreenReservoirAirLeak: 29003,
    BlueReservoirAirLeak: 29004,
    YellowReservoirAirLeak: 29005,
    GreenReservoirReturnLeak: 29006,
    BlueReservoirReturnLeak: 29007,
    YellowReservoirReturnLeak: 29008,

    LeftPfdDisplay: 31000,
    RightPfdDisplay: 31001,

    LgciuPowerSupply1: 32000,
    LgciuPowerSupply2: 32001,
    LgciuInternalError1: 32002,
    LgciuInternalError2: 32003,

    GearProxSensorDamageGearUplockLeft1: 32004,
    GearProxSensorDamageDoorDownlockRight2: 32005,
    GearProxSensorDamageGearUplockNose1: 32006,
    GearProxSensorDamageDoorUplockLeft2: 32007,

    RadioAltimeter1: 34000,
    RadioAltimeter2: 34001,
});

export const A380FailureDefinitions: FailureDefinition[] = [
    [24, A380Failure.TransformerRectifier1, 'TR 1'],
    [24, A380Failure.TransformerRectifier2, 'TR 2'],
    [24, A380Failure.TransformerRectifierEssential, 'ESS TR'],

    [29, A380Failure.GreenReservoirLeak, 'Green reservoir leak'],
    [29, A380Failure.BlueReservoirLeak, 'Blue reservoir leak'],
    [29, A380Failure.YellowReservoirLeak, 'Yellow reservoir leak'],
    [29, A380Failure.GreenReservoirAirLeak, 'Green reservoir air leak'],
    [29, A380Failure.BlueReservoirAirLeak, 'Blue reservoir air leak'],
    [29, A380Failure.YellowReservoirAirLeak, 'Yellow reservoir air leak'],
    [29, A380Failure.GreenReservoirReturnLeak, 'Green reservoir return leak'],
    [29, A380Failure.BlueReservoirReturnLeak, 'Blue reservoir return leak'],
    [29, A380Failure.YellowReservoirReturnLeak, 'Yellow reservoir return leak'],

    [31, A380Failure.LeftPfdDisplay, 'Captain PFD display'],
    [31, A380Failure.RightPfdDisplay, 'F/O PFD display'],

    [32, A380Failure.LgciuPowerSupply1, 'LGCIU 1 Power supply'],
    [32, A380Failure.LgciuPowerSupply2, 'LGCIU 2 Power supply'],
    [32, A380Failure.LgciuInternalError1, 'LGCIU 1 Internal error'],
    [32, A380Failure.LgciuInternalError2, 'LGCIU 2 Internal error'],

    [32, A380Failure.GearProxSensorDamageGearUplockNose1, 'Proximity sensor damage uplock nose gear #1'],

    [34, A380Failure.RadioAltimeter1, 'RA 1'],
    [34, A380Failure.RadioAltimeter2, 'RA 2'],
];
