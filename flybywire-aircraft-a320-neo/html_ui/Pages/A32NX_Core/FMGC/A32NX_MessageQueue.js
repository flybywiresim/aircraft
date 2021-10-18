class A32NX_MessageQueue {
    constructor(fmgc) {
        this._fmgc = fmgc;
        this._queue = [];
    }

    /**
     * Fmgc messages enter the queue via this void
     * @param message {McduMessage}
     */
    addMessage(message) {
        if (message.isResolved(this._fmgc)) {
            this.updateDisplayedMessage();
            return;
        }

        this._addToQueueOrUpdateQueuePosition(message);
        this.updateDisplayedMessage();
    }

    removeMessage(value) {
        for (let i = 0; i < this._queue.length; i++) {
            const message = this._queue[i];
            if (typeof value === "number" ? message.id === value : message.text === value) {
                message.onClear(this._fmgc);
                this._queue.splice(i, 1);
                if (i === 0) {
                    this._fmgc.removeScratchpadMessage(value);
                    this.updateDisplayedMessage();
                }
                break;
            }
        }
    }

    resetQueue() {
        this._queue = [];
    }

    updateDisplayedMessage() {
        if (this._queue.length > 0) {
            const message = this._queue[0];
            if (message.isResolved(this._fmgc)) {
                this._queue.splice(0, 1);
                return this.updateDisplayedMessage();
            }

            this._fmgc.setScratchpadMessage(message);
        }
    }

    _addToQueueOrUpdateQueuePosition(message) {
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
