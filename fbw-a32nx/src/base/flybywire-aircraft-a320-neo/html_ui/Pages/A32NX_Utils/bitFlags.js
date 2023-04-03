class BitFlags {
    constructor(number) {
        this.f64View = new Float64Array(1);
        this.u32View = new Uint32Array(this.f64View.buffer);
        this.setFlags(number);
    }

    setFlags(number) {
        this.flags = Array.from(this.u32View);
        const bigNumberAsBinaryStr = number.toString(2);

        let bigNumberAsBinaryStr2 = '';
        for (let i = 0; i < 64 - bigNumberAsBinaryStr.length; i++) {
            bigNumberAsBinaryStr2 += '0';
        }

        bigNumberAsBinaryStr2 += bigNumberAsBinaryStr;

        this.flags[1] = parseInt(bigNumberAsBinaryStr2.substring(0, 32), 2);
        this.flags[0] = parseInt(bigNumberAsBinaryStr2.substring(32), 2);
    }

    getBitIndex(bit) {
        if (bit > 63) {
            return false;
        }
        const f = Math.floor(bit / 31);
        const b = bit % 31;

        return ((this.flags[f] >> b) & 1) !== 0;
    }

    toggleBitIndex(bit) {
        if (bit > 63) {
            return;
        }
        const f = Math.floor(bit / 31);
        const b = bit % 31;

        this.flags[f] ^= (1 << b);
    }

    toDouble() {
        return (new Float64Array(Uint32Array.from(this.flags).buffer))[0];
    }

    toDebug() {
        const debug = [];
        this.flags.forEach((flag, index) => {
            debug.push(flag.toString(2));
            const fL = 32 - flag.toString(2).length;
            for (let i = 0; i < fL; i++) {
                debug[index] = '0'.concat(debug[index]);
            }
        });
        return (`HIGH [ ${debug[1]} | ${debug[0]} ] LOW`);
    }

    toNumber() {
        return this.flags[1] * 2 ** 32 + this.flags[0];
    }

    toString() {
        return this.toNumber().toString();
    }

    getTotalBits() {
        let total = 0;
        this.flags.forEach((flag) => {
            const n = 32;
            let i = 0;
            while (i++ < n) {
                if ((1 << i & flag) === (1 << i)) {
                    total++;
                }
            }
        });
        return total;
    }
}
