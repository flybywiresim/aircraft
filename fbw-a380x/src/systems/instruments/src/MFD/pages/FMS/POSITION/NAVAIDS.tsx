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
import { Database, MsfsBackend } from '@flybywiresim/fbw-sdk';
import { NXSystemMessages } from 'instruments/src/MFD/pages/FMS/legacy/NXSystemMessages';

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

    private async handleVorIdent(index: 1 | 2, ident: string) {
        if (ident === null || ident === '') {
            const vor = this.props.fmService.navigation.getNavaidTuner().getVorRadioTuningStatus(index);
            if (vor.manual) {
                this.props.fmService.navigation.getNavaidTuner().setManualVor(index, null);
            } else {
                this.props.fmService.mfd.addMessageToQueue(NXSystemMessages.notAllowed);
            }
        } else {
            const navaids = await NavigationDatabaseService.activeDatabase.searchVor(ident);
            if (navaids.length > 0) {
                if(this.props.fmService.navigation.getNavaidTuner().deselectedNavaids.find((databaseId) => databaseId === navaids[0].databaseId)) {
                    this.props.fmService.mfd.addMessageToQueue(NXSystemMessages.xxxIsDeselected.getModifiedMessage(navaids[0].ident));
                }
                this.props.fmService.navigation.getNavaidTuner().setManualVor(index, navaids[0]);
            }
        }
        this.onNewData();
    }

    private async handleVorFreq(index: 1 | 2, freq: number) {
        if (freq === null) {
            const vor = this.props.fmService.navigation.getNavaidTuner().getVorRadioTuningStatus(index);
            if (vor.manual) {
                this.props.fmService.navigation.getNavaidTuner().setManualVor(index, null);
            } else {
                this.props.fmService.mfd.addMessageToQueue(NXSystemMessages.notAllowed);
            }
        } else {
            this.props.fmService.navigation.getNavaidTuner().setManualVor(index, freq);
        }
        this.onNewData();
    }

    private async handleIlsIdent(ident: string) {
        if (this.props.fmService.navigation.getNavaidTuner().isMmrTuningLocked()) {
            this.props.fmService.mfd.addMessageToQueue(NXSystemMessages.notAllowed);
        }

        if (ident === null || ident === '') {
            const mmr = this.props.fmService.navigation.getNavaidTuner().getMmrRadioTuningStatus(1);
            if (mmr.manual) {
                this.props.fmService.navigation.getNavaidTuner().setManualIls(null);
            } else {
                this.props.fmService.mfd.addMessageToQueue(NXSystemMessages.notAllowed);
            }
        } else {
            const ils = await NavigationDatabaseService.activeDatabase.backendDatabase.getILSs([ident]);
            if (ils.length > 0) {
                await this.props.fmService.navigation.getNavaidTuner().setManualIls(ils[0]);
            }

        }
        this.onNewData();
    }

    private async handleIlsFreq(freq: number) {
        if (freq === null) {
            const ils = this.props.fmService.navigation.getNavaidTuner().getMmrRadioTuningStatus(1);
            if (ils.manual) {
                this.props.fmService.navigation.getNavaidTuner().setManualIls(null);
            } else {
                this.props.fmService.mfd.addMessageToQueue(NXSystemMessages.notAllowed);
            }
        } else {
            this.props.fmService.navigation.getNavaidTuner().setManualIls(freq);
        }
        this.onNewData();
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
                                            dataHandlerDuringValidation={async (v) => this.handleVorIdent(1, v)}
                                            mandatory={Subject.create(false)}
                                            enteredByPilot={this.vor1IdentEnteredByPilot}
                                            value={this.vor1Ident}
                                            containerStyle='width: 125px;'
                                            alignText='center'
                                            errorHandler={(e) => this.props.fmService.mfd.showFmsErrorMessage(e)}
                                        />
                                    </div>
                                    <div class="mfd-position-navaids-row">
                                        <InputField<number>
                                            dataEntryFormat={new FrequencyVORDMEFormat()}
                                            dataHandlerDuringValidation={async (v) => this.handleVorFreq(1, v)}
                                            mandatory={Subject.create(false)}
                                            enteredByPilot={this.vor1FreqEnteredByPilot}
                                            value={this.vor1Freq}
                                            containerStyle='width: 125px;'
                                            alignText='center'
                                            errorHandler={(e) => this.props.fmService.mfd.showFmsErrorMessage(e)}
                                        />
                                    </div>
                                    <div class="mfd-position-navaids-row">
                                        <InputField<number>
                                            dataEntryFormat={new InboundCourseFormat()}
                                            dataHandlerDuringValidation={async (v) => {
                                                this.props.fmService.navigation.getNavaidTuner().setVorCourse(1, v ? v : null);
                                            }}
                                            mandatory={Subject.create(false)}
                                            value={this.vor1Course}
                                            containerStyle='width: 125px;'
                                            alignText='center'
                                            errorHandler={(e) => this.props.fmService.mfd.showFmsErrorMessage(e)}
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
                                            dataHandlerDuringValidation={async (v) => this.handleVorIdent(2, v)}
                                            mandatory={Subject.create(false)}
                                            enteredByPilot={this.vor2IdentEnteredByPilot}
                                            value={this.vor2Ident}
                                            containerStyle='width: 125px;'
                                            alignText='center'
                                            errorHandler={(e) => this.props.fmService.mfd.showFmsErrorMessage(e)}
                                        />
                                    </div>
                                    <div class="mfd-position-navaids-row">
                                        <InputField<number>
                                            dataEntryFormat={new FrequencyVORDMEFormat()}
                                            dataHandlerDuringValidation={async (v) => this.handleVorFreq(2, v)}
                                            mandatory={Subject.create(false)}
                                            enteredByPilot={this.vor2FreqEnteredByPilot}
                                            value={this.vor2Freq}
                                            containerStyle='width: 125px;'
                                            alignText='center'
                                            errorHandler={(e) => this.props.fmService.mfd.showFmsErrorMessage(e)}
                                        />
                                    </div>
                                    <div class="mfd-position-navaids-row">
                                        <InputField<number>
                                            dataEntryFormat={new InboundCourseFormat()}
                                            dataHandlerDuringValidation={async (v) => {
                                                this.props.fmService.navigation.getNavaidTuner().setVorCourse(2, v ? v : null);
                                            }}
                                            mandatory={Subject.create(false)}
                                            value={this.vor2Course}
                                            containerStyle='width: 125px;'
                                            alignText='center'
                                            errorHandler={(e) => this.props.fmService.mfd.showFmsErrorMessage(e)}
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
                                    dataHandlerDuringValidation={async (v) => this.handleIlsIdent(v)}
                                    mandatory={Subject.create(false)}
                                    enteredByPilot={this.lsIdentEnteredByPilot}
                                    value={this.lsIdent}
                                    containerStyle='width: 125px;'
                                    alignText='center'
                                    errorHandler={(e) => this.props.fmService.mfd.showFmsErrorMessage(e)}
                                />
                            </div>
                            <div class="mfd-position-navaids-row">
                                <InputField<number>
                                    dataEntryFormat={new FrequencyILSFormat()}
                                    dataHandlerDuringValidation={async (v) => this.handleIlsFreq(v)}
                                    mandatory={Subject.create(false)}
                                    enteredByPilot={this.lsIdentEnteredByPilot}
                                    value={this.lsFreq}
                                    containerStyle='width: 125px;'
                                    alignText='center'
                                    errorHandler={(e) => this.props.fmService.mfd.showFmsErrorMessage(e)}
                                />
                            </div>
                            <div class="mfd-position-navaids-row">
                                <InputField<number>
                                    dataEntryFormat={new LsCourseFormat()}
                                    dataHandlerDuringValidation={async (v) => {
                                        this.props.fmService.navigation.getNavaidTuner().setIlsCourse(v ? v : null);
                                    }}
                                    mandatory={Subject.create(false)}
                                    enteredByPilot={this.lsIdentEnteredByPilot}
                                    value={this.lsCourse}
                                    containerStyle='width: 125px;'
                                    alignText='center'
                                    errorHandler={(e) => this.props.fmService.mfd.showFmsErrorMessage(e)}
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
