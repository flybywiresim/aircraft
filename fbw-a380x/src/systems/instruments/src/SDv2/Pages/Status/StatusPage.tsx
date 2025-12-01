//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0
import {
  ConsumerSubject,
  EventBus,
  FSComponent,
  MappedSubject,
  SimVarValueType,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import {
  DEFERRED_PROCEDURE_TYPE_TO_STRING,
  DeferredProcedureType,
  EcamDeferredProcedures,
  EcamInfos,
  EcamInopSys,
  EcamLimitations,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { FormattedFwcText } from 'instruments/src/EWD/elements/FormattedFwcText';
import { ChecklistState, FwsEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsPublisher';
import { MoreLabel, PageTitle } from '../Generic/PageTitle';
import { SDSimvars } from '../../SDSimvarPublisher';
import { SdPageProps } from '../../SD';

import './style.scss';
import { RegisteredSimVar } from '@flybywiresim/fbw-sdk';
import { SdSoftKey } from './elements/SdSoftKey';

export const SD_STS_LINES_PER_PAGE = 17;
export const SD_STS_LINES_PER_PAGE_USABLE = 13; // Minus heading and footer

enum StatusPageSectionDisplayStatus {
  HIDDEN,
  VISIBLE_CURRENT_PAGE,
  VISIBLE_NEXT_PAGE,
}
export class StatusPage extends DestroyableComponent<SdPageProps> {
  private readonly sub = this.props.bus.getSubscriber<SDSimvars & FwsEvents>();

  private readonly availChecker = new FwsSdAvailabilityChecker(this.props.bus);

  private readonly topSvgVisibility = this.props.visible.map((v) => (v ? 'visible' : 'hidden'));

  private readonly stsPageToShow = ConsumerSubject.create(this.sub.on('sdStsPageToShow'), 0);

  private readonly statusNormal = Subject.create(true);

  private readonly stsNumberOfPagesSimvar = RegisteredSimVar.create(
    'L:A32NX_ECAM_SD_STS_NUMBER_OF_PAGES',
    SimVarValueType.Number,
  );
  private readonly stsMoreAvailableSimvar = RegisteredSimVar.create<number>(
    'L:A32NX_ECAM_SD_STS_MORE_AVAILABLE',
    SimVarValueType.Number,
  );

  /* LIMITATIONS */
  private readonly limitationsDisplayStatus = Subject.create<StatusPageSectionDisplayStatus>(
    StatusPageSectionDisplayStatus.HIDDEN,
  );

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
  private readonly limitationsDisplay = MappedSubject.create(
    ([displayStatus, lines]) =>
      lines > 0 && displayStatus === StatusPageSectionDisplayStatus.VISIBLE_CURRENT_PAGE ? 'flex' : 'none',
    this.limitationsDisplayStatus,
    this.limitationsLines,
  );
  private readonly limitationsHeight = this.limitationsLines.map((lines) => `${lines * 30 + 3}px`);

  /* DEFERRED PROCEDURE LIST */
  private readonly deferredProceduresDisplayStatus = Subject.create<StatusPageSectionDisplayStatus>(
    StatusPageSectionDisplayStatus.HIDDEN,
  );
  private readonly deferredProceduresOnNextPageDisplay = this.deferredProceduresDisplayStatus.map((status) =>
    status === StatusPageSectionDisplayStatus.VISIBLE_NEXT_PAGE ? 'flex' : 'none',
  );
  private readonly deferredProcedures = ConsumerSubject.create(this.sub.on('fws_deferred_procedures'), []);

  private deferredProceduresLinesStrings: string[] = [];
  private readonly deferredProceduresFormatString = this.deferredProcedures.map((proc) => {
    StatusPage.DeferredProcedureLines(proc, this.deferredProceduresLinesStrings);
    return this.deferredProceduresLinesStrings.join('\r');
  });

  private readonly deferredProceduresLines = MappedSubject.create(
    ([proc]) => (proc.length > 0 ? proc.length * 2 : 0),
    this.deferredProcedures,
  );
  private readonly deferredProceduresDisplay = MappedSubject.create(
    ([displayStatus, lines]) =>
      lines > 0 && displayStatus === StatusPageSectionDisplayStatus.VISIBLE_CURRENT_PAGE ? 'flex' : 'none',
    this.deferredProceduresDisplayStatus,
    this.deferredProceduresLines,
  );

  private readonly deferredProceduresDisplaySeparationLine = Subject.create(true);

  private readonly deferredProceduresHeight = this.deferredProceduresLines.map((lines) => `${lines * 30 + 3}px`);

  /* INFO */
  private readonly infoDisplayStatus = Subject.create<StatusPageSectionDisplayStatus>(
    StatusPageSectionDisplayStatus.HIDDEN,
  );
  private readonly infoOnNextPageDisplay = this.infoDisplayStatus.map((status) =>
    status === StatusPageSectionDisplayStatus.VISIBLE_NEXT_PAGE ? 'flex' : 'none',
  );

  private readonly info = ConsumerSubject.create(this.sub.on('fws_information'), []);

  private readonly infoFormatString = this.info.map((info) => info.map((val) => EcamInfos[val]).join('\r'));

  private readonly infoLines = MappedSubject.create(([info]) => (info.length > 0 ? info.length : 0), this.info);
  private readonly infoDisplay = MappedSubject.create(
    ([displayStatus, lines]) =>
      lines > 0 && displayStatus === StatusPageSectionDisplayStatus.VISIBLE_CURRENT_PAGE ? 'flex' : 'none',
    this.infoDisplayStatus,
    this.infoLines,
  );

  private readonly infoDisplaySeparationLine = Subject.create(true);

  private readonly infoHeight = this.infoLines.map((lines) => `${lines * 30 + 3}px`);

  /* INOP SYS */
  private readonly inopSysDisplayStatus = Subject.create<StatusPageSectionDisplayStatus>(
    StatusPageSectionDisplayStatus.HIDDEN,
  );
  private readonly inopSysOnNextPageDisplay = this.inopSysDisplayStatus.map((status) =>
    status === StatusPageSectionDisplayStatus.VISIBLE_NEXT_PAGE ? 'flex' : 'none',
  );

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
  private readonly inopSysDisplay = MappedSubject.create(
    ([displayStatus, lines]) =>
      lines > 0 && displayStatus === StatusPageSectionDisplayStatus.VISIBLE_CURRENT_PAGE ? 'flex' : 'none',
    this.inopSysDisplayStatus,
    this.inopSysLines,
  );

  private readonly inopSysDisplaySeparationLine = Subject.create(true);

  private readonly inopSysHeight = this.inopSysLines.map((lines) => `${lines * 30 + 3}px`);

  /* ALERTS IMPACTING LDG PERF, TODO */
  private readonly alertImpactingLdgPerfDisplayStatus = Subject.create<StatusPageSectionDisplayStatus>(
    StatusPageSectionDisplayStatus.HIDDEN,
  );

  /* INOP SYS REDUND */
  private readonly inopSysRedund = ConsumerSubject.create(this.sub.on('fws_inop_sys_redundancy_loss'), []);
  private readonly inopSysRedundCurrentPage = MappedSubject.create(
    ([inopSysRedund, pageToShow]) =>
      inopSysRedund.slice(pageToShow * SD_STS_LINES_PER_PAGE_USABLE, (pageToShow + 1) * SD_STS_LINES_PER_PAGE_USABLE),
    this.inopSysRedund,
    this.stsPageToShow,
  );

  private readonly inopSysRedundFormatString = this.inopSysRedundCurrentPage.map((inopSysRedundCurrentPage) =>
    inopSysRedundCurrentPage.map((val) => EcamInopSys[val]).join('\r'),
  );

  private readonly inopSysRedundLines = MappedSubject.create(
    ([inopSysRedund]) => (inopSysRedund.length > 0 ? inopSysRedund.length : 0),
    this.inopSysRedundCurrentPage,
  );
  private readonly inopSysRedundDisplay = MappedSubject.create(
    ([lines]) => (lines > 0 ? 'flex' : 'none'),
    this.inopSysRedundLines,
  );

  private readonly inopSysRedundHeight = this.inopSysRedundLines.map((lines) => `${lines * 30 + 3}px`);

  private readonly moreActive = ConsumerSubject.create(this.sub.on('moreActive'), false);
  private readonly moreAvailable = this.inopSysRedund.map((lines) => lines.length > 0);
  private readonly moreAvailableVisibility = this.moreAvailable.map((v) => (v ? 'inherit' : 'hidden'));
  private readonly moreActiveVisibility = this.moreActive.map((v) => (v ? 'inherit' : 'hidden'));

  private readonly statusNormalDisplay = MappedSubject.create(
    ([normal, notAvail]) => (normal && !notAvail ? 'flex' : 'none'),
    this.statusNormal,
    this.availChecker.fwsFailed,
  );
  private readonly statusNotAvailableDisplay = MappedSubject.create(
    ([notAvail]) => (notAvail ? 'flex' : 'none'),
    this.availChecker.fwsFailed,
  );
  private readonly abnormalContentDisplay = MappedSubject.create(
    ([normal, notAvail, moreActive]) => (!normal && !notAvail && !moreActive ? 'flex' : 'none'),
    this.statusNormal,
    this.availChecker.fwsFailed,
    this.moreActive,
  );
  private readonly abnormalContentMoreDisplay = MappedSubject.create(
    ([normal, notAvail, moreActive]) => (!normal && !notAvail && moreActive ? 'flex' : 'none'),
    this.statusNormal,
    this.availChecker.fwsFailed,
    this.moreActive,
  );

  private readonly pressStsForNextStatusPageVisibility = MappedSubject.create(
    ([defStatus, infoStatus, inopStatus, alertStatus]) =>
      defStatus === StatusPageSectionDisplayStatus.VISIBLE_NEXT_PAGE ||
      infoStatus === StatusPageSectionDisplayStatus.VISIBLE_NEXT_PAGE ||
      inopStatus === StatusPageSectionDisplayStatus.VISIBLE_NEXT_PAGE ||
      alertStatus === StatusPageSectionDisplayStatus.VISIBLE_NEXT_PAGE
        ? 'inherit'
        : 'hidden',
    this.deferredProceduresDisplayStatus,
    this.infoDisplayStatus,
    this.inopSysDisplayStatus,
    this.alertImpactingLdgPerfDisplayStatus,
  );

  private readonly morePageOverflow = MappedSubject.create(
    ([inopSysRedund, pageToShow]) => inopSysRedund.length > (pageToShow + 1) * SD_STS_LINES_PER_PAGE_USABLE,
    this.inopSysRedund,
    this.stsPageToShow,
  );
  private readonly pressMoreForNextMorePageVisibility = this.morePageOverflow.map((v) => (v ? 'inherit' : 'hidden'));

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.topSvgVisibility,
      this.limitationsAllPhases,
      this.limitationsApprLdg,
      this.limitationsLeftFormatString,
      this.limitationsRightFormatString,
      this.limitationsLines,
      this.limitationsDisplay,
      this.deferredProceduresOnNextPageDisplay,
      this.deferredProcedures,
      this.deferredProceduresFormatString,
      this.deferredProceduresLines,
      this.deferredProceduresDisplay,
      this.infoOnNextPageDisplay,
      this.info,
      this.infoFormatString,
      this.infoLines,
      this.infoDisplay,
      this.infoHeight,
      this.inopSysOnNextPageDisplay,
      this.inopSysAllPhases,
      this.inopSysApprLdg,
      this.inopSysLeftFormatString,
      this.inopSysRightFormatString,
      this.inopSysLines,
      this.inopSysDisplay,
      this.inopSysHeight,
      this.pressStsForNextStatusPageVisibility,
    );

    this.subscriptions.push(
      MappedSubject.create(
        ([pageToShow, limAll, limAppr, deferredProcedures, info, inopApp, inopAppr, moreActive, inopSysRedund]) => {
          // Calculate number of pages required and where to display "ON NEXT PAGE" messages
          // 6 lines reserved for heading and white PRESS STS... line
          if (
            limAll.length === 0 &&
            limAppr.length === 0 &&
            deferredProcedures.length === 0 &&
            info.length === 0 &&
            inopApp.length === 0 &&
            inopAppr.length === 0
          ) {
            this.statusNormal.set(true);
          } else {
            this.statusNormal.set(false);
          }

          if (moreActive) {
            this.stsNumberOfPagesSimvar.set(
              inopSysRedund.length > 0 ? Math.ceil(inopSysRedund.length / SD_STS_LINES_PER_PAGE_USABLE) : 1,
            );
            return;
          }

          // Add one or two lines for header
          const limitationsLines = Math.max(limAll.length, limAppr.length) + 2;
          const deferredProceduresLines = this.deferredProceduresLinesStrings.length + 1; // Cave: Check if race condition
          const infoLines = info.length + 1;
          const inopSysLines = Math.max(inopApp.length, inopAppr.length) + 2;
          const alertImpactingLdgPerfLines = 0; // TODO

          // 0-based page index. -1 means not displayed
          let deferredProceduresVisibleOnPage = 0;
          let infoVisibleOnPage = 0;
          let inopSysVisibleOnPage = 0;
          let alertImpactingLdgPerfVisibleOnPage = 0; // TODO

          let calculateForPage = 0;
          let linesUsedOnCurrentPage = 0;

          // LIMITATIONS, always on first page
          linesUsedOnCurrentPage += limitationsLines;
          this.limitationsDisplayStatus.set(
            limitationsLines > 0 && pageToShow === 0
              ? StatusPageSectionDisplayStatus.VISIBLE_CURRENT_PAGE
              : StatusPageSectionDisplayStatus.HIDDEN,
          );

          if (linesUsedOnCurrentPage + deferredProceduresLines > SD_STS_LINES_PER_PAGE_USABLE) {
            deferredProceduresVisibleOnPage = calculateForPage + 1;
            calculateForPage += 1;
            linesUsedOnCurrentPage = 0;
            this.deferredProceduresDisplaySeparationLine.set(false);
          } else {
            deferredProceduresVisibleOnPage = calculateForPage;
            this.deferredProceduresDisplaySeparationLine.set(true);
          }
          linesUsedOnCurrentPage += deferredProceduresLines;

          if (linesUsedOnCurrentPage + infoLines > SD_STS_LINES_PER_PAGE_USABLE) {
            infoVisibleOnPage = calculateForPage + 1;
            calculateForPage += 1;
            linesUsedOnCurrentPage = 0;
            this.infoDisplaySeparationLine.set(false);
          } else {
            infoVisibleOnPage = calculateForPage;
            this.infoDisplaySeparationLine.set(true);
          }
          linesUsedOnCurrentPage += infoLines;

          if (linesUsedOnCurrentPage + inopSysLines > SD_STS_LINES_PER_PAGE_USABLE) {
            inopSysVisibleOnPage = calculateForPage + 1;
            calculateForPage += 1;
            linesUsedOnCurrentPage = 0;
            this.inopSysDisplaySeparationLine.set(false);
          } else {
            inopSysVisibleOnPage = calculateForPage;
            this.inopSysDisplaySeparationLine.set(true);
          }
          linesUsedOnCurrentPage += inopSysLines;

          if (linesUsedOnCurrentPage + alertImpactingLdgPerfLines > SD_STS_LINES_PER_PAGE_USABLE) {
            alertImpactingLdgPerfVisibleOnPage = calculateForPage + 1;
            calculateForPage += 1;
            linesUsedOnCurrentPage = 0;
          } else {
            alertImpactingLdgPerfVisibleOnPage = calculateForPage;
          }
          linesUsedOnCurrentPage += alertImpactingLdgPerfLines;

          let displayedOnNextPageAlreadyDisplayed = false;
          if (pageToShow === deferredProceduresVisibleOnPage) {
            this.deferredProceduresDisplayStatus.set(StatusPageSectionDisplayStatus.VISIBLE_CURRENT_PAGE);
          } else if (pageToShow + 1 === deferredProceduresVisibleOnPage && !displayedOnNextPageAlreadyDisplayed) {
            this.deferredProceduresDisplayStatus.set(StatusPageSectionDisplayStatus.VISIBLE_NEXT_PAGE);
            displayedOnNextPageAlreadyDisplayed = true;
          } else {
            this.deferredProceduresDisplayStatus.set(StatusPageSectionDisplayStatus.HIDDEN);
          }

          if (pageToShow === infoVisibleOnPage) {
            this.infoDisplayStatus.set(StatusPageSectionDisplayStatus.VISIBLE_CURRENT_PAGE);
          } else if (pageToShow + 1 === infoVisibleOnPage && !displayedOnNextPageAlreadyDisplayed) {
            this.infoDisplayStatus.set(StatusPageSectionDisplayStatus.VISIBLE_NEXT_PAGE);
            displayedOnNextPageAlreadyDisplayed = true;
          } else {
            this.infoDisplayStatus.set(StatusPageSectionDisplayStatus.HIDDEN);
          }

          if (pageToShow === inopSysVisibleOnPage) {
            this.inopSysDisplayStatus.set(StatusPageSectionDisplayStatus.VISIBLE_CURRENT_PAGE);
          } else if (pageToShow + 1 === inopSysVisibleOnPage && !displayedOnNextPageAlreadyDisplayed) {
            this.inopSysDisplayStatus.set(StatusPageSectionDisplayStatus.VISIBLE_NEXT_PAGE);
            displayedOnNextPageAlreadyDisplayed = true;
          } else {
            this.inopSysDisplayStatus.set(StatusPageSectionDisplayStatus.HIDDEN);
          }

          if (pageToShow === alertImpactingLdgPerfVisibleOnPage) {
            this.alertImpactingLdgPerfDisplayStatus.set(StatusPageSectionDisplayStatus.VISIBLE_CURRENT_PAGE);
          } else if (pageToShow + 1 === alertImpactingLdgPerfVisibleOnPage && !displayedOnNextPageAlreadyDisplayed) {
            this.alertImpactingLdgPerfDisplayStatus.set(StatusPageSectionDisplayStatus.VISIBLE_NEXT_PAGE);
            displayedOnNextPageAlreadyDisplayed = true;
          } else {
            this.alertImpactingLdgPerfDisplayStatus.set(StatusPageSectionDisplayStatus.HIDDEN);
          }

          this.stsNumberOfPagesSimvar.set(calculateForPage + 1);
        },
        this.stsPageToShow,
        this.limitationsAllPhases,
        this.limitationsApprLdg,
        this.deferredProceduresFormatString,
        this.info,
        this.inopSysAllPhases,
        this.inopSysApprLdg,
        this.moreActive,
        this.inopSysRedund,
      ),
      this.moreAvailable.sub((v) => {
        this.stsMoreAvailableSimvar.set(v ? 1 : 0);
      }, true),
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
          <g visibility={this.moreActiveVisibility}>
            <MoreLabel x={187} y={28} moreActive={this.moreActive} />
          </g>
        </svg>
        <div id="sts-normal-content" class="sd-sts-centered-text" style={{ display: this.statusNormalDisplay }}>
          NORMAL
        </div>
        <div
          id="sts-normal-content"
          class="sd-sts-centered-text amber"
          style={{ display: this.statusNotAvailableDisplay }}
        >
          STATUS NOT AVAILABLE
        </div>
        <div id="sts-abnormal-content" class="sd-sts-abnormal-content" style={{ display: this.abnormalContentDisplay }}>
          {/* LIMITATIONS */}
          <div
            class="sd-sts-section-container"
            style={{
              display: this.limitationsDisplay,
            }}
          >
            <StatusPageSectionHeading title="LIMITATIONS" showSeparationLines={Subject.create(false)} />
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
          {/* DEFERRED PROCEDURE LIST on next page */}
          <div
            class="sd-sts-section-container"
            style={{
              display: this.deferredProceduresOnNextPageDisplay,
            }}
          >
            <StatusPageSectionHeading title="DEFERRED PROCEDURE LIST" showSeparationLines={Subject.create(true)} />
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ height: '63px' }}>
              <FormattedFwcText x={0} y={24} message={'\x1b<4mDISPLAYED ON NEXT STATUS PAGE...'} />
            </svg>
          </div>
          {/* DEFERRED PROCEDURE LIST */}
          <div
            class="sd-sts-section-container"
            style={{
              display: this.deferredProceduresDisplay,
            }}
          >
            <StatusPageSectionHeading
              title="DEFERRED PROCEDURE LIST"
              showSeparationLines={this.deferredProceduresDisplaySeparationLine}
            />
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ height: this.deferredProceduresHeight }}>
              <FormattedFwcText x={0} y={24} message={this.deferredProceduresFormatString} />
            </svg>
          </div>
          {/* INFO on next page */}
          <div
            class="sd-sts-section-container"
            style={{
              display: this.infoOnNextPageDisplay,
            }}
          >
            <StatusPageSectionHeading title="INFO" showSeparationLines={Subject.create(true)} />
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ height: '63px' }}>
              <FormattedFwcText x={0} y={24} message={'\x1b<3mDISPLAYED ON NEXT STATUS PAGE...'} />
            </svg>
          </div>
          {/* INFO */}
          <div
            class="sd-sts-section-container"
            style={{
              display: this.infoDisplay,
            }}
          >
            <StatusPageSectionHeading title="INFO" showSeparationLines={this.infoDisplaySeparationLine} />
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ height: this.infoHeight }}>
              <FormattedFwcText x={0} y={24} message={this.infoFormatString} />
            </svg>
          </div>
          {/* INOP SYS on next page */}
          <div
            class="sd-sts-section-container"
            style={{
              display: this.inopSysOnNextPageDisplay,
            }}
          >
            <StatusPageSectionHeading title="INOP SYS" showSeparationLines={Subject.create(true)} />
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ height: '63px' }}>
              <FormattedFwcText x={0} y={24} message={'\x1b<4mDISPLAYED ON NEXT STATUS PAGE...'} />
            </svg>
          </div>
          {/* INOP SYS */}
          <div
            class="sd-sts-section-container"
            style={{
              display: this.inopSysDisplay,
            }}
          >
            <StatusPageSectionHeading title="INOP SYS" showSeparationLines={this.inopSysDisplaySeparationLine} />
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
          <div style="flex-grow: 1" />
          <div class="sd-sts-press-sts-for-next-page" style={{ visibility: this.pressStsForNextStatusPageVisibility }}>
            PRESS STS FOR NEXT STATUS PAGE
          </div>
          <div class="sd-sts-bottom-area">
            <div
              class="sd-sts-bottom-area-more-box"
              style={{
                visibility: this.moreAvailableVisibility,
              }}
            >
              MORE
            </div>
          </div>
          <SdSoftKey />
        </div>
        <div
          id="sts-abnormal-content-more"
          class="sd-sts-abnormal-content"
          style={{ display: this.abnormalContentMoreDisplay }}
        >
          {/* INOP SYS REDUND */}
          <div
            class="sd-sts-section-container"
            style={{
              display: this.inopSysRedundDisplay,
            }}
          >
            <StatusPageSectionHeading title="INOP SYS REDUND" showSeparationLines={Subject.create(false)} />
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ height: this.inopSysRedundHeight }}>
              <FormattedFwcText x={0} y={24} message={this.inopSysRedundFormatString} />
            </svg>
          </div>
          <div style="flex-grow: 1" />
          <div class="sd-sts-press-sts-for-next-page" style={{ visibility: this.pressMoreForNextMorePageVisibility }}>
            PRESS MORE FOR NEXT MORE PAGE
          </div>
          <SdSoftKey />
        </div>
      </div>
    );
  }

  /**
   * Returns an array, each line one element, with FwcFormattedString capable strings
   * @param proceduresState checklistState from FWS
   * @param outputLines array to fill with output lines to avoid allocations
   */
  public static DeferredProcedureLines(proceduresState: readonly ChecklistState[], outputLines: string[]): void {
    outputLines.length = 0;
    if (proceduresState.length === 0) {
      return;
    }

    Object.keys(DeferredProcedureType).forEach((_, procTypeIndex) => {
      const procsOfType = proceduresState.filter(
        (val) => EcamDeferredProcedures[val.id].type === Number(procTypeIndex),
      );
      if (procsOfType.length > 0) {
        outputLines.push(`\x1b<4m${DEFERRED_PROCEDURE_TYPE_TO_STRING[procTypeIndex]} :`);
        procsOfType.forEach((val) => {
          outputLines.push(`> \x1b<4m${EcamDeferredProcedures[val.id].title}`);
        });
      }
    });
  }
}

interface StatusPageSectionHeadingProps {
  title: string;
  showSeparationLines: Subscribable<boolean>;
}
export class StatusPageSectionHeading extends DestroyableComponent<StatusPageSectionHeadingProps> {
  render() {
    return (
      <div class="sd-sts-section-heading-group">
        <div class={{ 'sd-sts-section-heading-lines': true, show: this.props.showSeparationLines }} />
        <span class="sd-sts-section-heading underline">{this.props.title}</span>
        <div class={{ 'sd-sts-section-heading-lines': true, show: this.props.showSeparationLines }} />
      </div>
    );
  }
}

class FwsSdAvailabilityChecker {
  constructor(private bus: EventBus) {}

  private readonly sub = this.bus.getSubscriber<SDSimvars>();

  private readonly fws1IsHealthy = ConsumerSubject.create(this.sub.on('fws1_is_healthy'), true);
  private readonly fws2IsHealthy = ConsumerSubject.create(this.sub.on('fws2_is_healthy'), true);

  private readonly afdx_4_4_reachable = ConsumerSubject.create(this.sub.on('afdx_4_4_reachable'), true);
  private readonly afdx_14_14_reachable = ConsumerSubject.create(this.sub.on('afdx_14_14_reachable'), true);
  private readonly afdx_4_3_reachable = ConsumerSubject.create(this.sub.on('afdx_4_3_reachable'), true);
  private readonly afdx_14_13_reachable = ConsumerSubject.create(this.sub.on('afdx_14_13_reachable'), true);

  public readonly fwsAvail = MappedSubject.create(
    ([healthy1, healthy2, r_4_4, r_14_14, r_4_3, r_14_13]) =>
      (healthy1 && (r_4_3 || r_14_13)) || (healthy2 && (r_4_4 || r_14_14)),
    this.fws1IsHealthy,
    this.fws2IsHealthy,
    this.afdx_4_4_reachable,
    this.afdx_14_14_reachable,
    this.afdx_4_3_reachable,
    this.afdx_14_13_reachable,
  );

  public readonly fwsFailed = this.fwsAvail.map((it) => !it);
}
