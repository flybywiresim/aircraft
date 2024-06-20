import { DisplayComponent, FSComponent, SimVarValueType, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import './MfdSurvControls.scss';

import { MfdSurvEvents } from 'instruments/src/MsfsAvionicsCommon/providers/MfdSurvPublisher';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { SquawkFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { RadioButtonGroup } from 'instruments/src/MFD/pages/common/RadioButtonGroup';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { SurvButton } from 'instruments/src/MFD/pages/common/SurvButton';

interface MfdSurvControlsProps extends AbstractMfdPageProps {}

export class MfdSurvControls extends DisplayComponent<MfdSurvControlsProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  private readonly squawkCode = Subject.create<number | null>(null);

  private readonly xpdrAltRptgOn = Subject.create<boolean>(true);

  private readonly xpdrStatusSelectedIndex = Subject.create<number | null>(0);

  private readonly tcasTaraSelectedIndex = Subject.create<number | null>(0);

  private readonly tcasNormAbvBlwSelectedIndex = Subject.create<number | null>(0);

  private readonly wxrElevnTiltSelectedIndex = Subject.create<number | null>(0);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<MfdSimvars & MfdSurvEvents>();

    sub
      .on('xpdrCode')
      .whenChanged()
      .handle((code) => {
        this.squawkCode.set(code);
      });

    sub
      .on('mfd_xpdr_set_auto')
      .whenChanged()
      .handle((it) => this.xpdrStatusSelectedIndex.set(it ? 0 : 1));

    sub
      .on('mfd_xpdr_set_alt_reporting')
      .whenChanged()
      .handle((it) => this.xpdrAltRptgOn.set(it));

    this.subs.push(
      this.xpdrAltRptgOn.sub((it) =>
        this.props.bus.getPublisher<MfdSurvEvents>().pub('mfd_xpdr_set_alt_reporting', it, true),
      ),
    );
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  private xpdrStatusChanged(val: number) {
    this.props.bus.getPublisher<MfdSurvEvents>().pub('mfd_xpdr_set_auto', val === 0, true);
  }

  private setDefaultSettings() {
    // TODO
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
            <div style="width: 40%; display: flex; flex-direction: row; border-right: 2px solid lightgrey; margin-left: 5px;">
              <div style="display: flex; flex-direction: column; flex: 1; align-items: center;">
                <div class="mfd-label bigger" style="position: relative; left: 100px; top: 3px;">
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
                  ALT RTPG
                </div>
                <SurvButton state={this.xpdrAltRptgOn} labelOff={'OFF'} labelOn={'ON'} />
              </div>
              <div style="display: flex; flex-direction: column; flex; 1; align-items: center; justify-content: center; padding-right: 20px;">
                <RadioButtonGroup
                  values={['AUTO', 'STBY']}
                  onModified={(val) => this.xpdrStatusChanged(val)}
                  selectedIndex={this.xpdrStatusSelectedIndex}
                  idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_survControlsXpdrStatus`}
                  additionalVerticalSpacing={50}
                  greenActive={Subject.create(true)}
                />
              </div>
            </div>
            <div style="width: 60%; display: flex; flex-direction: row; border-right: 2px solid lightgrey; margin-left: 5px; padding-top: 75px;">
              <div class="mfd-label bigger" style="position: relative; left: 150px; top: -70px;">
                TCAS
              </div>
              <div style="display: flex; flex-direction: column; flex; 1; align-items: center; justify-content: center; padding-right: 40px; border-right: 2px solid lightgrey;">
                <RadioButtonGroup
                  values={['TA/RA', 'TA ONLY', 'STBY']}
                  selectedIndex={this.tcasTaraSelectedIndex}
                  idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_survControlsTcasTara`}
                  additionalVerticalSpacing={10}
                  greenActive={Subject.create(true)}
                  valuesDisabled={Subject.create(Array(3).fill(true))}
                />
              </div>
              <div style="display: flex; flex-direction: column; flex; 1; align-items: center; justify-content: center;">
                <RadioButtonGroup
                  values={['NORM', 'ABV', 'BLW']}
                  selectedIndex={this.tcasNormAbvBlwSelectedIndex}
                  idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_survControlsTcasNormAbvBlw`}
                  additionalVerticalSpacing={10}
                  greenActive={Subject.create(true)}
                  valuesDisabled={Subject.create(Array(3).fill(true))}
                />
              </div>
            </div>
          </div>
          <div class="mfd-surv-controls-second-section">
            <div style="width: 30%; display: flex; flex-direction: row; margin-left: 5px;">
              <div style="display: flex; flex-direction: column; flex: 1; align-items: center;">
                <div class="mfd-label bigger" style="position: relative; left: 100px; top: 3px;">
                  WXR
                </div>
                <div class="mfd-label bigger" style="margin-top: 80px;">
                  ELEVN/TILT
                </div>
                <RadioButtonGroup
                  values={['AUTO', 'ELEVN', 'TILT']}
                  selectedIndex={this.wxrElevnTiltSelectedIndex}
                  idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_survControlswxrElevnTilt`}
                  additionalVerticalSpacing={10}
                  greenActive={Subject.create(true)}
                  valuesDisabled={Subject.create(Array(3).fill(true))}
                />
              </div>
            </div>
            <div style="width: 70%; display: flex; flex-direction: row; margin-left: 5px; padding-top: 30px; align-items: center; justify-content: center;">
              <div style="display: grid; grid-template-columns: auto auto auto;">
                <div style="display: flex; flex-direction: column; align-items: center; margin: 20px;">
                  <div class="mfd-label">WXR</div>
                  <SurvButton state={Subject.create(true)} labelOff={'OFF'} labelOn={'AUTO'} />
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; margin: 20px;">
                  <div class="mfd-label">PRED W/S</div>
                  <SurvButton state={Subject.create(true)} labelOff={'OFF'} labelOn={'AUTO'} />
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; margin: 20px;">
                  <div class="mfd-label">TURB</div>
                  <SurvButton state={Subject.create(true)} labelOff={'OFF'} labelOn={'AUTO'} />
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; margin: 20px;">
                  <div class="mfd-label">GAIN</div>
                  <SurvButton state={Subject.create(true)} labelOff={'MAN'} labelOn={'AUTO'} />
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; margin: 20px;">
                  <div class="mfd-label">MODE</div>
                  <SurvButton state={Subject.create(true)} labelOff={'MAP'} labelOn={'WX'} />
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; margin: 20px;">
                  <div class="mfd-label">WX ON VD</div>
                  <SurvButton state={Subject.create(true)} labelOff={'OFF'} labelOn={'AUTO'} />
                </div>
              </div>
            </div>
          </div>
          <div class="mfd-surv-controls-third-section">
            <div class="mfd-label bigger" style="position: relative; left: 100px; top: -15px;">
              TAWS
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; margin: 10px; height: 100px;">
              <div class="mfd-label">TERR SYS</div>
              <SurvButton state={Subject.create(true)} labelOff={'OFF'} labelOn={'ON'} />
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; margin: 10px; height: 100px;">
              <div class="mfd-label">GPWS</div>
              <SurvButton state={Subject.create(true)} labelOff={'OFF'} labelOn={'ON'} />
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; margin: 10px; height: 100px;">
              <div class="mfd-label">G/S MODE</div>
              <SurvButton state={Subject.create(true)} labelOff={'OFF'} labelOn={'ON'} />
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; margin: 10px; height: 100px;">
              <div class="mfd-label">FLAP MODE</div>
              <SurvButton state={Subject.create(true)} labelOff={'OFF'} labelOn={'ON'} />
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; margin: 10px; height: 100px;">
              <div class="mfd-label">SURV</div>
              <Button
                label={'DEFAULT SETTINGS'}
                onClick={() => this.setDefaultSettings()}
                buttonStyle="width: 140px;"
              />
            </div>
          </div>
        </div>
        {/* end page content */}
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
