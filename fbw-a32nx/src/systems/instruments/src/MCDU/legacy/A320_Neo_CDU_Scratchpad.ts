// @ts-strict-ignore
// private variables and function are marked with _ prefix

import { McduMessage } from '../messages/NXSystemMessages';
import { Keypad } from './A320_Neo_CDU_Keypad';

/** The MCDU scratchpad display. This belongs to the MCDU itself. */
export class ScratchpadDisplay {
  public readonly guid = `SP-${Utils.generateGUID()}`;
  constructor(
    private mcdu: { sendUpdate: () => void },
    private scratchpadElement: HTMLElement,
  ) {
    this.mcdu = mcdu;
    this.scratchpadElement = scratchpadElement;
    this.scratchpadElement.className = 'white';
  }

  write(value = '', color = 'white') {
    this.scratchpadElement.textContent = value;
    this.scratchpadElement.className = color;
    this.mcdu.sendUpdate();
  }

  setStyle(style: string) {
    // This is actually legal as long as you assign a string, but the typescript DOM types mark it readonly so we need a cast.
    (this.scratchpadElement.style as unknown as string) = style;
  }

  getText() {
    return this.scratchpadElement.textContent;
  }

  getColor() {
    return this.scratchpadElement.className;
  }
}

/**
 * The scratchpad for each subsystem. These belong to the subsystems,
 * and one will be connected to the MCDU display (not paused) at any given time.
 */
export class ScratchpadDataLink {
  // actual scratchpad text/colour
  private _value = '';
  private _colour = '';

  // internal state
  private _text = '';
  private _message = undefined;
  private _status = 0;
  private _isPaused = true;

  constructor(
    private mcdu: {
      removeMessageFromQueue: (m: string) => void;
      setRequest: (subsystem: 'AIDS' | 'ATSU' | 'CFDS' | 'FMGC') => void;
      updateMessageQueue: () => void;
    },
    private displayUnit: ScratchpadDisplay,
    private subsystem: 'AIDS' | 'ATSU' | 'CFDS' | 'FMGC' | 'MCDU',
    private keypadEnabled = true,
  ) {}

  setText(text: string) {
    this._message = undefined;
    this._text = text;
    this._display(text);
  }

  setMessage(message: McduMessage) {
    if (this._message && !this._message.isTypeTwo && message.isTypeTwo) {
      return;
    }
    this._message = message;
    this._display(message.text, message.isAmber ? 'amber' : 'white');
  }

  removeMessage(messageText: string) {
    if (this._message && this._message.text === messageText) {
      this.setText('');
    }
  }

  addChar(char: string) {
    if (!this.keypadEnabled) {
      return;
    }
    if (this._status !== SpDisplayStatus.userContent) {
      this.setText(char);
    } else if (this._text.length + 1 < 23) {
      this.setText(this._text + char);
    }
  }

  clear() {
    if (!this.keypadEnabled) {
      return;
    }
    if (this._status === SpDisplayStatus.empty) {
      this.setText(Keypad.clrValue);
    } else if (this._status === SpDisplayStatus.clrValue) {
      this.setText('');
    } else if (this._status === SpDisplayStatus.userContent) {
      this.setText(this._text.slice(0, -1));
    } else {
      this.mcdu.removeMessageFromQueue(this._message.text);
      this.setText(this._text);
    }
  }

  clearHeld() {
    if (!this.keypadEnabled) {
      return;
    }
    if (this._status === SpDisplayStatus.clrValue || this._status === SpDisplayStatus.userContent) {
      this.setText('');
    }
  }

  isClearStop() {
    return this._status !== SpDisplayStatus.userContent;
  }

  plusMinus(char: string) {
    if (!this.keypadEnabled) {
      return;
    }
    if (this._status === SpDisplayStatus.userContent && this._text.slice(-1) === '-') {
      this.setText(this._text.slice(0, -1) + '+');
    } else {
      this.addChar(char);
    }
  }

  setUserData(data: string) {
    this._text = data;
  }

  removeUserContentFromScratchpadAndDisplayAndReturnTextContent() {
    const userContent = this._text;
    if (this._status < SpDisplayStatus.typeOneMessage) {
      this.setText('');
    }
    return userContent;
  }

  getText() {
    return this._text;
  }

  getColor() {
    return this._colour;
  }

  pause() {
    this._isPaused = true;
  }

  resume() {
    this._isPaused = false;
    this._display(this._value, this._colour);
  }

  private _display(value: string, color = 'white') {
    // store the content whether we're paused or not
    this._colour = color;
    this._value = value;
    this._updateStatus(value);

    // if we're not paused, write to the display
    if (!this._isPaused) {
      this.displayUnit.write(value, color);
    }
    // flag the annunciator if needed
    if (this.subsystem !== 'MCDU') {
      this.mcdu.setRequest(this.subsystem);
    }
  }

  private _updateStatus(scratchpadText: string) {
    if (this._message) {
      this._status = this._message.isTypeTwo ? SpDisplayStatus.typeTwoMessage : SpDisplayStatus.typeOneMessage;
    } else {
      if (this._text === '' || scratchpadText === '') {
        this._status = SpDisplayStatus.empty;
        setTimeout(() => this.mcdu.updateMessageQueue(), 150);
      } else if (this._text === Keypad.clrValue) {
        this._status = SpDisplayStatus.clrValue;
      } else {
        this._status = SpDisplayStatus.userContent;
      }
    }
  }
}

const SpDisplayStatus = {
  empty: 0,
  clrValue: 1,
  userContent: 2,
  typeOneMessage: 3,
  typeTwoMessage: 4,
};
