//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0
import { ConsumerSubject, FSComponent, MappedSubject, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import {
  DEFERRED_PROCEDURE_TYPE_TO_STRING,
  EcamDeferredProcedures,
  EcamInfos,
  EcamInopSys,
  EcamLimitations,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { FormattedFwcText } from 'instruments/src/EWD/elements/FormattedFwcText';
import { FwsEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsPublisher';
import { PageTitle } from '../Generic/PageTitle';
import { SDSimvars } from '../../SDSimvarPublisher';
import { SdPageProps } from '../../SD';

import './style.scss';

export const SD_STS_LINES_PER_PAGE = 18;
export class StatusPage extends DestroyableComponent<SdPageProps> {
  private readonly sub = this.props.bus.getSubscriber<SDSimvars & FwsEvents>();

  private readonly topSvgVisibility = this.props.visible.map((v) => (v ? 'visible' : 'hidden'));

  /* LIMITATIONS */
  private readonly limitationsAllPhases = ConsumerSubject.create(this.sub.on('fws_limitations_all_phases'), []);
  private readonly limitationsApprLdg = ConsumerSubject.create(this.sub.on('fws_limitations_appr_ldg'), []);

  private readonly limitationsLeftFormatString = this.limitationsAllPhases.map((limits) =>
    limits.map((val) => EcamLimitations[val]).join('\r'),
  );

  private readonly limitationsRightFormatString = this.limitationsApprLdg.map((limits) =>
    limits.map((val) => EcamLimitations[val]).join('\r'),
  );

  private readonly limitationsLines = MappedSubject.create(
    ([all, apprLdg]) => (all.length > 0 || apprLdg.length > 0 ? Math.max(all.length, apprLdg.length) : 0),
    this.limitationsAllPhases,
    this.limitationsApprLdg,
  );
  private readonly limitationsDisplay = this.limitationsLines.map((lines) => (lines > 0 ? 'flex' : 'none'));
  private readonly limitationsHeight = this.limitationsLines.map((lines) => `${lines * 30 + 3}px`);

  /* DEFERRED PROCEDURE LIST */
  private readonly deferredProcedures = ConsumerSubject.create(this.sub.on('fws_deferred_procedures'), []);

  private readonly deferredProceduresFormatString = this.deferredProcedures.map((proc) =>
    proc
      .map(
        (val) =>
          `\x1b<4m${DEFERRED_PROCEDURE_TYPE_TO_STRING[EcamDeferredProcedures[val.id].type]} :\r> \x1b<4m${EcamDeferredProcedures[val.id].title}`,
      )
      .join('\r'),
  );

  private readonly deferredProceduresLines = MappedSubject.create(
    ([proc]) => (proc.length > 0 ? proc.length * 2 : 0),
    this.deferredProcedures,
  );
  private readonly deferredProceduresDisplay = this.deferredProceduresLines.map((lines) =>
    lines > 0 ? 'flex' : 'none',
  );
  private readonly deferredProceduresHeight = this.deferredProceduresLines.map((lines) => `${lines * 30 + 3}px`);

  /* INFO */
  private readonly info = ConsumerSubject.create(this.sub.on('fws_information'), []);

  private readonly infoFormatString = this.info.map((info) => info.map((val) => EcamInfos[val]).join('\r'));

  private readonly infoLines = MappedSubject.create(([info]) => (info.length > 0 ? info.length : 0), this.info);
  private readonly infoDisplay = this.infoLines.map((lines) => (lines > 0 ? 'flex' : 'none'));
  private readonly infoHeight = this.infoLines.map((lines) => `${lines * 30 + 3}px`);

  /* INOP SYS */
  private readonly inopSysAllPhases = ConsumerSubject.create(this.sub.on('fws_inop_sys_all_phases'), []);
  private readonly inopSysApprLdg = ConsumerSubject.create(this.sub.on('fws_inop_sys_appr_ldg'), []);

  private readonly inopSysLeftFormatString = this.inopSysAllPhases.map((limits) =>
    limits.map((val) => EcamInopSys[val]).join('\r'),
  );

  private readonly inopSysRightFormatString = this.inopSysApprLdg.map((limits) =>
    limits.map((val) => EcamInopSys[val]).join('\r'),
  );

  private readonly inopSysLines = MappedSubject.create(
    ([all, apprLdg]) => (all.length > 0 || apprLdg.length > 0 ? Math.max(all.length, apprLdg.length) : 0),
    this.inopSysAllPhases,
    this.inopSysApprLdg,
  );
  private readonly inopSysDisplay = this.inopSysLines.map((lines) => (lines > 0 ? 'flex' : 'none'));
  private readonly inopSysHeight = this.inopSysLines.map((lines) => `${lines * 30 + 3}px`);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.inopSysAllPhases.sub((v) => console.log('inopSysAllPhases changed', v));

    this.subscriptions.push(
      this.topSvgVisibility,
      this.limitationsAllPhases,
      this.limitationsApprLdg,
      this.limitationsLeftFormatString,
      this.limitationsRightFormatString,
      this.limitationsLines,
      this.limitationsDisplay,
      this.deferredProcedures,
      this.deferredProceduresFormatString,
      this.deferredProceduresLines,
      this.deferredProceduresDisplay,
      this.info,
      this.infoFormatString,
      this.infoLines,
      this.infoDisplay,
      this.infoHeight,
      this.inopSysAllPhases,
      this.inopSysApprLdg,
      this.inopSysLeftFormatString,
      this.inopSysRightFormatString,
      this.inopSysLines,
      this.inopSysDisplay,
    );
  }

  destroy(): void {
    super.destroy();
  }

  render() {
    return (
      <div id="sts" class="sd-sts-top-div" style={{ visibility: this.topSvgVisibility }}>
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" height="45">
          <PageTitle x={6} y={29}>
            STATUS
          </PageTitle>
        </svg>
        {/* LIMITATIONS */}
        <div
          class="sd-sts-section-container"
          style={{
            display: this.limitationsDisplay,
          }}
        >
          <StatusPageSectionHeading title="LIMITATIONS" showLines={Subject.create(false)} />
          <div class="sd-sts-section-divided-area">
            <div class="sd-sts-section-divided-left">
              <span class="sd-sts-section-divided-area-heading">ALL PHASES</span>
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ height: this.limitationsHeight }}>
                <FormattedFwcText x={0} y={24} message={this.limitationsLeftFormatString} />
              </svg>
            </div>
            <div class="sd-sts-section-divided-right">
              <span class="sd-sts-section-divided-area-heading">APPR & LDG</span>
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ height: this.limitationsHeight }}>
                <FormattedFwcText x={0} y={24} message={this.limitationsRightFormatString} />
              </svg>
            </div>
          </div>
        </div>
        {/* INFO */}
        <div
          class="sd-sts-section-container"
          style={{
            display: this.deferredProceduresDisplay,
          }}
        >
          <StatusPageSectionHeading title="DEFERRED PROCEDURE LIST" showLines={Subject.create(true)} />
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ height: this.deferredProceduresHeight }}>
            <FormattedFwcText x={0} y={24} message={this.deferredProceduresFormatString} />
          </svg>
        </div>
        {/* INFO */}
        <div
          class="sd-sts-section-container"
          style={{
            display: this.infoDisplay,
          }}
        >
          <StatusPageSectionHeading title="INFO" showLines={Subject.create(true)} />
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ height: this.infoHeight }}>
            <FormattedFwcText x={0} y={24} message={this.infoFormatString} />
          </svg>
        </div>
        {/* INOP SYS */}
        <div
          class="sd-sts-section-container"
          style={{
            display: this.inopSysDisplay,
          }}
        >
          <StatusPageSectionHeading title="INOP SYS" showLines={Subject.create(true)} />
          <div class="sd-sts-section-divided-area">
            <div class="sd-sts-section-divided-left">
              <span class="sd-sts-section-divided-area-heading">ALL PHASES</span>
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ height: this.inopSysHeight }}>
                <FormattedFwcText x={0} y={24} message={this.inopSysLeftFormatString} />
              </svg>
            </div>
            <div class="sd-sts-section-divided-right">
              <span class="sd-sts-section-divided-area-heading">APPR & LDG</span>
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ height: this.inopSysHeight }}>
                <FormattedFwcText x={0} y={24} message={this.inopSysRightFormatString} />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

interface StatusPageSectionHeadingProps {
  title: string;
  showLines: Subscribable<boolean>;
}
export class StatusPageSectionHeading extends DestroyableComponent<StatusPageSectionHeadingProps> {
  render() {
    return (
      <div class="sd-sts-section-heading-group">
        <div class={{ 'sd-sts-section-heading-lines': true, show: this.props.showLines }} />
        <span class="sd-sts-section-heading underline">{this.props.title}</span>
        <div class={{ 'sd-sts-section-heading-lines': true, show: this.props.showLines }} />
      </div>
    );
  }
}
