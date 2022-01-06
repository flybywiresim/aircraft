/*
 * MIT License
 *
 * Copyright (c) 2022 FlyByWire Simulations
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

export enum AtcMessageDirection {
    Input,
    Output
}

export enum AtcMessageType {
    Telex,
    PDC
}

export enum AtcMessageStatus {
    Open,
    Closed,
    Wilco,
    Modify,
    Cannot
}

/**
 * Defines the generic ATC message
 */
export class AtcMessage {
    public UniqueMessageID = undefined;

    public Timestamp = undefined;

    public Type = undefined;

    public Direction = undefined;

    public Status = undefined;

    constructor() {
        let datetime = new Date().getTime();

        this.UniqueMessageID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (datetime + Math.random() * 16) % 16 | 0;
            datetime = Math.floor(datetime / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    public serialize() {
        throw new Error('No valid implementation');
    }

    // used to deserialize event data
    public deserialize(jsonData) {
        this.UniqueMessageID = jsonData.UniqueMessageID;
        this.Timestamp = jsonData.Timestamp;
        this.Type = jsonData.Type;
        this.Direction = jsonData.Direction;
        this.Status = jsonData.Status;
    }
}
