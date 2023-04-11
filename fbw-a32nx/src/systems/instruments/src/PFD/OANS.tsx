/* eslint-disable jsx-a11y/label-has-associated-control */

import 'instruments/src/PFD/MFD-common/common.scss';

import { Button } from 'instruments/src/PFD/MFD-common/Button';
import { IconButton } from 'instruments/src/PFD/MFD-common/IconButton';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/PFD/MFD-common/TopTabNavigator';

import { ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from 'msfssdk';

import { DropdownMenu } from 'instruments/src/PFD/MFD-common/DropdownMenu';
import { MFDSimvars } from './shared/MFDSimvarPublisher';

export interface OANSProps extends ComponentProps {
    bus: EventBus;
}

export class OANS extends DisplayComponent<OANSProps> {
    private testSubject = Subject.create(0);

    private oansMenuRef = FSComponent.createRef<HTMLDivElement>();

    private buttonRef = FSComponent.createRef<HTMLDivElement>();

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
                <IconButton icon="double-up" containerStyle="width: 49px; height: 45px; position: absolute; right: 2px; top: calc(65% + 54px);" />
                <div ref={this.oansMenuRef} style="display: flex; height: 30%; cursor: crosshair;">
                    <TopTabNavigator
                        pageTitles={Subject.create(['MAP DATA', 'ARPT SEL', 'STATUS'])}
                        selectedPageIndex={this.testSubject}
                        tabBarHeight={45}
                        tabBarSlantedEdgeAngle={25}
                        selectedTabTextColor="cyan"
                        additionalRightSpace={50}
                    >
                        <TopTabNavigatorPage>
                            <div style="flex: 1; display: flex; flex-direction: row; height: 100%;">
                                <div style="flex: 3; display: flex: flex-direction: column; justify-content: stretch;">
                                    <DropdownMenu values={Subject.create(['CE', 'AB', '14L'])} selectedIndex={Subject.create(0)} />
                                    <div style="padding-top: 20px; margin-top: 2px; border-right: 2px solid lightgrey; height: 100%;">
                                        <label class="container">
                                            RWY
                                            <input type="checkbox" checked="checked" />
                                            <span class="checkmark" />
                                        </label>
                                        <label class="container">
                                            TWY
                                            <input type="checkbox" />
                                            <span class="checkmark" />
                                        </label>
                                        <label class="container">
                                            STAND
                                            <input type="checkbox" />
                                            <span class="checkmark" />
                                        </label>
                                        <label class="container">
                                            OTHER
                                            <input type="checkbox" />
                                            <span class="checkmark" />
                                        </label>
                                    </div>
                                </div>
                                <div style="flex: 8; display: flex; flex-direction: column;">
                                    <div style="display: flex; flex-direction: row; justify-content: space-between; margin: 10px;">
                                        <Button containerStyle="flex: 1">ADD CROSS</Button>
                                        <Button containerStyle="flex: 1; margin-left: 10px; margin-right: 10px">ADD FLAG</Button>
                                        <Button containerStyle="flex: 1">LDG SHIFT</Button>
                                    </div>
                                    <div style="display: flex; flex-direction: row; justify-content: center; margin: 10px; ">
                                        <Button containerStyle="width: 65%">CENTER MAP ON CE</Button>
                                    </div>
                                </div>
                            </div>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            <span style="color: white; font-size: 60px;">ARPT SEL</span>
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
                                    <Button containerStyle="padding: 20px 30px 20px 30px;">SWAP</Button>
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
