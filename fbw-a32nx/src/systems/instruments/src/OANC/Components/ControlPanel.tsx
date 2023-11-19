// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FSComponent, DisplayComponent, VNode, Subscribable, Subscription, MapSubject, Subject, ArraySubject } from '@microsoft/msfs-sdk';

import { AmdbAirportSearchResult } from '@flybywiresim/fbw-sdk';
import { NavigraphAmdbClient } from '../api/NavigraphAmdbClient';

import './ControlPanel.scss';

export interface ControlPanelProps {
    amdbClient: NavigraphAmdbClient,

    isVisible: Subscribable<boolean>,
}

class ControlPanelStore {
    public readonly airports = ArraySubject.create<AmdbAirportSearchResult>();

    public readonly sortedAirports = ArraySubject.create<AmdbAirportSearchResult>();
}

enum ControlPanelAirportSearchMode {
    Icao,
    Iata,
    City,
}

export class ControlPanel extends DisplayComponent<ControlPanelProps> {
    private readonly store = new ControlPanelStore();

    private readonly subscriptions: Subscription[] = [];

    private readonly style = MapSubject.create<string, string>();

    private readonly activeTabIndex = Subject.create<1 | 2 | 3>(2);

    private readonly airportSearchMode = Subject.create(ControlPanelAirportSearchMode.City);

    onAfterRender() {
        this.subscriptions.push(
            this.props.isVisible.sub((it) => this.style.setValue('visibility', it ? 'visible' : 'hidden'), true),
        );

        this.props.amdbClient.searchForAirports('').then((airports) => {
            this.store.airports.set(airports);
        });

        this.subscriptions.push(
            this.store.airports.sub(() => this.sotAirports(this.airportSearchMode.get())),
        );

        this.subscriptions.push(
            this.airportSearchMode.sub((mode) => this.sotAirports(mode)),
        );

        this.subscriptions.push(
            this.store.sortedAirports.sub((index, type, item, array) => console.log('sorted airports', array)),
        );
    }

    private sotAirports(mode: ControlPanelAirportSearchMode) {
        const array = this.store.airports.getArray().slice();

        let prop: keyof AmdbAirportSearchResult;
        switch (mode) {
        default:
        case ControlPanelAirportSearchMode.Icao:
            prop = 'idarpt';
            break;
        case ControlPanelAirportSearchMode.Iata:
            prop = 'iata';
            break;
        case ControlPanelAirportSearchMode.City:
            prop = 'name';
            break;
        }

        array.sort((a, b) => {
            if (a[prop] < b[prop]) {
                return -1;
            }
            if (a[prop] > b[prop]) {
                return 1;
            }
            return 0;
        });

        this.store.sortedAirports.set(array);
    }

    render(): VNode | null {
        return (
            <div class="oanc-control-panel-container" style={this.style}>
                <div class="oanc-control-panel-tabs" data-active-tab-index={this.activeTabIndex}>
                    <div class="oanc-control-panel-tabs-dummy" />
                    <ControlPanelTabButton
                        text="MAP DATA"
                        isSelected={this.activeTabIndex.map((it) => it === 1)}
                        onSelected={() => this.activeTabIndex.set(1)}
                    />
                    <ControlPanelTabButton
                        text="ARPT SEL"
                        isSelected={this.activeTabIndex.map((it) => it === 2)}
                        onSelected={() => this.activeTabIndex.set(2)}
                    />
                    <ControlPanelTabButton
                        text="STATUS"
                        isSelected={this.activeTabIndex.map((it) => it === 3)}
                        onSelected={() => this.activeTabIndex.set(3)}
                    />
                </div>

                <div class="oanc-control-panel">
                    bruh
                </div>
            </div>
        );
    }
}

interface ControlPanelTabButtonProps {
    text: string,

    isSelected: Subscribable<boolean>,

    onSelected: () => void,
}

class ControlPanelTabButton extends DisplayComponent<ControlPanelTabButtonProps> {
    private readonly root = FSComponent.createRef<HTMLDivElement>();

    onAfterRender() {
        this.root.instance.addEventListener('click', this.props.onSelected);
    }

    render(): VNode | null {
        return (
            <div
                ref={this.root}
                class={{
                    'oanc-control-panel-tab-button': true,
                    'oanc-control-panel-tab-button-selected': this.props.isSelected,
                }}
            >
                {this.props.text}
            </div>
        );
    }
}
