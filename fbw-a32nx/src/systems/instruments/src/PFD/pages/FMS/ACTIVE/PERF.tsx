/* eslint-disable jsx-a11y/label-has-associated-control */

import { DropdownMenu } from 'instruments/src/PFD/MFD-common/DropdownMenu';
import { NumberInput } from 'instruments/src/PFD/MFD-common/NumberInput';

import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/PFD/MFD-common/TopTabNavigator';

import { ArraySubject, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import { Button } from 'instruments/src/PFD/MFD-common/Button';
import { ActivePageTitleBar } from 'instruments/src/PFD/MFD-common/ActivePageTitleBar';
import { RadioButtonGroup } from 'instruments/src/PFD/MFD-common/RadioButtonGroup';
import { MfdComponentProps } from 'instruments/src/PFD/MFD';
import { Footer } from 'instruments/src/PFD/MFD-common/Footer';

interface MfdFmsActivePerfProps extends MfdComponentProps {
}

export class MfdFmsActivePerf extends DisplayComponent<MfdFmsActivePerfProps> {
    private sysSelectorSelectedIndex = Subject.create(0);

    private flightPhasesSelectedPageIndex = Subject.create(0);

    private selectedThrustSettingIndex = Subject.create(0);

    private selectedFlapsIndex = Subject.create(0);

    private selectedPacksIndex = Subject.create(0);

    private selectedAntiIceIndex = Subject.create(0);

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);
    }

    render(): VNode {
        return (
            <>
                <ActivePageTitleBar activePage="ACTIVE/PERF" tmpyIsActive={Subject.create(false)} />
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
                            <div style="height: 100%; flex: 1; display: flex; justify-content: space-between;">
                                <div class="MFDLabelValueContainer" style="padding: 15px;">
                                    <span class="MFDLabel spacingRight">RWY</span>
                                    <span class="MFDGreenValue">14L</span>
                                </div>
                                <div class="MFDLabelValueContainer">
                                    <span class="MFDLabel spacingRight">T.O SHIFT</span>
                                    <NumberInput value={Subject.create(undefined)} emptyValueString="----" unitTrailing={Subject.create('M')} />
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
                            <div style="display: grid; grid-template-columns: 17% 20% 30% 30%; margin-top: 20px;">
                                <div><span class="MFDLabel">FLAPS</span></div>
                                <div><span class="MFDLabel">THS FOR</span></div>
                                <div><span class="MFDLabel">PACKS</span></div>
                                <div><span class="MFDLabel">ANTI ICE</span></div>
                                <div style="margin-top: 15px;">
                                    <DropdownMenu
                                        values={ArraySubject.create(['-', '1', '2', '3'])}
                                        selectedIndex={this.selectedFlapsIndex}
                                        idPrefix="flapDropdown"
                                        onChangeCallback={(val) => this.selectedFlapsIndex.set(val)}
                                        containerStyle="width: 75px;"
                                    />
                                </div>
                                <div style="width: 120px; margin-right: 15px; margin-top: 15px;">
                                    <NumberInput value={Subject.create(39.0)} emptyValueString="--.-" unitTrailing={Subject.create('%')} />
                                </div>
                                <div style="margin-right: 15px; margin-top: 15px;">
                                    <DropdownMenu
                                        values={ArraySubject.create(['ON', 'OFF'])}
                                        selectedIndex={this.selectedPacksIndex}
                                        idPrefix="packsDropdown"
                                        onChangeCallback={(val) => this.selectedPacksIndex.set(val)}
                                    />
                                </div>
                                <div style="margin-top: 15px;">
                                    <DropdownMenu
                                        values={ArraySubject.create(['ON', 'OFF'])}
                                        selectedIndex={this.selectedAntiIceIndex}
                                        idPrefix="antiIceDropdown"
                                        onChangeCallback={(val) => this.selectedAntiIceIndex.set(val)}
                                    />
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: auto auto; margin: 30px 60px 30px 0px; width: 45%;">
                                <div style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px;"><span class="MFDLabel">THR RED</span></div>
                                <div style="margin-bottom: 15px;">
                                    <NumberInput
                                        value={Subject.create(3000)}
                                        emptyValueString="----"
                                        unitTrailing={Subject.create('FT')}
                                        containerStyle="width: 150px; justify-content: flex-end;"
                                    />
                                </div>
                                <div style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px;"><span class="MFDLabel">ACCEL</span></div>
                                <div style="margin-bottom: 15px;">
                                    <NumberInput
                                        value={Subject.create(800)}
                                        emptyValueString="----"
                                        unitTrailing={Subject.create('FT')}
                                        containerStyle="width: 150px; justify-content: flex-end;"
                                    />
                                </div>
                                <div />
                                <div style="display: flex; flex: 1;">
                                    <Button onClick={() => console.log('NOISE')}>
                                        NOISE
                                    </Button>
                                </div>
                            </div>
                            <div style="flex-grow: 1;" />
                            {/* fill space vertically */}
                            <div style="margin: 20px 2px 3px 2px; display: flex; flex-direction: row; margin-top: 50px;">
                                <div class="MFDLabelValueContainer">
                                    <span class="MFDLabel spacingRight">TRANS</span>
                                    <NumberInput
                                        value={Subject.create(5000)}
                                        emptyValueString="----"
                                        unitTrailing={Subject.create('FT')}
                                        containerStyle="width: 170px; justify-content: flex-end;"
                                    />
                                </div>
                                <div class="MFDLabelValueContainer">
                                    <span class="MFDLabel spacingRight">EO ACCEL</span>
                                    <NumberInput
                                        value={Subject.create(1990)}
                                        emptyValueString="----"
                                        unitTrailing={Subject.create('FT')}
                                        containerStyle="width: 150px; justify-content: flex-end;"
                                    />
                                </div>
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
                            <Button onClick={() => console.log('RETURN')}>
                                RETURN
                            </Button>
                        </div>
                        <Button onClick={() => console.log('POS MONITOR')}>
                            POS MONITOR
                        </Button>
                        <div style="flex: 1" />
                    </div>
                </div>
                {/* end page content */}
                <Footer bus={this.props.bus} active={this.props.active} navigateTo={this.props.navigateTo} />
            </>
        );
    }
}
