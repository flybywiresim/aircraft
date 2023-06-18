/* eslint-disable jsx-a11y/label-has-associated-control */

import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';

import { ArraySubject, DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import { Button } from 'instruments/src/MFD/pages/common/Button';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { RadioButtonGroup } from 'instruments/src/MFD/pages/common/RadioButtonGroup';
import { MfdComponentProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import './perf.scss';
import {
    AltitudeFormat,
    AltitudeOrFlightLevelFormat,
    CostIndexFormat,
    DescentRateFormat,
    FlightLevelFormat,
    LengthFormat,
    PercentageFormat,
    QnhFormat,
    SpeedKnotsFormat,
    SpeedMachFormat,
    TemperatureFormat,
    WindDirectionFormat,
    WindSpeedFormat,
} from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Mmo, Vmo, maxCertifiedAlt } from 'shared/constants';

interface MfdFmsActivePerfProps extends MfdComponentProps {
}

export class MfdFmsActivePerf extends DisplayComponent<MfdFmsActivePerfProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    // Subjects
    private crzFl = Subject.create<number>(35000);

    private activePageTitle = Subject.create<string>('');

    private flightPhasesSelectedPageIndex = Subject.create(0);

    private costIndex = Subject.create<number>(69);

    private transAlt = Subject.create(5000);

    private thrRedAlt = Subject.create<number>(1080);

    private accelAlt = Subject.create<number>(1080);

    private noiseEndAlt = Subject.create<number>(800);

    private noiseN1 = Subject.create<number>(null);

    private noiseSpd = Subject.create<number>(null);

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
    private toShift = Subject.create<number>(null);

    private toV1 = Subject.create<number>(null);

    private toVR = Subject.create<number>(null);

    private toV2 = Subject.create<number>(null);

    private toSelectedThrustSettingIndex = Subject.create(0);

    private toFlexTemp = Subject.create<number>(null);

    private toSelectedDeratedIndex = Subject.create(0);

    private toSelectedFlapsIndex = Subject.create(0);

    private toThsFor = Subject.create<number>(null);

    private toSelectedPacksIndex = Subject.create(1);

    private toSelectedAntiIceIndex = Subject.create(0);

    private eoAccelAlt = Subject.create(13000);

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
            // TOGA
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

    private clbPredictionsReference = Subject.create<number>(null);

    private clbPreSelSpdTarget = Subject.create<number>(null);

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
    private crzPreSelSpdTarget = Subject.create<number>(230);

    private crzPreSelMachTarget = Subject.create<number>(0.59);

    // DES page subjects, refs and methods
    private desCabinDesRate = Subject.create<number>(-850);

    private desManagedSpdTarget = Subject.create<number>(276);

    private desManagedMachTarget = Subject.create<number>(0.84);

    private desPredictionsReference = Subject.create<number>(null);

    private transFl = Subject.create<number>(5000);

    // APPR page subjects, refs and methods
    private apprMag = Subject.create<number>(null);

    private apprWind = Subject.create<number>(null);

    private apprOat = Subject.create<number>(null);

    private apprQnh = Subject.create<number>(null);

    private apprMinimumBaro = Subject.create<number>(null);

    private apprMinimumRadio = Subject.create<number>(null);

    private apprSelectedFlapsIndex = Subject.create<number>(1);

    private apprVapp = Subject.create<number>(134);

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
                            <InputField<number>
                                dataEntryFormat={new FlightLevelFormat()}
                                isMandatory={Subject.create(false)}
                                value={this.crzFl}
                            />
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
                                    <InputField<number>
                                        dataEntryFormat={new LengthFormat(Subject.create(1), Subject.create(4000))} // TODO replace 4000 with length of RWY
                                        isMandatory={Subject.create(false)}
                                        value={this.toShift}
                                    />
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: row; border-bottom: 1px solid lightgrey; padding-bottom: 10px;">
                                <div style="flex: 5; display: grid; grid-template-columns: auto auto;
                                justify-content: space-between; border-right: 1px solid lightgrey; padding-top: 10px; margin-top: 5px; padding-right: 20px"
                                >
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">V1</span>
                                        <InputField<number>
                                            dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                            isMandatory={Subject.create(true)}
                                            value={this.toV1}
                                        />
                                    </div>
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">F</span>
                                        <span class="MFDGreenValue">216</span>
                                        <span class="MFDUnitLabel trailingUnit">KT</span>
                                    </div>
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">VR</span>
                                        <InputField<number>
                                            dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                            isMandatory={Subject.create(true)}
                                            value={this.toVR}
                                        />
                                    </div>
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">S</span>
                                        <span class="MFDGreenValue">220</span>
                                        <span class="MFDUnitLabel trailingUnit">KT</span>
                                    </div>
                                    <div class="MFDLabelValueContainer">
                                        <span class="MFDLabel spacingRight">V2</span>
                                        <InputField<number>
                                            dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                            isMandatory={Subject.create(true)}
                                            value={this.toV2}
                                        />
                                    </div>
                                    <div class="MFDLabelValueContainer">
                                        <span style="margin-right: 15px; justify-content: center;">
                                            <svg width="13" height="13" viewBox="0 0 13 13"><circle cx="6" cy="6" r="5" stroke="#00ff00" stroke-width="2" /></svg>
                                        </span>
                                        <span class="MFDGreenValue">246</span>
                                        <span class="MFDUnitLabel trailingUnit">KT</span>
                                    </div>
                                </div>
                                <div style="flex: 3; display: flex; flex-direction: column; justify-items: center; justify-content: center; ">
                                    <span style="width: 175px; display: inline; margin-left: 15px;">
                                        <RadioButtonGroup
                                            values={ArraySubject.create(['TOGA', 'FLEX', 'DERATED'])}
                                            onModified={(val) => this.toThrustSettingChanged(val)}
                                            selectedIndex={this.toSelectedThrustSettingIndex}
                                            idPrefix="thrustSettingRadio"
                                            additionalVerticalSpacing={15}
                                        />
                                    </span>
                                </div>
                                <div style="flex: 1; display: flex; flex-direction: column; justify-items: center; justify-content: center; ">
                                    <div class="MFDLabelValueContainer" style="margin-top: 60px;" ref={this.toFlexInputRef}>
                                        <InputField<number>
                                            dataEntryFormat={new TemperatureFormat(Subject.create(0), Subject.create(99))}
                                            isMandatory={Subject.create(false)}
                                            value={this.toFlexTemp}
                                        />
                                    </div>
                                    <div style="margin-top: 0px" ref={this.toDeratedInputRef}>
                                        <DropdownMenu
                                            values={ArraySubject.create(['D01', 'D02', 'D03', 'D04'])}
                                            selectedIndex={this.toSelectedDeratedIndex}
                                            onModified={(val) => console.log(val)}
                                            idPrefix="deratedDropdown"
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
                                        containerStyle="width: 75px;"
                                    />
                                </div>
                                <div style="width: 120px; margin-top: 15px; background-color: yellow; justify-self: center; align-self: center;">
                                    <InputField<number>
                                        dataEntryFormat={new PercentageFormat(Subject.create(0), Subject.create(99.9))}
                                        isMandatory={Subject.create(true)}
                                        value={this.toThsFor}
                                    />
                                </div>
                                <div style="margin-right: 15px; margin-top: 15px;">
                                    <DropdownMenu
                                        values={ArraySubject.create(['OFF/APU', 'ON'])}
                                        selectedIndex={this.toSelectedPacksIndex}
                                        idPrefix="packsDropdown"
                                    />
                                </div>
                                <div style="margin-top: 15px;">
                                    <DropdownMenu
                                        values={ArraySubject.create(['OFF', 'ENG ONLY', 'ENG + WING'])}
                                        selectedIndex={this.toSelectedAntiIceIndex}
                                        idPrefix="antiIceDropdown"
                                    />
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: auto auto auto auto auto; grid-auto-rows: 50px; margin: 20px 20px 20px 0px; height: 150px;">
                                <div style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px; width: 125px;">
                                    <span class="MFDLabel">THR RED</span>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                        isMandatory={Subject.create(false)}
                                        value={this.thrRedAlt}
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
                                        <InputField<number>
                                            dataEntryFormat={new PercentageFormat(Subject.create(40), Subject.create(110))}
                                            isMandatory={Subject.create(false)}
                                            value={this.noiseN1}
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
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                        isMandatory={Subject.create(false)}
                                        value={this.accelAlt}
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
                                        <InputField<number>
                                            dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                            isMandatory={Subject.create(false)}
                                            value={this.noiseSpd}
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
                                        <InputField<number>
                                            dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                            isMandatory={Subject.create(false)}
                                            value={this.noiseEndAlt}
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
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeFormat(Subject.create(1), Subject.create(maxCertifiedAlt))}
                                        isMandatory={Subject.create(false)}
                                        value={this.transAlt}
                                        containerStyle="width: 150px; justify-content: flex-end;"
                                    />
                                </div>
                                <div class="MFDLabelValueContainer">
                                    <span class="MFDLabel spacingRight">EO ACCEL</span>
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                        isMandatory={Subject.create(false)}
                                        value={this.eoAccelAlt}
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
                                    <InputField<number>
                                        dataEntryFormat={new CostIndexFormat()}
                                        isMandatory={Subject.create(false)}
                                        value={this.costIndex}
                                        containerStyle="width: 75px; justify-content: center;"
                                    />
                                </div>
                                <div class="MFDLabelValueContainer">
                                    <span class="MFDLabel spacingRight">DERATED CLB</span>
                                    <DropdownMenu
                                        values={ArraySubject.create(['NONE', '01', '02', '03', '04', '05'])}
                                        selectedIndex={this.clbDeratedClbSelectedIndex}
                                        idPrefix="deratedClbDropdown"
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
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(Subject.create(0), Subject.create(maxCertifiedAlt), this.transAlt)}
                                        isMandatory={Subject.create(false)}
                                        value={this.clbPredictionsReference}
                                        containerStyle="width: 150px; margin-left: 15px;"
                                    />
                                </div>
                                <div class="spdPreselManagedTableCell" style="border-right: 1px solid lightgrey; justify-content: flex-end;">
                                    <div class="MFDLabel">PRESEL</div>
                                </div>
                                <div class="spdTableCell">
                                    <InputField<number>
                                        dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                        isMandatory={Subject.create(false)}
                                        value={this.clbPreSelSpdTarget}
                                    />
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
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                        isMandatory={Subject.create(false)}
                                        value={this.thrRedAlt}
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
                                        <InputField<number>
                                            dataEntryFormat={new PercentageFormat(Subject.create(40), Subject.create(110))}
                                            isMandatory={Subject.create(false)}
                                            value={this.noiseN1}
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
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                        isMandatory={Subject.create(false)}
                                        value={this.accelAlt}
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
                                        <InputField<number>
                                            dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                            isMandatory={Subject.create(false)}
                                            value={this.noiseSpd}
                                            containerStyle="width: 110px; justify-content: flex-end;"
                                        />
                                    </div>
                                </div>
                                <div style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px; width: 150px;">
                                    <span ref={this.clbSpdLimLabelRef} class="MFDLabel">CLB SPD LIM</span>
                                    <span ref={this.clbNoiseEndLabelRef} class="MFDLabel">NOISE END</span>
                                </div>
                                <div style="grid-column-start: span 4; width: 300px;">
                                    <div ref={this.clbSpdLimValueRef} style="grid-row-start: span 3; display: flex; justify-content: flex-start; align-items: center;">
                                        <div class="MFDLabelValueContainer">
                                            <span class="MFDGreenValue">250</span>
                                            <span class="MFDUnitLabel trailingUnit">KT</span>
                                        </div>
                                        <span class="MFDGreenValue">/</span>
                                        <div class="MFDLabelValueContainer">
                                            <span class="MFDUnitLabel leadingUnit">FL</span>
                                            <span class="MFDGreenValue">100</span>

                                        </div>
                                    </div>
                                    <div ref={this.clbNoiseEndInputRef}>
                                        <InputField<number>
                                            dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                            isMandatory={Subject.create(false)}
                                            value={this.noiseEndAlt}
                                            containerStyle="width: 150px; justify-content: flex-end;"
                                        />
                                    </div>
                                </div>
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
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeFormat(Subject.create(1), Subject.create(maxCertifiedAlt))}
                                        isMandatory={Subject.create(false)}
                                        value={this.transAlt}
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
                                    <InputField<number>
                                        dataEntryFormat={new CostIndexFormat()}
                                        isMandatory={Subject.create(false)}
                                        value={this.costIndex}
                                        containerStyle="width: 75px; justify-content: center;"
                                    />
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
                                    <InputField<number>
                                        dataEntryFormat={new SpeedMachFormat(Subject.create(0.1), Subject.create(Mmo))}
                                        isMandatory={Subject.create(false)}
                                        value={this.crzPreSelMachTarget}
                                    />
                                </div>
                                <div class="spdTableCell">
                                    <InputField<number>
                                        dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                        isMandatory={Subject.create(false)}
                                        value={this.crzPreSelSpdTarget}
                                    />
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
                            <div style="display: flex; justify-content: space-between;">
                                <div class="MFDLabelValueContainer" style="padding: 15px;">
                                    <span class="MFDLabel spacingRight">CI</span>
                                    <InputField<number>
                                        dataEntryFormat={new CostIndexFormat()}
                                        isMandatory={Subject.create(false)}
                                        value={this.costIndex}
                                        containerStyle="width: 75px; justify-content: center;"
                                    />
                                </div>
                                <div class="MFDLabelValueContainer" style="padding: 15px;">
                                    <span class="MFDLabel spacingRight">DES CABIN RATE</span>
                                    <InputField<number>
                                        dataEntryFormat={new DescentRateFormat(Subject.create(-999), Subject.create(-100))}
                                        isMandatory={Subject.create(false)}
                                        value={this.desCabinDesRate}
                                        containerStyle="width: 175px; justify-content: center;"
                                    />
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
                                <div class="spdTableCell" style="flex-direction: row; justify-content: center; align-items: center;">
                                    <div class="MFDLabel">PRED TO </div>
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(Subject.create(0), Subject.create(maxCertifiedAlt), this.transFl)}
                                        isMandatory={Subject.create(false)}
                                        value={this.desPredictionsReference}
                                        containerStyle="width: 150px; margin-left: 15px;"
                                    />
                                </div>
                                <div class="spdPreselManagedTableCell" style="border-right: 1px solid lightgrey; justify-content: flex-end;">
                                    <div class="MFDLabel green biggest">MANAGED</div>
                                </div>
                                <div class="spdTableCell">
                                    <InputField<number>
                                        dataEntryFormat={new SpeedMachFormat(Subject.create(0.1), Subject.create(Mmo))}
                                        isMandatory={Subject.create(false)}
                                        value={this.desManagedMachTarget}
                                    />
                                </div>
                                <div class="spdTableCell">
                                    <InputField<number>
                                        dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                        isMandatory={Subject.create(false)}
                                        value={this.desManagedSpdTarget}
                                    />
                                </div>
                                <div class="spdTableCell">
                                    <span class="MFDGreenValue">--:--   ----</span>
                                </div>
                                <div class="spdPreselManagedTableCell" style="border-right: 1px solid lightgrey; justify-content: flex-end; height: 100px;" />
                                <div class="spdTableCell" />
                                <div class="spdTableCell" />
                                <div class="spdTableCell" />
                                <div class="spdTableCell" style="border-right: 1px solid lightgrey; border-bottom: none; justify-content: flex-end; height: 75px;" />
                                <div class="spdTableCell" style="border-bottom: none; padding: 5px;" />
                                <div class="spdTableCell" style="border-bottom: none; padding: 5px;" />
                                <div class="spdTableCell" style="border-bottom: none; padding: 5px;" />
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
                                    <Button onClick={() => this.props.navigateTo('fms/active/f-pln/vert-rev')}>
                                        SPD CSTR
                                    </Button>
                                </div>
                            </div>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            {/* APPR */}
                            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid lightgrey;">
                                <div class="MFDLabelValueContainer" style="padding: 15px;">
                                    <span class="MFDLabel spacingRight">APPR</span>
                                    <span class="MFDGreenValue">ILS26R</span>
                                </div>
                                <div class="MFDLabelValueContainer" style="padding: 15px;">
                                    <span class="MFDGreenValue">LFPG</span>
                                </div>
                                <div class="MFDLabelValueContainer" style="padding: 15px;">
                                    <span class="MFDLabel spacingRight">LW</span>
                                    <span class="MFDGreenValue">357.1</span>
                                    <span class="MFDUnitLabel trailingUnit">T</span>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: row;">
                                {/* left column */}
                                <div style="flex: 5; display: flex; flex-direction: column;">
                                    <div style="border: 1px solid lightgrey; display: flex; flex-direction: column; margin: 20px 40px 20px 0px; padding: 15px;">
                                        <div style="display: flex; flex-direction: row;">
                                            <span class="MFDLabel spacingRight" style="width: 125px; text-align: right; align-self: center; padding-left: 20px;">MAG WIND</span>
                                            <div style="border: 1px solid lightgrey; display: flex; flex-direction: row; padding: 2px;">
                                                <InputField<number>
                                                    dataEntryFormat={new WindDirectionFormat()}
                                                    isMandatory={Subject.create(false)}
                                                    value={this.apprMag}
                                                />
                                                <InputField<number>
                                                    dataEntryFormat={new WindSpeedFormat()}
                                                    isMandatory={Subject.create(false)}
                                                    value={this.apprWind}
                                                    containerStyle="margin-left: 10px;"
                                                />
                                            </div>
                                        </div>
                                        <div style="display: flex; flex-direction: row; margin-top: 15px;">
                                            <div class="MFDLabelValueContainer" style="padding: 15px;">
                                                <span class="MFDLabel spacingRight">HD</span>
                                                <span class="MFDGreenValue">---</span>
                                            </div>
                                            <div class="MFDLabelValueContainer" style="padding: 15px;">
                                                <span class="MFDLabel spacingRight">CROSS</span>
                                                <span class="MFDGreenValue">---</span>
                                            </div>
                                        </div>
                                        <div style="display: flex; flex-direction: row; margin-top: 20px;">
                                            <span class="MFDLabel spacingRight" style="width: 125px; text-align: right; align-self: center; padding-left: 20px;">OAT</span>
                                            <InputField<number>
                                                dataEntryFormat={new TemperatureFormat(Subject.create(-99), Subject.create(99))}
                                                isMandatory={Subject.create(false)}
                                                value={this.apprOat}
                                                containerStyle="width: 125px; justify-content: flex-end;"
                                            />
                                        </div>
                                        <div style="display: flex; flex-direction: row; margin-top: 15px;">
                                            <span class="MFDLabel spacingRight" style="width: 125px; text-align: right; align-self: center; padding-left: 20px;">QNH</span>
                                            <InputField<number>
                                                dataEntryFormat={new QnhFormat()}
                                                isMandatory={Subject.create(false)}
                                                value={this.apprQnh}
                                                containerStyle="width: 125px; justify-content: flex-end;"
                                            />
                                        </div>
                                    </div>
                                    <div style="position: relative; border: 1px solid lightgrey; display: flex; flex-direction: column; margin: 20px 40px 20px 0px; padding: 15px;">
                                        <span
                                            class="MFDLabel spacingRight"
                                            style="position: absolute; left: 10px; top: -10px;
                                            text-align: right; align-self: center; background-color: #040404;"
                                        >
                                            MINIMUM

                                        </span>
                                        <div style="display: flex; flex-direction: row;">
                                            <span class="MFDLabel spacingRight" style="width: 125px; text-align: right; align-self: center; padding-left: 20px;">BARO</span>
                                            <InputField<number>
                                                dataEntryFormat={new AltitudeFormat(Subject.create(0), Subject.create(maxCertifiedAlt))}
                                                isMandatory={Subject.create(false)}
                                                value={this.apprMinimumBaro}
                                                containerStyle="width: 125px;"
                                            />
                                        </div>
                                        <div style="display: flex; flex-direction: row; margin-top: 15px;">
                                            <span class="MFDLabel spacingRight" style="width: 125px; text-align: right; align-self: center; padding-left: 20px;">RADIO</span>
                                            <InputField<number>
                                                dataEntryFormat={new AltitudeFormat(Subject.create(0), Subject.create(maxCertifiedAlt))}
                                                isMandatory={Subject.create(false)}
                                                value={this.apprMinimumRadio}
                                                containerStyle="width: 125px;"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* right column */}
                                <div style="flex: 4; display: flex; flex-direction: column;">
                                    <div style="display: flex; flex-direction: column; align-items: center; margin-top: 30px;">
                                        <div class="MFDLabelValueContainer">
                                            <span style="margin-right: 15px; text-align: right; width: 50px;">
                                                <svg width="13" height="13" viewBox="0 0 13 13"><circle cx="6" cy="6" r="5" stroke="#00ff00" stroke-width="2" /></svg>
                                            </span>
                                            <span class="MFDGreenValue">192</span>
                                            <span class="MFDUnitLabel trailingUnit">KT</span>
                                        </div>
                                        <div class="MFDLabelValueContainer">
                                            <span class="MFDLabel spacingRight" style="margin-right: 15px; text-align: right; width: 50px;">S</span>
                                            <span class="MFDGreenValue">175</span>
                                            <span class="MFDUnitLabel trailingUnit">KT</span>
                                        </div>
                                        <div class="MFDLabelValueContainer">
                                            <span class="MFDLabel spacingRight" style="margin-right: 15px; text-align: right; width: 50px;">F</span>
                                            <span class="MFDGreenValue">161</span>
                                            <span class="MFDUnitLabel trailingUnit">KT</span>
                                        </div>
                                        <div class="MFDLabelValueContainer" style="padding-top: 15px;">
                                            <span class="MFDLabel spacingRight" style="margin-right: 15px; text-align: right; width: 50px;">VREF</span>
                                            <span class="MFDGreenValue">129</span>
                                            <span class="MFDUnitLabel trailingUnit">KT</span>
                                        </div>
                                    </div>
                                    <div style="width: 200px; margin-top: 20px; border: 1px solid lightgrey; display: flex; flex-direction: column; align-self: center; align-items: center;">
                                        <RadioButtonGroup
                                            values={ArraySubject.create(['CONF 3', 'FULL'])}
                                            selectedIndex={this.apprSelectedFlapsIndex}
                                            idPrefix="thrustSettingRadio"
                                            additionalVerticalSpacing={15}
                                        />
                                        <div class="MFDLabelValueContainer" style="margin-top: 10px;">
                                            <span class="MFDLabel spacingRight">VLS</span>
                                            <span class="MFDGreenValue">129</span>
                                            <span class="MFDUnitLabel trailingUnit">KT</span>
                                        </div>
                                    </div>
                                    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; align-self: center; margin-top: 20px;">
                                        <div style="display: flex; flex-direction: row; justify-content: center; justify-self; center; ">
                                            <span class="MFDLabel spacingRight" style="text-align: right; align-self: center;">VAPP</span>
                                            <InputField<number>
                                                dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                                isMandatory={Subject.create(false)}
                                                value={this.apprVapp}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style="flex-grow: 1;" />
                            {/* fill space vertically */}
                            <div style="margin: 10px 2px 3px 2px; display: flex; flex-direction: row;justify-content: space-between; padding-top: 10px;">
                                <div class="MFDLabelValueContainer">
                                    <span class="MFDLabel spacingRight" style="width: 125px; text-align: right; align-self: center; padding-left: 20px;">TRANS</span>
                                    <InputField<number>
                                        dataEntryFormat={new FlightLevelFormat()}
                                        isMandatory={Subject.create(false)}
                                        value={this.transFl}
                                        containerStyle="width: 110px; justify-content: flex-start;"
                                    />
                                </div>
                                <div class="MFDLabelValueContainer" style="padding: 15px;">
                                    <span class="MFDLabel spacingRight">VERT DEV</span>
                                    <span class="MFDGreenValue">+-----</span>
                                </div>
                            </div>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            {/* GA */}
                            <div style="margin: 60px 0px 100px 200px; display: flex; flex-direction: column;">
                                <div class="MFDLabelValueContainer">
                                    <span class="MFDLabel spacingRight">F</span>
                                    <span class="MFDGreenValue">138</span>
                                    <span class="MFDUnitLabel trailingUnit">KT</span>
                                </div>
                                <div class="MFDLabelValueContainer">
                                    <span class="MFDLabel spacingRight">S</span>
                                    <span class="MFDGreenValue">175</span>
                                    <span class="MFDUnitLabel trailingUnit">KT</span>
                                </div>
                                <div class="MFDLabelValueContainer">
                                    <span style="margin-right: 15px; text-align: right;">
                                        <svg width="13" height="13" viewBox="0 0 13 13"><circle cx="6" cy="6" r="5" stroke="#00ff00" stroke-width="2" /></svg>
                                    </span>
                                    <span class="MFDGreenValue">192</span>
                                    <span class="MFDUnitLabel trailingUnit">KT</span>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column;">
                                <div style="display: flex; flex-direction: row;">
                                    <div style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px; width: 150px;">
                                        <span class="MFDLabel">THR RED</span>
                                    </div>
                                    <div style="margin-bottom: 15px;">
                                        <InputField<number>
                                            dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                            isMandatory={Subject.create(false)}
                                            value={this.thrRedAlt}
                                            containerStyle="width: 150px; justify-content: flex-end;"
                                        />
                                    </div>
                                </div>
                                <div style="display: flex; flex-direction: row;">
                                    <div style="display: flex; justify-content: flex-end; align-items: center; margin-right: 15px; margin-bottom: 15px; width: 150px;">
                                        <span class="MFDLabel">ACCEL</span>
                                    </div>
                                    <div style="margin-bottom: 15px;">
                                        <InputField<number>
                                            dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                            isMandatory={Subject.create(false)}
                                            value={this.accelAlt}
                                            containerStyle="width: 150px; justify-content: flex-end;"
                                        />
                                    </div>
                                    <div style="display: flex; justify-content: flex-end; align-items: center; margin-left: 40px; margin-right: 15px; margin-bottom: 15px; width: 125px;">
                                        <span class="MFDLabel">EO ACCEL</span>
                                    </div>
                                    <div style="margin-bottom: 15px;">
                                        <InputField<number>
                                            dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                            isMandatory={Subject.create(false)}
                                            value={this.eoAccelAlt}
                                            containerStyle="width: 150px; justify-content: flex-end;"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div style="flex-grow: 1;" />
                            {/* fill space vertically */}
                            <div class="MFDLabelValueContainer">
                                <span class="MFDLabel spacingRight" style="width: 150px; text-align: right;">TRANS</span>
                                <span class="MFDGreenValue">5000</span>
                                <span class="MFDUnitLabel trailingUnit">FT</span>
                            </div>
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
