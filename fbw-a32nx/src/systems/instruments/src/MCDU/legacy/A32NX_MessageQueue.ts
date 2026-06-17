// @ts-strict-ignore
import { TypeIIMessage } from '../messages/NXSystemMessages';
import { ScratchpadDataLink } from './A320_Neo_CDU_Scratchpad';

export class A32NX_MessageQueue {
  private readonly _queue = [];

  constructor(private readonly _fmgc: { fmgcScratchpad: ScratchpadDataLink }) {}

  /**
   * Fmgc messages enter the queue via this void
   */
  addMessage(message: TypeIIMessage) {
    if (message.isResolved(this._fmgc)) {
      this.updateDisplayedMessage();
      return;
    }

    this._addToQueueOrUpdateQueuePosition(message);
    this.updateDisplayedMessage();
  }

  removeMessage(value: string) {
    for (let i = 0; i < this._queue.length; i++) {
      const message = this._queue[i];
      if (message.text === value) {
        message.onClear(this._fmgc);
        this._queue.splice(i, 1);
        if (i === 0) {
          if (this._fmgc.fmgcScratchpad) {
            this._fmgc.fmgcScratchpad.removeMessage(value);
          }
          this.updateDisplayedMessage();
        }
        break;
      }
    }
  }

  resetQueue() {
    this._queue.length = 0;
  }

  updateDisplayedMessage() {
    if (this._queue.length > 0) {
      const message = this._queue[0];
      if (message.isResolved(this._fmgc)) {
        this._queue.splice(0, 1);
        return this.updateDisplayedMessage();
      }

      if (this._fmgc.fmgcScratchpad) {
        this._fmgc.fmgcScratchpad.setMessage(message);
      }
    }
  }

  _addToQueueOrUpdateQueuePosition(message: TypeIIMessage) {
    for (let i = 0; i < this._queue.length; i++) {
      if (this._queue[i].text === message.text) {
        if (i !== 0) {
          this._queue.unshift(this._queue[i]);
          this._queue.splice(i + 1, 1);
        }
        return;
      }
    }

    for (let i = 0; i < this._queue.length; i++) {
      if (this._queue[i].isResolved(this._fmgc)) {
        this._queue.splice(i, 1);
      }
    }

    this._queue.unshift(message);

    if (this._queue.length > 5) {
      this._queue.splice(5, 1);
    }
  }
}
