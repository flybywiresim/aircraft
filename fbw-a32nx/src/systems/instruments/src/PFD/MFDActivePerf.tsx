/* eslint-disable jsx-a11y/label-has-associated-control */

import { DropdownMenu } from 'instruments/src/PFD/MFD-common/DropdownMenu';
import { NumberInput } from 'instruments/src/PFD/MFD-common/NumberInput';

import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/PFD/MFD-common/TopTabNavigator';

import { ArraySubject, ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import { Button } from 'instruments/src/PFD/MFD-common/Button';
import { PageSelectorDropdownMenu } from 'instruments/src/PFD/MFD-common/PageSelectorDropdownMenu';
import { ActivePageTitleBar } from 'instruments/src/PFD/MFD-common/ActivePageTitleBar';
import { RadioButtonGroup } from 'instruments/src/PFD/MFD-common/RadioButtonGroup';

interface MFDActivePerfProps extends ComponentProps {
    bus: EventBus;
}

export class MFDActivePerf extends DisplayComponent<MFDActivePerfProps> {
    private sysSelectorSelectedIndex = Subject.create(0);

    private flightPhasesSelectedPageIndex = Subject.create(0);

    private selectedThrustSettingIndex = Subject.create(0);

    private selectedFlapsIndex = Subject.create(0);

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);
    }

    render(): VNode {
        return (
            <>
                {/* begin header */}
                <div style="display: flex; flex-direction: row;">
                    <DropdownMenu
                        values={ArraySubject.create(['FMS 1', 'ATCCOM', 'SURV', 'FCU BKUP'])}
                        selectedIndex={this.sysSelectorSelectedIndex}
                        idPrefix="sysSelectorDropdown"
                        onChangeCallback={(val) => this.sysSelectorSelectedIndex.set(val)}
                        containerStyle="width: 25%;"
                        alignLabels="left"
                    />
                </div>
                <div style="display: flex; flex-direction: row;">
                    <PageSelectorDropdownMenu isActive={Subject.create(true)}>
                        ACTIVE
                    </PageSelectorDropdownMenu>
                    <PageSelectorDropdownMenu isActive={Subject.create(false)}>
                        POSITION
                    </PageSelectorDropdownMenu>
                    <PageSelectorDropdownMenu isActive={Subject.create(false)}>
                        SEC INDEX
                    </PageSelectorDropdownMenu>
                    <PageSelectorDropdownMenu isActive={Subject.create(false)}>
                        DATA
                    </PageSelectorDropdownMenu>
                </div>
                <ActivePageTitleBar activePage={Subject.create('ACTIVE/PERF')} tmpyIsActive={Subject.create(false)} />
                {/* end header */}
                {/* begin page content */}
                <div class="MFDPageContainer">
                    <div style="margin: 15px; display: flex; justify-content: space-between;">
                        <div class="MFDLabelValueContainer">
                            <span class="MFDLabel spacingRight">CRZ</span>
                            <NumberInput value={Subject.create(350)} emptyValueString="---" unitLeading={Subject.create('FL')} />
                        </div>
                        <div class="MFDLabelValueContainer">
                            <span class="MFDLabel spacingRight">OPT</span>
                            <span class="MFDUnitLabel leadingUnit">FL</span>
                            <span class="MFDGreenValue">370</span>
                        </div>
                        <div class="MFDLabelValueContainer">
                            <span class="MFDLabel spacingRight">REC MAX</span>
                            <span class="MFDUnitLabel leadingUnit">FL</span>
                            <span class="MFDGreenValue">393</span>
                        </div>
                    </div>
                    <TopTabNavigator
                        pageTitles={Subject.create(['T.O', 'CLB', 'CRZ', 'DES', 'APPR', 'GA'])}
                        selectedPageIndex={this.flightPhasesSelectedPageIndex}
                        pageChangeCallback={(val) => this.flightPhasesSelectedPageIndex.set(val)}
                        selectedTabTextColor="white"
                    >
                        <TopTabNavigatorPage>
                            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid lightgrey">
                                <div class="MFDLabelValueContainer" style="padding: 15px;">
                                    <span class="MFDLabel spacingRight">RWY</span>
                                    <span class="MFDGreenValue">14L</span>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: row;">
                                <div style="flex: 5; display: grid; grid-template-columns: auto auto;
                                justify-content: space-between; border-right: 1px solid lightgrey; padding-top: 10px; margin-top: 5px; padding-right: 20px"
                                >
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">V1</span>
                                        <NumberInput value={Subject.create(135)} emptyValueString="---" unitTrailing={Subject.create('KT')} />
                                    </div>
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">F</span>
                                        <span class="MFDGreenValue">169</span>
                                        <span class="MFDUnitLabel trailingUnit">KT</span>
                                    </div>
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">VR</span>
                                        <NumberInput value={Subject.create(140)} emptyValueString="---" unitTrailing={Subject.create('KT')} />
                                    </div>
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">S</span>
                                        <span class="MFDGreenValue">220</span>
                                        <span class="MFDUnitLabel trailingUnit">KT</span>
                                    </div>
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">V2</span>
                                        <NumberInput value={Subject.create(145)} emptyValueString="---" unitTrailing={Subject.create('KT')} />
                                    </div>
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">O</span>
                                        <span class="MFDGreenValue">246</span>
                                        <span class="MFDUnitLabel trailingUnit">KT</span>
                                    </div>
                                </div>
                                <div style="flex: 4; display: flex; flex-direction: column; justify-items: center; justify-content: center; ">
                                    <span style="width: 175px; display: inline; margin-left: 15px;">
                                        <RadioButtonGroup
                                            values={ArraySubject.create(['TOGA', 'FLEX', 'DERATED'])}
                                            selectedIndex={this.selectedThrustSettingIndex}
                                            idPrefix="thrustSettingRadio"
                                            onChangeCallback={(num) => this.selectedThrustSettingIndex.set(num)}
                                        />
                                    </span>
                                </div>
                            </div>
                            <div style="margin: 15px 0px 15px 0px; display: flex; justify-content: space-between;">
                                <div class="MFDLabelValueContainer">
                                    <span class="MFDLabel spacingRight">FLAPS</span>
                                    <DropdownMenu
                                        values={ArraySubject.create(['-', '1', '2', '3'])}
                                        selectedIndex={this.selectedFlapsIndex}
                                        idPrefix="flapDropdown"
                                        onChangeCallback={(val) => this.selectedFlapsIndex.set(val)}
                                    />
                                </div>
                                <div class="MFDLabelValueContainer">
                                    <span class="MFDLabel spacingRight">THS FOR</span>
                                    <NumberInput value={Subject.create(39.0)} emptyValueString="--.-" unitTrailing={Subject.create('%')} />
                                </div>
                                <div class="MFDLabelValueContainer">
                                    <span class="MFDLabel spacingRight">T.O SHIFT</span>
                                    <NumberInput value={Subject.create(undefined)} emptyValueString="----" unitTrailing={Subject.create('M')} />
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: auto auto; justify-content: space-between; margin: 10px 80px 10px 80px;">
                                <div class="MFDLabelValueContainer" style="justify-content: flex-end;">
                                    <span class="MFDLabel spacingRight">THR RED</span>
                                    <NumberInput
                                        value={Subject.create(3000)}
                                        emptyValueString="----"
                                        unitTrailing={Subject.create('FT')}
                                        containerStyle="width: 125px; justify-content: flex-end;"
                                    />
                                </div>
                                <div class="MFDLabelValueContainer" />
                                <div class="MFDLabelValueContainer" style="justify-content: flex-end;">
                                    <span class="MFDLabel spacingRight">ACCEL</span>
                                    <NumberInput
                                        value={Subject.create(800)}
                                        emptyValueString="----"
                                        unitTrailing={Subject.create('FT')}
                                        containerStyle="width: 125px; justify-content: flex-end;"
                                    />
                                </div>
                                <div class="MFDLabelValueContainer">
                                    <span class="MFDLabel spacingRight">EO ACCEL</span>
                                    <NumberInput
                                        value={Subject.create(1990)}
                                        emptyValueString="----"
                                        unitTrailing={Subject.create('FT')}
                                        containerStyle="width: 125px; justify-content: flex-end;"
                                    />
                                </div>
                            </div>
                            <div style="margin: 20px 2px 3px 2px; display: flex; flex-direction: row;">
                                <div style="display: flex; flex: 1;">
                                    <Button>
                                        NOISE
                                    </Button>
                                </div>
                            </div>
                            <div style="flex-grow: 1;" />
                            {/* fill space vertically */}
                            <div style="margin: 20px 2px 3px 2px; display: flex; flex-direction: row; justify-self: flex-end;">
                                <div class="MFDLabelValueContainer" style="flex: 4; margin-left: 80px;">
                                    <span class="MFDLabel spacingRight">TRANS</span>
                                    <NumberInput
                                        value={Subject.create(5000)}
                                        emptyValueString="----"
                                        unitTrailing={Subject.create('FT')}
                                    />
                                </div>
                                <Button>
                                    CPNY T.O
                                    <br />
                                    REQUEST
                                </Button>
                            </div>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            <span style="color: white; font-size: 60px;">CLB</span>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            <span style="color: white; font-size: 60px;">CRZ</span>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            <span style="color: white; font-size: 60px;">DES</span>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            <span style="color: white; font-size: 60px;">APPR</span>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            <span style="color: white; font-size: 60px;">GA</span>
                        </TopTabNavigatorPage>
                    </TopTabNavigator>
                    <div style="margin: 20px 2px 3px 2px; display: flex; flex-direction: row;">
                        <div style="display: flex; flex: 1;">
                            <Button>
                                RETURN
                            </Button>
                        </div>
                        <Button>
                            POS MONITOR
                        </Button>
                        <div style="flex: 1" />
                    </div>
                </div>
                {/* end page content */}
                {/* begin footer */}
                <div style="display: flex; border-top: 2px solid $display-mfd-dark-grey; padding: 5px;">
                    <Button>
                        CLEAR
                        <br />
                        INFO
                    </Button>
                </div>
                {/* end footer */}
            </>
        );
    }
}
