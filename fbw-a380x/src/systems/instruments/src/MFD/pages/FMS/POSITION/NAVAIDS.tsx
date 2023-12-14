/* eslint-disable jsx-a11y/label-has-associated-control */

import { ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './navaids.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { Button } from 'instruments/src/MFD/pages/common/Button';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { FrequencyILSFormat, FrequencyVORDMEFormat, InboundCourseFormat, LsCourseFormat, NavaidIdentFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';
import { NavigationDatabaseService } from '@fmgc/index';
import { VhfNavaidType } from '../../../../../../../../../fbw-common/src/systems/navdata';
import { AirportSubsectionCode, IlsNavaid, LsCategory, SectionCode } from 'msfs-navdata';

interface MfdFmsPositionNavaidProps extends AbstractMfdPageProps {
}

export class MfdFmsPositionNavaids extends FmsPage<MfdFmsPositionNavaidProps> {
    private navaidsSelectedPageIndex = Subject.create<number>(0);

    private vor1Ident = Subject.create<string>(null);

    private vor1IdentEnteredByPilot = Subject.create<boolean>(false);

    private vor1Freq = Subject.create<number>(null);

    private vor1FreqEnteredByPilot = Subject.create<boolean>(false);

    private vor1Course = Subject.create<number>(null);

    private vor1Class = Subject.create<string>(null);

    private vor2Ident = Subject.create<string>(null);

    private vor2IdentEnteredByPilot = Subject.create<boolean>(false);

    private vor2Freq = Subject.create<number>(null);

    private vor2FreqEnteredByPilot = Subject.create<boolean>(false);

    private vor2Course = Subject.create<number>(null);

    private vor2Class = Subject.create<string>(null);

    private lsIdent = Subject.create<string>(null);

    private lsFreq = Subject.create<number>(null);

    private lsCourse = Subject.create<number>(null);

    private lsSlope = Subject.create<string>(null);

    private lsClass = Subject.create<string>(null);

    private lsIdentEnteredByPilot = Subject.create<boolean>(false);

    private lsCourseEnteredByPilot = Subject.create<boolean>(false);

    protected onNewData() {
        console.time('POSITION/NAVAIDS:onNewData');

        const vor1 = this.props.fmService.navigation.getNavaidTuner().getVorRadioTuningStatus(1);
        this.vor1Ident.set(vor1.ident ?? null);
        this.vor1Freq.set(vor1.frequency ?? null);
        this.vor1Course.set(vor1.course ?? null);
        this.vor1Class.set(vor1.ident ? (vor1.dmeOnly ? 'DME' : 'VOR/DME') : '');
        this.vor1IdentEnteredByPilot.set(vor1.manual);
        this.vor1FreqEnteredByPilot.set(vor1.manual);

        const vor2 = this.props.fmService.navigation.getNavaidTuner().getVorRadioTuningStatus(2);
        this.vor2Ident.set(vor2.ident ?? null);
        this.vor2Freq.set(vor2.frequency ?? null);
        this.vor2Course.set(vor2.course ?? null);
        this.vor2Class.set(vor2.ident ? (vor2.dmeOnly ? 'DME' : 'VOR/DME') : '');
        this.vor2IdentEnteredByPilot.set(vor2.manual);
        this.vor2FreqEnteredByPilot.set(vor2.manual);

        const mmr = this.props.fmService.navigation.getNavaidTuner().getMmrRadioTuningStatus(1);
        this.lsIdent.set(mmr.ident ?? null);
        this.lsFreq.set(mmr.frequency ?? null);
        this.lsCourse.set(mmr.course ?? null);
        this.lsSlope.set(mmr.slope ? mmr.slope.toFixed(1) : '---');
        this.lsClass.set(mmr.ident ? 'ILS/DME' : '');
        this.lsIdentEnteredByPilot.set(mmr.manual);
        this.lsCourseEnteredByPilot.set(mmr.courseManual);

        console.timeEnd('POSITION/NAVAIDS:onNewData');
    }

    private deselectGlide() {
        // TODO
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<ClockEvents & MfdSimvars>();
        this.subs.push(sub.on('realTime').atFrequency(1).handle((_t) => {
            this.onNewData();
        }));
    }

    render(): VNode {
        return (
            <>
                {super.render()}
                {/* begin page content */}
                <div class="mfd-page-container">
                    <TopTabNavigator
                            pageTitles={Subject.create(['TUNED FOR DISPLAY', 'SELECTED FOR FMS NAV'])}
                            selectedPageIndex={this.navaidsSelectedPageIndex}
                            pageChangeCallback={(val) => this.navaidsSelectedPageIndex.set(val)}
                            selectedTabTextColor="white"
                        >
                        <TopTabNavigatorPage>
                            {/* TUNED FOR DISPLAY */}
                            <div style="display: flex; flex-direction: row; align-self: center; padding-bottom: 20px;">
                                <div style=" flex-direction: column; width: 40%; justify-content: space-between;">
                                    <div class="mfd-label mfd-position-navaids-row">VOR1</div>
                                    <div class="mfd-position-navaids-row">
                                        <InputField<string>
                                            dataEntryFormat={new NavaidIdentFormat()}
                                            dataHandlerDuringValidation={async (v) => {
                                                if (v === null || v === '') {
                                                    this.props.fmService.navigation.getNavaidTuner().setManualVor(1, null);
                                                } else {
                                                    const navaids = await NavigationDatabaseService.activeDatabase.searchVor(v);
                                                    if (navaids.length > 0) {
                                                        this.props.fmService.navigation.getNavaidTuner().setManualVor(1, navaids[0]);
                                                    }
                                                }
                                            }}
                                            mandatory={Subject.create(false)}
                                            enteredByPilot={this.vor1IdentEnteredByPilot}
                                            value={this.vor1Ident}
                                            containerStyle='width: 125px;'
                                            alignText='center'
                                        />
                                    </div>
                                    <div class="mfd-position-navaids-row">
                                        <InputField<number>
                                            dataEntryFormat={new FrequencyVORDMEFormat(this.props.fmService.mfd)}
                                            dataHandlerDuringValidation={async (v) => {
                                                this.props.fmService.navigation.getNavaidTuner().setManualVor(1, v ? v : null);
                                            }}
                                            mandatory={Subject.create(false)}
                                            enteredByPilot={this.vor1FreqEnteredByPilot}
                                            value={this.vor1Freq}
                                            containerStyle='width: 125px;'
                                            alignText='center'
                                        />
                                    </div>
                                    <div class="mfd-position-navaids-row">
                                        <InputField<number>
                                            dataEntryFormat={new InboundCourseFormat(this.props.fmService.mfd)}
                                            dataHandlerDuringValidation={async (v) => {
                                                this.props.fmService.navigation.getNavaidTuner().setVorCourse(1, v ? v : null);
                                            }}
                                            mandatory={Subject.create(false)}
                                            value={this.vor1Course}
                                            containerStyle='width: 125px;'
                                            alignText='center'
                                        />
                                    </div>
                                    <div class="mfd-position-navaids-row"><span class="mfd-value-green">{this.vor1Class}</span></div>
                                </div>
                                <div style="display: flex; flex-direction: column; width: 20%; margin-left: 40px; margin-right: 40px;">
                                    <div class="mfd-label mfd-position-navaids-row" />
                                    <div class="mfd-label mfd-position-navaids-row">IDENT</div>
                                    <div class="mfd-label mfd-position-navaids-row">FREQ</div>
                                    <div class="mfd-label mfd-position-navaids-row">CRS</div>
                                    <div class="mfd-label mfd-position-navaids-row">CLASS</div>
                                </div>
                                <div style="display: flex; flex-direction: column; width: 40%;">
                                    <div class="mfd-label mfd-position-navaids-row">VOR2</div>
                                    <div class="mfd-position-navaids-row">
                                        <InputField<string>
                                            dataEntryFormat={new NavaidIdentFormat()}
                                            dataHandlerDuringValidation={async (v) => {
                                                if (v === null || v === '') {
                                                    this.props.fmService.navigation.getNavaidTuner().setManualVor(2, null);
                                                } else {
                                                    const navaids = await NavigationDatabaseService.activeDatabase.searchVor(v);
                                                    if (navaids.length > 0) {
                                                        this.props.fmService.navigation.getNavaidTuner().setManualVor(2, navaids[0]);
                                                    }
                                                }
                                            }}
                                            mandatory={Subject.create(false)}
                                            enteredByPilot={this.vor2IdentEnteredByPilot}
                                            value={this.vor2Ident}
                                            containerStyle='width: 125px;'
                                            alignText='center'
                                        />
                                    </div>
                                    <div class="mfd-position-navaids-row">
                                        <InputField<number>
                                            dataEntryFormat={new FrequencyVORDMEFormat(this.props.fmService.mfd)}
                                            dataHandlerDuringValidation={async (v) => {
                                                this.props.fmService.navigation.getNavaidTuner().setManualVor(2, v ? v : null);
                                            }}
                                            mandatory={Subject.create(false)}
                                            enteredByPilot={this.vor2FreqEnteredByPilot}
                                            value={this.vor2Freq}
                                            containerStyle='width: 125px;'
                                            alignText='center'
                                        />
                                    </div>
                                    <div class="mfd-position-navaids-row">
                                        <InputField<number>
                                            dataEntryFormat={new InboundCourseFormat(this.props.fmService.mfd)}
                                            dataHandlerDuringValidation={async (v) => {
                                                this.props.fmService.navigation.getNavaidTuner().setVorCourse(2, v ? v : null);
                                            }}
                                            mandatory={Subject.create(false)}
                                            value={this.vor2Course}
                                            containerStyle='width: 125px;'
                                            alignText='center'
                                        />
                                    </div>
                                    <div class="mfd-position-navaids-row"><span class="mfd-value-green">{this.vor2Class}</span></div>
                                </div>
                            </div>
                            <div style="height: 5px; width: 100%; border-bottom: 2px solid darkgrey;" />
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            {/* SELECTED FOR FMS NAV */}
                        </TopTabNavigatorPage>
                    </TopTabNavigator>
                    <div style="display: flex; flex-direction: row; align-self: center;">
                        <div style="display: flex; flex-direction: column; margin-right: 20px;">
                            <div class="mfd-label mfd-position-navaids-row" />
                            <div class="mfd-label mfd-position-navaids-row ar">IDENT</div>
                            <div class="mfd-label mfd-position-navaids-row ar">FREQ/CHAN</div>
                            <div class="mfd-label mfd-position-navaids-row ar">CRS</div>
                            <div class="mfd-label mfd-position-navaids-row ar">SLOPE</div>
                            <div class="mfd-label mfd-position-navaids-row ar">CLASS</div>
                        </div>
                        <div style="display: flex; flex-direction: column;">
                            <div class="mfd-label mfd-position-navaids-row">LS</div>
                            <div class="mfd-position-navaids-row">
                                <InputField<string>
                                    dataEntryFormat={new NavaidIdentFormat()}
                                    dataHandlerDuringValidation={async (v) => {
                                        if (v === null || v === '') {
                                            this.props.fmService.navigation.getNavaidTuner().setManualIls(null);
                                        } else {
                                            const navaids = await NavigationDatabaseService.activeDatabase.searchVor(v);
                                            const ils = navaids.filter((it) => (it.type === VhfNavaidType.IlsDme || it.type === VhfNavaidType.IlsTacan));
                                            if (ils.length > 0) {
                                                const ilsNavaid: IlsNavaid = {
                                                    ...ils[0],
                                                    sectionCode: SectionCode.Airport,
                                                    subSectionCode: AirportSubsectionCode.LocalizerGlideSlope,
                                                    category: LsCategory.None,
                                                    runwayIdent: ils[0].name.split(' ')[1],
                                                    locLocation: { lat: ils[0].location.lat, long: ils[0].location.long },
                                                    locBearing: 0, // TODO

                                                }
                                                console.warn(ils[0]);
                                                await this.props.fmService.navigation.getNavaidTuner().setManualIls(ilsNavaid);
                                            }

                                        }
                                    }}
                                    mandatory={Subject.create(false)}
                                    enteredByPilot={this.lsIdentEnteredByPilot}
                                    value={this.lsIdent}
                                    containerStyle='width: 125px;'
                                    alignText='center'
                                />
                            </div>
                            <div class="mfd-position-navaids-row">
                                <InputField<number>
                                    dataEntryFormat={new FrequencyILSFormat(this.props.fmService.mfd)}
                                    dataHandlerDuringValidation={async (v) => {
                                        this.props.fmService.navigation.getNavaidTuner().setManualIls(v ? v : null);
                                    }}
                                    mandatory={Subject.create(false)}
                                    enteredByPilot={this.lsIdentEnteredByPilot}
                                    value={this.lsFreq}
                                    containerStyle='width: 125px;'
                                    alignText='center'
                                />
                            </div>
                            <div class="mfd-position-navaids-row">
                                <InputField<number>
                                    dataEntryFormat={new LsCourseFormat(this.props.fmService.mfd)}
                                    dataHandlerDuringValidation={async (v) => {
                                        this.props.fmService.navigation.getNavaidTuner().setIlsCourse(v ? v : null);
                                    }}
                                    mandatory={Subject.create(false)}
                                    enteredByPilot={this.lsIdentEnteredByPilot}
                                    value={this.lsCourse}
                                    containerStyle='width: 125px;'
                                    alignText='center'
                                />
                            </div>
                            <div class="mfd-position-navaids-row">
                                <div class="mfd-label-value-container">
                                    <span class="mfd-value-green">{this.lsSlope}</span>
                                    <span class="mfd-label-unit mfd-unit-trailing">°</span>
                                </div>
                            </div>
                            <div class="mfd-position-navaids-row"><span class="mfd-value-green">{this.lsClass}</span></div>
                        </div>
                        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; margin-left: 15px;">
                        <Button
                                label={Subject.create(
                                    <div style="display: flex; flex-direction: row; justify-content: space-between;">
                                        <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                                            DESELECT
                                            <br />
                                            GLIDE
                                        </span>
                                        <span style="display: flex; align-items: center; justify-content: center;">*</span>
                                    </div>,
                                )}
                                disabled={Subject.create(true)}
                                onClick={() => {this.deselectGlide()}}
                                buttonStyle='width: 225px;'
                            />
                        </div>
                    </div>
                    <div style="flex-grow: 1;" />
                    {/* fill space vertically */}
                    <div style="width: 150px;">
                        <Button label="RETURN" onClick={() => this.props.uiService.navigateTo('back')} buttonStyle="margin-right: 5px;" />
                    </div>
                </div>
                <Footer bus={this.props.bus} uiService={this.props.uiService} fmService={this.props.fmService} />
            </>
        );
    }
}
