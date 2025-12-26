import { Arinc429Word } from '@flybywiresim/fbw-sdk';

export class ADIRS {
  static getNdSupplier(displayIndex: number, knobValue: number) {
    const adirs3ToCaptain = 0;
    const adirs3ToFO = 2;

    if (this.isCaptainSide(displayIndex)) {
      return knobValue === adirs3ToCaptain ? 3 : 1;
    }
    return knobValue === adirs3ToFO ? 3 : 2;
  }

  static getNdInertialReferenceSource(displayIndex: number) {
    return ADIRS.getNdSupplier(displayIndex, SimVar.GetSimVarValue('L:A32NX_ATT_HDG_SWITCHING_KNOB', 'Enum'));
  }

  static getNdAirDataReferenceSource(displayIndex: number) {
    return ADIRS.getNdSupplier(displayIndex, SimVar.GetSimVarValue('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'Enum'));
  }

  static isCaptainSide(displayIndex: number) {
    return displayIndex === 1;
  }

  static mapNotAvailable(displayIndex: number) {
    const inertialReferenceSource = ADIRS.getNdInertialReferenceSource(displayIndex);
    return (
      !Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_LATITUDE`).isNormalOperation() ||
      !Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_LONGITUDE`).isNormalOperation()
    );
  }

  /** in degrees */
  static getLatitude() {
    return ADIRS.getFromAnyAdiru('IR', 'LATITUDE');
  }

  /** in degrees */
  static getLongitude() {
    return ADIRS.getFromAnyAdiru('IR', 'LONGITUDE');
  }

  /** in degrees */
  static getTrueTrack() {
    return ADIRS.getFromAnyAdiru('IR', 'TRUE_TRACK');
  }

  /** in degrees */
  static getMagneticTrack() {
    return ADIRS.getFromAnyAdiru('IR', 'TRACK');
  }

  /** in knots */
  static getTrueAirspeed() {
    return ADIRS.getFromAnyAdiru('ADR', 'TRUE_AIRSPEED');
  }

  /** in knots */
  static getCalibratedAirspeed() {
    return ADIRS.getFromAnyAdiru('ADR', 'COMPUTED_AIRSPEED');
  }

  /** in knots */
  static getGroundSpeed() {
    return ADIRS.getFromAnyAdiru('IR', 'GROUND_SPEED');
  }

  // FIXME there should be baro corrected altitude 1 (capt) and 2 (f/o)
  /** in feet */
  static getBaroCorrectedAltitude() {
    return ADIRS.getFromAnyAdiru('ADR', 'ALTITUDE');
  }

  /** in degrees celsius */
  static getStaticAirTemperature() {
    return ADIRS.getFromAnyAdiru('ADR', 'STATIC_AIR_TEMPERATURE');
  }

  /** in hPa */
  static getCorrectedAverageStaticPressure() {
    return ADIRS.getFromAnyAdiru('ADR', 'CORRECTED_AVERAGE_STATIC_PRESSURE');
  }

  /**
   *
   * @param type IR or ADR
   * @param param the name of the param
   */
  static getFromAnyAdiru(type: 'IR' | 'ADR', param: string): Arinc429Word | undefined {
    // In the real aircraft, FMGC 1 is supplied by ADIRU 1, and FMGC 2 by ADIRU 2. When any is unavailable
    // the FMGC switches to ADIRU 3. If only one ADIRU is available, both FMGCs use the same ADIRU.
    // As we don't have a split FMGC, we'll just use the following code for now.
    const fromAdiru = 1;
    const toAdiru = 3;
    for (let adiruNumber = fromAdiru; adiruNumber <= toAdiru; adiruNumber++) {
      const arincWord = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_${type}_${adiruNumber}_${param}`);
      if (arincWord.isNormalOperation() || adiruNumber === toAdiru) {
        return arincWord;
      }
    }
    return undefined;
  }
}
