export type FMMessageColor = 'White' | 'Amber';

export interface FMMessage {
  /**
   * Unique ID for this message type
   */
  id: number;

  /**
   * Text on the MCDU scratchpad
   */
  text?: string;

  /**
   * ND message flag, if applicable
   */
  ndFlag?: number;

  /**
   * ND priority, if applicable
   */
  ndPriority?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

  /**
   * EFIS display text, if different than MCDU scratchpad text
   */
  efisText?: string;

  /**
   * Display color for both MCDU and EFIS
   */
  color: FMMessageColor;

  /**
   * Can the message be cleared by the MCDU CLR key?
   */
  clearable?: boolean;
}
