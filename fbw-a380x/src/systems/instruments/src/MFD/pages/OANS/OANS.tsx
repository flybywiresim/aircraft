/* eslint-disable jsx-a11y/label-has-associated-control */

import 'instruments/src/MFD/pages/common/style.scss';
import './oans.scss';

import { Button } from 'instruments/src/MFD/pages/common/Button';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';
import { OANSRunwayInfoBox } from 'instruments/src/MFD/pages/OANS/OANSRunwayInfoBox';
import { ContextMenu } from 'instruments/src/MFD/pages/common/ContextMenu';

import { ArraySubject, ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { RadioButtonGroup } from 'instruments/src/MFD/pages/common/RadioButtonGroup';
import { NumberInput } from 'instruments/src/MFD/pages/common/NumberInput';

export interface OANSProps extends ComponentProps {
    bus: EventBus;
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

export class OANS extends DisplayComponent<OANSProps> {
    private availableEntityTypes = Object.values(EntityTypes).filter((v) => typeof v === 'string') as string[];

    private selectedEntityType = Subject.create<EntityTypes>(EntityTypes.RWY);

    private availableEntityList = ArraySubject.create(['08L', '08R', '26L', '26R', 'M', 'N', 'S', 'T']);

    private selectedEntityIndex = Subject.create(0);

    private selectedEntityString = Subject.create('08L');

    private airportList = ArraySubject.create(['EDDM', 'KJFK']);

    private selectedAirportIndex = Subject.create(0);

    private selectedAirportSearchFilter = Subject.create(0); // 0 = ICAO, 1 = IATA, 2 = CITY NAME

    private mapRef = FSComponent.createRef<HTMLDivElement>();

    private contextMenuRef = FSComponent.createRef<ContextMenu>();

    private oansMenuRef = FSComponent.createRef<HTMLDivElement>();

    private oansMenuSelectedPageIndex = Subject.create(0);

    private contextMenuPositionTriggered = Subject.create<MousePosition>({ x: 0, y: 0 })

    private contextMenuActions = ArraySubject.create([
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
        document.getElementById('MapDataLdgShiftPanel').style.display = 'flex';
        document.getElementById('MapDataMain').style.display = 'none';
    }

    private hideLdgShiftPanel() {
        document.getElementById('MapDataLdgShiftPanel').style.display = 'none';
        document.getElementById('MapDataMain').style.display = 'flex';
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

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

        this.selectedEntityIndex.sub((val) => this.selectedEntityString.set(this.availableEntityList.get(val)));
    }

    render(): VNode {
        return (
            <div class="mfd-main">
                {/* begin header */}
                <div style="display: flex; flex-direction: row; justify-content: space-between">
                    <div style="display: flex; flex-direction: column">
                        <span class="MFDLabel">
                            GS
                            {' '}
                            <span class="MFDGreenValue">0</span>
                        </span>
                        <span class="MFDLabel">
                            <span class="MFDGreenValue">---</span>
                            {' / '}
                            <span class="MFDGreenValue">---</span>
                        </span>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end">
                        <span class="MFDLabel">MUNICH INTL</span>
                        <span class="MFDLabel">EDDM MUC</span>
                    </div>
                </div>
                <div ref={this.mapRef} style="display: flex; flex: 1; justify-content: center; align-items: center; background-color: #111; cursor: crosshair;">
                    <span style="font-size: 40px; color: white;">MAP</span>
                    <ContextMenu
                        ref={this.contextMenuRef}
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
                        pageChangeCallback={(index) => this.oansMenuSelectedPageIndex.set(index)}
                    >
                        <TopTabNavigatorPage>
                            <div style="flex: 1; display: flex; flex-direction: row; height: 100%;">
                                <div style="flex: 1; display: flex: flex-direction: column; justify-content: stretch;">
                                    <DropdownMenu
                                        values={this.availableEntityList}
                                        selectedIndex={this.selectedEntityIndex}
                                        idPrefix="123"
                                        onChangeCallback={(i) => this.selectedEntityIndex.set(i)}
                                    />
                                    <div style="padding-top: 20px; margin-top: 2px; border-right: 2px solid lightgrey; height: 100%;">
                                        <RadioButtonGroup
                                            values={ArraySubject.create(this.availableEntityTypes)}
                                            selectedIndex={this.selectedEntityType}
                                            idPrefix="entityTypesRadio"
                                            onChangeCallback={(num) => this.selectedEntityType.set(num)}
                                        />
                                    </div>
                                </div>
                                <div id="MapDataLdgShiftPanel" style="display: none; flex: 3; flex-direction: column; margin: 5px 20px 5px 20px;">
                                    <div style="flex: 1; display: flex; justify-content: space-between; border-bottom: 1px solid lightgrey;">
                                        <div class="MFDLabelValueContainer" style="padding: 15px;">
                                            <span class="MFDLabel spacingRight">RWY</span>
                                            <span class="MFDGreenValue">{this.selectedEntityString}</span>
                                        </div>
                                    </div>
                                    <div style="flex: 5; display: flex; flex-direction: row; justify-content: space-between; margin: 10px;">
                                        <div style="display: flex; flex-direction: column;">
                                            <div style="display: grid; grid-template-columns: 1fr auto; grid-template-rows: 50px 50px; align-items: center;">
                                                <span class="MFDLabel spacingRight bigger" style="justify-self: flex-end">THRESHOLD SHIFT</span>
                                                <NumberInput emptyValueString="----" value={Subject.create(0)} unitTrailing={Subject.create('M')} />
                                                <span class="MFDLabel spacingRight bigger" style="justify-self: flex-end">END SHIFT</span>
                                                <NumberInput emptyValueString="----" value={Subject.create(0)} unitTrailing={Subject.create('M')} />
                                            </div>
                                            <div style="display: flex; flex-direction: row; justify-content: center; margin-top: 10px;">
                                                <Button
                                                    containerStyle="padding: 7px 15px 5px 15px;"
                                                    onClick={() => this.hideLdgShiftPanel()}
                                                >
                                                    RETURN
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div id="MapDataMain" style="display: flex; flex: 3; flex-direction: column; margin: 5px 20px 5px 20px;">
                                    <div style="display: flex; flex-direction: row; justify-content: space-between; margin: 10px;">
                                        <Button onClick={() => console.log('ADD CROSS')} containerStyle="flex: 1">ADD CROSS</Button>
                                        <Button onClick={() => console.log('ADD FLAG')} containerStyle="flex: 1; margin-left: 10px; margin-right: 10px">ADD FLAG</Button>
                                        <Button onClick={() => this.showLdgShiftPanel()} containerStyle="flex: 1">LDG SHIFT</Button>
                                    </div>
                                    <div style="display: flex; flex-direction: row; justify-content: center; margin: 10px; ">
                                        <Button
                                            onClick={() => console.log(`CENTER MAP ON ${this.availableEntityList.get(this.selectedEntityIndex.get())}`)}
                                            containerStyle="width: 65%"
                                        >
                                            {`CENTER MAP ON ${this.availableEntityList.get(this.selectedEntityIndex.get())}`}
                                        </Button>
                                    </div>
                                    <OANSRunwayInfoBox
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
                                        onChangeCallback={(i) => this.selectedAirportIndex.set(i)}
                                    />
                                    <div style="padding-top: 20px; margin-top: 2px; height: 100%;">
                                        <RadioButtonGroup
                                            values={ArraySubject.create(['ICAO', 'IATA', 'CITY NAME'])}
                                            selectedIndex={this.selectedAirportSearchFilter}
                                            idPrefix="airportSearchFilterRadio"
                                            onChangeCallback={(num) => this.selectedAirportSearchFilter.set(num)}
                                        />
                                    </div>
                                </div>
                                <div id="ArptSelMiddle" style="display: flex; flex: 2; flex-direction: column; margin: 5px 20px 5px 20px;">
                                    <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: center; margin: 30px;">
                                        <span class="MFDGreenValue">MUNICH INTL</span>
                                        <span class="MFDGreenValue">EDDM MUC</span>
                                        <span class="MFDGreenValue">48°21.5N/011°47.0E</span>
                                    </div>
                                    <div style="display: flex; flex-direction: row; justify-content: center; margin: 10px; ">
                                        <Button
                                            onClick={() => console.log('DISPLAY AIRPORT')}
                                            containerStyle="width: 75%"
                                        >
                                            DISPLAY AIRPORT
                                        </Button>
                                    </div>
                                </div>
                                <div style="width: 20%; display: flex; flex-direction: column;
                                margin-top: 20px; margin-bottom: 20px; justify-content: space-between;
                                align-items: center; border-left: 2px solid lightgrey"
                                >
                                    <Button onClick={() => null}>EDDM</Button>
                                    <Button onClick={() => null}>KJFK</Button>
                                    <Button onClick={() => null} disabled={Subject.create(true)}>ALTN</Button>
                                </div>
                            </div>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage containerStyle="justify-content: space-between; align-content: space-between; justify-items: space-between;">
                            <div style="display: flex; flex-direction: row; border-bottom: 2px solid lightgray;
                            padding-bottom: 25px; margin-left: 30px; margin-right: 30px;"
                            >
                                <div style="flex: 3; display: flex; flex-direction: column; align-items: center;">
                                    <span class="MFDLabel" style="margin-bottom: 10px;">ACTIVE DATABASE</span>
                                    <span class="MFDGreenValue bigger">7MAR-3APR</span>
                                </div>
                                <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                                    <Button onClick={() => console.log('SWAP')} containerStyle="padding: 20px 30px 20px 30px;">SWAP</Button>
                                </div>
                                <div style="flex: 3; display: flex; flex-direction: column; align-items: center;">
                                    <span class="MFDLabel" style="margin-bottom: 10px;">SECOND DATABASE</span>
                                    <span class="MFDGreenValue smaller">7FEB-6MAR</span>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: row; justify-content: space-between;
                            border-bottom: 2px solid lightgray; margin: 0px 15px 0px 15px; padding: 25px 10px 25px 10px;"
                            >
                                <span class="MFDLabel">AIRPORT DATABASE</span>
                                <span class="MFDGreenValue">SXT59027250AA04</span>
                            </div>
                            <div style="display: flex; flex-direction: row; justify-content: space-between; justify-content: center; margin-top: 20px;">
                                <span class="MFDLabel bigger">DATABASE CYCLE NOT VALID</span>
                            </div>
                        </TopTabNavigatorPage>
                    </TopTabNavigator>
                </div>
            </div>
        );
    }
}
