/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/utils/XMLLogic" />
import { CompositeLogicXMLHost } from '../../data/';

/** The acceptable priority types for a given warning. */
export enum WarningType {
  Warning,
  Caution,
  Test,
  SoundOnly
}

/** The main logic for a system warning. */
export class Warning {
  /** The category of the warnining. */
  public readonly type: WarningType;
  /** The short-form text. */
  public readonly shortText?: string;
  /** The long-form text. */
  public readonly longText?: string;
  /** The name of a sound to play along with the visual warning. */
  public readonly soundId?: string;
  /** The XML logic element triggering this warning if true. */
  public readonly condition: CompositeLogicXMLElement;
  /** Does this only fire once? */
  public readonly once?: boolean;
  /** If a one-shot, has this been triggered already? */
  private _triggered: boolean
  /** The event ID for this sound. */
  private _soundEventId?: Name_Z;

  /**
   * Creates an instance of a Warning.
   * @param type The type of warning this is.
   * @param condition An XML logic element with the trigger logic.
   * @param shortText The warning message in short form.
   * @param longText The warning message in long form.
   * @param soundId The sound name to use with this warning.
   * @param once True if this warning only fires once
   */
  public constructor(type: WarningType, condition: CompositeLogicXMLElement, shortText?: string, longText?: string, soundId?: string, once?: boolean) {
    this.type = type;
    this.shortText = shortText;
    this.longText = longText;
    this.soundId = soundId;
    this.condition = condition;
    this.once = once;
    this._triggered = false;
    if (this.soundId) {
      this._soundEventId = new Name_Z(this.soundId);
    }
  }

  /**
   * Whether or not we have any text at all.
   * @returns True if any non-empty text strings are set.
   */
  public get hasText(): boolean {
    return this.shortText || this.longText ? true : false;
  }

  /**
   * The alert is being fired, take action.
   */
  public trigger(): void {
    this._triggered = true;
  }

  /**
   * A text description for the warning, for debugging purposes.
   * @returns A string
   */
  public get description(): string {
    return `<${this.shortText}|${this.longText}|${this.soundId}>`;
  }

  /**
   * Whether or not the warning has been triggered in this session.
   * @returns True if the warning has been triggered.
   */
  public get triggered(): boolean {
    return this._triggered;
  }

  /**
   * Can this alert fire?
   * @returns True if the current configuration allows the alert to fire.
   */
  public get canTrigger(): boolean {
    return !this.once || !this._triggered;
  }

  /**
   * The event ID Coherent returns when this sound has been played.
   * @returns A Name_Z based on the sound ID.
   */
  public get eventId(): Name_Z | undefined {
    return this._soundEventId;
  }
}

/** The basic component for handling warning logic. */
export class WarningManager {
  private warnings: Array<Warning>;
  private warnActiveStates: Array<boolean>;
  private logicHost: CompositeLogicXMLHost;
  private textCb: (warning: Warning | undefined) => void;
  private soundCb?: (warning: Warning, active: boolean) => void;
  private curSndIdx: number | null;
  private curTxtIdx: number | null;

  /**
   * Create a WarningManager.
   * @param warnings An array of warnings to manage.
   * @param logicHost An event bus.
   * @param textCb A callback to display new warning text.
   * @param soundCb A callback to play an instrument sound from a sound ID.
   */
  constructor(warnings: Array<Warning>, logicHost: CompositeLogicXMLHost, textCb: (warning: Warning | undefined) => void, soundCb?: (warning: Warning, active: boolean) => void) {
    this.warnings = warnings;
    this.logicHost = logicHost;
    this.textCb = textCb;
    this.soundCb = soundCb;
    this.curSndIdx = null;
    this.curTxtIdx = null;
    this.warnActiveStates = new Array<boolean>();

    for (let i = 0; i < warnings.length; i++) {
      this.logicHost.addLogicAsNumber(warnings[i].condition, this.handleWarning.bind(this, i), 0);
      this.warnActiveStates.push(false);
    }
  }

  /**
   * Handle a warning firing.  This is rather complex, but it basically keeps
   * track of every warning that is active, both for text and for sound, and
   * makes sure that the highest priority version of each is played or
   * displayed, masking and restoring lower priority warnings as needed.
   * @param warnIndex The index of our warnings array that's firing.
   * @param active 1 if the warning is active, 0 otherwise.
   */
  private handleWarning(warnIndex: number, active: number): void {
    const warning = this.warnings[warnIndex];
    // Handle a warning that is going active.
    if (active && warning.canTrigger) {
      this.warnActiveStates[warnIndex] = true;
      warning.trigger();
      // Only worry about text if the warning has text.
      if (warning.hasText) {
        // If there is no existing text displayed, or text of a lower priority, replace it.
        if ((this.curTxtIdx == undefined || this.curTxtIdx > warnIndex)) {
          // First, if the prior warning was a one-shot, force it to inactive so it won't be restored later.
          if (this.curTxtIdx && this.warnings[this.curTxtIdx].once) {
            this.warnActiveStates[this.curTxtIdx] = false;
          }
          this.textCb(warning);
          this.curTxtIdx = warnIndex;
        }
      }

      // Now check for sound.
      if (this.soundCb !== undefined && warning.soundId) {
        // Make sure we have the right to play our sound.
        if (this.curSndIdx == undefined || this.curSndIdx > warnIndex) {
          // Disable a prior sound, if one was playing.
          if (this.curSndIdx && this.curSndIdx > warnIndex) {
            this.soundCb(this.warnings[this.curSndIdx], false);
            // If the prior warning was a one-shot, force it to inactive so it won't be restored.
            if (this.warnings[this.curSndIdx].once) {
              this.warnActiveStates[this.curSndIdx] = false;
            }
          }
          this.soundCb(warning, true);
          this.curSndIdx = warnIndex;
        }
      }

      // If that was a one-time alert, turn it off, too.
      if (warning.once) {
        this.handleWarning(warnIndex, 0);
      }
    } else if (!active) {
      this.warnActiveStates[warnIndex] = false;
      let isCurSnd = this.curSndIdx == warnIndex ? true : false;
      let isCurTxt = this.curTxtIdx == warnIndex ? true : false;
      // If this warning is the current active text or sound, we need to disable it.
      if (isCurSnd && this.soundCb) {
        this.soundCb(warning, false);
      }
      if (isCurTxt) {
        this.textCb(undefined);
      }

      // If either of those were true, let's see if there's anything else
      // of lower prirority that should be made active.
      if (isCurSnd || isCurTxt) {
        // We know there was no higher-priority warning, so we step through
        // everything lower than us.
        let i = warnIndex + 1;

        while ((isCurSnd || isCurTxt) && i < this.warnings.length) {
          // Only continue this iteration if the next potential warning
          // is active.
          if (this.warnActiveStates[i]) {
            const nextWarning = this.warnings[i];
            // Make sure we can trigger the warning.   This will be false if
            // it's a one-shot that's already triggered.  If so, just fall
            // through to the next iteration.
            if (nextWarning.canTrigger) {
              // See if the lower priority warning has sound.  If so, activate.
              if (isCurSnd && nextWarning.soundId && this.soundCb) {
                this.soundCb(this.warnings[i], true);
                this.curSndIdx = i;
                // We can stop looking for another sound.
                isCurSnd = false;
              }

              // Now do the same sort of thing for text.
              if (isCurTxt && this.warnings[i].hasText) {
                this.textCb(this.warnings[i]);
                this.curTxtIdx = i;
                // We can stop looking for another text.
                isCurTxt = false;
              }
            }
          }
          // Move to the next warning on the list.
          i++;
        }
      }

      // If we haven't yet set new sound or text, just nullify them.
      if (isCurSnd && this.soundCb) {
        this.curSndIdx = null;
      }

      if (isCurTxt) {
        this.curTxtIdx = null;
      }
    }
  }
}