/* eslint-disable jsx-a11y/label-has-associated-control */

import 'instruments/src/MFD/pages/common/style.scss';
import './OansNdUi.scss';

import { Button } from 'instruments/src/MFD/pages/common/Button';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';
import { ContextMenu } from 'instruments/src/MFD/pages/common/ContextMenu';

import { ArraySubject, ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import { MouseCursor } from 'instruments/src/MFD/pages/common/MouseCursor';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { RadioButtonGroup } from 'instruments/src/MFD/pages/common/RadioButtonGroup';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { LengthFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { FmcInterface } from 'instruments/src/MFD/FMC/FmcInterface';
import { OansRunwayInfoBox } from 'instruments/src/MFD/pages/OANS/OANSRunwayInfoBox';

export interface OANSProps extends ComponentProps {
    bus: EventBus;
    instrument: BaseInstrument;
    fmc: FmcInterface;
}

export enum EntityTypes {
    RWY,
    TWY,
    STAND,
    OTHER
}

declare type MousePosition = {
    x: number;
    y: number;
}

export class OansNdUi extends DisplayComponent<OANSProps> {
    private topRef = FSComponent.createRef<HTMLDivElement>();

    private mouseCursorRef = FSComponent.createRef<MouseCursor>();

    private availableEntityTypes = Object.values(EntityTypes).filter((v) => typeof v === 'string') as string[];

    private thresholdShift = Subject.create<number | null>(null);

    private endShift = Subject.create<number | null>(null);

    private selectedEntityType = Subject.create<EntityTypes | null>(EntityTypes.RWY);

    private availableEntityList = ArraySubject.create(['08L', '08R', '26L', '26R', 'M', 'N', 'S', 'T']);

    private selectedEntityIndex = Subject.create<number | null>(null);

    private selectedEntityString = Subject.create('08L');

    private airportList = ArraySubject.create(['EDDM', 'KJFK']);

    private selectedAirportIndex = Subject.create<number | null>(null);

    private selectedAirportSearchFilter = Subject.create<number | null>(null); // 0 = ICAO, 1 = IATA, 2 = CITY NAME

    private mapRef = FSComponent.createRef<HTMLDivElement>();

    private contextMenuRef = FSComponent.createRef<ContextMenu>();

    private contextMenuOpened = Subject.create<boolean>(false);

    private oansMenuRef = FSComponent.createRef<HTMLDivElement>();

    private oansMenuSelectedPageIndex = Subject.create(0);

    private contextMenuPositionTriggered = Subject.create<MousePosition>({ x: 0, y: 0 })

    private contextMenuActions = Subject.create([
        {
            title: 'ADD CROSS',
            disabled: false,
            onSelectCallback: () => console.log(`ADD CROSS at (${this.contextMenuPositionTriggered.get().x}, ${this.contextMenuPositionTriggered.get().y})`),
        },
        {
            title: 'ADD FLAG',
            disabled: false,
            onSelectCallback: () => console.log(`ADD FLAG at (${this.contextMenuPositionTriggered.get().x}, ${this.contextMenuPositionTriggered.get().y})`),
        },
        {
            title: 'MAP DATA',
            disabled: false,
            onSelectCallback: () => this.toggleOANSMenu(),
        },
        {
            title: 'ERASE ALL CROSSES',
            disabled: true,
            onSelectCallback: () => console.log('ERASE ALL CROSSES'),
        },
        {
            title: 'ERASE ALL FLAGS',
            disabled: true,
            onSelectCallback: () => console.log('ERASE ALL FLAGS'),
        },
        {
            title: 'CENTER ON ACFT',
            disabled: false,
            onSelectCallback: () => console.log('CENTER ON ACFT'),
        },
    ]);

    private toggleOANSMenu() {
        if (this.oansMenuRef.instance.style.display === 'flex') {
            this.oansMenuRef.instance.style.display = 'none';
        } else {
            this.oansMenuRef.instance.style.display = 'flex';
        }
    }

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

    // Necessary to enable mouse interaction
    get isInteractive(): boolean {
        return true;
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.topRef.instance.addEventListener('mousemove', (ev) => {
            this.mouseCursorRef.instance.updatePosition(ev.clientX, ev.clientY);
        });

        this.mapRef.instance.addEventListener('contextmenu', (e) => {
            // Not firing right now, use double click
            this.contextMenuPositionTriggered.set({ x: e.clientX, y: e.clientY });
            this.contextMenuRef.instance.display(e.clientX, e.clientY);
        });

        this.mapRef.instance.addEventListener('dblclick', (e) => {
            this.contextMenuPositionTriggered.set({ x: e.clientX, y: e.clientY });
            this.contextMenuRef.instance.display(e.clientX, e.clientY);
        });

        this.mapRef.instance.addEventListener('click', () => {
            this.contextMenuRef.instance.hideMenu();
        });

        this.selectedEntityIndex.sub((val) => this.selectedEntityString.set(this.availableEntityList.get(val ?? 0)));
    }

    render(): VNode {
        return (
            <div class="mfd-main" ref={this.topRef}>
                {/* begin header */}
                <div style="display: flex; flex-direction: row; justify-content: space-between">
                    <div style="display: flex; flex-direction: column">
                        <span class="mfd-label">
                            GS
                            {' '}
                            <span class="mfd-value">0</span>
                        </span>
                        <span class="mfd-label">
                            <span class="mfd-value">---</span>
                            {' / '}
                            <span class="mfd-value">---</span>
                        </span>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end">
                        <span class="mfd-label">MUNICH INTL</span>
                        <span class="mfd-label">EDDM MUC</span>
                    </div>
                </div>
                <div ref={this.mapRef} style="display: flex; flex: 1; justify-content: center; align-items: center; background-color: #111; cursor: crosshair;">
                    <span style="font-size: 40px; color: white;">MAP</span>
                    <ContextMenu
                        ref={this.contextMenuRef}
                        opened={this.contextMenuOpened}
                        idPrefix="contextMenu"
                        values={this.contextMenuActions}
                    />
                </div>
                <IconButton onClick={() => this.toggleOANSMenu()} icon="double-up" containerStyle="width: 49px; height: 45px; position: absolute; right: 2px; top: calc(65% + 54px);" />
                <div ref={this.oansMenuRef} style="display: flex; height: 30%; cursor: crosshair;">
                    <TopTabNavigator
                        pageTitles={Subject.create(['MAP DATA', 'ARPT SEL', 'STATUS'])}
                        selectedPageIndex={this.oansMenuSelectedPageIndex}
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
                                        idPrefix="123"
                                        freeTextAllowed={false}
                                        onModified={(i) => this.selectedEntityIndex.set(i)}
                                    />
                                    <div style="padding-top: 20px; margin-top: 2px; border-right: 2px solid lightgrey; height: 100%;">
                                        <RadioButtonGroup
                                            values={this.availableEntityTypes}
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
                                                    errorHandler={(e) => this.props.fmc.showFmsErrorMessage(e)}
                                                />
                                                <span class="mfd-label mfd-spacing-right bigger" style="justify-self: flex-end">END SHIFT</span>
                                                <InputField<number>
                                                    dataEntryFormat={new LengthFormat(Subject.create(0), Subject.create(4000))}
                                                    value={this.endShift}
                                                    mandatory={Subject.create(false)}
                                                    errorHandler={(e) => this.props.fmc.showFmsErrorMessage(e)}
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
                                        <Button label="ADD CROSS" onClick={() => console.log('ADD CROSS')} buttonStyle="flex: 1" />
                                        <Button label="ADD FLAG" onClick={() => console.log('ADD FLAG')} buttonStyle="flex: 1; margin-left: 10px; margin-right: 10px" />
                                        <Button label="LDG SHIFT" onClick={() => this.showLdgShiftPanel()} buttonStyle="flex: 1" />
                                    </div>
                                    <div style="display: flex; flex-direction: row; justify-content: center; margin: 10px; ">
                                        <Button
                                            label={`CENTER MAP ON ${this.availableEntityList.get(this.selectedEntityIndex.get() ?? 0)}`}
                                            onClick={() => console.log(`CENTER MAP ON ${this.availableEntityList.get(this.selectedEntityIndex.get() ?? 0)}`)}
                                            buttonStyle="width: 65%"
                                        />
                                    </div>
                                    <OansRunwayInfoBox
                                        rwyOrStand={this.selectedEntityType}
                                        selectedEntity={this.selectedEntityString}
                                        tora={Subject.create(4000)}
                                        lda={Subject.create(4000)}
                                        ldaIsReduced={Subject.create(false)}
                                        coordinate={Subject.create('48°21.5N/011°47.0E')}
                                    />
                                </div>
                            </div>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            <div style="flex: 1; display: flex; flex-direction: row; height: 100%;">
                                <div style="width: 30%; display: flex: flex-direction: column; justify-content: stretch;">
                                    <DropdownMenu
                                        values={this.airportList}
                                        selectedIndex={this.selectedAirportIndex}
                                        idPrefix="airportDropdown"
                                        freeTextAllowed={false}
                                        onModified={(i) => this.selectedAirportIndex.set(i)}
                                    />
                                    <div style="padding-top: 20px; margin-top: 2px; height: 100%;">
                                        <RadioButtonGroup
                                            values={['ICAO', 'IATA', 'CITY NAME']}
                                            selectedIndex={this.selectedAirportSearchFilter}
                                            idPrefix="airportSearchFilterRadio"
                                        />
                                    </div>
                                </div>
                                <div id="ArptSelMiddle" style="display: flex; flex: 2; flex-direction: column; margin: 5px 20px 5px 20px;">
                                    <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: center; margin: 30px;">
                                        <span class="mfd-value">MUNICH INTL</span>
                                        <span class="mfd-value">EDDM MUC</span>
                                        <span class="mfd-value">48°21.5N/011°47.0E</span>
                                    </div>
                                    <div style="display: flex; flex-direction: row; justify-content: center; margin: 10px; ">
                                        <Button
                                            label="DISPLAY AIRPORT"
                                            onClick={() => console.log('DISPLAY AIRPORT')}
                                            buttonStyle="width: 75%"
                                        />
                                    </div>
                                </div>
                                <div style="width: 20%; display: flex; flex-direction: column;
                                margin-top: 20px; margin-bottom: 20px; justify-content: space-between;
                                align-items: center; border-left: 2px solid lightgrey"
                                >
                                    <Button label="EDDM" onClick={() => {}} />
                                    <Button label="KJFK" onClick={() => {}} />
                                    <Button label="ALTN" onClick={() => {}} disabled={Subject.create(true)} />
                                </div>
                            </div>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage containerStyle="justify-content: space-between; align-content: space-between; justify-items: space-between;">
                            <div style="display: flex; flex-direction: row; border-bottom: 2px solid lightgray;
                            padding-bottom: 25px; margin-left: 30px; margin-right: 30px;"
                            >
                                <div style="flex: 3; display: flex; flex-direction: column; align-items: center;">
                                    <span class="mfd-label" style="margin-bottom: 10px;">ACTIVE DATABASE</span>
                                    <span class="mfd-value bigger">7MAR-3APR</span>
                                </div>
                                <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                                    <Button label="SWAP" onClick={() => console.log('SWAP')} buttonStyle="padding: 20px 30px 20px 30px;" />
                                </div>
                                <div style="flex: 3; display: flex; flex-direction: column; align-items: center;">
                                    <span class="mfd-label" style="margin-bottom: 10px;">SECOND DATABASE</span>
                                    <span class="mfd-value smaller">7FEB-6MAR</span>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: row; justify-content: space-between;
                            border-bottom: 2px solid lightgray; margin: 0px 15px 0px 15px; padding: 25px 10px 25px 10px;"
                            >
                                <span class="mfd-label">AIRPORT DATABASE</span>
                                <span class="mfd-value">SXT59027250AA04</span>
                            </div>
                            <div style="display: flex; flex-direction: row; justify-content: space-between; justify-content: center; margin-top: 20px;">
                                <span class="mfd-label bigger">DATABASE CYCLE NOT VALID</span>
                            </div>
                        </TopTabNavigatorPage>
                    </TopTabNavigator>
                </div>
                <MouseCursor side={Subject.create('CAPT')} ref={this.mouseCursorRef} />
            </div>
        );
    }
}
