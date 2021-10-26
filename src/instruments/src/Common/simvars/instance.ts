//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { BehaviorSubject, Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { isEqual } from 'lodash';
import { SimVarItem, SimVarType, SimVarValue } from './types';
import { SimVarUnit } from './units';

export class SimVarInstance {
    name: string;

    unit: SimVarUnit;

    type: SimVarType;

    item: BehaviorSubject<SimVarItem>;

    lastUpdated: number;

    maxStaleness?: number;

    subscriptions: Record<string, Subscription>;

    constructor(name: string, unit: SimVarUnit, type: SimVarType) {
        this.name = name;
        this.unit = unit;
        this.type = type;
        this.item = new BehaviorSubject<SimVarItem>(this.getUpdatedItem());
        this.subscriptions = {};
    }

    private getVarValue(): SimVarValue {
        switch (this.type) {
        case SimVarType.Sim: return SimVar.GetSimVarValue(this.name, this.unit);
        case SimVarType.Global: return SimVar.GetGlobalVarValue(this.name, this.unit);
        case SimVarType.Game: return SimVar.GetGameVarValue(this.name, this.unit);
        default: return null;
        }
    }

    private getUpdatedItem(): SimVarItem {
        return {
            value: this.getVarValue(),
            lastUpdated: Date.now(),
        };
    }

    public subscribe(onUpdated:(value: SimVarValue) => void, maxStaleness?: number): string {
        if (!this.maxStaleness || !maxStaleness || maxStaleness < this.maxStaleness) {
            this.maxStaleness = maxStaleness;
        }

        const subscription = this.item.subscribe((item) => onUpdated(item.value));

        const id = uuidv4();

        this.subscriptions[id] = subscription;

        return id;
    }

    public unsubscribe(id: string): void {
        if (this.subscriptions[id]) {
            this.subscriptions[id].unsubscribe();
            delete this.subscriptions[id];
        }
    }

    public updateValue() {
        const updatedItem = this.getUpdatedItem();
        if (updatedItem.value !== undefined && !isEqual(updatedItem.value, this.item.getValue())) {
            this.item.next(updatedItem);
        }
    }

    public hasSubscribers(): boolean {
        return Object.keys(this.subscriptions).length > 0;
    }

    public getValue(): SimVarValue {
        return this.item.getValue().value;
    }

    public setValue(value: SimVarValue, proxy?: string): void {
        switch (this.type) {
        case SimVarType.Sim: {
            SimVar.SetSimVarValue(proxy || this.name, this.unit, value);
            this.item.next({
                value,
                lastUpdated: Date.now(),
            });
            break;
        }
        case SimVarType.Game: {
            SimVar.SetGameVarValue(proxy || this.name, this.unit, value);
            this.item.next({
                value,
                lastUpdated: Date.now(),
            });
            break;
        }
        default: throw new Error(`Unable to set value for type ${this.type}`);
        }
    }
}
