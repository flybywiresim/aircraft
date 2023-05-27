/* eslint-disable jsx-a11y/label-has-associated-control */

import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { NumberInput } from 'instruments/src/MFD/pages/common/NumberInput';

import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';

import { ArraySubject, DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import { Button } from 'instruments/src/MFD/pages/common/Button';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { RadioButtonGroup } from 'instruments/src/MFD/pages/common/RadioButtonGroup';
import { MfdComponentProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

interface MfdFmsActivePerfProps extends MfdComponentProps {
}

export class MfdFmsActivePerf extends DisplayComponent<MfdFmsActivePerfProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    // Subjects

    private activePageTitle = Subject.create<string>('');

    private flightPhasesSelectedPageIndex = Subject.create(0);

    private selectedThrustSettingIndex = Subject.create(0);

    private selectedDeratedIndex = Subject.create(0);

    private selectedFlapsIndex = Subject.create(0);

    private selectedPacksIndex = Subject.create(1);

    private selectedAntiIceIndex = Subject.create(0);

    // Refs
    private flexInputRef = FSComponent.createRef<HTMLDivElement>();

    private deratedInputRef = FSComponent.createRef<HTMLDivElement>();

    private noiseFieldsRefs = [FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>()];

    private noiseButtonRef = FSComponent.createRef<HTMLDivElement>();

    private noiseEndLabelRef = FSComponent.createRef<HTMLSpanElement>();

    private noiseEndInputRef = FSComponent.createRef<HTMLDivElement>();

    private thrustSettingChanged(newIndex: number) {
        this.selectedThrustSettingIndex.set(newIndex);

        if (newIndex === 1) {
            // FLEX
            this.flexInputRef.instance.style.visibility = 'visible';
            this.deratedInputRef.instance.style.visibility = 'hidden';
        } else if (newIndex === 2) {
            // DERATED
            this.flexInputRef.instance.style.visibility = 'hidden';
            this.deratedInputRef.instance.style.visibility = 'visible';
        } else {
            // FLEX
            this.flexInputRef.instance.style.visibility = 'hidden';
            this.deratedInputRef.instance.style.visibility = 'hidden';
        }
    }

    private showNoiseFields(visible: boolean) {
        if (visible === true) {
            this.noiseButtonRef.instance.style.display = 'none';
            this.noiseEndLabelRef.instance.style.display = 'flex';
            this.noiseEndInputRef.instance.style.display = 'flex';
            this.noiseFieldsRefs.forEach((el) => {
                el.instance.style.visibility = 'visible';
            });
        } else {
            this.noiseButtonRef.instance.style.display = 'flex';
            this.noiseEndLabelRef.instance.style.display = 'none';
            this.noiseEndInputRef.instance.style.display = 'none';
            this.noiseFieldsRefs.forEach((el) => {
                el.instance.style.visibility = 'hidden';
            });
        }
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        // Initialized hidden/visible states
        this.thrustSettingChanged(0);
        this.showNoiseFields(false);

        this.subs.push(this.props.activeUri.sub((val) => {
            switch (val.category) {
            case 'active':
                this.activePageTitle.set('ACTIVE/PERF');
                break;
            case 'sec1':
                this.activePageTitle.set('SEC1/PERF');
                break;
            case 'sec2':
                this.activePageTitle.set('SEC2/PERF');
                break;
            case 'sec3':
                this.activePageTitle.set('SEC3/PERF');
                break;

            default:
                this.activePageTitle.set('ACTIVE/PERF');
                break;
            }
        }, true));

        // If extra parameter for activeUri is given, navigate to flight phase sub-page
        switch (this.props.activeUri.get().extra) {
        case 'to':
            this.flightPhasesSelectedPageIndex.set(0);
            break;
        case 'clb':
            this.flightPhasesSelectedPageIndex.set(1);
            break;
        case 'crz':
            this.flightPhasesSelectedPageIndex.set(2);
            break;
        case 'des':
            this.flightPhasesSelectedPageIndex.set(3);
            break;
        case 'appr':
            this.flightPhasesSelectedPageIndex.set(4);
            break;
        case 'ga':
            this.flightPhasesSelectedPageIndex.set(5);
            break;

        default:
            break;
        }
    }

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    render(): VNode {
        return (
            <>
                <ActivePageTitleBar activePage={this.activePageTitle} offset={Subject.create('5L')} eoIsActive={Subject.create(true)} tmpyIsActive={Subject.create(true)} />
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
                            <div style="height: 100%; flex: 1; display: flex; justify-content: space-between; border-bottom: 1px solid lightgrey;">
                                <div class="MFDLabelValueContainer" style="padding: 15px;">
                                    <span class="MFDLabel spacingRight">RWY</span>
                                    <span class="MFDGreenValue">14L</span>
                                </div>
                                <div class="MFDLabelValueContainer">
                                    <span class="MFDLabel spacingRight">T.O SHIFT</span>
                                    <NumberInput value={Subject.create(undefined)} emptyValueString="----" unitTrailing={Subject.create('M')} />
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: row; border-bottom: 1px solid lightgrey; padding-bottom: 10px;">
                                <div style="flex: 5; display: grid; grid-template-columns: auto auto;
                                justify-content: space-between; border-right: 1px solid lightgrey; padding-top: 10px; margin-top: 5px; padding-right: 20px"
                                >
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">V1</span>
                                        <NumberInput value={Subject.create(135)} emptyValueString="---" unitTrailing={Subject.create('KT')} />
                                    </div>
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">F</span>
                                        <span class="MFDGreenValue">216</span>
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
                                <div style="flex: 3; display: flex; flex-direction: column; justify-items: center; justify-content: center; ">
                                    <span style="width: 175px; display: inline; margin-left: 15px;">
                                        <RadioButtonGroup
                                            values={ArraySubject.create(['TOGA', 'FLEX', 'DERATED'])}
                                            selectedIndex={this.selectedThrustSettingIndex}
                                            idPrefix="thrustSettingRadio"
                                            onChangeCallback={(num) => this.thrustSettingChanged(num)}
                                            additionalVerticalSpacing={15}
                                        />
                                    </span>
                                </div>
                                <div style="flex: 1; display: flex; flex-direction: column; justify-items: center; justify-content: center; ">
                                    <div class="MFDLabelValueContainer" style="margin-top: 60px;" ref={this.flexInputRef}>
                                        <NumberInput value={Subject.create(undefined)} emptyValueString="---" unitTrailing={Subject.create('°C')} />
                                    </div>
                                    <div style="margin-top: 0px" ref={this.deratedInputRef}>
                                        <DropdownMenu
                                            values={ArraySubject.create(['D01', 'D02', 'D03', 'D04'])}
                                            selectedIndex={this.selectedDeratedIndex}
                                            idPrefix="deratedDropdown"
                                            onChangeCallback={(val) => this.selectedDeratedIndex.set(val)}
                                            containerStyle="width: 100px;"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 17% 19% 1% 30% 30%; margin-top: 10px; padding-bottom: 15px; border-bottom: 1px solid lightgrey;">
                                <div><span class="MFDLabel">FLAPS</span></div>
                                <div><span class="MFDLabel">THS FOR</span></div>
                                <div style="grid-row-start: span 2; border-left: 1px solid lightgrey;" />
                                <div><span class="MFDLabel">PACKS</span></div>
                                <div><span class="MFDLabel">ANTI ICE</span></div>
                                <div style="margin-top: 15px;">
                                    <DropdownMenu
                                        values={ArraySubject.create(['1', '2', '3'])}
                                        selectedIndex={this.selectedFlapsIndex}
                                        idPrefix="flapDropdown"
                                        onChangeCallback={(val) => this.selectedFlapsIndex.set(val)}
                                        containerStyle="width: 75px;"
                                    />
                                </div>
                                <div style="width: 120px; margin-top: 15px; background-color: yellow; justify-self: center; align-self: center;">
                                    <NumberInput value={Subject.create(39.0)} emptyValueString="--.-" unitTrailing={Subject.create('%')} />
                                </div>
                                <div style="margin-right: 15px; margin-top: 15px;">
                                    <DropdownMenu
                                        values={ArraySubject.create(['OFF/APU', 'ON'])}
                                        selectedIndex={this.selectedPacksIndex}
                                        idPrefix="packsDropdown"
                                        onChangeCallback={(val) => this.selectedPacksIndex.set(val)}
                                    />
                                </div>
                                <div style="margin-top: 15px;">
                                    <DropdownMenu
                                        values={ArraySubject.create(['OFF', 'ENG ONLY', 'ENG + WING'])}
                                        selectedIndex={this.selectedAntiIceIndex}
                                        idPrefix="antiIceDropdown"
                                        onChangeCallback={(val) => this.selectedAntiIceIndex.set(val)}
                                    />
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: auto auto auto auto auto; grid-auto-rows: 50px; margin: 20px 60px 30px 0px; height: 150px;">
                                <div style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px; width: 125px;">
                                    <span class="MFDLabel">THR RED</span>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <NumberInput
                                        value={Subject.create(3000)}
                                        emptyValueString="----"
                                        unitTrailing={Subject.create('FT')}
                                        containerStyle="width: 150px; justify-content: flex-end;"
                                    />
                                </div>
                                <div>
                                    <div ref={this.noiseFieldsRefs[0]} style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px;">
                                        <svg fill="#ffffff" height="35px" width="35px" viewBox="0 0 60 60">
                                            <polygon points="0,28 50,28 50,20 60,30 50,40 50,32 0,32" />
                                        </svg>
                                        <span class="MFDLabel" style="width: 40px; margin-left: 10px; text-align: right">N1</span>
                                    </div>
                                </div>
                                <div>
                                    <div ref={this.noiseFieldsRefs[1]} style="margin-bottom: 15px;">
                                        <NumberInput
                                            value={Subject.create(82)}
                                            emptyValueString="--"
                                            unitTrailing={Subject.create('%')}
                                            containerStyle="width: 110px; justify-content: flex-end;"
                                        />
                                    </div>
                                </div>
                                <div style="grid-row-start: span 2;">
                                    <div ref={this.noiseFieldsRefs[2]} style=" display: flex; justify-content: center; align-items: center;">
                                        <Button onClick={() => this.showNoiseFields(false)}>
                                            CANCEL
                                            <br />
                                            NOISE
                                        </Button>
                                    </div>
                                </div>
                                <div style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px; width: 125px;">
                                    <span class="MFDLabel">ACCEL</span>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <NumberInput
                                        value={Subject.create(1300)}
                                        emptyValueString="----"
                                        unitTrailing={Subject.create('FT')}
                                        containerStyle="width: 150px; justify-content: flex-end;"
                                    />
                                </div>
                                <div>
                                    <div ref={this.noiseFieldsRefs[3]} style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px;">
                                        <svg fill="#ffffff" height="35px" width="35px" viewBox="0 0 60 60">
                                            <polygon points="0,28 50,28 50,20 60,30 50,40 50,32 0,32" />
                                        </svg>
                                        <span class="MFDLabel" style="width: 40px; margin-left: 10px; text-align: right">SPD</span>
                                    </div>
                                </div>
                                <div>
                                    <div ref={this.noiseFieldsRefs[4]} style="margin-bottom: 15px;">
                                        <NumberInput
                                            value={Subject.create(214)}
                                            emptyValueString="---"
                                            unitTrailing={Subject.create('KT')}
                                            containerStyle="width: 110px; justify-content: flex-end;"
                                        />
                                    </div>
                                </div>
                                <div style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px; width: 125px;">
                                    <span ref={this.noiseEndLabelRef} class="MFDLabel">NOISE END</span>
                                </div>
                                <div>
                                    <div ref={this.noiseButtonRef} style="display: flex;">
                                        <Button onClick={() => this.showNoiseFields(true)}>
                                            NOISE
                                        </Button>
                                    </div>
                                    <div ref={this.noiseEndInputRef}>
                                        <NumberInput
                                            value={Subject.create(800)}
                                            emptyValueString="----"
                                            unitTrailing={Subject.create('FT')}
                                            containerStyle="width: 150px; justify-content: flex-end;"
                                        />
                                    </div>
                                </div>
                                <div />
                                <div />
                            </div>
                            <div style="flex-grow: 1;" />
                            {/* fill space vertically */}
                            <div style="margin: 10px 2px 3px 2px; display: flex; flex-direction: row;justify-content: space-between; padding-top: 10px; border-top: 1px solid lightgrey;">
                                <div class="MFDLabelValueContainer">
                                    <span class="MFDLabel spacingRight">TRANS</span>
                                    <NumberInput
                                        value={Subject.create(5000)}
                                        emptyValueString="----"
                                        unitTrailing={Subject.create('FT')}
                                        containerStyle="width: 150px; justify-content: flex-end;"
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
                                <div>
                                    <Button onClick={() => console.log('CPNY T.O REQUEST')} containerStyle="padding-left: 30px; padding-right: 30px">
                                        CPNY T.O
                                        <br />
                                        REQUEST
                                    </Button>
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
                <Footer bus={this.props.bus} activeUri={this.props.activeUri} navigateTo={this.props.navigateTo} />
            </>
        );
    }
}
