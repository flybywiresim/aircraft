export class ScratchpadMessage {
    text: string

    isAmber: Boolean

    isTypeTwo: Boolean

    c? : () => {}

    f? : () => {}

    constructor(text: string, isAmber: Boolean, isTypeTwo: Boolean, c? : () => {}, f? : () => {}) {
        this.text = text;
        this.isAmber = isAmber;
        this.isTypeTwo = isTypeTwo;
        this.c = c;
        this.f = f;
    }
}
