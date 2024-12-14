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

  valueOr(defaultValue: number | undefined | null): number;

  bitValue(bit: number): boolean;

  bitValueOr(bit: number, defaultValue: boolean | undefined | null): boolean;
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

  static async toSimVarValue(name: string, value: number, ssm: Arinc429SignStatusMatrix) {
    Arinc429Word.f32View[0] = value;
    const simVal = Arinc429Word.u32View[0] + Math.trunc(ssm) * 2 ** 32;
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

  /**
   * Returns the value when normal operation, the supplied default value otherwise.
   */
  valueOr(defaultValue: number | undefined | null) {
    return this.isNormalOperation() || this.isFunctionalTest() ? this.value : defaultValue;
  }

  bitValue(bit: number): boolean {
    return ((this.value >> (bit - 1)) & 1) !== 0;
  }

  bitValueOr(bit: number, defaultValue: boolean | undefined | null): boolean {
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
  rawWord = 0;

  u32View = new Uint32Array(1);

  f32View = new Float32Array(this.u32View.buffer);

  ssm: Arinc429SignStatusMatrix;

  value: number;

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

  /**
   * Returns the value when normal operation, the supplied default value otherwise.
   */
  valueOr(defaultValue: number | undefined | null): number {
    return this.isNormalOperation() || this.isFunctionalTest() ? this.value : defaultValue;
  }

  bitValue(bit: number): boolean {
    return ((this.value >> (bit - 1)) & 1) !== 0;
  }

  bitValueOr(bit: number, defaultValue: boolean | undefined | null): boolean {
    return this.isNormalOperation() || this.isFunctionalTest() ? ((this.value >> (bit - 1)) & 1) !== 0 : defaultValue;
  }
}

/**
 * A utility class specifically for writing Arinc429 words to a simvar.
 * Optimized to only write when the value changes more than some quantization.
 */
export class Arinc429OutputWord implements Arinc429WordData {
  private word: Arinc429Word;

  private isDirty: boolean = true;

  constructor(
    private name: string,
    value = 0,
  ) {
    this.word = new Arinc429Word(value);
  }

  static empty(name: string) {
    return new Arinc429OutputWord(name);
  }

  get rawWord() {
    return this.word.rawWord;
  }

  get value() {
    return this.word.value;
  }

  set value(value) {
    if (this.word.value !== value) {
      this.isDirty = true;
    }

    this.word.value = value;
  }

  get ssm() {
    return this.word.ssm;
  }

  set ssm(ssm) {
    if (this.word.ssm !== ssm) {
      this.isDirty = true;
    }

    this.word.ssm = ssm;
  }

  isFailureWarning() {
    return this.word.isFailureWarning();
  }

  isNoComputedData() {
    return this.word.isNoComputedData();
  }

  isFunctionalTest() {
    return this.word.isFunctionalTest();
  }

  isNormalOperation() {
    return this.word.isNormalOperation();
  }

  valueOr(defaultValue: number | undefined | null): number {
    return this.word.valueOr(defaultValue);
  }

  bitValue(bit: number): boolean {
    return this.word.bitValue(bit);
  }

  bitValueOr(bit: number, defaultValue: boolean | undefined | null): boolean {
    return this.word.bitValueOr(bit, defaultValue);
  }

  async writeToSimVarIfDirty() {
    if (this.isDirty) {
      this.isDirty = false;
      return Arinc429Word.toSimVarValue(this.name, this.value, this.ssm);
    }

    return Promise.resolve();
  }

  setBnrValue(value: number, ssm: Arinc429SignStatusMatrix, bits: number, rangeMax: number, rangeMin: number = 0) {
    const quantum = Math.max(Math.abs(rangeMin), rangeMax) / 2 ** bits;
    const data = Math.max(rangeMin, Math.min(rangeMax, Math.round(value / quantum) * quantum));

    this.value = data;
    this.ssm = ssm;
  }
}
