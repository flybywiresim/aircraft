// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
    FSComponent, DisplayComponent, ComponentProps, VNode, Subscribable, Subscription, MapSubject, Subject, ArraySubject, DmsFormatter2, UnitType,
} from '@microsoft/msfs-sdk';

import { AmdbAirportSearchResult } from '@flybywiresim/fbw-sdk';
import { NavigraphAmdbClient } from '../api/NavigraphAmdbClient';
import { RadioButtonGroup } from './RadioButtonGroup';

import './ControlPanel.scss';

export interface ControlPanelProps extends ComponentProps {
    amdbClient: NavigraphAmdbClient,

    isVisible: Subscribable<boolean>,

    onSelectAirport: (airportIcao: string) => void,
}

class ControlPanelStore {
    public readonly airports = ArraySubject.create<AmdbAirportSearchResult>();

    public readonly sortedAirports = ArraySubject.create<AmdbAirportSearchResult>();

    public readonly selectedAirport = Subject.create<AmdbAirportSearchResult | null>(null);

    public readonly isAirportSelectionPending = Subject.create(false);
}

enum ControlPanelAirportSearchMode {
    Icao,
    Iata,
    City,
}

export class ControlPanel extends DisplayComponent<ControlPanelProps> {
    private static readonly LAT_FORMATTER = DmsFormatter2.create('{dd}°{mm}.{s}{+[N]-[S]}', UnitType.DEGREE, 0.1);

    private static readonly LONG_FORMATTER = DmsFormatter2.create('{ddd}°{mm}.{s}{+[E]-[W]}', UnitType.DEGREE, 0.1);

    private readonly displayAirportButtonRef = FSComponent.createRef<HTMLButtonElement>();

    private readonly buttonRefs = [
        FSComponent.createRef<HTMLButtonElement>(),
        FSComponent.createRef<HTMLButtonElement>(),
        FSComponent.createRef<HTMLButtonElement>(),
    ];

    private readonly store = new ControlPanelStore();

    private readonly subscriptions: Subscription[] = [];

    private readonly style = MapSubject.create<string, string>();

    private readonly activeTabIndex = Subject.create<1 | 2 | 3>(2);

    private readonly airportSearchMode = Subject.create(ControlPanelAirportSearchMode.City);

    onAfterRender() {
        this.displayAirportButtonRef.instance.addEventListener('click', () => this.handleDisplayAirport());

        this.buttonRefs[0].instance.addEventListener('click', () => this.handleSelectAirport('NZQN'));
        this.buttonRefs[1].instance.addEventListener('click', () => this.handleSelectAirport('LFPG'));
        this.buttonRefs[2].instance.addEventListener('click', () => this.handleSelectAirport('CYUL'));

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

    public setSelectedAirport(airport: AmdbAirportSearchResult) {
        this.store.selectedAirport.set(airport);
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

    private handleSelectAirport = (icao: string) => {
        const airport = this.store.airports.getArray().find((it) => it.idarpt === icao);

        if (!airport) {
            throw new Error('');
        }

        this.store.selectedAirport.set(airport);
        this.store.isAirportSelectionPending.set(true);
    }

    private handleDisplayAirport = () => {
        if (!this.store.selectedAirport.get()) {
            throw new Error('');
        }

        this.props.onSelectAirport(this.store.selectedAirport.get().idarpt);
        this.store.isAirportSelectionPending.set(false); // TODO should be done when airport is fully loaded
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

                <div class={{ 'oanc-control-panel': true, 'oanc-control-panel-tmpy': this.store.isAirportSelectionPending }}>
                    <div class="oanc-control-panel-arpt-sel-left">
                        <div class="oanc-control-panel-arpt-sel-left-dropdowns" />

                        <RadioButtonGroup
                            values={['ICAO', 'IATA', 'CITY NAME']}
                            selectedIndex={Subject.create(0)}
                            idPrefix="oanc-search"
                        />
                    </div>

                    <div class="oanc-control-panel-arpt-sel-center">
                        <span class="oanc-control-panel-arpt-sel-center-info">{this.store.selectedAirport.map((it) => it?.name?.substring(0, 18).toUpperCase() ?? '')}</span>
                        <span class="oanc-control-panel-arpt-sel-center-info">
                            {this.store.selectedAirport.map((it) => {
                                if (!it) {
                                    return '';
                                }

                                return `${it.idarpt}       ${it.iata}`;
                            })}
                        </span>
                        <span class="oanc-control-panel-arpt-sel-center-info ">
                            {this.store.selectedAirport.map((it) => {
                                if (!it) {
                                    return '';
                                }

                                return `${ControlPanel.LAT_FORMATTER(it.coordinates.lat)}/${ControlPanel.LONG_FORMATTER(it.coordinates.lon)}`;
                            })}
                        </span>

                        <button ref={this.displayAirportButtonRef} type="button">DISPLAY ARPT</button>
                    </div>

                    <div class="oanc-control-panel-arpt-sel-right">
                        <button ref={this.buttonRefs[0]} type="button">NZQN</button>
                        <button ref={this.buttonRefs[1]} type="button">LFPG</button>
                        <button ref={this.buttonRefs[2]} type="button">CYUL</button>
                    </div>

                    <div class="oanc-control-panel-arpt-sel-close">
                        <button type="button"> </button>
                    </div>
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
