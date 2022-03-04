// Common definitions relevant to all radio types.

/** The basic radio types. */
export enum RadioType {
  Com = 'COM',
  Nav = 'NAV',
  Adf = 'ADF',
}

/** Encapsulates a single radio's state. */
export type Radio = {
  /** Index number of the radio. */
  index: number,
  /** The current active frequency. */
  activeFrequency: number,
  /** The ident of the active station */
  ident: string | null,
  /** The current standby frequency. */
  standbyFrequency: number,
  /** The appropriate RadioType for this radio. */
  radioType: RadioType,
  /** Whether this radio is selected for changes. */
  selected: boolean,
}


/** The two frequency "banks", active and standby. */
export enum FrequencyBank {
  Active,
  Standby
}

/** Events relating to changes in a radio's state. */
export interface RadioEvents {
  /** Set the state of a radio. */
  setRadioState: Radio,
  /** Change the stanby frequency in a radio. */
  setFrequency: FrequencyChangeEvent,
  /** Publish the ident of a tuned station. */
  setIdent: IdentChangeEvent,
  /** ADF1 Standby Frequency */
  adf1StandbyFreq: number,
  /** ADF1 Active Frequency */
  adf1ActiveFreq: number,
}


/** Encapsuation of a frequency change event. */
export type FrequencyChangeEvent = {
  /** The type of radio to change. */
  radio: Radio,
  /** The frequency bank to update. */
  bank: FrequencyBank,
  /** The new frequency in MHz. */
  frequency: number
}

/** Encapsulation of a new ident event */
export type IdentChangeEvent = {
  /** The radio currently tuned. */
  index: number,
  /** The new ident. */
  ident: string
}

/** COM frequency spacing on COM radios. */
export enum ComSpacing {
  /** 25Khz spacing */
  Spacing25Khz,

  /** 8.33Khz spacing */
  Spacing833Khz
}

/** Encapsulation of a COM spacing change event. */
export type ComSpacingChangeEvent = {
  /** The index of the COM radio to update. */
  index: number,

  /** The spacing of the COM radio. */
  spacing: ComSpacing
}