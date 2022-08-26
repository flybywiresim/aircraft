export class BitFlags {
    flags: number[];

    static f64View = new Float64Array(1);

    static u32View = new Uint32Array(BitFlags.f64View.buffer);

    constructor(float: number) {
        this.setFlags(float);
    }

    setFlags(float: number): void {
        BitFlags.f64View[0] = float;
        this.flags = Array.from(BitFlags.u32View);
    }

    getBitIndex(bit: number): boolean {
        if (bit > 63) return false;
        const f = Math.floor(bit / 31);
        const b = bit % 31;

        return ((this.flags[f] >> b) & 1) !== 0;
    }

    toggleBitIndex(bit: number): void {
        if (bit > 63) return;
        const f = Math.floor(bit / 31);
        const b = bit % 31;

        this.flags[f] ^= (1 << b);
    }

    toDouble(): number {
        return (new Float64Array(Uint32Array.from(this.flags).buffer))[0];
    }

    toString(): string {
        return (`[ ${this.flags[0].toString(2)} | ${this.flags[1].toString(2)} ]`);
    }
}
