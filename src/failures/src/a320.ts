// One can rightfully argue that this constant shouldn't be located in @flybywiresim/failures.
// Once we create an A320 specific package, such as @flybywiresim/a320, we can move it there.
export const A320Failure = Object.freeze({
    TransformerRectifier1: 24000,
    TransformerRectifier2: 24001,
    TransformerRectifierEssential: 24002,
    LeftPfdDisplay: 31000,
    RightPfdDisplay: 31001,
});
