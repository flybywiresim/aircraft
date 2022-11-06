/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/utils/XMLLogic" />


/** The acceptable priority types for a given annunciation. */
export enum AnnunciationType {
  Warning,
  Caution,
  Advisory,
  SafeOp
}

/** The main logic for a cabin annunciation. */
export class Annunciation {
  /** The priority type of the annunciation. */
  public readonly type: AnnunciationType;
  /** The text to show when we are displayed. */
  public readonly text: string;
  /** An XML logic element that will show when we are active. */
  public readonly condition: CompositeLogicXMLElement;
  /** An optional text suffix to put on the alert text. */
  public readonly suffix: string | undefined;


  /**
   * Creates an instance of Annunciation.
   * @param type The type of annuniciaton this is.
   * @param text The text label to show.
   * @param condition The logic condition for setting it.
   * @param suffix Any suffix text to past to the end.
   */
  public constructor(type: AnnunciationType, text: string, condition: CompositeLogicXMLElement, suffix: string | undefined) {
    this.type = type;
    this.text = text;
    this.condition = condition;
    this.suffix = suffix;
  }
}