import { ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdFmsPositionNavaids.scss';
import { NavaidSubsectionCode } from '@flybywiresim/fbw-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { Button } from 'instruments/src/MFD/pages/common/Button';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import {
  FrequencyILSFormat,
  FrequencyVORDMEFormat,
  InboundCourseFormat,
  LsCourseFormat,
  NavaidIdentFormat,
} from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';
import { NavigationDatabaseService } from '@fmgc/index';
import { NXSystemMessages } from 'instruments/src/MFD/shared/NXSystemMessages';
import { NavRadioTuningStatus } from '@fmgc/navigation/NavaidTuner';

interface MfdFmsPositionNavaidsProps extends AbstractMfdPageProps {}

export class MfdFmsPositionNavaids extends FmsPage<MfdFmsPositionNavaidsProps> {
  private navaidsSelectedPageIndex = Subject.create<number>(0);

  private vor1Ident = Subject.create<string | null>(null);

  private vor1IdentEnteredByPilot = Subject.create<boolean>(false);

  private vor1Freq = Subject.create<number | null>(null);

  private vor1FreqEnteredByPilot = Subject.create<boolean>(false);

  private vor1Course = Subject.create<number | null>(null);

  private vor1Class = Subject.create<string | null>(null);

  private vor2Ident = Subject.create<string | null>(null);

  private vor2IdentEnteredByPilot = Subject.create<boolean>(false);

  private vor2Freq = Subject.create<number | null>(null);

  private vor2FreqEnteredByPilot = Subject.create<boolean>(false);

  private vor2Course = Subject.create<number | null>(null);

  private vor2Class = Subject.create<string | null>(null);

  private lsIdent = Subject.create<string | null>(null);

  private lsFreq = Subject.create<number | null>(null);

  private lsCourse = Subject.create<number | null>(null);

  private lsSlope = Subject.create<string | null>(null);

  private lsClass = Subject.create<string | null>(null);

  private lsIdentEnteredByPilot = Subject.create<boolean>(false);

  private lsFrequencyEnteredByPilot = Subject.create<boolean>(false);

  private lsCourseEnteredByPilot = Subject.create<boolean>(false);

  private firstRowIdent = Subject.create<string | null>(null);

  private firstRowFrequency = Subject.create<string | null>(null);

  private firstRowClass = Subject.create<string | null>(null);

  private secondRowIdent = Subject.create<string | null>(null);

  private secondRowFrequency = Subject.create<string | null>(null);

  private secondRowClass = Subject.create<string | null>(null);

  private thirdRowIdentRef = FSComponent.createRef<HTMLDivElement>();

  private thirdRowIdent = Subject.create<string | null>(null);

  private thirdRowFrequency = Subject.create<string | null>(null);

  private thirdRowClass = Subject.create<string | null>(null);

  private deselectedNavaids = [
    Subject.create<string | null>(null),
    Subject.create<string | null>(null),
    Subject.create<string | null>(null),
    Subject.create<string | null>(null),
    Subject.create<string | null>(null),
    Subject.create<string | null>(null),
  ];

  private static isNavRadioIdentManual(navStatus?: NavRadioTuningStatus): boolean {
    return !!(navStatus?.manual && navStatus?.facility !== undefined);
  }

  private static isNavRadioFreqManual(navStatus?: NavRadioTuningStatus): boolean {
    return !!(navStatus?.manual && navStatus?.facility === undefined);
  }

  protected onNewData() {
    if (!this.props.fmcService.master) {
      return;
    }

    const vor1 = this.props.fmcService.master.navaidTuner.getVorRadioTuningStatus(1);
    this.vor1Ident.set(vor1.ident ?? null);
    this.vor1Freq.set(vor1.frequency ?? null);
    this.vor1Course.set(vor1.course ?? null);
    const class1 = vor1.dmeOnly ? 'DME' : 'VOR/DME';
    this.vor1Class.set(vor1.ident ? class1 : '');
    this.vor1IdentEnteredByPilot.set(MfdFmsPositionNavaids.isNavRadioIdentManual(vor1));
    this.vor1FreqEnteredByPilot.set(MfdFmsPositionNavaids.isNavRadioFreqManual(vor1));

    const vor2 = this.props.fmcService.master.navaidTuner.getVorRadioTuningStatus(2);
    this.vor2Ident.set(vor2.ident ?? null);
    this.vor2Freq.set(vor2.frequency ?? null);
    this.vor2Course.set(vor2.course ?? null);
    const class2 = vor2.dmeOnly ? 'DME' : 'VOR/DME';
    this.vor2Class.set(vor2.ident ? class2 : '');
    this.vor2IdentEnteredByPilot.set(MfdFmsPositionNavaids.isNavRadioIdentManual(vor2));
    this.vor2FreqEnteredByPilot.set(MfdFmsPositionNavaids.isNavRadioFreqManual(vor2));

    const mmr = this.props.fmcService.master.navaidTuner.getMmrRadioTuningStatus(1);
    this.lsIdent.set(mmr.ident ?? null);
    this.lsFreq.set(mmr.frequency ?? null);
    this.lsCourse.set(mmr.course ?? null);
    this.lsSlope.set(mmr.slope ? mmr.slope.toFixed(1) : '---');
    this.lsClass.set(mmr.ident ? 'ILS/DME' : '');
    this.lsIdentEnteredByPilot.set(MfdFmsPositionNavaids.isNavRadioIdentManual(mmr));
    this.lsFrequencyEnteredByPilot.set(MfdFmsPositionNavaids.isNavRadioFreqManual(mmr));
    this.lsCourseEnteredByPilot.set(mmr.courseManual);

    this.deselectedNavaids.forEach((v, i) => {
      if (this.props.fmcService.master?.navaidTuner.deselectedNavaids[i]) {
        // FIXME pass full navaid objects to deselected navaids so we can get the ident.
        // Taking it from the databaseId is not safe but all we can do for now.
        v.set(this.props.fmcService.master.navaidTuner.deselectedNavaids[i].substring(7).trim());
      } else {
        v.set(null);
      }
    });

    // Third line for selected navaids table: Display LS if set
    this.thirdRowFrequency.set(mmr.frequency ? mmr.frequency.toFixed(2) : '');
    this.thirdRowClass.set(mmr.ident ? 'ILS/DME' : '');
    this.thirdRowIdent.set(mmr.ident ?? null);
    this.thirdRowIdentRef.instance.style.visibility = mmr.ident ? 'visible' : 'hidden';
  }

  private async parseNavaid(navaid: string, onlyVor = false) {
    const navaids = await (onlyVor
      ? NavigationDatabaseService.activeDatabase.searchVor(navaid)
      : NavigationDatabaseService.activeDatabase.searchAllNavaid(navaid));

    return this.props.mfd.deduplicateFacilities(navaids);
  }

  private deselectGlide() {
    // TODO
  }

  private async handleVorIdent(index: 1 | 2, ident: string | null) {
    if (ident === null || ident === '') {
      const vor = this.props.fmcService.master?.navaidTuner.getVorRadioTuningStatus(index);
      if (MfdFmsPositionNavaids.isNavRadioIdentManual(vor)) {
        this.props.fmcService.master?.navaidTuner.setManualVor(index, null);
      } else {
        this.props.fmcService.master?.addMessageToQueue(NXSystemMessages.notAllowed, undefined, undefined);
      }
    } else {
      const navaid = await this.parseNavaid(ident, true);

      if (navaid && navaid.subSectionCode === NavaidSubsectionCode.VhfNavaid) {
        if (
          this.props.fmcService.master?.navaidTuner.deselectedNavaids.find(
            (databaseId) => databaseId === navaid.databaseId,
          )
        ) {
          this.props.fmcService.master.addMessageToQueue(
            NXSystemMessages.xxxIsDeselected.getModifiedMessage(navaid.ident),
            undefined,
            undefined,
          );
        } else {
          this.props.fmcService.master?.navaidTuner.setManualVor(index, navaid);
        }
      }
    }
    this.onNewData();
  }

  private async handleVorFreq(index: 1 | 2, freq: number | null) {
    if (freq === null) {
      const vor = this.props.fmcService.master?.navaidTuner.getVorRadioTuningStatus(index);
      if (MfdFmsPositionNavaids.isNavRadioFreqManual(vor)) {
        this.props.fmcService.master?.navaidTuner.setManualVor(index, null);
      } else {
        this.props.fmcService.master?.addMessageToQueue(NXSystemMessages.notAllowed, undefined, undefined);
      }
    } else {
      this.props.fmcService.master?.navaidTuner.setManualVor(index, freq);
    }
    this.onNewData();
  }

  private async handleIlsIdent(ident: string | null) {
    if (this.props.fmcService.master?.navaidTuner.isMmrTuningLocked()) {
      this.props.fmcService.master.addMessageToQueue(NXSystemMessages.notAllowed, undefined, undefined);
    }

    if (ident === null || ident === '') {
      const mmr = this.props.fmcService.master?.navaidTuner.getMmrRadioTuningStatus(1);
      if (MfdFmsPositionNavaids.isNavRadioIdentManual(mmr)) {
        this.props.fmcService.master?.navaidTuner.setManualIls(null);
      } else {
        this.props.fmcService.master?.addMessageToQueue(NXSystemMessages.notAllowed, undefined, undefined);
      }
    } else {
      const ils = await NavigationDatabaseService.activeDatabase.backendDatabase.getILSs([ident]);
      const deduplicatedIls = await this.props.mfd.deduplicateFacilities(ils);
      if (deduplicatedIls) {
        await this.props.fmcService.master?.navaidTuner.setManualIls(deduplicatedIls);
      }
    }
    this.onNewData();
  }

  private async handleIlsFreq(freq: number | null) {
    if (freq === null) {
      const ils = this.props.fmcService.master?.navaidTuner.getMmrRadioTuningStatus(1);
      if (MfdFmsPositionNavaids.isNavRadioFreqManual(ils)) {
        this.props.fmcService.master?.navaidTuner.setManualIls(null);
      } else {
        this.props.fmcService.master?.addMessageToQueue(NXSystemMessages.notAllowed, undefined, undefined);
      }
    } else {
      this.props.fmcService.master?.navaidTuner.setManualIls(freq);
    }
    this.onNewData();
  }

  async deselectionHandler(nV: string | null, oV: string | null | undefined) {
    if (nV) {
      const navaid = await this.parseNavaid(nV);
      if (navaid) {
        this.props.fmcService.master?.navaidTuner.deselectNavaid(navaid.databaseId);
      }
    } else if (oV) {
      const navaid = await this.parseNavaid(oV);
      if (navaid) {
        this.props.fmcService.master?.navaidTuner.reselectNavaid(navaid.databaseId);
      }
    }
    this.onNewData();
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.props.mfd.uiService.activeUri.sub((val) => {
        if (val.extra === 'display') {
          this.navaidsSelectedPageIndex.set(0);
        } else if (val.extra === 'nav') {
          this.navaidsSelectedPageIndex.set(1);
        }
      }, true),
    );

    const sub = this.props.bus.getSubscriber<ClockEvents & MfdSimvars>();
    this.subs.push(
      sub
        .on('realTime')
        .atFrequency(1)
        .handle((_t) => {
          this.onNewData();
        }),
    );
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
            tabBarSlantedEdgeAngle={25}
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
                      containerStyle="width: 125px;"
                      alignText="center"
                      errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </div>
                  <div class="mfd-position-navaids-row">
                    <InputField<number>
                      dataEntryFormat={new FrequencyVORDMEFormat()}
                      dataHandlerDuringValidation={async (v) => this.handleVorFreq(1, v)}
                      mandatory={Subject.create(false)}
                      enteredByPilot={this.vor1FreqEnteredByPilot}
                      value={this.vor1Freq}
                      containerStyle="width: 125px;"
                      alignText="center"
                      errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </div>
                  <div class="mfd-position-navaids-row">
                    <InputField<number>
                      dataEntryFormat={new InboundCourseFormat()}
                      dataHandlerDuringValidation={async (v) => {
                        this.props.fmcService.master?.navaidTuner.setVorCourse(1, v || null);
                      }}
                      mandatory={Subject.create(false)}
                      value={this.vor1Course}
                      containerStyle="width: 125px;"
                      alignText="center"
                      errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </div>
                  <div class="mfd-position-navaids-row">
                    <span class="mfd-value">{this.vor1Class}</span>
                  </div>
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
                      containerStyle="width: 125px;"
                      alignText="center"
                      errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </div>
                  <div class="mfd-position-navaids-row">
                    <InputField<number>
                      dataEntryFormat={new FrequencyVORDMEFormat()}
                      dataHandlerDuringValidation={async (v) => this.handleVorFreq(2, v)}
                      mandatory={Subject.create(false)}
                      enteredByPilot={this.vor2FreqEnteredByPilot}
                      value={this.vor2Freq}
                      containerStyle="width: 125px;"
                      alignText="center"
                      errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </div>
                  <div class="mfd-position-navaids-row">
                    <InputField<number>
                      dataEntryFormat={new InboundCourseFormat()}
                      dataHandlerDuringValidation={async (v) => {
                        this.props.fmcService.master?.navaidTuner.setVorCourse(2, v || null);
                      }}
                      mandatory={Subject.create(false)}
                      value={this.vor2Course}
                      containerStyle="width: 125px;"
                      alignText="center"
                      errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </div>
                  <div class="mfd-position-navaids-row">
                    <span class="mfd-value">{this.vor2Class}</span>
                  </div>
                </div>
              </div>
              <div style="height: 5px; width: 100%; border-bottom: 2px solid darkgrey;" />
            </TopTabNavigatorPage>
            <TopTabNavigatorPage>
              {/* SELECTED FOR FMS NAV */}
              <div class="mfd-pos-nav-nav-table">
                <div class="mfd-label br bb">IDENT</div>
                <div class="mfd-label br bb">FREQ/CHAN</div>
                <div class="mfd-label bb">CLASS</div>
                <div class="mfd-label br">{this.firstRowIdent}</div>
                <div class="mfd-value br">{this.firstRowFrequency}</div>
                <div class="mfd-value">{this.firstRowClass}</div>
                <div class="mfd-label br">{this.secondRowIdent}</div>
                <div class="mfd-value br">{this.secondRowFrequency}</div>
                <div class="mfd-value">{this.secondRowClass}</div>
                <div class="mfd-label br">
                  <div ref={this.thirdRowIdentRef}>
                    <Button
                      label={this.thirdRowIdent.map((it) => (
                        <>{it}</>
                      ))}
                      onClick={() => {}}
                      showArrow
                      menuItems={Subject.create([{ label: 'DATA NAVAID', action: () => {} }])}
                      idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_dataNavaid`}
                      disabled={Subject.create(true)}
                    />
                  </div>
                </div>
                <div class="mfd-value br">{this.thirdRowFrequency}</div>
                <div class="mfd-value">{this.thirdRowClass}</div>
              </div>
              <div class="mfd-label" style="padding-left: 30px; margin-bottom: 20px;">
                RADIO NAV MODE
              </div>
              <div class="mfd-label" style="padding-left: 30px; margin-bottom: 10px;">
                RADIO POSITION
              </div>
              <div style="border-bottom: 1px solid lightgrey; width: 100%; height: 3px; margin-bottom: 15px;" />
              <div class="mfd-label" style="padding-left: 15px; margin-bottom: 10px;">
                LIST OF DESELECTED NAVAIDS
              </div>
              <div style="width: 45%; display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div>
                  <InputField<string>
                    dataEntryFormat={new NavaidIdentFormat('-')}
                    dataHandlerDuringValidation={this.deselectionHandler.bind(this)}
                    value={this.deselectedNavaids[0]}
                    alignText="center"
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div>
                  <InputField<string>
                    dataEntryFormat={new NavaidIdentFormat('-')}
                    dataHandlerDuringValidation={this.deselectionHandler.bind(this)}
                    value={this.deselectedNavaids[1]}
                    alignText="center"
                    disabled={this.deselectedNavaids[0].map((it) => it === null)}
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div>
                  <InputField<string>
                    dataEntryFormat={new NavaidIdentFormat('-')}
                    dataHandlerDuringValidation={this.deselectionHandler.bind(this)}
                    value={this.deselectedNavaids[2]}
                    alignText="center"
                    disabled={this.deselectedNavaids[1].map((it) => it === null)}
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
              </div>
              <div style="width: 45%; display: flex; justify-content: space-between;">
                <div>
                  <InputField<string>
                    dataEntryFormat={new NavaidIdentFormat('-')}
                    dataHandlerDuringValidation={this.deselectionHandler.bind(this)}
                    value={this.deselectedNavaids[3]}
                    alignText="center"
                    disabled={this.deselectedNavaids[2].map((it) => it === null)}
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div>
                  <InputField<string>
                    dataEntryFormat={new NavaidIdentFormat('-')}
                    dataHandlerDuringValidation={this.deselectionHandler.bind(this)}
                    value={this.deselectedNavaids[4]}
                    alignText="center"
                    disabled={this.deselectedNavaids[3].map((it) => it === null)}
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div>
                  <InputField<string>
                    dataEntryFormat={new NavaidIdentFormat('-')}
                    dataHandlerDuringValidation={this.deselectionHandler.bind(this)}
                    value={this.deselectedNavaids[5]}
                    alignText="center"
                    disabled={this.deselectedNavaids[4].map((it) => it === null)}
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
              </div>
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
                  dataHandlerDuringValidation={async (v) => (v ? this.handleIlsIdent(v) : false)}
                  mandatory={Subject.create(false)}
                  enteredByPilot={this.lsIdentEnteredByPilot}
                  value={this.lsIdent}
                  containerStyle="width: 125px;"
                  alignText="center"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>
              <div class="mfd-position-navaids-row">
                <InputField<number>
                  dataEntryFormat={new FrequencyILSFormat()}
                  dataHandlerDuringValidation={async (v) => (v ? this.handleIlsFreq(v) : false)}
                  mandatory={Subject.create(false)}
                  enteredByPilot={this.lsFrequencyEnteredByPilot}
                  value={this.lsFreq}
                  containerStyle="width: 125px;"
                  alignText="center"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>
              <div class="mfd-position-navaids-row">
                <InputField<number>
                  dataEntryFormat={new LsCourseFormat()}
                  dataHandlerDuringValidation={async (v) => {
                    this.props.fmcService.master?.navaidTuner.setIlsCourse(
                      v !== null ? Math.abs(v) : null,
                      v && v < 0 ? true : false,
                    );
                  }}
                  mandatory={Subject.create(false)}
                  enteredByPilot={this.lsCourseEnteredByPilot}
                  value={this.lsCourse}
                  containerStyle="width: 125px;"
                  alignText="center"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>
              <div class="mfd-position-navaids-row">
                <div class="mfd-label-value-container">
                  <span class="mfd-value">{this.lsSlope}</span>
                  <span class="mfd-label-unit mfd-unit-trailing">°</span>
                </div>
              </div>
              <div class="mfd-position-navaids-row">
                <span class="mfd-value">{this.lsClass}</span>
              </div>
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
                onClick={() => {
                  this.deselectGlide();
                }}
                buttonStyle="width: 225px;"
              />
            </div>
          </div>
          <div style="flex-grow: 1;" />
          {/* fill space vertically */}
          <div style="width: 150px;">
            <Button
              label="RETURN"
              onClick={() => this.props.mfd.uiService.navigateTo('back')}
              buttonStyle="margin-right: 5px;"
            />
          </div>
        </div>
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
