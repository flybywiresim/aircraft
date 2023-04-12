/* eslint-disable jsx-a11y/label-has-associated-control */

import 'instruments/src/PFD/MFD-common/common.scss';
import 'instruments/src/PFD/oans.scss';

import { Button } from 'instruments/src/PFD/MFD-common/Button';
import { IconButton } from 'instruments/src/PFD/MFD-common/IconButton';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/PFD/MFD-common/TopTabNavigator';
import { OANSRunwayInfoBox } from 'instruments/src/PFD/OANSRunwayInfoBox';

import { ArraySubject, ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from 'msfssdk';

import { DropdownMenu } from 'instruments/src/PFD/MFD-common/DropdownMenu';
import { NumberInputField } from 'instruments/src/PFD/MFD-common/NumberInputField';
import { RadioButtonGroup } from 'instruments/src/PFD/MFD-common/RadioButtonGroup';
import { DropdownMenuTest } from 'instruments/src/PFD/MFD-common/DropdownMenuTest';
import { MFDSimvars } from './shared/MFDSimvarPublisher';

export interface OANSProps extends ComponentProps {
    bus: EventBus;
}

export enum EntityTypes {
    RWY,
    TWY,
    STAND,
    OTHER
}

export class OANS extends DisplayComponent<OANSProps> {
    private testSubject = Subject.create(0);

    private availableEntityTypes = Object.values(EntityTypes).filter((v) => typeof v === 'string') as string[];

    private selectedEntityType = Subject.create<EntityTypes>(EntityTypes.RWY);

    private entityList = ArraySubject.create<string>(['08L', '08R', 'M', 'S']);

    private selectedEntityIndex = Subject.create<number>(0);

    private airportList = ArraySubject.create<string>(['EDDM', 'KJFK']);

    private selectedAirportIndex = Subject.create<number>(0);

    private selectedAirportSearchFilter = Subject.create<number>(0); // 0 = ICAO, 1 = IATA, 2 = CITY NAME

    private airportName = Subject.create('MUNICH INTL');

    private airportCodes = Subject.create('EDDM MUC');

    private airportCoordinates = Subject.create('48°21.5N/011°47.0E');

    private oansMenuRef = FSComponent.createRef<HTMLDivElement>();

    private oansMenuSelectedPageIndex = Subject.create(0);

    private changeSelectedEntityType(newSelectedIndex: number) {
        this.selectedEntityType.set(newSelectedIndex);
    }

    private changeSelectedAirportSearchFilter(newSelectedIndex: number) {
        this.selectedAirportSearchFilter.set(newSelectedIndex);
    }

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

        const sub = this.props.bus.getSubscriber<MFDSimvars>();

        sub.on('potentiometerCaptain').whenChanged().handle((value) => {
            if (value > 0 && value < 0.4) {
                this.testSubject.set(0);
            } else if (value >= 0.4 && value < 0.7) {
                this.testSubject.set(1);
            } else {
                this.testSubject.set(2);
            }
        });

        sub.on('ecamNdXfr').whenChanged().handle((value) => {
            if (value === 1) {
                this.oansMenuRef.instance.style.display = 'flex';
            } else {
                this.oansMenuRef.instance.style.display = 'none';
            }
        });
    }

    render(): VNode {
        return (
            <>
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
                <div style="display: flex; flex: 1; justify-content: center; align-items: center;">
                    <span style="font-size: 40px; color: white">MAP</span>
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
                                        values={this.entityList}
                                        selectedIndex={this.selectedEntityIndex}
                                        useNewStyle
                                    />
                                    <div style="padding-top: 20px; margin-top: 2px; border-right: 2px solid lightgrey; height: 100%;">
                                        <RadioButtonGroup
                                            values={ArraySubject.create(this.availableEntityTypes)}
                                            selectedIndex={this.selectedEntityType}
                                            idPrefix="entityTypesRadio"
                                            onChangeCallback={(num) => this.changeSelectedEntityType(num)}
                                        />
                                    </div>
                                </div>
                                <div id="MapDataLdgShiftPanel" style="display: none; flex: 3; flex-direction: column; margin: 5px 20px 5px 20px;">
                                    <div style="flex: 1; display: flex; justify-content: space-between; border-bottom: 1px solid lightgrey;">
                                        <div class="MFDLabelValueContainer" style="padding: 15px;">
                                            <span class="MFDLabel spacingRight">RWY</span>
                                            <span class="MFDGreenValue">{this.entityList.get(this.selectedEntityIndex.get())}</span>
                                        </div>
                                    </div>
                                    <div style="flex: 5; display: flex; flex-direction: row; justify-content: space-between; margin: 10px;">
                                        <div style="display: flex; flex-direction: column;">
                                            <div style="display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 50px 50px; align-items: center;">
                                                <span class="MFDLabel spacingRight bigger" style="justify-self: flex-end">THRESHOLD SHIFT</span>
                                                <NumberInputField emptyValueString="----" value={Subject.create(0)} unitTrailing={Subject.create('M')} />
                                                <span class="MFDLabel spacingRight bigger" style="justify-self: flex-end">END SHIFT</span>
                                                <NumberInputField emptyValueString="----" value={Subject.create(0)} unitTrailing={Subject.create('M')} />
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
                                            onClick={() => console.log(`CENTER MAP ON ${this.entityList.get(this.selectedEntityIndex.get())}`)}
                                            containerStyle="width: 65%"
                                        >
                                            {`CENTER MAP ON ${this.entityList.get(this.selectedEntityIndex.get())}`}
                                        </Button>
                                    </div>
                                    <OANSRunwayInfoBox
                                        rwyOrStand={this.selectedEntityType}
                                        selectedEntity={Subject.create(this.entityList.get(this.selectedEntityIndex.get()))}
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
                                    <DropdownMenuTest
                                        values={this.airportList}
                                        selectedIndex={this.selectedAirportIndex}
                                        idPrefix="123"
                                        useNewStyle
                                    />
                                    <div style="padding-top: 20px; margin-top: 2px; height: 100%;">
                                        <RadioButtonGroup
                                            values={ArraySubject.create(['ICAO', 'IATA', 'CITY NAME'])}
                                            selectedIndex={this.selectedAirportSearchFilter}
                                            idPrefix="airportSearchFilterRadio"
                                            onChangeCallback={(num) => this.changeSelectedAirportSearchFilter(num)}
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
                                    <Button>EDDM</Button>
                                    <Button disabled={Subject.create(true)}>KJFK</Button>
                                    <Button>ALTN</Button>
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
            </>
        );
    }
}
