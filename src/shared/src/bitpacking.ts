export class BitPacking {
    /**
     * Pack an array of up to 4 8-bit integers into a single integer
     * The total size of the resulting packed integer is 51 bytes.
     * Can hold values from -128 to 127 signed, or 0 to 255 unsigned.
     * @param values The array of integers
     * @param unsigned A boolean flag which indicates whether the integers should be signed or unsigned.
     * @returns Resulting packed number
     */
    static pack8(values: number[], unsigned: boolean = false): number {
        const size = Math.min(values.length, 4);
        const offset = unsigned ? 128 : 0;
        let packed = 0;
        let bitmask = 0xFF;
        for (let i = 0; i < size; i++) {
            packed += bitmask & (Math.abs((Math.trunc(values[i]) + offset)) << (8 * i));
            bitmask *= 0x100;
        }
        return (packed << 3) + size;
    }

    /**
     * Unpacks numbers created by pack8() back into an integer array
     * @param value The packed number
     * @param unsigned A boolean flag which indicates whether the integers were packed signed or unsigned.
     * @returns Resulting unpacked int array
     */
    static unpack8(value: number, unsigned: boolean = false): number[] {
        const size = 0x07 & value;
        const offset = unsigned ? 128 : 0;
        let data = (value >>> 3);
        const unpacked: number[] = [];
        for (let i = 0; i < size; i++) {
            unpacked.push((0xFF & data) - offset);
            data >>>= 8;
        }

        return unpacked;
    }
}
