/* eslint-disable jsx-a11y/label-has-associated-control */

import './style.scss';

import { SysSelectorDropdownMenu } from 'instruments/src/PFD/MFD-common/SysSelectorDropdownMenu';
import { NumberInputField } from 'instruments/src/PFD/MFD-common/NumberInputField';
import { DropdownMenu } from 'instruments/src/PFD/MFD-common/DropdownMenu';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/PFD/MFD-common/TopTabNavigator';

import { ClockEvents, ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from 'msfssdk';

import { Button } from 'instruments/src/PFD/MFD-common/Button';
import { PageSelectorDropdownMenu } from 'instruments/src/PFD/MFD-common/PageSelectorDropdownMenu';
import { ActivePageTitleBar } from 'instruments/src/PFD/MFD-common/ActivePageTitleBar';
import { DisplayUnit } from '../MsfsAvionicsCommon/displayUnit';
import { MFDSimvars } from './shared/MFDSimvarPublisher';

export const getDisplayIndex = () => {
    const url = document.getElementsByTagName('a32nx-pfd')[0].getAttribute('url');
    return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

interface MFDProps extends ComponentProps {
    bus: EventBus;
    instrument: BaseInstrument;
}

export class MFDComponent extends DisplayComponent<MFDProps> {
    private displayBrightness = Subject.create(0);

    private displayFailed = Subject.create(false);

    private displayPowered = Subject.create(false);

    private testSubject = Subject.create(0);

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const isCaptainSide = getDisplayIndex() === 1;

        const sub = this.props.bus.getSubscriber<ClockEvents & MFDSimvars>();

        sub.on(isCaptainSide ? 'potentiometerCaptain' : 'potentiometerFo').whenChanged().handle((value) => {
            this.displayBrightness.set(value);

            if (this.displayBrightness.get() > 0 && this.displayBrightness.get() < 0.3) {
                this.testSubject.set(0);
            } else if (this.displayBrightness.get() >= 0.3 && this.displayBrightness.get() < 0.7) {
                this.testSubject.set(1);
            } else {
                this.testSubject.set(2);
            }
        });

        sub.on(isCaptainSide ? 'elec' : 'elecFo').whenChanged().handle((value) => {
            this.displayPowered.set(value === 1);
        });
    }

    render(): VNode {
        return (
            <DisplayUnit
                failed={this.displayFailed}
                bus={this.props.bus}
                powered={this.displayPowered}
                brightness={this.displayBrightness}
                normDmc={getDisplayIndex()}
            >
                <div class="mfd-main">
                    {/* begin header */}
                    <div style="display: flex; flex-direction: row;">
                        <SysSelectorDropdownMenu values={Subject.create(['FMS 1', 'ATCCOM', 'SURV'])} selectedIndex={Subject.create(0)} />
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
                                <NumberInputField value={Subject.create(350)} emptyValueString="---" unitLeading={Subject.create('FL')} />
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
                        <TopTabNavigator pageTitles={Subject.create(['T.O', 'CLB', 'CRZ', 'DES', 'APPR', 'GA'])} selectedPageIndex={this.testSubject}>
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
                                            <NumberInputField value={Subject.create(135)} emptyValueString="---" unitTrailing={Subject.create('KT')} />
                                        </div>
                                        <div class="MFDLabelValueContainer">
                                            <span class="MFDLabel spacingRight">F</span>
                                            <span class="MFDGreenValue">169</span>
                                            <span class="MFDUnitLabel trailingUnit">KT</span>
                                        </div>
                                        <div class="MFDLabelValueContainer">
                                            <span class="MFDLabel spacingRight">VR</span>
                                            <NumberInputField value={Subject.create(140)} emptyValueString="---" unitTrailing={Subject.create('KT')} />
                                        </div>
                                        <div class="MFDLabelValueContainer">
                                            <span class="MFDLabel spacingRight">S</span>
                                            <span class="MFDGreenValue">220</span>
                                            <span class="MFDUnitLabel trailingUnit">KT</span>
                                        </div>
                                        <div class="MFDLabelValueContainer">
                                            <span class="MFDLabel spacingRight">V2</span>
                                            <NumberInputField value={Subject.create(145)} emptyValueString="---" unitTrailing={Subject.create('KT')} />
                                        </div>
                                        <div class="MFDLabelValueContainer">
                                            <span class="MFDLabel spacingRight">O</span>
                                            <span class="MFDGreenValue">246</span>
                                            <span class="MFDUnitLabel trailingUnit">KT</span>
                                        </div>
                                    </div>
                                    <div style="flex: 4; display: flex; flex-direction: column; justify-items: center; justify-content: center; ">
                                        <label class="container">
                                            TOGA
                                            <input type="checkbox" checked="checked" />
                                            <span class="checkmark" />
                                        </label>
                                        <label class="container">
                                            FLEX
                                            <input type="checkbox" />
                                            <span class="checkmark" />
                                        </label>
                                        <label class="container">
                                            DERATED
                                            <input type="checkbox" />
                                            <span class="checkmark" />
                                        </label>
                                    </div>
                                </div>
                                <div style="margin: 15px 0px 15px 0px; display: flex; justify-content: space-between;">
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">FLAPS</span>
                                        <DropdownMenu values={Subject.create(['-', '1', '2', '3'])} selectedIndex={Subject.create(0)} />
                                    </div>
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">THS FOR</span>
                                        <NumberInputField value={Subject.create(39.0)} emptyValueString="--.-" unitTrailing={Subject.create('%')} />
                                    </div>
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">T.O SHIFT</span>
                                        <NumberInputField value={Subject.create(undefined)} emptyValueString="----" unitTrailing={Subject.create('M')} />
                                    </div>
                                </div>
                                <div style="display: grid; grid-template-columns: auto auto; justify-content: space-between; margin: 10px 80px 10px 80px;">
                                    <div class="MFDLabelValueContainer" style="justify-content: flex-end;">
                                        <span class="MFDLabel spacingRight">THR RED</span>
                                        <NumberInputField
                                            value={Subject.create(3000)}
                                            emptyValueString="----"
                                            unitTrailing={Subject.create('FT')}
                                            containerStyle="width: 125px; justify-content: flex-end;"
                                        />
                                    </div>
                                    <div class="MFDLabelValueContainer" />
                                    <div class="MFDLabelValueContainer" style="justify-content: flex-end;">
                                        <span class="MFDLabel spacingRight">ACCEL</span>
                                        <NumberInputField
                                            value={Subject.create(800)}
                                            emptyValueString="----"
                                            unitTrailing={Subject.create('FT')}
                                            containerStyle="width: 125px; justify-content: flex-end;"
                                        />
                                    </div>
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">EO ACCEL</span>
                                        <NumberInputField
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
                                        <NumberInputField
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
                </div>
            </DisplayUnit>
        );
    }
}
