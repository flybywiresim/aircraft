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

import './perf.scss';

interface MfdFmsActivePerfProps extends MfdComponentProps {
}

export class MfdFmsActivePerf extends DisplayComponent<MfdFmsActivePerfProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    // Subjects

    private activePageTitle = Subject.create<string>('');

    private flightPhasesSelectedPageIndex = Subject.create(0);

    private costIndex = Subject.create<number | undefined>(69);

    private transAlt = Subject.create(13000);

    private thrRedAlt = Subject.create<number | undefined>(1080);

    private accelAlt = Subject.create<number | undefined>(1080);

    private noiseEndAlt = Subject.create<number | undefined>(800);

    private showNoiseFields(visible: boolean) { // TODO for all phases
        if (visible === true) {
            // TO page
            this.toNoiseButtonRef.instance.style.display = 'none';
            this.toNoiseEndLabelRef.instance.style.display = 'flex';
            this.toNoiseEndInputRef.instance.style.display = 'flex';
            this.toNoiseFieldsRefs.forEach((el) => {
                el.instance.style.visibility = 'visible';
            });

            // CLB page
            this.clbNoiseButtonRef.instance.style.display = 'none';
            this.clbNoiseEndLabelRef.instance.style.display = 'flex';
            this.clbSpdLimLabelRef.instance.style.display = 'none';
            this.clbNoiseEndInputRef.instance.style.display = 'flex';
            this.clbSpdLimValueRef.instance.style.display = 'none';
            this.clbNoiseFieldsRefs.forEach((el) => {
                el.instance.style.visibility = 'visible';
            });
        } else {
            // TO page
            this.toNoiseButtonRef.instance.style.display = 'flex';
            this.toNoiseEndLabelRef.instance.style.display = 'none';
            this.toNoiseEndInputRef.instance.style.display = 'none';
            this.toNoiseFieldsRefs.forEach((el) => {
                el.instance.style.visibility = 'hidden';
            });

            // CLB page
            this.clbNoiseButtonRef.instance.style.display = 'flex';
            this.clbNoiseEndLabelRef.instance.style.display = 'none';
            this.clbSpdLimLabelRef.instance.style.display = 'flex';
            this.clbNoiseEndInputRef.instance.style.display = 'none';
            this.clbSpdLimValueRef.instance.style.display = 'flex';
            this.clbNoiseFieldsRefs.forEach((el) => {
                el.instance.style.visibility = 'hidden';
            });
        }
    }

    // TO page subjects, refs and methods
    private toSelectedThrustSettingIndex = Subject.create(0);

    private toSelectedDeratedIndex = Subject.create(0);

    private toSelectedFlapsIndex = Subject.create(0);

    private toSelectedPacksIndex = Subject.create(1);

    private toSelectedAntiIceIndex = Subject.create(0);

    private toFlexInputRef = FSComponent.createRef<HTMLDivElement>();

    private toDeratedInputRef = FSComponent.createRef<HTMLDivElement>();

    private toThrustSettingChanged(newIndex: number) {
        this.toSelectedThrustSettingIndex.set(newIndex);

        if (newIndex === 1) {
            // FLEX
            this.toFlexInputRef.instance.style.visibility = 'visible';
            this.toDeratedInputRef.instance.style.visibility = 'hidden';
        } else if (newIndex === 2) {
            // DERATED
            this.toFlexInputRef.instance.style.visibility = 'hidden';
            this.toDeratedInputRef.instance.style.visibility = 'visible';
        } else {
            // FLEX
            this.toFlexInputRef.instance.style.visibility = 'hidden';
            this.toDeratedInputRef.instance.style.visibility = 'hidden';
        }
    }

    private toNoiseFieldsRefs = [FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>()];

    private toNoiseButtonRef = FSComponent.createRef<HTMLDivElement>();

    private toNoiseEndLabelRef = FSComponent.createRef<HTMLSpanElement>();

    private toNoiseEndInputRef = FSComponent.createRef<HTMLDivElement>();

    // CLB page subjects, refs and methods
    private clbDeratedClbSelectedIndex = Subject.create(0);

    private clbPredictionsReference = Subject.create<number | undefined>(undefined);

    private clbPreSelSpdTarget = Subject.create<number | undefined>(undefined);

    private clbNoiseFieldsRefs = [FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>()];

    private clbNoiseButtonRef = FSComponent.createRef<HTMLDivElement>();

    private clbSpdLimLabelRef = FSComponent.createRef<HTMLSpanElement>();

    private clbNoiseEndLabelRef = FSComponent.createRef<HTMLSpanElement>();

    private clbSpdLimValueRef = FSComponent.createRef<HTMLDivElement>();

    private clbNoiseEndInputRef = FSComponent.createRef<HTMLDivElement>();

    // CRZ page subjects, refs and methods
    private crzPreSelSpdTarget = Subject.create<number | undefined>(undefined);

    private crzPreSelMachTarget = Subject.create<number | undefined>(undefined);

    // DES page subjects, refs and methods

    // APPR page subjects, refs and methods

    // GA page subjects, refs and methods

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        // Initialized hidden/visible states
        this.toThrustSettingChanged(0);
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
                            {/* T.O */}
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
                                            selectedIndex={this.toSelectedThrustSettingIndex}
                                            idPrefix="thrustSettingRadio"
                                            onChangeCallback={(num) => this.toThrustSettingChanged(num)}
                                            additionalVerticalSpacing={15}
                                        />
                                    </span>
                                </div>
                                <div style="flex: 1; display: flex; flex-direction: column; justify-items: center; justify-content: center; ">
                                    <div class="MFDLabelValueContainer" style="margin-top: 60px;" ref={this.toFlexInputRef}>
                                        <NumberInput value={Subject.create(undefined)} emptyValueString="---" unitTrailing={Subject.create('°C')} />
                                    </div>
                                    <div style="margin-top: 0px" ref={this.toDeratedInputRef}>
                                        <DropdownMenu
                                            values={ArraySubject.create(['D01', 'D02', 'D03', 'D04'])}
                                            selectedIndex={this.toSelectedDeratedIndex}
                                            idPrefix="deratedDropdown"
                                            onChangeCallback={(val) => this.toSelectedDeratedIndex.set(val)}
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
                                        selectedIndex={this.toSelectedFlapsIndex}
                                        idPrefix="flapDropdown"
                                        onChangeCallback={(val) => this.toSelectedFlapsIndex.set(val)}
                                        containerStyle="width: 75px;"
                                    />
                                </div>
                                <div style="width: 120px; margin-top: 15px; background-color: yellow; justify-self: center; align-self: center;">
                                    <NumberInput value={Subject.create(39.0)} emptyValueString="--.-" unitTrailing={Subject.create('%')} />
                                </div>
                                <div style="margin-right: 15px; margin-top: 15px;">
                                    <DropdownMenu
                                        values={ArraySubject.create(['OFF/APU', 'ON'])}
                                        selectedIndex={this.toSelectedPacksIndex}
                                        idPrefix="packsDropdown"
                                        onChangeCallback={(val) => this.toSelectedPacksIndex.set(val)}
                                    />
                                </div>
                                <div style="margin-top: 15px;">
                                    <DropdownMenu
                                        values={ArraySubject.create(['OFF', 'ENG ONLY', 'ENG + WING'])}
                                        selectedIndex={this.toSelectedAntiIceIndex}
                                        idPrefix="antiIceDropdown"
                                        onChangeCallback={(val) => this.toSelectedAntiIceIndex.set(val)}
                                    />
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: auto auto auto auto auto; grid-auto-rows: 50px; margin: 20px 20px 20px 0px; height: 150px;">
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
                                    <div ref={this.toNoiseFieldsRefs[0]} style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px;">
                                        <svg fill="#ffffff" height="35px" width="35px" viewBox="0 0 60 60">
                                            <polygon points="0,28 50,28 50,20 60,30 50,40 50,32 0,32" />
                                        </svg>
                                        <span class="MFDLabel" style="width: 40px; margin-left: 10px; text-align: right">N1</span>
                                    </div>
                                </div>
                                <div>
                                    <div ref={this.toNoiseFieldsRefs[1]} style="margin-bottom: 15px;">
                                        <NumberInput
                                            value={Subject.create(82)}
                                            emptyValueString="--"
                                            unitTrailing={Subject.create('%')}
                                            containerStyle="width: 110px; justify-content: flex-end;"
                                        />
                                    </div>
                                </div>
                                <div style="grid-row-start: span 2;">
                                    <div ref={this.toNoiseFieldsRefs[2]} style=" display: flex; justify-content: center; align-items: center;">
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
                                    <div ref={this.toNoiseFieldsRefs[3]} style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px;">
                                        <svg fill="#ffffff" height="35px" width="35px" viewBox="0 0 60 60">
                                            <polygon points="0,28 50,28 50,20 60,30 50,40 50,32 0,32" />
                                        </svg>
                                        <span class="MFDLabel" style="width: 40px; margin-left: 10px; text-align: right">SPD</span>
                                    </div>
                                </div>
                                <div>
                                    <div ref={this.toNoiseFieldsRefs[4]} style="margin-bottom: 15px;">
                                        <NumberInput
                                            value={Subject.create(214)}
                                            emptyValueString="---"
                                            unitTrailing={Subject.create('KT')}
                                            containerStyle="width: 110px; justify-content: flex-end;"
                                        />
                                    </div>
                                </div>
                                <div style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px; width: 125px;">
                                    <span ref={this.toNoiseEndLabelRef} class="MFDLabel">NOISE END</span>
                                </div>
                                <div>
                                    <div ref={this.toNoiseButtonRef} style="display: flex;">
                                        <Button onClick={() => this.showNoiseFields(true)}>
                                            NOISE
                                        </Button>
                                    </div>
                                    <div ref={this.toNoiseEndInputRef}>
                                        <NumberInput
                                            value={this.noiseEndAlt}
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
                                        value={this.transAlt}
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
                            {/* CLB */}
                            <div style="display: flex; justify-content: space-between;">
                                <div class="MFDLabelValueContainer" style="padding: 15px; margin-bottom: 15px;">
                                    <span class="MFDLabel spacingRight">CI</span>
                                    <NumberInput emptyValueString="--" value={this.costIndex} />
                                </div>
                                <div class="MFDLabelValueContainer">
                                    <span class="MFDLabel spacingRight">DERATED CLB</span>
                                    <DropdownMenu
                                        values={ArraySubject.create(['NONE', '01', '02', '03', '04', '05'])}
                                        selectedIndex={this.clbDeratedClbSelectedIndex}
                                        idPrefix="deratedClbDropdown"
                                        onChangeCallback={(val) => this.clbDeratedClbSelectedIndex.set(val)}
                                        containerStyle="width: 125px;"
                                    />
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 20% 22% 13% 45%">
                                <div class="spdTableCell" style="border-right: 1px solid lightgrey;">
                                    <div class="MFDLabel">MODE</div>
                                </div>
                                <div class="spdTableCell">
                                    <div class="MFDLabel">SPD</div>
                                </div>
                                <div class="spdTableCell">
                                    <div class="MFDLabel">MACH</div>
                                </div>
                                <div class="spdTableCell" style="flex-direction: row; justify-content: center; align-items: center;">
                                    <div class="MFDLabel">PRED TO </div>
                                    <NumberInput emptyValueString="---" value={this.clbPredictionsReference} containerStyle="width: 100px; margin-left: 15px;" />
                                </div>
                                <div class="spdPreselManagedTableCell" style="border-right: 1px solid lightgrey; justify-content: flex-end;">
                                    <div class="MFDLabel">PRESEL</div>
                                </div>
                                <div class="spdTableCell">
                                    <NumberInput emptyValueString="---" value={this.clbPreSelSpdTarget} unitTrailing={Subject.create('KT')} />
                                </div>
                                <div class="spdTableCell" />
                                <div class="spdTableCell" />
                                <div class="spdPreselManagedTableCell" style="border-right: 1px solid lightgrey; justify-content: flex-end;">
                                    <div class="MFDLabel green">MANAGED</div>
                                </div>
                                <div class="spdTableCell">
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDGreenValue">250</span>
                                        <span class="MFDUnitLabel trailingUnit">KT</span>
                                    </div>
                                </div>
                                <div class="spdTableCell" />
                                <div class="spdTableCell">
                                    <span class="MFDGreenValue">--:--   ----</span>
                                </div>
                                <div class="spdTableCell" style="border-right: 1px solid lightgrey; justify-content: flex-end; padding: 5px 15px 5px 15px;">
                                    <div class="MFDLabel">ECON</div>
                                </div>
                                <div class="spdTableCell" style="padding: 5px 15px 5px 15px;">
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDGreenValue">314</span>
                                        <span class="MFDUnitLabel trailingUnit">KT</span>
                                    </div>
                                </div>
                                <div class="spdTableCell" style="padding: 5px 15px 5px 15px;">
                                    <span class="MFDGreenValue">.82</span>
                                </div>
                                <div class="spdTableCell" style="padding: 5px 15px 5px 15px;" />
                                <div style="border-right: 1px solid lightgrey; height: 40px;" />
                                <div />
                                <div />
                                <div />
                            </div>
                            <div style="display: grid; grid-template-columns: auto auto auto auto auto; grid-auto-rows: 50px; margin: 20px 20px 20px 0px; height: 150px;">
                                <div style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px; width: 125px;">
                                    <span class="MFDLabel">THR RED</span>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <NumberInput
                                        value={this.thrRedAlt}
                                        emptyValueString="----"
                                        unitTrailing={Subject.create('FT')}
                                        containerStyle="width: 150px; justify-content: flex-end;"
                                    />
                                </div>
                                <div>
                                    <div ref={this.clbNoiseFieldsRefs[0]} style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px;">
                                        <svg fill="#ffffff" height="35px" width="35px" viewBox="0 0 60 60">
                                            <polygon points="0,28 50,28 50,20 60,30 50,40 50,32 0,32" />
                                        </svg>
                                        <span class="MFDLabel" style="width: 40px; margin-left: 10px; text-align: right">N1</span>
                                    </div>
                                </div>
                                <div>
                                    <div ref={this.clbNoiseFieldsRefs[1]} style="margin-bottom: 15px;">
                                        <NumberInput
                                            value={Subject.create(82)}
                                            emptyValueString="--"
                                            unitTrailing={Subject.create('%')}
                                            containerStyle="width: 110px; justify-content: flex-end;"
                                        />
                                    </div>
                                </div>
                                <div style="grid-row-start: span 2; display: flex; justify-content: center; align-items: center;">
                                    <div ref={this.clbNoiseFieldsRefs[2]} style=" display: flex; justify-content: center; align-items: center;">
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
                                        value={this.accelAlt}
                                        emptyValueString="----"
                                        unitTrailing={Subject.create('FT')}
                                        containerStyle="width: 150px; justify-content: flex-end;"
                                    />
                                </div>
                                <div>
                                    <div ref={this.clbNoiseFieldsRefs[3]} style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px;">
                                        <svg fill="#ffffff" height="35px" width="35px" viewBox="0 0 60 60">
                                            <polygon points="0,28 50,28 50,20 60,30 50,40 50,32 0,32" />
                                        </svg>
                                        <span class="MFDLabel" style="width: 40px; margin-left: 10px; text-align: right">SPD</span>
                                    </div>
                                </div>
                                <div>
                                    <div ref={this.clbNoiseFieldsRefs[4]} style="margin-bottom: 15px;">
                                        <NumberInput
                                            value={Subject.create(214)}
                                            emptyValueString="---"
                                            unitTrailing={Subject.create('KT')}
                                            containerStyle="width: 110px; justify-content: flex-end;"
                                        />
                                    </div>
                                </div>
                                <div style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px; width: 150px;">
                                    <span ref={this.clbSpdLimLabelRef} class="MFDLabel">CLB SPD LIM</span>
                                    <span ref={this.clbNoiseEndLabelRef} class="MFDLabel">NOISE END</span>
                                </div>
                                <div style="grid-row-start: span 2;">
                                    <div ref={this.clbSpdLimValueRef} style="display: flex; justify-content: flex-start; align-items: center;">
                                        <div class="MFDLabelValueContainer">
                                            <span class="MFDGreenValue">250</span>
                                            <span class="MFDUnitLabel trailingUnit">KT</span>
                                        </div>
                                        <span class="MFDGreenValue">/</span>
                                        <div class="MFDLabelValueContainer">
                                            <span class="MFDUnitLabel trailingUnit">FL</span>
                                            <span class="MFDGreenValue">100</span>

                                        </div>
                                    </div>
                                    <div ref={this.clbNoiseEndInputRef}>
                                        <NumberInput
                                            value={this.noiseEndAlt}
                                            emptyValueString="----"
                                            unitTrailing={Subject.create('FT')}
                                            containerStyle="width: 150px; justify-content: flex-end;"
                                        />
                                    </div>
                                </div>
                                <div />
                            </div>
                            <div style="flex-grow: 1;" />
                            {/* fill space vertically */}
                            <div style="margin: 5px 2px 3px 2px; display: flex; flex-direction: row; justify-content: flex-end; align-items: center;">
                                <div ref={this.clbNoiseButtonRef} style="display: flex;">
                                    <Button onClick={() => this.showNoiseFields(true)}>
                                        NOISE
                                    </Button>
                                </div>
                                <div class="MFDLabelValueContainer" style="margin-left: 50px;">
                                    <span class="MFDLabel spacingRight">TRANS</span>
                                    <NumberInput
                                        value={this.transAlt}
                                        emptyValueString="----"
                                        unitTrailing={Subject.create('FT')}
                                        containerStyle="width: 150px; justify-content: flex-end;"
                                    />
                                </div>
                                <div>
                                    <Button onClick={() => this.props.navigateTo('fms/active/f-pln/vert-rev')}>
                                        SPD CSTR
                                    </Button>
                                </div>
                            </div>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            {/* CRZ */}
                            <div style="display: flex; justify-content: space-between;">
                                <div class="MFDLabelValueContainer" style="padding: 15px;">
                                    <span class="MFDLabel spacingRight">CI</span>
                                    <NumberInput emptyValueString="--" value={this.costIndex} />
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 20% 13% 22% 45%">
                                <div class="spdTableCell" style="border-right: 1px solid lightgrey;">
                                    <div class="MFDLabel">MODE</div>
                                </div>
                                <div class="spdTableCell">
                                    <div class="MFDLabel">MACH</div>
                                </div>
                                <div class="spdTableCell">
                                    <div class="MFDLabel">SPD</div>
                                </div>
                                <div class="spdTableCell" style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                                    <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                                        <div class="MFDLabel spacingRight">AT</div>
                                        <div class="MFDGreenValue bigger">TOKMA</div>
                                    </div>
                                    <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                                        <div class="MFDLabel spacingRight">STEP TO</div>
                                        <div class="MFDLabelValueContainer">
                                            <span class="MFDUnitLabel leadingUnit">FL</span>
                                            <span class="MFDGreenValue bigger">360</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="spdPreselManagedTableCell" style="border-right: 1px solid lightgrey; justify-content: flex-end;">
                                    <div class="MFDLabel">PRESEL</div>
                                </div>
                                <div class="spdTableCell">
                                    <NumberInput emptyValueString=".--" value={this.crzPreSelMachTarget} />
                                </div>
                                <div class="spdTableCell">
                                    <NumberInput emptyValueString="---" value={this.crzPreSelSpdTarget} unitTrailing={Subject.create('KT')} />
                                </div>
                                <div class="spdTableCell" />
                                <div class="spdPreselManagedTableCell" style="border-right: 1px solid lightgrey; justify-content: flex-end;">
                                    <div class="MFDLabel green">MANAGED</div>
                                </div>
                                <div class="spdTableCell">
                                    <span class="MFDGreenValue">.82</span>
                                </div>
                                <div class="spdTableCell">
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDGreenValue">---</span>
                                        <span class="MFDUnitLabel trailingUnit"> </span>
                                    </div>
                                </div>
                                <div class="spdTableCell">
                                    <span class="MFDGreenValue">00:45   298</span>
                                    <span class="MFDUnitLabel trailingUnit">NM</span>
                                </div>
                                <div class="spdTableCell" style="border-right: 1px solid lightgrey; justify-content: flex-end; padding: 5px 15px 5px 15px;">
                                    <div class="MFDLabel">ECON</div>
                                </div>
                                <div class="spdTableCell" style="padding: 5px 15px 5px 15px;">
                                    <span class="MFDGreenValue">.82</span>
                                </div>
                                <div class="spdTableCell" style="padding: 5px 15px 5px 15px;">
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDGreenValue">314</span>
                                        <span class="MFDUnitLabel trailingUnit">KT</span>
                                    </div>
                                </div>
                                <div class="spdTableCell" style="padding: 5px 15px 5px 15px;" />
                                <div class="spdTableCell" style="border-right: 1px solid lightgrey; border-bottom: none; justify-content: flex-end; padding: 5px;">
                                    <div class="MFDLabel">LRC</div>
                                </div>
                                <div class="spdTableCell" style="border-bottom: none; padding: 5px;">
                                    <span class="MFDGreenValue">.84</span>
                                </div>
                                <div class="spdTableCell" style="border-bottom: none; padding: 5px;">
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDGreenValue">---</span>
                                        <span class="MFDUnitLabel trailingUnit"> </span>
                                    </div>
                                </div>
                                <div />
                                <div class="spdTableCell" style="border-right: 1px solid lightgrey; border-bottom: none; justify-content: flex-end; padding: 5px;">
                                    <div class="MFDLabel">MAX TURB</div>
                                </div>
                                <div class="spdTableCell" style="border-bottom: none; padding: 5px;">
                                    <span class="MFDGreenValue">.85</span>
                                </div>
                                <div class="spdTableCell" style="border-bottom: none; padding: 5px;">
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDGreenValue">---</span>
                                        <span class="MFDUnitLabel trailingUnit"> </span>
                                    </div>
                                </div>
                                <div />
                            </div>
                            <div style="flex-grow: 1;" />
                            {/* fill space vertically */}
                            <div style="margin: 10px 2px 3px 2px; display: flex; flex-direction: row; justify-content: space-between; align-items: center; padding-top: 10px;">
                                <span class="MFDLabel bigger">DEST</span>
                                <span class="MFDLabel green bigger">LFPG</span>
                                <span class="MFDLabel green bigger">06:38</span>
                                <div class="MFDLabelValueContainer">
                                    <span class="MFDGreenValue">15.3</span>
                                    <span class="MFDUnitLabel trailingUnit">T</span>
                                </div>
                                <div style="display: flex; flex-direction: row;">
                                    <Button onClick={() => console.log('CMS')} containerStyle="margin-right: 10px;">
                                        CMS
                                    </Button>
                                    <Button onClick={() => this.props.navigateTo('fms/active/f-pln/vert-rev')}>
                                        STEP ALTs
                                    </Button>
                                </div>
                            </div>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            {/* DES */}
                            <span style="color: white; font-size: 60px;">DES</span>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            {/* APPR */}
                            <span style="color: white; font-size: 60px;">APPR</span>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            {/* GA */}
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
