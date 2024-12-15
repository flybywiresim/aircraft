export class SimVarCache {
  private simVarCache: { [key: string]: number | null };

  constructor() {
    this.simVarCache = {};
  }

  getCachedSimVar(_simvar: string, _unit, force: boolean = false): number {
    const key: string = `${_simvar}:${_unit}`;
    if (this.simVarCache[key] !== null && !force) {
      return this.simVarCache[key];
    }
    const value = SimVar.GetSimVarValue(_simvar, _unit);
    this.simVarCache[key] = value;
    return value;
  }

  resetCache(): void {
    Object.entries(this.simVarCache).forEach(([key]) => {
      this.simVarCache[key] = null;
    });
  }
}

export class LocalSimVar<T> {
  private localVar: T | number;

  constructor(
    public simvar: string,
    public unit,
  ) {
    this.localVar = SimVar.GetSimVarValue(this.simvar, this.unit);
  }

  setVar(value: T | number): void {
    // Assume we are the only setter
    if (this.localVar !== value) {
      this.localVar = value;
      SimVar.SetSimVarValue(this.simvar, this.unit, +value);
    }
  }

  getVar(): T | number {
    return this.localVar;
  }
}

export class SimVarString {
  /**
   * Pack a string into numbers for use in a simvar
   * ASCII chars from dec 32-63 can be encoded, 6-bit per char, 8 chars per simvar
   * IMPORTANT: write the values as strings to the simvars or you will have precision errors
   * @param value
   * @param maxLength if specified enough simvars will be returned to fit this length,
   * and the value will be trimmed to this length
   * @returns an array of numbers ready to be written to simvars
   */
  static pack(value: string, maxLength?: number): number[] {
    let word = -1;
    const ret = [];
    for (let i = 0; i < Math.min(maxLength, value.length); i++) {
      const char = i % 8;
      if (char === 0) {
        word++;
        ret[word] = 0;
      }

      let code = value.charCodeAt(i) - 31;
      if (code < 1 || code > 63 || !Number.isFinite(code)) {
        code = 0;
      }
      ret[word] += 2 ** (char * 6) * code;
    }
    if (maxLength && ret.length < Math.ceil(maxLength / 8)) {
      ret.push(...new Array(Math.ceil(maxLength / 8) - ret.length).fill(0));
    }

    return ret;
  }

  /**
   * Unpacks numeric values packed by @see packString
   * @param values an array of numbers from the simvars
   * @returns the unpacked string
   */
  static unpack(values: number[]): string {
    let ret = '';
    for (let i = 0; i < values.length * 8; i++) {
      const word = Math.floor(i / 8);
      const char = i % 8;
      const code = Math.floor(values[word] / 2 ** (char * 6)) & 0x3f;
      if (code > 0) {
        ret += String.fromCharCode(code + 31);
      }
    }
    return ret;
  }
}
