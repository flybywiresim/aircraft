import {
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  SimVarValueType,
  Subject,
  SubscribableMapFunctions,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';

import './MfdSurvControls.scss';

import { MfdSurvEvents } from 'instruments/src/MsfsAvionicsCommon/providers/MfdSurvPublisher';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import { SquawkFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { RadioButtonColor, RadioButtonGroup } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/RadioButtonGroup';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { SurvButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/SurvButton';

interface MfdSurvControlsProps extends AbstractMfdPageProps {}

export enum TransponderState {
  Off = 0,
  Standby = 1,
  Test = 2,
  ModeA = 3,
  ModeC = 4,
  ModeS = 5,
}

export class MfdSurvControls extends DisplayComponent<MfdSurvControlsProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private readonly subs = [] as Subscription[];

  private readonly sub = this.props.bus.getSubscriber<MfdSimvars & MfdSurvEvents>();

  private readonly xpdrFailed = Subject.create<boolean>(false);

  private readonly squawkCode = Subject.create<number | null>(null);

  private readonly xpdrAltRptgAvailable = Subject.create<boolean>(true);

  private readonly xpdrSetAltReportingRequest = ConsumerSubject.create(this.sub.on('mfd_xpdr_set_alt_reporting'), true);

  private readonly xpdrState = ConsumerSubject.create(this.sub.on('xpdrState'), TransponderState.Off);

  private readonly xpdrAltRptgOn = Subject.create<boolean>(true);
  private readonly xpdrAltRptgDisabled = MappedSubject.create(
    ([failed, avail]) => failed || !avail,
    this.xpdrFailed,
    this.xpdrAltRptgAvailable,
  );

  private readonly xpdrStatusSelectedIndex = Subject.create<number | null>(0);
  private readonly xpdrStatusRadioColor = this.xpdrStatusSelectedIndex.map((it) =>
    it === 0 ? RadioButtonColor.Green : RadioButtonColor.White,
  );

  private readonly tcasFailed = ConsumerSubject.create(this.sub.on('tcasFail'), true);

  private readonly tcasRadioGroupDisabled = MappedSubject.create(
    ([tcasFailed, xpdrState]) =>
      Array(3).fill(tcasFailed || xpdrState === TransponderState.Off || xpdrState === TransponderState.Standby),
    this.tcasFailed,
    this.xpdrState,
  );

  private readonly tcasTaraSelectedIndex = Subject.create<number | null>(2);

  private readonly tcasNormAbvBlwSelectedIndex = Subject.create<number | null>(0);

  private readonly wxrFailed = Subject.create<boolean>(true);

  private readonly wxrElevnTiltSelectedIndex = Subject.create<number | null>(0);

  private readonly wxrAuto = Subject.create<boolean>(false);

  private readonly wxrPredWsAuto = Subject.create<boolean>(false);

  private readonly wxrTurbAuto = Subject.create<boolean>(false);

  private readonly wxrGainAuto = Subject.create<boolean>(true);

  private readonly wxrModeWx = Subject.create<boolean>(true);

  private readonly wxrOnVd = Subject.create<boolean>(false);

  private readonly activeSystemGroupWxrTaws = ConsumerSubject.create(this.sub.on('wxrTawsSysSelected'), 0);
  private readonly terr1Failed = ConsumerSubject.create(this.sub.on('terr1Failed'), false);
  private readonly gpws1Failed = ConsumerSubject.create(this.sub.on('gpws1Failed'), false);
  private readonly terr2Failed = ConsumerSubject.create(this.sub.on('terr2Failed'), false);
  private readonly gpws2Failed = ConsumerSubject.create(this.sub.on('gpws2Failed'), false);

  private readonly tawsTerrFailed = MappedSubject.create(
    ([selected, f1, f2]) => (selected === 1 ? f1 : selected === 2 ? f2 : true),
    this.activeSystemGroupWxrTaws,
    this.terr1Failed,
    this.terr2Failed,
  );

  private readonly tawsGpwsFailed = MappedSubject.create(
    ([selected, f1, f2]) => (selected === 1 ? f1 : selected === 2 ? f2 : true),
    this.activeSystemGroupWxrTaws,
    this.gpws1Failed,
    this.gpws2Failed,
  );

  private readonly allTawsFailed = MappedSubject.create(
    SubscribableMapFunctions.and(),
    this.tawsTerrFailed,
    this.tawsGpwsFailed,
  );

  private readonly tawsTerrSysOn = Subject.create<boolean>(true);

  private readonly tawsGpwsOn = Subject.create<boolean>(true);

  private readonly tawsGsModeOn = Subject.create<boolean>(true);

  private readonly tawsFlapModeOn = Subject.create<boolean>(true);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<MfdSimvars & MfdSurvEvents>();

    this.subs.push(
      sub
        .on('xpdrCode')
        .whenChanged()
        .handle((code) => {
          this.squawkCode.set(code);
        }),
    );

    this.subs.push(this.xpdrState.sub(() => this.xpdrStatusChanged(), true));
    this.subs.push(this.xpdrSetAltReportingRequest.sub(() => this.xpdrStatusChanged(), true));

    this.subs.push(sub.on('mfd_tcas_alert_level').handle((val) => this.tcasTaraSelectedIndex.set(2 - val)));

    this.subs.push(sub.on('mfd_tcas_alt_select').handle((val) => this.tcasNormAbvBlwSelectedIndex.set(val)));

    this.subs.push(
      sub
        .on('gpwsTerrOff')
        .whenChanged()
        .handle((it) => this.tawsTerrSysOn.set(!it)),
    );

    this.subs.push(
      sub
        .on('gpwsSysOff')
        .whenChanged()
        .handle((it) => this.tawsGpwsOn.set(!it)),
    );

    this.subs.push(
      sub
        .on('gpwsGsInhibit')
        .whenChanged()
        .handle((it) => this.tawsGsModeOn.set(!it)),
    );

    this.subs.push(
      sub
        .on('gpwsFlapsInhibit')
        .whenChanged()
        .handle((it) => this.tawsFlapModeOn.set(!it)),
    );

    this.subs.push(
      this.xpdrSetAltReportingRequest,
      this.xpdrState,
      this.xpdrAltRptgDisabled,
      this.xpdrStatusRadioColor,
      this.tcasFailed,
      this.tcasRadioGroupDisabled,
      this.activeSystemGroupWxrTaws,
      this.terr1Failed,
      this.terr2Failed,
      this.gpws1Failed,
      this.gpws2Failed,
      this.tawsTerrFailed,
      this.tawsGpwsFailed,
      this.allTawsFailed,
    );
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    for (const s of this.subs) {
      s.destroy();
    }

    super.destroy();
  }

  private xpdrStatusChanged() {
    const state = this.xpdrState.get();
    const isOnGround = this.props.fmcService.master?.fmgc.isOnGround();

    this.xpdrStatusSelectedIndex.set(
      state === TransponderState.ModeA || state === TransponderState.ModeC || state === TransponderState.ModeS ? 0 : 1,
    );

    // On ground, Mode C is inhibited, we can only update from transponder state once we're in the air
    this.xpdrAltRptgOn.set(
      isOnGround
        ? this.xpdrSetAltReportingRequest.get()
        : state === TransponderState.ModeC || state === TransponderState.ModeS,
    );
    this.xpdrAltRptgAvailable.set(
      state === TransponderState.ModeA || state === TransponderState.ModeC || state === TransponderState.ModeS,
    );
  }

  private setDefaultSettings() {
    if (!this.xpdrFailed.get()) {
      this.props.bus.getPublisher<MfdSurvEvents>().pub('mfd_xpdr_set_auto', true, true);
      this.props.bus.getPublisher<MfdSurvEvents>().pub('mfd_xpdr_set_alt_reporting', true, true);
    }

    if (!this.tcasFailed.get()) {
      this.props.bus.getPublisher<MfdSurvEvents>().pub('mfd_tcas_alert_level', 2, true); // TA/RA
      this.props.bus.getPublisher<MfdSurvEvents>().pub('mfd_tcas_alt_select', 0, true); // NORM
    }

    if (!this.wxrFailed.get()) {
      // FIXME replace with appropriate events
      this.wxrElevnTiltSelectedIndex.set(0);
      this.wxrAuto.set(true);
      this.wxrPredWsAuto.set(true);
      this.wxrTurbAuto.set(true);
      this.wxrGainAuto.set(true);
      this.wxrModeWx.set(true);
      this.wxrOnVd.set(true);
    }

    if (!this.tawsTerrFailed.get()) {
      SimVar.SetSimVarValue('L:A32NX_GPWS_TERR_OFF', SimVarValueType.Bool, false);
    }

    if (!this.tawsGpwsFailed.get()) {
      SimVar.SetSimVarValue('L:A32NX_GPWS_SYS_OFF', SimVarValueType.Bool, false);
      SimVar.SetSimVarValue('L:A32NX_GPWS_GS_OFF', SimVarValueType.Bool, false);
      SimVar.SetSimVarValue('L:A32NX_GPWS_FLAPS_OFF', SimVarValueType.Bool, false);
    }
  }

  render(): VNode {
    return (
      <>
        <ActivePageTitleBar
          activePage={Subject.create('CONTROLS')}
          offset={Subject.create('')}
          eoIsActive={Subject.create(false)}
          tmpyIsActive={Subject.create(false)}
        />
        {/* begin page content */}
        <div class="mfd-page-container">
          <div class="mfd-surv-controls-first-section">
            <div class="mfd-surv-controls-xpdr-section">
              <div class="mfd-surv-controls-xpdr-left">
                <div class={{ 'mfd-surv-heading': true, 'mfd-surv-xpdr-label': true, failed: this.xpdrFailed }}>
                  XPDR
                </div>
                <div class="mfd-label bigger" style="margin-top: 30px;">
                  SQWK
                </div>
                <InputField<number>
                  dataEntryFormat={new SquawkFormat()}
                  dataHandlerDuringValidation={async (v) =>
                    v ? SimVar.SetSimVarValue('K:XPNDR_SET', 'number', parseInt(v.toString(), 16)) : false
                  }
                  value={this.squawkCode}
                  containerStyle="width: 100px; margin-bottom: 5px;"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                  alignText={'center'}
                />
                <Button
                  label={'IDENT'}
                  onClick={() => SimVar.SetSimVarValue('K:XPNDR_IDENT_ON', SimVarValueType.Bool, true)}
                  buttonStyle="width: 100px;"
                />
                <div class="mfd-label bigger" style="margin-top: 20px; margin-bottom: 5px;">
                  ALT RPTG
                </div>
                <SurvButton
                  state={this.xpdrAltRptgOn}
                  disabled={this.xpdrAltRptgDisabled}
                  labelFalse={'OFF'}
                  labelTrue={'ON'}
                  onChanged={(v) => {
                    this.props.bus.getPublisher<MfdSurvEvents>().pub('mfd_xpdr_set_alt_reporting', v, true);
                  }}
                />
              </div>
              <div class="mfd-surv-controls-xpdr-right">
                <RadioButtonGroup
                  values={['AUTO', 'STBY']}
                  onModified={(val) =>
                    this.props.bus.getPublisher<MfdSurvEvents>().pub('mfd_xpdr_set_auto', val === 0, true)
                  }
                  selectedIndex={this.xpdrStatusSelectedIndex}
                  idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_survControlsXpdrStatus`}
                  additionalVerticalSpacing={50}
                  color={this.xpdrStatusRadioColor}
                />
              </div>
            </div>
            <div class="mfd-surv-controls-tcas-section">
              <div class={{ 'mfd-surv-heading': true, 'mfd-surv-tcas-label': true, failed: this.tcasFailed }}>TCAS</div>
              <div class="mfd-surv-controls-tcas-left">
                <RadioButtonGroup
                  values={['TA/RA', 'TA ONLY', 'STBY']}
                  onModified={(val) =>
                    this.props.bus.getPublisher<MfdSurvEvents>().pub('mfd_tcas_alert_level', 2 - val, true)
                  }
                  selectedIndex={this.tcasTaraSelectedIndex}
                  idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_survControlsTcasTara`}
                  additionalVerticalSpacing={10}
                  valuesDisabled={this.tcasRadioGroupDisabled}
                  color={Subject.create(RadioButtonColor.Green)}
                />
              </div>
              <div class="mfd-surv-controls-tcas-right">
                <RadioButtonGroup
                  values={['NORM', 'ABV', 'BLW']}
                  selectedIndex={this.tcasNormAbvBlwSelectedIndex}
                  onModified={(val) =>
                    this.props.bus.getPublisher<MfdSurvEvents>().pub('mfd_tcas_alt_select', val, true)
                  }
                  valuesDisabled={this.tcasRadioGroupDisabled}
                  idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_survControlsTcasNormAbvBlw`}
                  additionalVerticalSpacing={10}
                  color={Subject.create(RadioButtonColor.Green)}
                />
              </div>
            </div>
          </div>
          <div class="mfd-surv-controls-second-section">
            <div class="mfd-surv-controls-wxr-left">
              <div class={{ 'mfd-surv-heading': true, 'mfd-surv-wxr-label': true, failed: this.wxrFailed }}>WXR</div>
              <div class="mfd-label bigger" style="margin-top: 80px;">
                ELEVN/TILT
              </div>
              <RadioButtonGroup
                values={['AUTO', 'ELEVN', 'TILT']}
                selectedIndex={this.wxrElevnTiltSelectedIndex}
                idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_survControlswxrElevnTilt`}
                additionalVerticalSpacing={10}
                color={Subject.create(RadioButtonColor.Green)}
                valuesDisabled={Subject.create(Array(3).fill(true))}
              />
            </div>
            <div class="mfd-surv-controls-wxr-right">
              <div class="mfd-surv-controls-wxr-grid">
                <div class="mfd-surv-controls-wxr-grid-cell">
                  <div class="mfd-surv-label">WXR</div>
                  <SurvButton
                    state={this.wxrAuto}
                    disabled={this.wxrFailed}
                    labelFalse={'OFF'}
                    labelTrue={'AUTO'}
                    onChanged={() => {}}
                  />
                </div>
                <div class="mfd-surv-controls-wxr-grid-cell">
                  <div class="mfd-surv-label">PRED W/S</div>
                  <SurvButton
                    state={this.wxrPredWsAuto}
                    disabled={this.wxrFailed}
                    labelFalse={'OFF'}
                    labelTrue={'AUTO'}
                    onChanged={() => {}}
                  />
                </div>
                <div class="mfd-surv-controls-wxr-grid-cell">
                  <div class="mfd-surv-label">TURB</div>
                  <SurvButton
                    state={this.wxrTurbAuto}
                    disabled={this.wxrFailed}
                    labelFalse={'OFF'}
                    labelTrue={'AUTO'}
                    onChanged={() => {}}
                  />
                </div>
                <div class="mfd-surv-controls-wxr-grid-cell">
                  <div class="mfd-surv-label">GAIN</div>
                  <SurvButton
                    state={this.wxrGainAuto}
                    disabled={this.wxrFailed}
                    labelFalse={'MAN'}
                    labelTrue={'AUTO'}
                    onChanged={() => {}}
                  />
                </div>
                <div class="mfd-surv-controls-wxr-grid-cell">
                  <div class="mfd-surv-label">MODE</div>
                  <SurvButton
                    state={this.wxrModeWx}
                    disabled={this.wxrFailed}
                    labelFalse={'MAP'}
                    labelTrue={'WX'}
                    onChanged={() => {}}
                  />
                </div>
                <div class="mfd-surv-controls-wxr-grid-cell">
                  <div class="mfd-surv-label">WX ON VD</div>
                  <SurvButton
                    state={this.wxrOnVd}
                    disabled={this.wxrFailed}
                    labelFalse={'OFF'}
                    labelTrue={'AUTO'}
                    onChanged={() => {}}
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="mfd-surv-controls-third-section">
            <div class={{ 'mfd-surv-heading': true, 'mfd-surv-taws-label': true, failed: this.allTawsFailed }}>
              TAWS
            </div>
            <div class="mfd-surv-controls-taws-section">
              <div class="mfd-surv-controls-taws-element" style="padding-right: 50px;">
                <div class="mfd-surv-label">TERR SYS</div>
                <SurvButton
                  state={this.tawsTerrSysOn}
                  disabled={this.tawsTerrFailed}
                  labelFalse={'OFF'}
                  labelTrue={'ON'}
                  onChanged={(v) => SimVar.SetSimVarValue('L:A32NX_GPWS_TERR_OFF', SimVarValueType.Bool, !v)}
                />
              </div>
              <div class="mfd-surv-controls-taws-element">
                <div class="mfd-surv-label">GPWS</div>
                <SurvButton
                  state={this.tawsGpwsOn}
                  disabled={this.tawsGpwsFailed}
                  labelFalse={'OFF'}
                  labelTrue={'ON'}
                  onChanged={(v) => SimVar.SetSimVarValue('L:A32NX_GPWS_SYS_OFF', SimVarValueType.Bool, !v)}
                />
              </div>
              <div class="mfd-surv-controls-taws-element">
                <div class="mfd-surv-label">G/S MODE</div>
                <SurvButton
                  state={this.tawsGsModeOn}
                  disabled={this.tawsGpwsFailed}
                  labelFalse={'OFF'}
                  labelTrue={'ON'}
                  onChanged={(v) => SimVar.SetSimVarValue('L:A32NX_GPWS_GS_OFF', SimVarValueType.Bool, !v)}
                />
              </div>
              <div class="mfd-surv-controls-taws-element">
                <div class="mfd-surv-label">FLAP MODE</div>
                <SurvButton
                  state={this.tawsFlapModeOn}
                  disabled={this.tawsGpwsFailed}
                  labelFalse={'OFF'}
                  labelTrue={'ON'}
                  onChanged={(v) => SimVar.SetSimVarValue('L:A32NX_GPWS_FLAPS_OFF', SimVarValueType.Bool, !v)}
                />
              </div>
            </div>
            <div class="mfd-surv-controls-def-settings-container">
              <div class="mfd-surv-controls-def-settings">
                <div class="mfd-surv-label">SURV</div>
                <Button
                  label={'DEFAULT SETTINGS'}
                  onClick={() => this.setDefaultSettings()}
                  buttonStyle="width: 140px;"
                />
              </div>
            </div>
          </div>
        </div>
        {/* end page content */}
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
