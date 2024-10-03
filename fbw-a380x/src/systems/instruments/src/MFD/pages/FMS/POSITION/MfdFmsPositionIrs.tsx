import { ClockEvents, FSComponent, MappedSubject, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdFmsPositionIrs.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { Button } from 'instruments/src/MFD/pages/common/Button';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { HeadingFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Arinc429Register, Arinc429RegisterSubject, Arinc429Word, coordinateToString } from '@flybywiresim/fbw-sdk';

interface MfdFmsPositionIrsProps extends AbstractMfdPageProps {}

enum IrsDataFor {
  NONE = 0,
  IRS_1 = 1,
  IRS_2 = 2,
  IRS_3 = 3,
}

type IrsStatus = 'NAV' | 'ALIGN' | 'ATT' | 'INVALID' | 'OFF' | '';

export class MfdFmsPositionIrs extends FmsPage<MfdFmsPositionIrsProps> {
  private ir1MaintWord = Arinc429RegisterSubject.createEmpty();

  private ir2MaintWord = Arinc429RegisterSubject.createEmpty();

  private ir3MaintWord = Arinc429RegisterSubject.createEmpty();

  private alignmentLabel = Subject.create<string>('----');

  private alignmentPosition = Subject.create<string>('---');

  private alignOnOtherRefDisabled = Subject.create<boolean>(true);

  private irs1Status = Subject.create<IrsStatus>('');

  private irs1SecondColumn = Subject.create<string>('');

  private irs1ThirdColumn = Subject.create<string>('');

  private irs2Status = Subject.create<IrsStatus>('');

  private irs2SecondColumn = Subject.create<string>('');

  private irs2ThirdColumn = Subject.create<string>('');

  private irs3Status = Subject.create<IrsStatus>('');

  private irs3SecondColumn = Subject.create<string>('');

  private irs3ThirdColumn = Subject.create<string>('');

  private setHdgDivRef = FSComponent.createRef<HTMLDivElement>();

  private setHdgValue = Subject.create<number | null>(null);

  private irsDataRef = FSComponent.createRef<HTMLDivElement>();

  private showIrsDataFor = Subject.create<IrsDataFor>(IrsDataFor.IRS_1);

  private irs1DataVisible = Subject.create<boolean>(false);

  private irs2DataVisible = Subject.create<boolean>(false);

  private irs3DataVisible = Subject.create<boolean>(false);

  private irsDataFreezeButtonDisabled = Subject.create(true);

  private irsDataPosition = Subject.create<string>('');

  private irsDataTrueTrack = Subject.create<string>('');

  private irsDataGroundSpeed = Subject.create<string>('');

  private irsDataTrueWindDirection = Subject.create<string>('');

  private irsDataTrueWindSpeed = Subject.create<string>('');

  private irsDataTrueHeading = Subject.create<string>('');

  private irsDataMagneticHeading = Subject.create<string>('');

  private irsDataMagneticVariation = Subject.create<string>('');

  private irsDataMagneticVariationUnit = Subject.create<string>('');

  private irsDataGpirsPosition = Subject.create<string>('');

  private irsDataAccuracy = Subject.create<string>('');

  private irsAreAligned = MappedSubject.create(
    ([ir1, ir2, ir3]) => ['NAV', 'ATT'].includes(ir1) && ['NAV', 'ATT'].includes(ir2) && ['NAV', 'ATT'].includes(ir3),
    this.irs1Status,
    this.irs2Status,
    this.irs3Status,
  );

  private irsAreAlignedOnRefPos = Subject.create<boolean>(false);

  protected onNewData() {}

  private changeIrsData(showDataFor: IrsDataFor) {
    this.irs1DataVisible.set(showDataFor === IrsDataFor.IRS_1);
    this.irs2DataVisible.set(showDataFor === IrsDataFor.IRS_2);
    this.irs3DataVisible.set(showDataFor === IrsDataFor.IRS_3);
    this.irsDataRef.instance.style.visibility = showDataFor === IrsDataFor.NONE ? 'hidden' : 'visible';
    this.updateIrsData();
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<ClockEvents & MfdSimvars>();

    this.subs.push(sub.on('adirs1MaintWord').handle((w) => this.ir1MaintWord.setWord(w)));
    this.subs.push(sub.on('adirs2MaintWord').handle((w) => this.ir2MaintWord.setWord(w)));
    this.subs.push(sub.on('adirs3MaintWord').handle((w) => this.ir3MaintWord.setWord(w)));

    this.subs.push(this.showIrsDataFor.sub((v) => this.changeIrsData(v), true));

    this.subs.push(
      this.irsAreAligned.sub((v) => {
        if (v) {
          if (this.irsAreAlignedOnRefPos.get()) {
            this.alignmentLabel.set('IRS ALIGNED ON REF POS:');
          } else {
            this.alignmentLabel.set('IRS ALIGNED ON GPS POS:');
          }
          this.alignmentPosition.set(
            coordinateToString(this.props.fmcService.master?.navigation.getPpos() ?? { lat: 0, long: 0 }, false),
          );
        } else {
          if (this.irsAreAlignedOnRefPos.get()) {
            this.alignmentLabel.set('IRS ALIGNING ON REF POS:');
          } else {
            this.alignmentLabel.set('IRS ALIGNING ON GPS POS:');
          }
          this.alignmentPosition.set(
            coordinateToString(this.props.fmcService.master?.navigation.getPpos() ?? { lat: 0, long: 0 }, false),
          );
        }
      }, true),
    );

    this.subs.push(
      this.ir1MaintWord.sub(
        (v) => this.setIrsStatusColumns(1, v, this.irs1Status, this.irs1SecondColumn, this.irs1ThirdColumn),
        true,
      ),
    );
    this.subs.push(
      this.ir2MaintWord.sub(
        (v) => this.setIrsStatusColumns(2, v, this.irs2Status, this.irs2SecondColumn, this.irs2ThirdColumn),
        true,
      ),
    );
    this.subs.push(
      this.ir3MaintWord.sub(
        (v) => this.setIrsStatusColumns(3, v, this.irs3Status, this.irs3SecondColumn, this.irs3ThirdColumn),
        true,
      ),
    );

    this.subs.push(
      sub
        .on('realTime')
        .atFrequency(1)
        .handle((_t) => {
          this.updateIrsData();
        }),
    );

    this.setHdgDivRef.instance.style.visibility = 'hidden';
  }

  private updateIrsData() {
    const ir = this.showIrsDataFor.get();

    if (ir !== IrsDataFor.NONE) {
      const lat = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${ir}_LATITUDE`);
      const long = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${ir}_LONGITUDE`);

      this.irsDataPosition.set(coordinateToString({ lat: lat.value, long: long.value }, false));
      this.irsDataTrueTrack.set(Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${ir}_TRUE_TRACK`).value.toFixed(1));
      this.irsDataGroundSpeed.set(Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${ir}_GROUND_SPEED`).value.toFixed(1));
      this.irsDataTrueWindDirection.set(
        Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${ir}_WIND_DIRECTION`).value.toFixed(1),
      );
      this.irsDataTrueWindSpeed.set(
        `/${Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${ir}_WIND_SPEED`).value.toFixed(1)}`,
      );
      this.irsDataTrueHeading.set(Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${ir}_TRUE_HEADING`).value.toFixed(1));
      this.irsDataMagneticHeading.set(Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${ir}_HEADING`).value.toFixed(1));

      const magVar =
        Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${ir}_HEADING`).value -
        Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${ir}_TRUE_HEADING`).value;
      this.irsDataMagneticVariation.set(Math.abs(magVar).toFixed(1));
      this.irsDataMagneticVariationUnit.set(magVar < 0 ? '°W' : '°E');
      this.irsDataGpirsPosition.set(
        coordinateToString(this.props.fmcService.master?.navigation.getPpos() ?? { lat: 0, long: 0 }, false),
      );
      this.irsDataAccuracy.set(this.props.fmcService.master?.navigation.getEpe().toFixed(0) ?? '');
    }
  }

  private alignDurationLeft(v: Arinc429Register): string {
    if (v.bitValue(16) && v.bitValue(17) && v.bitValue(18)) {
      return 'AVAIL IN \u003e 7 MIN';
    }
    if (v.bitValue(17) && v.bitValue(18)) {
      return 'AVAIL IN 6 MIN';
    }
    if (v.bitValue(16) && v.bitValue(18)) {
      return 'AVAIL IN 5 MIN';
    }
    if (v.bitValue(18)) {
      return 'AVAIL IN 4 MIN';
    }
    if (v.bitValue(16) && v.bitValue(17)) {
      return 'AVAIL IN 3 MIN';
    }
    if (v.bitValue(17)) {
      return 'AVAIL IN 2 MIN';
    }
    if (v.bitValue(16)) {
      return 'AVAIL IN 1 MIN';
    }
    return '';
  }

  private setIrsStatusColumns(
    ir: number,
    v: Arinc429Register,
    first: Subject<IrsStatus>,
    second: Subject<string>,
    third: Subject<string>,
  ) {
    const knob: number = SimVar.GetSimVarValue(`L:A32NX_OVHD_ADIRS_IR_${ir}_MODE_SELECTOR_KNOB`, 'Enum');

    if (knob === 1 || knob === 2) {
      if (v.bitValue(1)) {
        first.set('ALIGN');
        second.set(this.alignDurationLeft(v));
      } else if (v.bitValue(2)) {
        first.set('ATT');
      } else if (v.bitValue(3)) {
        first.set('NAV');
      } else {
        first.set('INVALID');
      }

      // Third column
      if (v.bitValue(4)) {
        third.set('ENTER HDG');
      }

      if (v.bitValue(9) || v.bitValue(14)) {
        third.set('IR FAULT');
      } else if (v.bitValue(4)) {
        third.set('ENTER HDG');
      } else if (v.bitValue(13)) {
        third.set('EXCESS MOTION');
      } else if (v.bitValue(8)) {
        third.set('SWITCH ADR');
      } else {
        third.set('');
      }
    } else {
      first.set('OFF');
    }
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="mfd-page-container">
          <div class="fr" style="margin: 15px;">
            <div style="flex: 1; display: flex; justify-content: center; align-items: center;">
              <span class="mfd-label" style="color: #e68000">
                {this.alignmentLabel}
              </span>
            </div>
            <div style="flex: 1 display: flex; justify-content: center; align-items: center;">
              <span class="mfd-value bigger">{this.alignmentPosition}</span>
            </div>
          </div>
          <div class="fr" style="padding-bottom: 20px; border-bottom: 2px solid lightgrey;">
            <Button disabled={this.alignOnOtherRefDisabled} label="ALIGN ON<br />OTHER REF" onClick={() => {}} />
          </div>
          <div class="fr" style="margin-top: 40px;">
            <div class="mfd-position-irs-table-col1">
              <span class="mfd-label">IRS 1</span>
            </div>
            <div class="mfd-position-irs-table-col2">
              <span class="mfd-value bigger">{this.irs1Status}</span>
            </div>
            <div class="mfd-position-irs-table-col3">
              <span class="mfd-value">{this.irs1SecondColumn}</span>
            </div>
            <div class="mfd-position-irs-table-col4">
              <span class="mfd-value">{this.irs1ThirdColumn}</span>
            </div>
          </div>
          <div class="fr">
            <div class="mfd-position-irs-table-col1">
              <span class="mfd-label">IRS 2</span>
            </div>
            <div class="mfd-position-irs-table-col2">
              <span class="mfd-value bigger">{this.irs2Status}</span>
            </div>
            <div class="mfd-position-irs-table-col3">
              <span class="mfd-value">{this.irs2SecondColumn}</span>
            </div>
            <div class="mfd-position-irs-table-col4">
              <span class="mfd-value">{this.irs2ThirdColumn}</span>
            </div>
          </div>
          <div class="fr">
            <div class="mfd-position-irs-table-col1 mfd-position-irs-table-last-row">
              <span class="mfd-label">IRS 3</span>
            </div>
            <div class="mfd-position-irs-table-col2 mfd-position-irs-table-last-row">
              <span class="mfd-value bigger">{this.irs3Status}</span>
            </div>
            <div class="mfd-position-irs-table-col3 mfd-position-irs-table-last-row">
              <span class="mfd-value">{this.irs3SecondColumn}</span>
            </div>
            <div class="mfd-position-irs-table-col4 mfd-position-irs-table-last-row">
              <span class="mfd-value">{this.irs3ThirdColumn}</span>
            </div>
          </div>
          <div
            ref={this.setHdgDivRef}
            class="fr"
            style="justify-content: flex-end; align-items: center; margin-top: 10px; margin-bottom: 20px;"
          >
            <span class="mfd-label">SET HDG</span>
            <InputField<number>
              dataEntryFormat={new HeadingFormat()}
              value={this.setHdgValue}
              mandatory={Subject.create(true)}
              alignText="flex-end"
              containerStyle="width: 150px; margin-left: 10px;"
              errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
              hEventConsumer={this.props.mfd.hEventConsumer}
              interactionMode={this.props.mfd.interactionMode}
            />
          </div>
          <div class="mfd-position-irs-irs-button-row">
            <Button
              label="IRS1"
              onClick={() => this.showIrsDataFor.set(this.irs1DataVisible.get() ? IrsDataFor.NONE : IrsDataFor.IRS_1)}
              selected={this.irs1DataVisible}
              buttonStyle="width: 150px; margin-right: 3px;"
            />
            <Button
              label="IRS2"
              onClick={() => this.showIrsDataFor.set(this.irs2DataVisible.get() ? IrsDataFor.NONE : IrsDataFor.IRS_2)}
              selected={this.irs2DataVisible}
              buttonStyle="width: 150px; margin-right: 3px;"
            />
            <Button
              label="IRS3"
              onClick={() => this.showIrsDataFor.set(this.irs3DataVisible.get() ? IrsDataFor.NONE : IrsDataFor.IRS_3)}
              selected={this.irs3DataVisible}
              buttonStyle="width: 150px;"
            />
          </div>
          <div ref={this.irsDataRef} class="fc" style="border: 2px outset lightgrey; padding: 2px 15px 15px 15px;">
            <div class="fr" style="justify-content: space-between; margin-bottom: 15px;">
              <div style="align-self: flex-start;">
                <Button disabled={this.irsDataFreezeButtonDisabled} label="FREEZE<br />ALL IRS" onClick={() => {}} />
              </div>
              <div style="align-self: flex-end;">
                <span class="mfd-label" style="margin-right: 20px;">
                  POSITION
                </span>
                <span class="mfd-value bigger">{this.irsDataPosition}</span>
              </div>
            </div>
            <div class="fr">
              <div style="flex: 1; display: flex; justify-content: flex-end; align-items: center; padding: 7px;">
                <span class="mfd-label">T.TRK</span>
              </div>
              <div class="mfd-label-value-container" style="flex: 1.5; justify-content: flex-end; align-items: center;">
                <span class="mfd-value bigger">{this.irsDataTrueTrack}</span>
                <span class="mfd-label-unit mfd-unit-trailing">°T</span>
              </div>
              <div style="flex: 1; display: flex; justify-content: flex-end; align-items: center; padding: 7px;">
                <span class="mfd-label">T.HDG</span>
              </div>
              <div class="mfd-label-value-container" style="flex: 1; justify-content: flex-end;">
                <span class="mfd-value bigger">{this.irsDataTrueHeading}</span>
                <span class="mfd-label-unit mfd-unit-trailing">°T</span>
              </div>
            </div>
            <div class="fr">
              <div style="flex: 1; display: flex; justify-content: flex-end; align-items: center; padding: 7px;">
                <span class="mfd-label">GND SPD</span>
              </div>
              <div class="mfd-label-value-container" style="flex: 1.5; justify-content: flex-end;">
                <span class="mfd-value bigger">{this.irsDataGroundSpeed}</span>
                <span class="mfd-label-unit mfd-unit-trailing">KT</span>
              </div>
              <div style="flex: 1; display: flex; justify-content: flex-end; align-items: center; padding: 7px;">
                <span class="mfd-label">MAG HDG</span>
              </div>
              <div class="mfd-label-value-container" style="flex: 1; justify-content: flex-end;">
                <span class="mfd-value bigger">{this.irsDataMagneticHeading}</span>
                <span class="mfd-label-unit mfd-unit-trailing">°{'\xa0'}</span>
              </div>
            </div>
            <div class="fr" style="border-bottom: 2px solid lightgrey; margin-bottom: 15px;">
              <div style="flex: 1; display: flex; justify-content: flex-end; align-items: center; padding: 7px;">
                <span class="mfd-label">T.WIND</span>
              </div>
              <div class="mfd-label-value-container" style="flex: 1.5; justify-content: flex-end;">
                <span class="mfd-value bigger">{this.irsDataTrueWindDirection}</span>
                <span class="mfd-label-unit mfd-unit-trailing">°</span>
                <span class="mfd-value bigger">{this.irsDataTrueWindSpeed}</span>
                <span class="mfd-label-unit mfd-unit-trailing">KT</span>
              </div>
              <div style="flex: 1; display: flex; justify-content: flex-end; align-items: center; padding: 7px;">
                <span class="mfd-label">MAG VAR</span>
              </div>
              <div class="mfd-label-value-container" style="flex: 1; justify-content: flex-end;">
                <span class="mfd-value bigger">{this.irsDataMagneticVariation}</span>
                <span class="mfd-label-unit mfd-unit-trailing">{this.irsDataMagneticVariationUnit}</span>
              </div>
            </div>
            <div class="fc" style="display: flex; align-items: flex-end; padding-right: 15px;">
              <div class="mfd-label-value-container">
                <span class="mfd-label mfd-spacing-right">GPIRS POSITION</span>
                <span class="mfd-value bigger" style="width: 325px;">
                  {this.irsDataGpirsPosition}
                </span>
              </div>
              <div class="mfd-label-value-container">
                <span class="mfd-label mfd-spacing-right">ACCURACY</span>
                <span class="mfd-value bigger" style="width: 300px; text-align: right;">
                  {this.irsDataAccuracy}
                </span>
                <span class="mfd-label-unit" style="width: 25px;">
                  FT
                </span>
              </div>
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
