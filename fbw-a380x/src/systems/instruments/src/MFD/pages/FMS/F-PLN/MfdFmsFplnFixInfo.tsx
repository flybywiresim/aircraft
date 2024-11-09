import { AnyFix } from '@flybywiresim/fbw-sdk';

import { FmsPage } from '../../common/FmsPage';
import { ObservableFlightPlan } from '@fmgc/flightplanning/plans/ObservableFlightPlan';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { Footer } from '../../common/Footer';
import { TopTabNavigator, TopTabNavigatorPage } from '../../common/TopTabNavigator';
import { InputField } from '../../common/InputField';
import { FixFormat, RadialFormat, RadiusFormat } from '../../common/DataEntryFormats';

import './MfdFmsFplnFixInfo.scss';
import { FmsError, FmsErrorType } from '@fmgc/FmsError';
import { FixInfoEntry } from '@fmgc/flightplanning/plans/FixInfo';
import { Button } from '../../common/Button';

export class MfdFmsFplnFixInfo extends FmsPage {
  private flightPlan = new ObservableFlightPlan(
    this.props.bus,
    this.props.fmcService.master!.flightPlanService,
    FlightPlanIndex.Active,
  );

  private readonly selectedTab = Subject.create(0);

  protected onNewData(): void {
    // noop
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="mfd-fms-fpln-fix-info-header"></div>
        <TopTabNavigator pageTitles={['FIX 1', 'FIX 2', 'FIX 3', 'FIX 4']} selectedPageIndex={this.selectedTab}>
          {([1, 2, 3, 4] as const).map((value) => (
            <TopTabNavigatorPage containerStyle="max-height: 45rem;">
              <div class="fr aic mfd-fms-fpln-fix-info-ref-ident">
                <span class="mfd-fms-fpln-fix-info-ref-ident-label">REF IDENT</span>

                <InputField<AnyFix, AnyFix[]>
                  readonlyValue={this.flightPlan.fixInfos[value].map((it) => it?.fix ?? null)}
                  onModified={async (fixes) => {
                    if (!fixes) {
                      throw new FmsError(FmsErrorType.NotInDatabase);
                    }

                    const fix = await this.props.mfd.deduplicateFacilities(fixes);

                    if (fix) {
                      void this.props.fmcService.master!.flightPlanService.setFixInfoEntry(
                        value,
                        new FixInfoEntry(fix, [], []),
                      );
                    }
                  }}
                  dataEntryFormat={new FixFormat()}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>

              <div class="mfd-fms-fpln-fix-info-table">
                <div class="fr mfd-fms-fpln-fix-info-table-row-1">
                  <span class="mfd-fms-fpln-fix-info-table-col-left"></span>
                  <span class="fc jcc aic mfd-fms-fpln-fix-info-table-col-center mfd-fms-fpln-fix-info-fpl-intercept-header">
                    <span>F-PLN INTERCEPT</span>
                    <span>UTC</span>
                    <span>DIST</span>
                    <span>ALT</span>
                  </span>
                  <span class="mfd-fms-fpln-fix-info-table-col-right"></span>
                </div>

                <div class="fr mfd-fms-fpln-fix-info-table-row-2">
                  <span class="fc mfd-fms-fpln-fix-info-table-col-left">
                    <span class="mfd-fms-fpln-fix-info-radial-header">RADIAL</span>

                    <InputField<number, number, false>
                      class="mfd-fms-fpln-fix-info-radial-1"
                      readonlyValue={this.flightPlan.fixInfos[value].map(
                        (it) => it?.radials?.[0]?.magneticBearing ?? null,
                      )}
                      onModified={(radial) => {
                        if (radial === null) {
                          return;
                        }

                        this.props.fmcService.master?.flightPlanService.editFixInfoEntry(value, (fixInfo) => {
                          if (!fixInfo.radials) {
                            fixInfo.radials = [];
                          }

                          fixInfo.radials[0] = { magneticBearing: radial, trueBearing: radial };

                          return fixInfo;
                        });
                      }}
                      dataEntryFormat={new RadialFormat()}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />

                    <InputField<number, number, false>
                      class="mfd-fms-fpln-fix-info-radial-2"
                      readonlyValue={this.flightPlan.fixInfos[value].map(
                        (it) => it?.radials?.[1]?.magneticBearing ?? null,
                      )}
                      onModified={(radial) => {
                        if (radial === null) {
                          return;
                        }

                        this.props.fmcService.master?.flightPlanService.editFixInfoEntry(value, (fixInfo) => {
                          if (!fixInfo.radials) {
                            fixInfo.radials = [];
                          }

                          fixInfo.radials[1] = { magneticBearing: radial, trueBearing: radial };

                          return fixInfo;
                        });
                      }}
                      dataEntryFormat={new RadialFormat()}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </span>
                  <span class="mfd-fms-fpln-fix-info-table-col-center"></span>
                  <span class="mfd-fms-fpln-fix-info-table-col-right"></span>
                </div>
                <div class="fr mfd-fms-fpln-fix-info-table-row-3">
                  <span class="fc mfd-fms-fpln-fix-info-table-col-left">
                    <span class="mfd-fms-fpln-fix-info-radius-header">RADIUS</span>

                    <InputField<number, number, false>
                      class="mfd-fms-fpln-fix-info-radius-1"
                      readonlyValue={this.flightPlan.fixInfos[value].map((it) => it?.radii?.[0]?.radius ?? null)}
                      onModified={(radius) => {
                        if (radius === null) {
                          return;
                        }

                        this.props.fmcService.master?.flightPlanService.editFixInfoEntry(value, (fixInfo) => {
                          if (!fixInfo.radii) {
                            fixInfo.radii = [];
                          }

                          fixInfo.radii[0] = { radius };

                          return fixInfo;
                        });
                      }}
                      dataEntryFormat={new RadiusFormat()}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </span>
                  <span class="mfd-fms-fpln-fix-info-table-col-center"></span>
                  <span class="mfd-fms-fpln-fix-info-table-col-right"></span>
                </div>
                <div class="fr mfd-fms-fpln-fix-info-table-row-4">
                  <span class="mfd-fms-fpln-fix-info-table-col-left"></span>
                  <span class="mfd-fms-fpln-fix-info-table-col-center"></span>
                  <span class="mfd-fms-fpln-fix-info-table-col-right"></span>
                </div>
              </div>
            </TopTabNavigatorPage>
          ))}
        </TopTabNavigator>

        <Button label="RETRUN" onClick={() => {}} buttonStyle="width: 130px; margin-left: 12px;" />

        {/* end page content */}
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
