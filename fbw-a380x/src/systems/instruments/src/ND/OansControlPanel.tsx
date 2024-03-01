/* eslint-disable jsx-a11y/label-has-associated-control */

import './UI/style.scss';
import './OansControlPanel.scss';

import {
    ArraySubject, ComponentProps, DisplayComponent, EventBus, FSComponent,
    MapSubject, MappedSubscribable, SimVarValueType, Subject, Subscribable, Subscription, VNode,
} from '@microsoft/msfs-sdk';
import { ControlPanelAirportSearchMode, ControlPanelStore, ControlPanelUtils, NavigraphAmdbClient, OansControlEvents } from '@flybywiresim/oanc';
import { AmdbAirportSearchResult, EfisSide } from '@flybywiresim/fbw-sdk';

import { FmsOansData } from 'instruments/src/MsfsAvionicsCommon/providers/FmsOansPublisher';
import { Button } from 'instruments/src/ND/UI/Button';
import { OansRunwayInfoBox } from 'instruments/src/ND/OANSRunwayInfoBox';
import { DropdownMenu } from './UI/DropdownMenu';
import { RadioButtonGroup } from './UI/RadioButtonGroup';
import { InputField } from './UI/InputField';
import { LengthFormat } from './UI/DataEntryFormats';
import { IconButton } from './UI/IconButton';
import { TopTabNavigator, TopTabNavigatorPage } from './UI/TopTabNavigator';

export interface OansProps extends ComponentProps {
    bus: EventBus;
    side: EfisSide;
    isVisible: Subscribable<boolean>,
    togglePanel: () => void,
}

export enum EntityTypes {
    RWY,
    TWY,
    STAND,
    OTHER
}

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export class OansControlPanel extends DisplayComponent<OansProps> {
    private readonly subs: (Subscription | MappedSubscribable<any>)[] = [];

    private amdbClient = new NavigraphAmdbClient();

    private oansMenuRef = FSComponent.createRef<HTMLDivElement>();

    private readonly airportSearchAirportDropdownRef = FSComponent.createRef<DropdownMenu>();

    private readonly displayAirportButtonRef = FSComponent.createRef<Button>();

    private readonly closePanelButtonRef = FSComponent.createRef<HTMLButtonElement>();

    private readonly store = new ControlPanelStore();

    private readonly style = MapSubject.create<string, string>();

    private readonly activeTabIndex = Subject.create<number>(2);

    private availableEntityTypes = Object.values(EntityTypes).filter((v) => typeof v === 'string') as string[];

    private thresholdShift = Subject.create<number | null>(null);

    private endShift = Subject.create<number | null>(null);

    private selectedEntityType = Subject.create<EntityTypes | null>(EntityTypes.RWY);

    private availableEntityList = ArraySubject.create(['']);

    private selectedEntityIndex = Subject.create<number | null>(0);

    private selectedEntityString = Subject.create<string | null>(null);

    private originAirport = Subject.create<string | null>(null);

    private destAirport = Subject.create<string | null>(null);

    private altnAirport = Subject.create<string | null>(null);

    private landingRunwayIdent = Subject.create<string | null>(null);

    private landingRunwayLength = Subject.create<number | null>(null);

    private runwayTora = Subject.create<string | null>(null);

    private runwayLda = Subject.create<string | null>(null);

    private reqStoppingDistance = Subject.create<number | null>(null);

    private airportDatabase = Subject.create('SXT59027250AA04');

    private activeDatabase = Subject.create('30DEC-27JAN');

    private secondDatabase = Subject.create('27JAN-24FEB');

    private showLdgShiftPanel() {
        const shiftPanel = document.getElementById('MapDataLdgShiftPanel');
        const main = document.getElementById('MapDataMain');
        if (shiftPanel && main) {
            shiftPanel.style.display = 'flex';
            main.style.display = 'none';
        }
    }

    private hideLdgShiftPanel() {
        const shiftPanel = document.getElementById('MapDataLdgShiftPanel');
        const main = document.getElementById('MapDataMain');
        if (shiftPanel && main) {
            shiftPanel.style.display = 'none';
            main.style.display = 'flex';
        }
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const date = SimVar.GetGameVarValue('FLIGHT NAVDATA DATE RANGE', 'string');
        if (date) {
            this.activeDatabase.set(this.calculateActiveDate(date));
            this.secondDatabase.set(this.calculateSecDate(date));
        }

        this.subs.push(
            this.props.isVisible.sub((it) => this.style.setValue('visibility', it ? 'visible' : 'hidden'), true),
        );

        this.amdbClient.searchForAirports('').then((airports) => {
            this.store.airports.set(airports);
        });

        this.subs.push(
            this.store.airports.sub(() => this.sortAirports(this.store.airportSearchMode.get() ?? ControlPanelAirportSearchMode.Icao)),
        );

        this.subs.push(
            this.store.airportSearchMode.sub((mode) => this.sortAirports(mode ?? ControlPanelAirportSearchMode.Icao)),
        );

        this.subs.push(
            this.store.airportSearchMode.sub(() => this.updateAirportSearchData(), true),
            this.store.sortedAirports.sub(() => this.updateAirportSearchData(), true),
        );

        // unfocus input fields on tab change
        this.subs.push(
            this.activeTabIndex.sub((_index) => Coherent.trigger('UNFOCUS_INPUT_FIELD')),
        );

        const sub = this.props.bus.getSubscriber<FmsOansData>();

        sub.on('fmsOrigin').whenChanged().handle((it) => this.originAirport.set(it));
        sub.on('fmsDestination').whenChanged().handle((it) => this.destAirport.set(it));
        sub.on('fmsAlternate').whenChanged().handle((it) => this.altnAirport.set(it));
        sub.on('fmsLandingRunway').whenChanged().handle((it) => {
            // Set control panel display
            this.landingRunwayIdent.set(it.substring(2));
            this.availableEntityList.set([it.substring(2)]);
            this.selectedEntityType.set(EntityTypes.RWY);
            this.selectedEntityIndex.set(0);
            this.selectedEntityString.set(it.substring(2));
            this.updateLandingRunwayData();
        });

        // Load runway data from nav data
        // TODO FIXME fms-v2 check when merged
        // Once fms-v2 is merged this will be loaded here (via Msfs backend)
        // TODO unclear whether that's LDA, TORA, ...
        sub.on('fmsLandingRunwayLength').whenChanged().handle((it) => {
            this.runwayLda.set(it.toFixed(0));
            this.runwayTora.set(it.toFixed(0));
            this.landingRunwayLength.set(it);
            this.updateLandingRunwayData();
        });

        sub.on('oansRequestedStoppingDistance').whenChanged().handle((it) => this.reqStoppingDistance.set(it));

        this.selectedEntityIndex.sub((val) => this.selectedEntityString.set(this.availableEntityList.get(val ?? 0)));
    }

    private updateLandingRunwayData() {
        this.props.bus.getPublisher<OansControlEvents>().pub('btvRunwayInfo', { ident: this.landingRunwayIdent.get() ?? '', length: this.landingRunwayLength.get() ?? 0 });
    }

    public updateAirportSearchData() {
        const searchMode = this.store.airportSearchMode.get();
        const sortedAirports = this.store.sortedAirports.getArray();

        const prop = ControlPanelUtils.getSearchModeProp(searchMode ?? ControlPanelAirportSearchMode.Icao);

        this.store.airportSearchData.set(sortedAirports.map((it) => (it[prop] as string).toUpperCase()));
    }

    public setSelectedAirport(airport: AmdbAirportSearchResult) {
        this.store.selectedAirport.set(airport);
        const foundIndex = this.store.sortedAirports.getArray().findIndex((it) => it.idarpt === airport.idarpt);
        this.store.airportSearchSelectedAirportIndex.set(foundIndex === -1 ? null : foundIndex);
    }

    private sortAirports(mode: ControlPanelAirportSearchMode) {
        const array = this.store.airports.getArray().slice();

        const prop = ControlPanelUtils.getSearchModeProp(mode);

        array.sort((a, b) => {
            if (a[prop] < b[prop]) {
                return -1;
            }
            if (a[prop] > b[prop]) {
                return 1;
            }
            return 0;
        });

        this.store.sortedAirports.set(array.filter((it) => it[prop] !== null));
    }

    private handleSelectAirport = (icao: string, indexInSearchData?: number) => {
        const airport = this.store.airports.getArray().find((it) => it.idarpt === icao);

        if (!airport) {
            throw new Error('');
        }

        const firstLetter = airport[ControlPanelUtils.getSearchModeProp(this.store.airportSearchMode.get() ?? ControlPanelAirportSearchMode.Icao)][0];
        this.store.airportSearchSelectedSearchLetterIndex.set(ControlPanelUtils.LETTERS.findIndex((it) => it === firstLetter));

        const airportIndexInSearchData = indexInSearchData ?? this.store.sortedAirports.getArray().findIndex((it) => it.idarpt === icao);

        this.store.airportSearchSelectedAirportIndex.set(airportIndexInSearchData);
        this.store.selectedAirport.set(airport);
        this.store.isAirportSelectionPending.set(true);
    };

    private handleSelectSearchMode = (newSearchMode: ControlPanelAirportSearchMode) => {
        const selectedAirport = this.store.selectedAirport.get();

        this.store.airportSearchMode.set(newSearchMode);

        if (selectedAirport !== null) {
            const prop = ControlPanelUtils.getSearchModeProp(newSearchMode);

            const firstLetter = selectedAirport[prop][0];
            const airportIndexInSearchData = this.store.sortedAirports.getArray().findIndex((it) => it.idarpt === selectedAirport.idarpt);

            this.store.airportSearchSelectedSearchLetterIndex.set(ControlPanelUtils.LETTERS.findIndex((it) => it === firstLetter));
            this.store.airportSearchSelectedAirportIndex.set(airportIndexInSearchData);
        }
    };

    private handleDisplayAirport = () => {
        if (!this.store.selectedAirport.get()) {
            throw new Error('[OANS] Empty airport selected for display.');
        }

        this.props.bus.getPublisher<OansControlEvents>().pub('oansDisplayAirport', this.store.selectedAirport.get().idarpt, true);
        this.store.isAirportSelectionPending.set(false); // TODO should be done when airport is fully loaded
    }

    private findNewMonthIndex(index: number) {
        if (index === 0) {
            return 11;
        }
        return index - 1;
    }

    private lessThan10(num: number) {
        if (num < 10) {
            return `0${num}`;
        }
        return num;
    }

    private calculateActiveDate(date: string): string {
        if (date.length === 13) {
            const startMonth = date.slice(0, 3);
            const startDay = date.slice(3, 5);

            const endMonth = date.slice(5, 8);
            const endDay = date.slice(8, 10);

            return `${startDay}${startMonth}-${endDay}${endMonth}`;
        }
        return date;
    }

    private calculateSecDate(date: string): string {
        if (date.length === 13) {
            const primStartMonth = date.slice(0, 3);
            const primStartDay = Number(date.slice(3, 5));

            const primStartMonthIndex = months.findIndex((item) => item === primStartMonth);

            if (primStartMonthIndex === -1) {
                return 'ERR';
            }

            let newEndMonth = primStartMonth;
            let newEndDay = primStartDay - 1;

            let newStartDay = newEndDay - 27;
            let newStartMonth = primStartMonth;

            if (newEndDay === 0) {
                newEndMonth = months[this.findNewMonthIndex(primStartMonthIndex)];
                newEndDay = monthLength[this.findNewMonthIndex(primStartMonthIndex)];
            }

            if (newStartDay <= 0) {
                newStartMonth = months[this.findNewMonthIndex(primStartMonthIndex)];
                newStartDay = monthLength[this.findNewMonthIndex(primStartMonthIndex)] + newStartDay;
            }

            return `${this.lessThan10(newStartDay)}${newStartMonth}-${this.lessThan10(newEndDay)}${newEndMonth}`;
        }
        return 'ERR';
    }

    render(): VNode {
        return (
            <>
                <IconButton
                    ref={this.closePanelButtonRef}
                    onClick={() => this.props.togglePanel()}
                    icon="double-up"
                    containerStyle="z-index: 10; width: 49px; height: 45px; position: absolute; right: 2px; top: 768px;"
                />
                <div class="oans-control-panel-background">
                    <div ref={this.oansMenuRef} class="oans-control-panel" style={this.style}>
                        <TopTabNavigator
                            pageTitles={Subject.create(['MAP DATA', 'ARPT SEL', 'STATUS'])}
                            selectedPageIndex={this.activeTabIndex}
                            tabBarHeight={45}
                            tabBarSlantedEdgeAngle={30}
                            selectedTabTextColor="cyan"
                            additionalRightSpace={50}
                        >
                            <TopTabNavigatorPage>
                                <div style="flex: 1; display: flex; flex-direction: row; height: 100%;">
                                    <div style="flex: 1; display: flex: flex-direction: column; justify-content: stretch;">
                                        <DropdownMenu
                                            values={this.availableEntityList}
                                            selectedIndex={this.selectedEntityIndex}
                                            idPrefix="oanc-search-letter"
                                            freeTextAllowed={false}
                                            onModified={(i) => this.selectedEntityIndex.set(i)}
                                            inactive={Subject.create(true)}
                                        />
                                        <div style="border-right: 2px solid lightgrey; height: 100%;">
                                            <RadioButtonGroup
                                                values={this.availableEntityTypes}
                                                valuesDisabled={Subject.create(Array(4).fill(true))}
                                                selectedIndex={this.selectedEntityType}
                                                idPrefix="entityTypesRadio"
                                            />
                                        </div>
                                    </div>
                                    <div id="MapDataLdgShiftPanel" style="display: none; flex: 3; flex-direction: column; margin: 5px 20px 5px 20px;">
                                        <div style="flex: 1; display: flex; justify-content: space-between; border-bottom: 1px solid lightgrey;">
                                            <div class="mfd-label-value-container" style="padding: 15px;">
                                                <span class="mfd-label mfd-spacing-right">RWY</span>
                                                <span class="mfd-value">{this.selectedEntityString}</span>
                                            </div>
                                        </div>
                                        <div style="flex: 5; display: flex; flex-direction: row; justify-content: space-between; margin: 10px;">
                                            <div style="display: flex; flex-direction: column;">
                                                <div style="display: grid; grid-template-columns: 1fr auto; grid-template-rows: 50px 50px; align-items: center;">
                                                    <span class="mfd-label mfd-spacing-right bigger" style="justify-self: flex-end">THRESHOLD SHIFT</span>
                                                    <InputField<number>
                                                        dataEntryFormat={new LengthFormat(Subject.create(0), Subject.create(4000))}
                                                        value={this.thresholdShift}
                                                        mandatory={Subject.create(false)}
                                                    />
                                                    <span class="mfd-label mfd-spacing-right bigger" style="justify-self: flex-end">END SHIFT</span>
                                                    <InputField<number>
                                                        dataEntryFormat={new LengthFormat(Subject.create(0), Subject.create(4000))}
                                                        value={this.endShift}
                                                        mandatory={Subject.create(false)}
                                                    />
                                                </div>
                                                <div style="display: flex; flex-direction: row; justify-content: center; margin-top: 10px;">
                                                    <Button
                                                        label="RETURN"
                                                        buttonStyle="padding: 7px 15px 5px 15px;"
                                                        onClick={() => this.hideLdgShiftPanel()}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div id="MapDataMain" style="display: flex; flex: 3; flex-direction: column; margin: 5px 20px 5px 20px;">
                                        <div style="display: flex; flex-direction: row; justify-content: space-between; margin: 10px;">
                                            <Button
                                                label="ADD CROSS"
                                                onClick={() => console.log('ADD CROSS')}
                                                buttonStyle="flex: 1"
                                                disabled={Subject.create(true)}
                                            />
                                            <Button
                                                label="ADD FLAG"
                                                onClick={() => console.log('ADD FLAG')}
                                                buttonStyle="flex: 1; margin-left: 10px; margin-right: 10px"
                                                disabled={Subject.create(true)}
                                            />
                                            <Button label="LDG SHIFT" onClick={() => this.showLdgShiftPanel()} buttonStyle="flex: 1" disabled={Subject.create(true)} />
                                        </div>
                                        <div style="display: flex; flex-direction: row; justify-content: center; margin: 10px;">
                                            <Button
                                                label={`CENTER MAP ON ${this.availableEntityList.get(this.selectedEntityIndex.get() ?? 0)}`}
                                                onClick={() => console.log(`CENTER MAP ON ${this.availableEntityList.get(this.selectedEntityIndex.get() ?? 0)}`)}
                                                disabled={Subject.create(true)}
                                            />
                                        </div>
                                        <div style="display: flex; flex-direction: row; justify-content: center; align-items: center; margin: 10px;">
                                            <div class="mfd-label" style="margin-right: 10px;">BTV STOP DISTANCE</div>
                                            <div>
                                                <InputField<number>
                                                    dataEntryFormat={new LengthFormat(Subject.create(0), Subject.create(4000))}
                                                    dataHandlerDuringValidation={async (val) => SimVar.SetSimVarValue('L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE', SimVarValueType.Number, val)}
                                                    value={this.reqStoppingDistance}
                                                    mandatory={Subject.create(false)}
                                                    inactive={this.selectedEntityString.map((it) => !it)}
                                                />
                                            </div>
                                        </div>
                                        <OansRunwayInfoBox
                                            rwyOrStand={this.selectedEntityType}
                                            selectedEntity={this.selectedEntityString}
                                            tora={this.runwayTora}
                                            lda={this.runwayLda}
                                            ldaIsReduced={Subject.create(false)}
                                            coordinate={Subject.create('----')}
                                        />
                                    </div>
                                </div>
                            </TopTabNavigatorPage>
                            <TopTabNavigatorPage>
                                <div style="flex: 1; display: flex; flex-direction: row; height: 100%;">
                                    <div style="width: 30%; display: flex: flex-direction: column; justify-content: stretch;">
                                        <div style="display: flex;">
                                            <DropdownMenu
                                                ref={this.airportSearchAirportDropdownRef}
                                                values={this.store.airportSearchData}
                                                selectedIndex={this.store.airportSearchSelectedAirportIndex}
                                                onModified={(newSelectedIndex) => {
                                                    this.handleSelectAirport(this.store.sortedAirports.get(newSelectedIndex ?? 0).idarpt, newSelectedIndex ?? undefined);
                                                }}
                                                freeTextAllowed={false}
                                                numberOfDigitsForInputField={7}
                                                alignLabels={this.store.airportSearchMode.map((it) => (it === ControlPanelAirportSearchMode.City ? 'flex-start' : 'center'))}
                                                idPrefix="oanc-search-airport"
                                            />
                                        </div>
                                        <div style="padding-top: 20px; margin-top: 2px; height: 100%;">
                                            <RadioButtonGroup
                                                values={['ICAO', 'IATA', 'CITY NAME']}
                                                selectedIndex={this.store.airportSearchMode}
                                                onModified={(newSelectedIndex) => {
                                                    switch (newSelectedIndex) {
                                                    case 0: this.handleSelectSearchMode(ControlPanelAirportSearchMode.Icao); break;
                                                    case 1: this.handleSelectSearchMode(ControlPanelAirportSearchMode.Iata); break;
                                                    default: this.handleSelectSearchMode(ControlPanelAirportSearchMode.City); break;
                                                    }
                                                }}
                                                idPrefix="oanc-search"
                                            />
                                        </div>
                                    </div>
                                    <div id="ArptSelMiddle" style="display: flex; flex: 2; flex-direction: column; margin: 5px 20px 5px 20px;">
                                        <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: center; margin: 10px;">
                                            <span class="mfd-value">{this.store.selectedAirport.map((it) => it?.name?.substring(0, 18).toUpperCase() ?? '')}</span>
                                            <span class="mfd-value">
                                                {this.store.selectedAirport.map((it) => {
                                                    if (!it) {
                                                        return '';
                                                    }

                                                    return `${it.idarpt}       ${it.iata}`;
                                                })}
                                            </span>
                                            <span class="mfd-value">
                                                {this.store.selectedAirport.map((it) => {
                                                    if (!it) {
                                                        return '';
                                                    }

                                                    return `${ControlPanelUtils.LAT_FORMATTER(it.coordinates.lat)}/${ControlPanelUtils.LONG_FORMATTER(it.coordinates.lon)}`;
                                                })}
                                            </span>
                                        </div>
                                        <div style="flex-grow: 1;" />
                                        <div style="display: flex; flex-direction: row; justify-content: center; margin: 10px; ">
                                            <Button
                                                ref={this.displayAirportButtonRef}
                                                label="DISPLAY AIRPORT"
                                                onClick={() => this.handleDisplayAirport()}
                                                buttonStyle="width: 100%"
                                            />
                                        </div>
                                    </div>
                                    <div style="width: 20%; display: flex; flex-direction: column;
                                    margin-top: 20px; margin-bottom: 20px; justify-content: space-between;
                                    align-items: center; border-left: 2px solid lightgrey"
                                    >
                                        <Button
                                            label={this.originAirport.map((it) => (it ? (<>{it}</>) : (<>ORIGIN</>)))}
                                            onClick={() => {
                                                const airport = this.originAirport.get();
                                                if (airport) {
                                                    this.handleSelectAirport(airport);
                                                }
                                            }}
                                            disabled={this.originAirport.map((it) => !it)}
                                            buttonStyle="width: 100px;"
                                        />
                                        <Button
                                            label={this.destAirport.map((it) => (it ? (<>{it}</>) : (<>DEST</>)))}
                                            onClick={() => {
                                                const airport = this.destAirport.get();
                                                if (airport) {
                                                    this.handleSelectAirport(airport);
                                                }
                                            }}
                                            disabled={this.destAirport.map((it) => !it)}
                                            buttonStyle="width: 100px;"
                                        />
                                        <Button
                                            label={this.altnAirport.map((it) => (it ? (<>{it}</>) : (<>ALTN</>)))}
                                            onClick={() => {
                                                const airport = this.altnAirport.get();
                                                if (airport) {
                                                    this.handleSelectAirport(airport);
                                                }
                                            }}
                                            disabled={this.altnAirport.map((it) => !it)}
                                            buttonStyle="width: 100px;"
                                        />
                                    </div>
                                </div>
                            </TopTabNavigatorPage>
                            <TopTabNavigatorPage containerStyle="justify-content: space-between; align-content: space-between; justify-items: space-between;">
                                <div style="display: flex; flex-direction: row; border-bottom: 2px solid lightgray;
                                padding-bottom: 25px; margin-left: 30px; margin-right: 30px;"
                                >
                                    <div style="flex: 3; display: flex; flex-direction: column; align-items: center;">
                                        <span class="mfd-label" style="margin-bottom: 10px;">ACTIVE</span>
                                        <span class="mfd-value bigger">{this.activeDatabase}</span>
                                    </div>
                                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                                        <Button label="SWAP" disabled={Subject.create(true)} onClick={() => console.log('SWAP')} buttonStyle="padding: 20px 30px 20px 30px;" />
                                    </div>
                                    <div style="flex: 3; display: flex; flex-direction: column; align-items: center;">
                                        <span class="mfd-label" style="margin-bottom: 10px;">SECOND</span>
                                        <span class="mfd-value smaller">{this.secondDatabase}</span>
                                    </div>
                                </div>
                                <div style="display: flex; flex-direction: row; justify-content: space-between;
                                border-bottom: 2px solid lightgray; margin: 0px 15px 0px 15px; padding: 25px 10px 25px 10px;"
                                >
                                    <span class="mfd-label">AIRPORT DATABASE</span>
                                    <span class="mfd-value">{this.airportDatabase}</span>
                                </div>
                                <div style="display: flex; flex-direction: row; justify-content: space-between; justify-content: center; margin-top: 20px; height: 20px;">
                                    <span class="mfd-label bigger" />
                                </div>
                            </TopTabNavigatorPage>
                        </TopTabNavigator>
                    </div>
                </div>
            </>
        );
    }
}
