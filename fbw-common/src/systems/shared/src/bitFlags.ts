export class BitFlags {
  flags: number[];

  static f64View = new Float64Array(1);

  static u32View = new Uint32Array(BitFlags.f64View.buffer);

  constructor(number: number) {
    this.setFlags(number);
  }

  setFlags(number: number): void {
    this.flags = Array.from(BitFlags.u32View);
    const bigNumberAsBinaryStr = number.toString(2); // '100000000000000000000000000000000000000000000000000000'

    let bigNumberAsBinaryStr2 = '';
    for (let i = 0; i < 64 - bigNumberAsBinaryStr.length; i++) {
      bigNumberAsBinaryStr2 += '0';
    }

    bigNumberAsBinaryStr2 += bigNumberAsBinaryStr;

    this.flags[1] = parseInt(bigNumberAsBinaryStr2.substring(0, 32), 2);
    this.flags[0] = parseInt(bigNumberAsBinaryStr2.substring(32), 2);
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

    this.flags[f] ^= 1 << b;
  }

  toDouble(): number {
    return new Float64Array(Uint32Array.from(this.flags).buffer)[0];
  }

  toDebug(): string {
    const debug: string[] = [];
    this.flags.forEach((flag, index) => {
      debug.push(flag.toString(2));
      const fL = 32 - flag.toString(2).length;
      for (let i = 0; i < fL; i++) {
        debug[index] = '0'.concat(debug[index]);
      }
    });
    return `HIGH [ ${debug[1]} | ${debug[0]} ] LOW`;
  }

  toNumber(): number {
    return this.flags[1] * 2 ** 32 + this.flags[0];
  }

  toString(): string {
    return this.toNumber().toString();
  }

  getTotalBits(): number {
    let total = 0;
    this.flags.forEach((flag) => {
      const n = 32;
      let i = 0;
      while (i++ < n) {
        if (((1 << i) & flag) === 1 << i) {
          total++;
        }
      }
    });
    return total;
  }
}

export class SeatFlags extends BitFlags {
  // Limit bits utilisation to < totalSeats
  totalSeats: number;

  constructor(number: number, totalSeats: number) {
    super(number);
    this.totalSeats = totalSeats;
  }

  getEmptySeatIds(): number[] {
    const emptySeats: number[] = [];
    for (let seatId = 0; seatId < this.totalSeats; seatId++) {
      if (!this.getBitIndex(seatId)) {
        emptySeats.push(seatId);
      }
    }
    return emptySeats;
  }

  getFilledSeatIds(): number[] {
    const filledSeats: number[] = [];
    for (let seatId = 0; seatId < this.totalSeats; seatId++) {
      if (this.getBitIndex(seatId)) {
        filledSeats.push(seatId);
      }
    }
    return filledSeats;
  }

  isSeatFilled(seatId: number): boolean {
    if (seatId > this.totalSeats) return false;
    return this.getBitIndex(seatId);
  }

  toggleSeatId(seatId: number): void {
    if (seatId > this.totalSeats) return;
    this.toggleBitIndex(seatId);
  }

  fillSeats(numFill: number, choices: number[]) {
    for (let i = 0; i < numFill; i++) {
      if (choices.length > 0) {
        const chosen = ~~(Math.random() * choices.length);
        this.toggleSeatId(choices[chosen]);
        choices.splice(chosen, 1);
      }
    }
  }

  fillEmptySeats(numFill: number) {
    this.fillSeats(numFill, this.getEmptySeatIds());
  }

  emptySeats(numEmpty: number, choices: number[]) {
    for (let i = 0; i < numEmpty; i++) {
      if (choices.length > 0) {
        const chosen = ~~(Math.random() * choices.length);
        this.toggleSeatId(choices[chosen]);
        choices.splice(chosen, 1);
      }
    }
  }

  emptyFilledSeats(numEmpty: number) {
    this.emptySeats(numEmpty, this.getFilledSeatIds());
  }

  getTotalFilledSeats(): number {
    return this.getTotalBits();
  }

  getTotalEmptySeats(): number {
    return this.totalSeats - this.getTotalBits();
  }
}
