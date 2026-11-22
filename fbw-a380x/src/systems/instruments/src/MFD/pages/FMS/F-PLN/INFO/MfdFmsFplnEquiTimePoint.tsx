// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0
import { FmsPage } from '../../../common/FmsPage';
import {
  ClockEvents,
  ComponentProps,
  FSComponent,
  LifecycleComponent,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import './MfdFmsFplnEquiTimePoint.scss';
import { InputField } from '../../../../../MsfsAvionicsCommon/UiWidgets/InputField';
import { FixFormat, WindDirectionFormat, WindSpeedFormat } from '../../../common/DataEntryFormats';
import { Fix } from '@flybywiresim/fbw-sdk';
import { MfdDisplayInterface } from '../../../../MFD';
import { A380FmsError } from '../../../../shared/A380FmsError';
import { createVectorFromMagnitudeAndDirection, isWindVectorComplete } from '@fmgc/flightplanning/data/wind';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import { NXSystemMessages } from '../../../../shared/NXSystemMessages';
import { FmsError } from '@fmgc/FmsError';
import { ReturnButtonFooter } from '../../../common/ReturnButtonFooter';

enum EtpMessage {
  NO_ETP = 'ETP NOT FOUND',
  SEQUENCED = 'ETP SEQUENCED',
}

export class MfdFmsFplnEquiTimePoint extends FmsPage {
  private readonly timeToEtp = Subject.create('--:--');
  private readonly timeHeader = Subject.create('');
  private readonly distanceToEtp = Subject.create<number | null>(null);
  private readonly distanceToEtpDisplay = this.distanceToEtp
    .map((v) => (v != null ? v.toFixed(0).padStart(4, '\xa0') : '----'))
    .withLifecycle(this.defaultLifecycle);
  private readonly distancetoEtpUnitVisibility = this.distanceToEtp
    .map((v) => (v !== null ? 'visible' : 'hidden'))
    .withLifecycle(this.defaultLifecycle);

  // Ref fix 1
  private readonly bearingToRef1 = Subject.create<number | null>(null);
  private readonly distanceToRef1 = Subject.create<number | null>(null);
  private readonly timeToRef1 = Subject.create<string>('');
  private readonly ref1Fix = Subject.create<Fix | null>(null);
  private readonly ref1FixEnteredByPilot = Subject.create(false);
  private readonly ref1FixNotAvailable = this.ref1Fix.map((v) => v === null).withLifecycle(this.defaultLifecycle);
  private readonly ref1WindDirection = Subject.create<number | null>(null);
  private readonly ref1WindSpeed = Subject.create<number | null>(null);
  private readonly etpToRef1Bearing = Subject.create<number | null>(null);
  private readonly etpToRef1Distance = Subject.create<number | null>(null);
  private readonly etpToRef1Time = Subject.create('');

  // Ref fix 2
  private readonly bearingToRef2 = Subject.create<number | null>(null);
  private readonly distanceToRef2 = Subject.create<number | null>(null);
  private readonly timeToRef2 = Subject.create<string>('');
  private readonly ref2Fix = Subject.create<Fix | null>(null);
  private readonly ref2FixEnteredByPilot = Subject.create(false);
  private readonly ref2FixNotAvailable = this.ref2Fix.map((v) => v === null).withLifecycle(this.defaultLifecycle);
  private readonly ref2WindDirection = Subject.create<number | null>(null);
  private readonly ref2WindSpeed = Subject.create<number | null>(null);
  private readonly etpToRef2Bearing = Subject.create<number | null>(null);
  private readonly etpToRef2Distance = Subject.create<number | null>(null);
  private readonly etpToRef2Time = Subject.create('');

  // ETP INFO
  private readonly etpMessage = Subject.create<EtpMessage | null>(null);
  private readonly etpNotAvailable = this.etpMessage.map((v) => v !== null).withLifecycle(this.defaultLifecycle);
  private readonly etpComputed = Subject.create(false);
  private readonly etpWaypointIdent = Subject.create('');
  private readonly etpWaypointDistance = Subject.create('');

  public onAfterRender(node: VNode): void {
    this.props.bus
      .getSubscriber<ClockEvents>()
      .on('activeSimDuration')
      .atFrequency(1)
      .handle(() => this.update())
      .withLifecycle(this.defaultLifecycle);
    super.onAfterRender(node);
  }

  private update() {
    const etp = this.props.fmcService.master.getEquitimePoint();
    this.timeHeader.set(this.props.fmcService.master.getTimePredictionHeader().padEnd(4, '\xa0'));
    const etpEtaSeconds = etp.pposTimeToEtp !== undefined ? etp.pposTimeToEtp * 3600 : null;
    this.timeToEtp.set(this.props.fmcService.master.formatEta(etpEtaSeconds));
    this.distanceToEtp.set(etp.pposDistanceToEtp !== undefined ? Math.round(etp.pposDistanceToEtp) : null);
    //REF 1 information
    this.bearingToRef1.set(etp.pposBearingToReferenceFix1 ?? null);
    this.distanceToRef1.set(etp.pposDistanceToReferenceFix1 ?? null);
    this.timeToRef1.set(
      this.props.fmcService.master.formatEta(
        etp.pposTimeToReferenceFix1 !== undefined ? etp.pposTimeToReferenceFix1 * 3600 : null,
      ),
    );
    this.ref1Fix.set(etp.referenceFix1 ?? null);
    this.ref1FixEnteredByPilot.set(etp.referenceFix1 !== undefined && etp.isReferenceFix1PilotEntered);
    this.ref1WindDirection.set(etp.getWindToReferenceFix1().direction ?? null);
    this.ref1WindSpeed.set(etp.getWindToReferenceFix1().magnitude ?? null);
    this.etpToRef1Bearing.set(etp.etpBearingToReferenceFix1 ?? null);
    this.etpToRef1Distance.set(etp.etpDistanceToReferenceFix1 ?? null);
    this.etpToRef1Time.set(
      this.props.fmcService.master.formatEta(
        etp.etpTimeToReferenceFix1 !== undefined ? etp.etpTimeToReferenceFix1 * 3600 : null,
      ),
    );
    // REF 2
    this.bearingToRef2.set(etp.pposBearingToReferenceFix2 ?? null);
    this.distanceToRef2.set(etp.pposDistanceToReferenceFix2 ?? null);
    this.timeToRef2.set(
      this.props.fmcService.master.formatEta(
        etp.pposTimeToReferenceFix2 !== undefined ? etp.pposTimeToReferenceFix2 * 3600 : null,
      ),
    );
    this.ref2Fix.set(etp.referenceFix2 ?? null);
    this.ref2FixEnteredByPilot.set(etp.referenceFix2 !== undefined && etp.isReferenceFix2PilotEntered);
    this.ref2WindDirection.set(etp.getWindToReferenceFix2().direction ?? null);
    this.ref2WindSpeed.set(etp.getWindToReferenceFix2().magnitude ?? null);
    this.etpToRef2Bearing.set(etp.etpBearingToReferenceFix2 ?? null);
    this.etpToRef2Distance.set(etp.etpDistanceToReferenceFix2 ?? null);
    this.etpToRef2Time.set(
      this.props.fmcService.master.formatEta(
        etp.etpTimeToReferenceFix2 !== undefined ? etp.etpTimeToReferenceFix2 * 3600 : null,
      ),
    );
    const etpData = etp.get();
    const flightplan = this.props.fmcService.master.flightPlanInterface.hasActive
      ? this.props.fmcService.master.flightPlanInterface.active
      : null;
    this.etpComputed.set(etpData !== undefined);
    this.etpWaypointIdent.set(
      (etpData !== undefined && flightplan ? flightplan.legElementAt(etpData[2]).ident : '-------') + '/',
    );
    this.etpWaypointDistance.set(etpData !== undefined ? (-etpData[1]).toFixed(1) + '\xa0NM' : '-----.-');
    if ((etp.referenceFix1 !== undefined || etp.referenceFix2 !== undefined) && !etp.isEtpRecomputing().get()) {
      this.etpMessage.set(
        etp.isEtpSequenced().get() ? EtpMessage.SEQUENCED : etpData === undefined ? EtpMessage.NO_ETP : null,
      );
    } else {
      this.etpMessage.set(null);
    }
  }

  private async onFixModified(fixIdent: string | null, number: 1 | 2) {
    let wpt: Fix | undefined = undefined;
    try {
      if (fixIdent) {
        wpt = await WaypointEntryUtils.getOrCreateWaypoint(this.props.fmcService.master, fixIdent, true);
        if (!wpt) {
          this.props.fmcService.master.addMessageToQueue(NXSystemMessages.notInDatabase, undefined, undefined);
          return;
        }
      }
      if (number === 1) {
        await this.props.fmcService.master.getEquitimePoint().setPilotEnteredReferenceFix1(wpt);
      } else {
        await this.props.fmcService.master.getEquitimePoint().setPilotEnteredReferenceFix2(wpt);
      }
    } catch (e) {
      if (e instanceof FmsError) {
        this.props.fmcService.master.showFmsErrorMessage(e.type);
      }
    }
  }

  private async onWindModified(direction: number | null, speed: number | null, number: 1 | 2) {
    const etp = this.props.fmcService.master.getEquitimePoint();
    const windVector = number === 1 ? etp.getWindToReferenceFix1() : etp.getWindToReferenceFix2();
    const fix = number === 1 ? etp.referenceFix1 : etp.referenceFix2;
    if (fix !== null) {
      try {
        if (direction !== null && speed !== null) {
          const windVector = createVectorFromMagnitudeAndDirection(direction, speed);
          if (number === 1) {
            await etp.setPilotEnteredWindToReferenceFix1(windVector);
          } else {
            await etp.setPilotEnteredWindToReferenceFix2(windVector);
          }
        } else {
          // If wind vector was fully filled before and one of the values is now null, clear the wind vector, otherwise do nothing.
          if (isWindVectorComplete(windVector)) {
            if (number === 1) {
              await etp.setPilotEnteredWindToReferenceFix1({ direction: undefined, magnitude: undefined });
            } else {
              await etp.setPilotEnteredWindToReferenceFix2({ direction: undefined, magnitude: undefined });
            }
          }
        }
      } catch (e) {
        if (e instanceof FmsError) {
          this.props.fmcService.master.showFmsErrorMessage(e.type);
        }
      }
    }
  }

  public render(): VNode {
    return (
      <>
        {super.render()}
        <div class="mfd-fpln-etp-ppos-rect">
          <span class="mfd-label bigger mfd-fpln-etp-ppos-text">P.POS</span>
        </div>
        <div class="mfd-fpln-etp-ppos-dist-line"></div>
        <div class="mfd-fpln-etp-ppos-time-dist-rect">
          <span class="mfd-label bigger etp-ppos-dist-header">DIST</span>
          <span class="mfd-value bigger etp-ppos-dist-value">{this.distanceToEtpDisplay}</span>
          <span
            class="mfd-label-unit bigger mfd-unit-trailing etp-ppos-dist-unit"
            style={{ visibility: this.distancetoEtpUnitVisibility }}
          >
            NM
          </span>
          <span class="mfd-label bigger etp-ppos-time-header">{this.timeHeader}</span>
          <span class="mfd-value bigger etp-ppos-time-value">{this.timeToEtp}</span>
        </div>
        <div class="mfd-fpln-etp-ppos-airport-horizontal-line first"></div>
        <div class="mfd-fpln-etp-ppos-airport-vertical-line first"></div>
        <div class="mfd-fpln-etp-ppos-airport-horizontal-line second"></div>
        <div class="mfd-fpln-etp-ppos-airport-vertical-line second"></div>
        <div class="mfd-fpln-etp-ppos-line-etp"></div>
        <div class="etp-triangle-pointing-down mfd-fpln-etp-ppos-info-line-triangle"></div>
        <div class="mfd-etp-ref-info-container left">
          <MfdEtpRefInfo
            bearingToFix={this.bearingToRef1}
            distanceToFix={this.distanceToRef1}
            timeToFix={this.timeToRef1}
            timeHeader={this.timeHeader}
            referenceFix={this.ref1Fix}
            fixEnteredByPilot={this.ref1FixEnteredByPilot}
            windInputDisabled={this.ref1FixNotAvailable}
            windDirection={this.ref1WindDirection}
            windSpeed={this.ref1WindSpeed}
            trackFromEtpToFix={this.etpToRef1Bearing}
            distanceFromEtpToFix={this.etpToRef1Distance}
            timeFromEtpToFix={this.etpToRef1Time}
            left={true}
            mfd={this.props.mfd}
            onWindModified={(direction, speed) => this.onWindModified(direction, speed, 1)}
            onFixModified={(fix) => this.onFixModified(fix, 1)}
            errorHandler={(e) => {
              this.props.fmcService.master.showFmsErrorMessage(e.type, e.details);
            }}
            etpMessage={this.etpNotAvailable}
          ></MfdEtpRefInfo>
        </div>
        <div class="mfd-etp-ref-info-container right">
          <MfdEtpRefInfo
            bearingToFix={this.bearingToRef2}
            distanceToFix={this.distanceToRef2}
            timeToFix={this.timeToRef2}
            timeHeader={this.timeHeader}
            referenceFix={this.ref2Fix}
            fixEnteredByPilot={this.ref2FixEnteredByPilot}
            windInputDisabled={this.ref2FixNotAvailable}
            windDirection={this.ref2WindDirection}
            windSpeed={this.ref2WindSpeed}
            trackFromEtpToFix={this.etpToRef2Bearing}
            distanceFromEtpToFix={this.etpToRef2Distance}
            timeFromEtpToFix={this.etpToRef2Time}
            left={false}
            mfd={this.props.mfd}
            onWindModified={(direction, speed) => this.onWindModified(direction, speed, 2)}
            onFixModified={(fix) => this.onFixModified(fix, 2)}
            errorHandler={(e) => {
              this.props.fmcService.master.showFmsErrorMessage(e.type, e.details);
            }}
            etpMessage={this.etpNotAvailable}
          ></MfdEtpRefInfo>
        </div>
        <div class={{ 'mfd-fpln-etp-info': true, 'no-border': this.etpNotAvailable }}>
          <span
            class="mfd-label bigger mfd-fpln-etp-info-etp-text"
            style={{
              display: this.etpComputed.map((v) => (v ? 'inherit' : 'none')).withLifecycle(this.defaultLifecycle),
            }}
          >
            ETP
          </span>
          <div
            class="fr mfd-fpln-etp-waypoint-info-container"
            style={{
              display: this.etpNotAvailable.map((v) => (v ? 'none' : 'inherit')).withLifecycle(this.defaultLifecycle),
            }}
          >
            <span class="mfd-value bigger">{this.etpWaypointIdent}</span>
            <span class="mfd-value bigger mfd-fpln-etp-waypoint-info-distance">{this.etpWaypointDistance}</span>
          </div>
          <span class="mfd-label bigger amber mfd-fpln-etp-msg">{this.etpMessage}</span>
        </div>
        <ReturnButtonFooter
          visible={true}
          onReturnClicked={() => this.props.mfd.uiService.navigateBack()}
        ></ReturnButtonFooter>
      </>
    );
  }
}

export interface MfdEtpRefInfoProps extends ComponentProps {
  bearingToFix: Subscribable<number | null>;
  distanceToFix: Subscribable<number | null>;
  timeHeader: Subscribable<string>;
  timeToFix: Subscribable<string>;
  referenceFix: Subscribable<Fix | null>;
  fixEnteredByPilot: Subscribable<boolean>;
  windInputDisabled: Subscribable<boolean>;
  windDirection: Subject<number | null>;
  windSpeed: Subject<number | null>;
  trackFromEtpToFix: Subscribable<number | null>;
  distanceFromEtpToFix: Subscribable<number | null>;
  timeFromEtpToFix: Subscribable<string>;
  left: boolean;
  mfd: MfdDisplayInterface;
  onFixModified: (fixIdent: string | null, number: 1 | 2) => void;
  onWindModified: (direction: number | null, speed: number | null) => void;
  errorHandler: (error: A380FmsError) => void;
  etpMessage: Subscribable<boolean>;
}

export class MfdEtpRefInfo extends LifecycleComponent<MfdEtpRefInfoProps> {
  render(): VNode | null {
    return (
      <>
        <MfdEtpBrgDistanceTimeToFixInfo
          bearingOrTrackToFix={this.props.bearingToFix}
          distanceToFix={this.props.distanceToFix}
          timeHeader={this.props.timeHeader}
          timeToFix={this.props.timeToFix}
          isFromEtp={false}
          left={this.props.left}
        ></MfdEtpBrgDistanceTimeToFixInfo>
        <div class="etp-ppos-ref-line"></div>
        <div class="etp-triangle-pointing-down mfd-fpln-etp-ppos-line-etp-triangle"></div>
        <div class="etp-ref-fix-header-container">
          <span
            class={{
              'mfd-label': true,
              bigger: true,
              'etp-ref-fix-header': true,
              left: this.props.left,
              right: !this.props.left,
            }}
          >
            {this.props.left ? 'REF1' : 'REF2'}
          </span>
        </div>
        <div class={{ 'etp-ref-fix-container': true, left: this.props.left, right: !this.props.left }}>
          <InputField<Fix, string, false>
            dataEntryFormat={new FixFormat()}
            readonlyValue={this.props.referenceFix}
            onModified={(v) => {
              this.props.onFixModified(v, this.props.left ? 1 : 2);
            }}
            canBeCleared={true}
            alignText="center"
            errorHandler={(e) => {
              this.props.errorHandler(e);
            }}
            hEventConsumer={this.props.mfd.hEventConsumer}
            interactionMode={this.props.mfd.interactionMode}
            containerStyle="width:174px; position:absolute; left: 27px;top: 13px;height: 37px;"
            enteredByPilot={this.props.fixEnteredByPilot}
          />
          <span class="mfd-fpln-etp-crz-text mfd-label bigger">CRZ</span>
          <span class="mfd-fpln-etp-fl-text mfd-label bigger">FL</span>
          <span class="mfd-fpln-etp-wind-text mfd-label bigger">WIND</span>
          <InputField
            containerStyle="height: 37px; width:90px; position: absolute; top: 101.5px; left: 9px;"
            onModified={(v) => {
              this.props.onWindModified(v, this.props.windSpeed.get());
            }}
            errorHandler={(e) => {
              this.props.errorHandler(e);
            }}
            hEventConsumer={this.props.mfd.hEventConsumer}
            interactionMode={this.props.mfd.interactionMode}
            dataEntryFormat={new WindDirectionFormat()}
            value={this.props.windDirection}
            canBeCleared={true}
            disabled={this.props.windInputDisabled}
            enteredByPilot={this.props.windDirection.map((v) => v !== null).withLifecycle(this.defaultLifecycle)}
          ></InputField>
          <InputField
            containerStyle="height: 37px; width:110px; position: absolute; top: 101.5px; left: 108.5px;"
            onModified={(v) => {
              this.props.onWindModified(this.props.windDirection.get(), v);
            }}
            errorHandler={(e) => {
              this.props.errorHandler(e);
            }}
            hEventConsumer={this.props.mfd.hEventConsumer}
            interactionMode={this.props.mfd.interactionMode}
            dataEntryFormat={new WindSpeedFormat()}
            value={this.props.windSpeed}
            disabled={this.props.windInputDisabled}
            canBeCleared={true}
            enteredByPilot={this.props.windSpeed.map((v) => v !== null).withLifecycle(this.defaultLifecycle)}
          ></InputField>
        </div>
        <div
          class={{ 'etp-ppos-ref-line': true, 'from-etp': true, left: this.props.left, right: !this.props.left }}
        ></div>
        <div
          class={{ 'etp-triangle-pointing-up': true, 'from-etp': true, left: this.props.left, right: !this.props.left }}
        ></div>
        <MfdEtpBrgDistanceTimeToFixInfo
          bearingOrTrackToFix={this.props.trackFromEtpToFix}
          distanceToFix={this.props.distanceFromEtpToFix}
          timeHeader={this.props.timeHeader}
          timeToFix={this.props.timeFromEtpToFix}
          isFromEtp={true}
          left={this.props.left}
          etpNotAvail={this.props.etpMessage}
        ></MfdEtpBrgDistanceTimeToFixInfo>
        <div class={{ 'mfd-etp-from-etp-vertical-line': true, left: this.props.left, right: !this.props.left }}></div>
        <div class={{ 'mfd-etp-from-etp-horizontal-line': true, left: this.props.left, right: !this.props.left }}></div>
      </>
    );
  }
}

export interface MfdEtpBrgDistanceTimeProps extends ComponentProps {
  bearingOrTrackToFix: Subscribable<number | null>;
  distanceToFix: Subscribable<number | null>;
  timeToFix: Subscribable<string>;
  timeHeader: Subscribable<string>;
  isFromEtp: boolean;
  left: boolean;
  etpNotAvail?: Subscribable<boolean>;
}

export class MfdEtpBrgDistanceTimeToFixInfo extends LifecycleComponent<MfdEtpBrgDistanceTimeProps> {
  render(): VNode | null {
    return (
      <>
        <div
          class={{
            'mfd-fpln-etp-brg-dist-utc-ref-box': true,
            'mfd-fpln-etp-brg-dist-from-etp-box': this.props.isFromEtp,
            left: this.props.left,
            right: !this.props.left,
          }}
        >
          <div
            style={{
              display: (this.props.etpNotAvail ?? Subject.create(false))
                .map((v) => (v ? 'none' : 'block'))
                .withLifecycle(this.defaultLifecycle),
            }}
            class={{
              'mfd-fpln-etp-brg-dist-utc-ref-box-data-container-left': this.props.left,
              'mfd-fpln-etp-brg-dist-utc-ref-box-data-container-right': !this.props.left,
            }}
          >
            <div class="fr">
              <span
                class={{
                  'mfd-label': true,
                  bigger: true,
                  'etp-ref-info-to-brg-header': !this.props.isFromEtp,
                  'etp-ref-info-from-etp-trk-header': this.props.isFromEtp,
                }}
              >
                {this.props.isFromEtp ? 'TRK' : 'BRG'}
              </span>
              <span
                class={{
                  'mfd-value': true,
                  bigger: true,
                  'etp-ref-info-to-brg-value': !this.props.isFromEtp,
                  'etp-ref-info-from-etp-trk-value': this.props.isFromEtp,
                }}
              >
                {this.props.bearingOrTrackToFix.map((v) => (v !== null ? v.toFixed(0).padStart(3, '0') : '---'))}
              </span>
              <span
                class={{
                  'mfd-label-unit': true,
                  bigger: true,
                  'etp-ref-info-to-brg-unit': !this.props.isFromEtp,
                  'etp-ref-info-from-etp-trk-unit': this.props.isFromEtp,
                }}
                style={{
                  visibility: this.props.bearingOrTrackToFix
                    .map((v) => (v !== null ? 'visible' : 'hidden'))
                    .withLifecycle(this.defaultLifecycle),
                }}
              >
                °
              </span>
            </div>
            <div class="fr">
              <span
                class={{
                  'mfd-label': true,
                  bigger: true,
                  'etp-ref-info-to-dist-header': !this.props.isFromEtp,
                  'etp-ref-info-from-etp-dist-header': this.props.isFromEtp,
                }}
              >
                DIST
              </span>
              <span
                class={{
                  'mfd-value': true,
                  bigger: true,
                  'etp-ref-info-to-dist-value': !this.props.isFromEtp,
                  'etp-ref-info-from-etp-dist-value': this.props.isFromEtp,
                }}
              >
                {this.props.distanceToFix.map((v) =>
                  v !== null
                    ? this.props.isFromEtp
                      ? v.toFixed(0).padStart(4, '\xa0')
                      : v.toFixed(0).padEnd(4, '\xa0')
                    : '----',
                )}
              </span>
              <span
                class={{
                  'mfd-label-unit': true,
                  bigger: true,
                  'etp-ref-info-to-dist-unit': !this.props.isFromEtp,
                  'etp-ref-info-from-etp-dist-unit': this.props.isFromEtp,
                }}
                style={{
                  visibility: this.props.distanceToFix
                    .map((v) => (v !== null ? 'visible' : 'hidden'))
                    .withLifecycle(this.defaultLifecycle),
                }}
              >
                NM
              </span>
            </div>
            <div class="fr">
              <span
                class={{
                  'mfd-label': true,
                  bigger: true,
                  'etp-ref-info-to-time-header': !this.props.isFromEtp,
                  'etp-ref-info-from-etp-time-header': this.props.isFromEtp,
                }}
              >
                {this.props.timeHeader}
              </span>
              <span
                class={{
                  'mfd-value': true,
                  bigger: true,
                  'etp-ref-info-to-time-value': !this.props.isFromEtp,
                  'etp-ref-info-from-etp-time-value': this.props.isFromEtp,
                }}
              >
                {this.props.timeToFix}
              </span>
            </div>
          </div>
        </div>
      </>
    );
  }
}
