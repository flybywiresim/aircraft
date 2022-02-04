// One can rightfully argue that this constant shouldn't be located in @flybywiresim/failures.
// Once we create an A320 specific package, such as @flybywiresim/a320, we can move it there.
export const A320Failure = Object.freeze({
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
});
