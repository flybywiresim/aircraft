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

  static getLatitude() {
    return ADIRS.getFromAnyAdiru('IR', 'LATITUDE');
  }

  static getLongitude() {
    return ADIRS.getFromAnyAdiru('IR', 'LONGITUDE');
  }

  static getTrueTrack() {
    return ADIRS.getFromAnyAdiru('IR', 'TRUE_TRACK');
  }

  static getTrueAirspeed() {
    return ADIRS.getFromAnyAdiru('ADR', 'TRUE_AIRSPEED');
  }

  static getCalibratedAirspeed() {
    return ADIRS.getFromAnyAdiru('ADR', 'COMPUTED_AIRSPEED');
  }

  static getGroundSpeed() {
    return ADIRS.getFromAnyAdiru('IR', 'GROUND_SPEED');
  }

  // FIXME there should be baro corrected altitude 1 (capt) and 2 (f/o)
  static getBaroCorrectedAltitude() {
    return ADIRS.getFromAnyAdiru('ADR', 'ALTITUDE');
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
