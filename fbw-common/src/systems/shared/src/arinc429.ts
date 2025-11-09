export enum Arinc429SignStatusMatrix {
  FailureWarning = 0b00,
  NoComputedData = 0b01,
  FunctionalTest = 0b10,
  NormalOperation = 0b11,
}

export interface Arinc429WordData {
  ssm: Arinc429SignStatusMatrix;

  value: number;

  rawWord: number;

  isFailureWarning(): boolean;

  isNoComputedData(): boolean;

  isFunctionalTest(): boolean;

  isNormalOperation(): boolean;

  isInvalid(): boolean;

  /** Returns the value of the word if valid, else the specified default value. */
  valueOr(defaultValue: number): number;
  /** Returns the value of the word if valid, else null. */
  valueOr(defaultValue: null): number | null;
  /** Returns the value of the word if valid, else undefined. */
  valueOr(defaultValue: undefined): number | undefined;
  valueOr(defaultValue: number | undefined | null): number | undefined | null;

  bitValue(bit: number): boolean;

  /** Returns the value of the bit if valid, else the specified default value. */
  bitValueOr(bit: number, defaultValue: boolean): boolean;
  /** Returns the value of the bit if valid, else null. */
  bitValueOr(bit: number, defaultValue: null): boolean | null;
  /** Returns the value of the bit if valid, else undefined. */
  bitValueOr(bit: number, defaultValue: undefined): boolean | undefined;
  bitValueOr(bit: number, defaultValue: boolean | undefined | null): boolean | undefined | null;
}

/** @deprecated Use {@link Arinc429Register} instead. */
export class Arinc429Word implements Arinc429WordData {
  static u32View = new Uint32Array(1);

  static f32View = new Float32Array(Arinc429Word.u32View.buffer);

  ssm: Arinc429SignStatusMatrix;

  value: number;

  constructor(public readonly rawWord: number) {
    Arinc429Word.u32View[0] = (rawWord & 0xffffffff) >>> 0;
    this.ssm = (Math.trunc(rawWord / 2 ** 32) & 0b11) as Arinc429SignStatusMatrix;
    this.value = Arinc429Word.f32View[0];
  }

  static empty(): Arinc429Word {
    return new Arinc429Word(0);
  }

  static fromSimVarValue(name: string): Arinc429Word {
    return new Arinc429Word(SimVar.GetSimVarValue(name, 'number'));
  }

  public static getRawWord(value: number, ssm: Arinc429SignStatusMatrix) {
    Arinc429Word.f32View[0] = value;
    return Arinc429Word.u32View[0] + Math.trunc(ssm) * 2 ** 32;
  }

  static async toSimVarValue(name: string, value: number, ssm: Arinc429SignStatusMatrix) {
    const simVal = Arinc429Word.getRawWord(value, ssm);
    return SimVar.SetSimVarValue(name, 'string', simVal.toString());
  }

  isFailureWarning() {
    return this.ssm === Arinc429SignStatusMatrix.FailureWarning;
  }

  isNoComputedData() {
    return this.ssm === Arinc429SignStatusMatrix.NoComputedData;
  }

  isFunctionalTest() {
    return this.ssm === Arinc429SignStatusMatrix.FunctionalTest;
  }

  isNormalOperation() {
    return this.ssm === Arinc429SignStatusMatrix.NormalOperation;
  }

  isInvalid(): boolean {
    return (
      this.ssm !== Arinc429SignStatusMatrix.NormalOperation && this.ssm !== Arinc429SignStatusMatrix.FunctionalTest
    );
  }

  /** @inheritdoc */
  public valueOr(defaultValue: number): number;
  /** @inheritdoc */
  public valueOr(defaultValue: undefined): number | undefined;
  /** @inheritdoc */
  public valueOr(defaultValue: null): number | null;
  /** Returns the value of the word if valid, else the specified default value. */
  public valueOr(defaultValue: number | undefined | null): number | undefined | null;
  public valueOr(defaultValue: number | undefined | null): number | undefined | null {
    return this.isNormalOperation() || this.isFunctionalTest() ? this.value : defaultValue;
  }

  bitValue(bit: number): boolean {
    return ((this.value >> (bit - 1)) & 1) !== 0;
  }

  /** @inheritdoc */
  public bitValueOr(bit: number, defaultValue: boolean): boolean;
  /** @inheritdoc */
  public bitValueOr(bit: number, defaultValue: null): boolean | null;
  /** @inheritdoc */
  public bitValueOr(bit: number, defaultValue: undefined): boolean | undefined;
  /** Returns the value of the bit if valid, else the specified default value. */
  public bitValueOr(bit: number, defaultValue: boolean | undefined | null): boolean | typeof defaultValue;
  public bitValueOr(bit: number, defaultValue: boolean | undefined | null): boolean | typeof defaultValue {
    return this.isNormalOperation() || this.isFunctionalTest() ? ((this.value >> (bit - 1)) & 1) !== 0 : defaultValue;
  }

  setBitValue(bit: number, value: boolean): void {
    if (value) {
      this.value |= 1 << (bit - 1);
    } else {
      this.value &= ~(1 << (bit - 1));
    }
  }
}

export class Arinc429Register implements Arinc429WordData {
  private static readonly iso5Cache: number[] = [];

  rawWord = 0;

  u32View = new Uint32Array(1);

  f32View = new Float32Array(this.u32View.buffer);

  public ssm = Arinc429SignStatusMatrix.FailureWarning;

  public value = 0;

  static empty() {
    return new Arinc429Register();
  }

  private constructor() {
    this.set(0);
  }

  set(rawWord: number): Arinc429Register {
    this.rawWord = rawWord;
    this.u32View[0] = (rawWord & 0xffffffff) >>> 0;
    this.ssm = (Math.trunc(rawWord / 2 ** 32) & 0b11) as Arinc429SignStatusMatrix;
    this.value = this.f32View[0];
    return this;
  }

  setValue(value: typeof this.value): void {
    this.value = value;
    this.updateRawWord();
  }

  private updateRawWord(): void {
    this.f32View[0] = this.value;
    this.rawWord = this.u32View[0] + Math.trunc(this.ssm) * 2 ** 32;
  }

  setBitValue(bit: number, value: boolean): void {
    if (value) {
      this.value |= 1 << (bit - 1);
    } else {
      this.value &= ~(1 << (bit - 1));
    }
    this.updateRawWord();
  }

  setSsm(ssm: typeof this.ssm): void {
    this.ssm = ssm;
    this.updateRawWord();
  }

  setFromSimVar(name: string): Arinc429Register {
    return this.set(SimVar.GetSimVarValue(name, 'number'));
  }

  writeToSimVar(name: string): void {
    this.f32View[0] = this.value;
    SimVar.SetSimVarValue(name, 'string', (this.u32View[0] + Math.trunc(this.ssm) * 2 ** 32).toString());
  }

  isFailureWarning() {
    return this.ssm === Arinc429SignStatusMatrix.FailureWarning;
  }

  isNoComputedData() {
    return this.ssm === Arinc429SignStatusMatrix.NoComputedData;
  }

  isFunctionalTest() {
    return this.ssm === Arinc429SignStatusMatrix.FunctionalTest;
  }

  isNormalOperation() {
    return this.ssm === Arinc429SignStatusMatrix.NormalOperation;
  }

  isInvalid(): boolean {
    return (
      this.ssm !== Arinc429SignStatusMatrix.NormalOperation && this.ssm !== Arinc429SignStatusMatrix.FunctionalTest
    );
  }

  /** @inheritdoc */
  public valueOr(defaultValue: number): number;
  /** @inheritdoc */
  public valueOr(defaultValue: undefined): number | undefined;
  /** @inheritdoc */
  public valueOr(defaultValue: null): number | null;
  public valueOr(defaultValue: number | undefined | null): number | undefined | null {
    return this.isInvalid() ? defaultValue : this.value;
  }

  bitValue(bit: number): boolean {
    return ((this.value >> (bit - 1)) & 1) !== 0;
  }

  /** @inheritdoc */
  public bitValueOr(bit: number, defaultValue: boolean): boolean;
  /** @inheritdoc */
  public bitValueOr(bit: number, defaultValue: null): boolean | null;
  /** @inheritdoc */
  public bitValueOr(bit: number, defaultValue: undefined): boolean | undefined;
  public bitValueOr(bit: number, defaultValue: boolean | undefined | null): boolean | undefined | null {
    return this.isInvalid() ? defaultValue : ((this.value >> (bit - 1)) & 1) !== 0;
  }

  public getIso5Value(): string {
    return Arinc429Register.assembleIso5Value(true, this);
  }

  public static assembleIso5Value(includeInvalid: boolean, ...words: Arinc429WordData[]): string {
    Arinc429Register.iso5Cache.length = 0;
    for (const word of words) {
      if (
        !includeInvalid &&
        word.ssm !== Arinc429SignStatusMatrix.NormalOperation &&
        word.ssm !== Arinc429SignStatusMatrix.FunctionalTest
      ) {
        break;
      }
      const char0 = (word.value >>> 10) & 0x7f;
      if (char0 > 0) {
        Arinc429Register.iso5Cache.push(char0);

        const char1 = (word.value >>> 18) & 0x7f;
        if (char1 > 0) {
          Arinc429Register.iso5Cache.push(char1);
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return String.fromCharCode(...Arinc429Register.iso5Cache);
  }
}

/**
 * A utility class specifically for outputting ARINC429 words.
 * BNR values are quantised according to the specified bitwidth and range.
 * Optimized to only write when the value changes more than some quantization.
 */
export class Arinc429OutputWord {
  protected word: Arinc429Word;

  protected isDirty: boolean = true;

  public constructor(rawValue = 0) {
    this.word = new Arinc429Word(rawValue);
  }

  public setRawValue(value: number) {
    if (this.word.value !== value) {
      this.isDirty = true;
    }

    this.word.value = value;
  }

  public setSsm(ssm: number) {
    if (this.word.ssm !== ssm) {
      this.isDirty = true;
    }

    this.word.ssm = ssm;
  }

  /** @inheritdoc */
  public valueOr(defaultValue: number): number;
  /** @inheritdoc */
  public valueOr(defaultValue: undefined): number | undefined;
  /** @inheritdoc */
  public valueOr(defaultValue: null): number | null;
  public valueOr(defaultValue: number | undefined | null): number | undefined | null {
    return this.word.valueOr(defaultValue);
  }

  public bitValue(bit: number): boolean {
    return this.word.bitValue(bit);
  }

  /** @inheritdoc */
  public bitValueOr(bit: number, defaultValue: boolean): boolean;
  /** @inheritdoc */
  public bitValueOr(bit: number, defaultValue: null): boolean | null;
  /** @inheritdoc */
  public bitValueOr(bit: number, defaultValue: undefined): boolean | undefined;
  public bitValueOr(bit: number, defaultValue: boolean | undefined | null): boolean | typeof defaultValue {
    return this.word.bitValueOr(bit, defaultValue);
  }

  public setBnrValue(
    value: number,
    ssm: Arinc429SignStatusMatrix,
    bits: number,
    rangeMax: number,
    rangeMin: number = 0,
  ) {
    const quantum = Math.max(Math.abs(rangeMin), rangeMax) / 2 ** bits;
    const data = Math.max(rangeMin, Math.min(rangeMax, Math.round(value / quantum) * quantum));

    this.setRawValue(data);
    this.setSsm(ssm);
  }

  public setBitValue(bit: number, value: boolean): void {
    if (value) {
      this.setRawValue(this.word.value | (1 << (bit - 1)));
    } else {
      this.setRawValue(this.word.value & ~(1 << (bit - 1)));
    }
  }

  public setIso5Value(value: string, ssm: Arinc429SignStatusMatrix) {
    const data =
      ((value.length >= 1 ? value.charCodeAt(0) : 0) << 10) | ((value.length >= 2 ? value.charCodeAt(1) : 0) << 18);

    this.setRawValue(data);
    this.setSsm(ssm);
  }

  public getRawBusValue(): number {
    return Arinc429Word.getRawWord(this.word.value, this.word.ssm);
  }

  public performActionIfDirty<T>(action: () => T): T | undefined {
    if (this.isDirty) {
      this.isDirty = false;
      return action();
    }
  }
}

/**
 * A utility class specifically for writing Arinc429 words to a local var.
 * BNR values are quantised according to the specified bitwidth and range.
 * Optimized to only write when the value changes more than some quantization.
 */
export class Arinc429LocalVarOutputWord extends Arinc429OutputWord {
  public constructor(
    public name: string,
    rawValue = 0,
  ) {
    super(rawValue);
  }

  private readonly writeToSimvar = () => Arinc429Word.toSimVarValue(this.name, this.word.value, this.word.ssm);

  public async writeToSimVarIfDirty(): Promise<unknown> {
    return this.performActionIfDirty(this.writeToSimvar);
  }
}
