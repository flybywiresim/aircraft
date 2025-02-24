import {
  FSComponent,
  NumberFormatter,
  NumberUnitSubject,
  Subject,
  Unit,
  UnitFamily,
  UnitType,
  VNode,
} from '@microsoft/msfs-sdk';
import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { Button, ButtonMenuItem } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { getApproachName } from '../../../shared/utils';
import { ApproachType } from '@flybywiresim/fbw-sdk';
import { LandingSystemUtils } from '@fmgc/flightplanning/data/landingsystem';

import './MfdFmsFpln.scss';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { AlternateFlightPlan } from '@fmgc/flightplanning/plans/AlternateFlightPlan';

const ApproachTypeOrder = Object.freeze({
  [ApproachType.Mls]: 0,
  [ApproachType.MlsTypeA]: 1,
  [ApproachType.MlsTypeBC]: 2,
  [ApproachType.Ils]: 3,
  [ApproachType.Gls]: 4,
  [ApproachType.Igs]: 5,
  [ApproachType.Loc]: 6,
  [ApproachType.LocBackcourse]: 7,
  [ApproachType.Lda]: 8,
  [ApproachType.Sdf]: 9,
  [ApproachType.Fms]: 10,
  [ApproachType.Gps]: 11,
  [ApproachType.Rnav]: 12,
  [ApproachType.VorDme]: 13,
  [ApproachType.Vortac]: 13, // VORTAC and VORDME are intentionally the same
  [ApproachType.Tacan]: 13,
  [ApproachType.Vor]: 14,
  [ApproachType.NdbDme]: 15,
  [ApproachType.Ndb]: 16,
  [ApproachType.Unknown]: 17,
});

interface MfdFmsFplnArrProps extends AbstractMfdPageProps {}

export class MfdFmsFplnArr extends FmsPage<MfdFmsFplnArrProps> {
  private readonly toIcao = Subject.create<string>('');

  private readonly rwyIdent = Subject.create<string>('');

  private rwyLength = NumberUnitSubject.create(UnitType.METER.createNumber(NaN));

  private readonly rwyCrs = Subject.create<string>('');

  private readonly approachName = Subject.create<string>('');

  private readonly approachLsFrequencyChannel = Subject.create<string>('');

  private readonly approachLsIdent = Subject.create('');

  private readonly via = Subject.create<string>('');

  private readonly star = Subject.create<string>('');

  private readonly trans = Subject.create<string>('');

  private readonly rwyOptions = Subject.create<ButtonMenuItem[]>([]);

  private readonly apprDisabled = Subject.create<boolean>(false);

  private readonly apprOptions = Subject.create<ButtonMenuItem[]>([]);

  private readonly viaDisabled = Subject.create<boolean>(false);

  private readonly viaOptions = Subject.create<ButtonMenuItem[]>([]);

  private readonly starDisabled = Subject.create<boolean>(false);

  private readonly starOptions = Subject.create<ButtonMenuItem[]>([]);

  private readonly transDisabled = Subject.create<boolean>(false);

  private readonly transOptions = Subject.create<ButtonMenuItem[]>([]);

  private readonly returnButtonDiv = FSComponent.createRef<HTMLDivElement>();

  private readonly tmpyInsertButtonDiv = FSComponent.createRef<HTMLDivElement>();

  private readonly apprButtonScrollTo = Subject.create<number>(0);

  private lengthUnit = Subject.create<Unit<UnitFamily.Distance>>(UnitType.METER);

  protected onNewData(): void {
    if (!this.props.fmcService.master || !this.loadedFlightPlan) {
      return;
    }

    const isAltn = this.props.fmcService.master.revisedLegIsAltn.get() ?? false;
    const flightPlan = isAltn ? this.loadedFlightPlan.alternateFlightPlan : this.loadedFlightPlan;

    if (flightPlan.destinationAirport) {
      this.GenerateRunwayOptions(flightPlan, isAltn);
      if (flightPlan.destinationRunway) {
        this.rwyIdent.set(flightPlan.destinationRunway.ident.substring(4));
        this.rwyLength.set(Number(flightPlan.destinationRunway.length.toFixed(0)), UnitType.METER);
        this.rwyCrs.set(flightPlan.destinationRunway.bearing.toFixed(0).padStart(3, '0') ?? '---');
      } else {
        this.rwyIdent.set('---');
        this.rwyLength.set(NaN);
        this.rwyCrs.set('---');
      }

      if (flightPlan.availableApproaches?.length > 0) {
        const appr: ButtonMenuItem[] = [
          {
            label: 'NONE',
            action: async () => {
              await this.props.fmcService.master?.flightPlanService.setApproach(
                undefined,
                this.loadedFlightPlanIndex.get(),
                isAltn,
              );
              await this.props.fmcService.master?.flightPlanService.setApproachVia(
                undefined,
                this.loadedFlightPlanIndex.get(),
                isAltn,
              );
            },
          },
        ];

        // Sort approaches by runway
        // FIXME add runway-by-itself
        const sortedApproaches = flightPlan.availableApproaches
          .filter(
            (a) =>
              a.type !== ApproachType.Tacan &&
              a.type !== ApproachType.Mls &&
              a.type !== ApproachType.MlsTypeA &&
              a.type !== ApproachType.MlsTypeBC &&
              a.runwayIdent !== undefined && // circling approaches
              a.type !== ApproachType.LocBackcourse, // FIXME remove when supported
          )
          .sort(
            (a, b) =>
              a.runwayIdent?.localeCompare(b.runwayIdent ?? '') ||
              ApproachTypeOrder[a.type] - ApproachTypeOrder[b.type],
          );
        let isFirstMatch = true;
        sortedApproaches.forEach((el, idx) => {
          appr.push({
            label: getApproachName(el),
            action: async () => {
              await this.props.fmcService.master?.flightPlanService.setDestinationRunway(
                el.runwayIdent ?? '',
                this.loadedFlightPlanIndex.get(),
                isAltn,
              ); // Should we do this here?
              await this.props.fmcService.master?.flightPlanService.setApproach(
                el.databaseId,
                this.loadedFlightPlanIndex.get(),
                isAltn,
              );
              await this.props.fmcService.master?.flightPlanService.setApproachVia(
                undefined,
                this.loadedFlightPlanIndex.get(),
                isAltn,
              );
            },
          });

          if (isFirstMatch && el.runwayIdent === flightPlan?.destinationRunway?.ident) {
            this.apprButtonScrollTo.set(idx + 1); // Account for NONE, add 1
            isFirstMatch = false;
          }
        });
        this.apprOptions.set(appr);
        this.apprDisabled.set(false);
      } else {
        this.apprDisabled.set(true);
      }

      if (flightPlan.approach) {
        this.approachName.set(getApproachName(flightPlan.approach, false));
        const ls = flightPlan.approach ? LandingSystemUtils.getLsFromApproach(flightPlan.approach) : undefined;
        // FIXME handle non-localizer types
        this.approachLsFrequencyChannel.set(ls?.frequency.toFixed(2) ?? '');
        this.approachLsIdent.set(ls?.ident ?? '');
        const isRnp = !!flightPlan.approach.authorisationRequired;

        if (flightPlan.availableApproachVias.length > 0) {
          const vias: ButtonMenuItem[] = [
            {
              label: 'NONE',
              action: async () => {
                await this.props.fmcService.master?.flightPlanService.setApproachVia(
                  undefined,
                  this.loadedFlightPlanIndex.get(),
                  isAltn,
                );
              },
            },
          ];

          // Only show VIAs matching to approach (and STAR, if available)
          flightPlan.availableApproachVias
            .filter((via) => {
              if (flightPlan.arrival?.runwayTransitions?.length && flightPlan.arrival?.runwayTransitions?.length > 0) {
                return flightPlan.arrival.runwayTransitions.some(
                  (trans) =>
                    trans.legs[trans.legs.length - 1]?.waypoint?.databaseId === via.legs[0]?.waypoint?.databaseId,
                );
              }
              return true;
            })
            .forEach((via) => {
              vias.push({
                label: isRnp ? `${via.ident} (RNP)` : via.ident,
                action: async () => {
                  await this.props.fmcService.master?.flightPlanService.setApproachVia(
                    via.databaseId,
                    this.loadedFlightPlanIndex.get(),
                    isAltn,
                  );
                },
              });
            });
          this.viaOptions.set(vias);
          this.viaDisabled.set(false);
        } else {
          this.viaDisabled.set(true);
        }
      } else if (flightPlan.availableApproaches?.length > 0) {
        this.approachName.set('------');
        this.approachLsFrequencyChannel.set('---.--');
        this.approachLsIdent.set('');
        this.viaDisabled.set(true);
      } else {
        this.approachName.set('NONE');
        this.approachLsFrequencyChannel.set('---.--');
        this.approachLsIdent.set('');
        this.viaDisabled.set(true);
      }

      if (flightPlan.approachVia) {
        this.via.set(flightPlan.approachVia.ident);
      } else if (!flightPlan.approach || flightPlan?.approach?.transitions?.length > 0) {
        this.via.set('------');
      } else {
        this.via.set('NONE');
      }

      if (flightPlan.availableArrivals?.length > 0 && flightPlan.approach) {
        const arrivals: ButtonMenuItem[] = [
          {
            label: 'NONE',
            action: async () => {
              await this.props.fmcService.master?.flightPlanService.setArrival(
                undefined,
                this.loadedFlightPlanIndex.get(),
                isAltn,
              );
              await this.props.fmcService.master?.flightPlanService.setArrivalEnrouteTransition(
                undefined,
                this.loadedFlightPlanIndex.get(),
                isAltn,
              );
            },
          },
        ];

        flightPlan.availableArrivals.forEach((el) => {
          const arr: ButtonMenuItem = {
            label: el.ident,
            action: async () => {
              await this.props.fmcService.master?.flightPlanService.setArrival(
                el.databaseId,
                this.loadedFlightPlanIndex.get(),
                isAltn,
              );
              await this.props.fmcService.master?.flightPlanService.setArrivalEnrouteTransition(
                undefined,
                this.loadedFlightPlanIndex.get(),
                isAltn,
              );
            },
          };

          if (el.runwayTransitions.length > 0) {
            let apprIsMatching = false;
            el.runwayTransitions.forEach((it) => {
              if (
                it.ident === flightPlan.approach?.runwayIdent ||
                (it.ident.charAt(4) === 'B' &&
                  it.ident.substring(0, 4) === flightPlan.approach?.runwayIdent?.substring(0, 4))
              ) {
                apprIsMatching = true;
              }
            });

            if (apprIsMatching) {
              arrivals.push(arr);
            }
          } else {
            // No runway transitions, push all
            arrivals.push(arr);
          }
        });
        this.starOptions.set(arrivals);
        this.starDisabled.set(false);
      } else {
        this.starDisabled.set(true);
      }

      if (flightPlan.arrival) {
        this.star.set(flightPlan.arrival.ident);

        if (flightPlan.arrival.enrouteTransitions?.length > 0) {
          const trans: ButtonMenuItem[] = [
            {
              label: 'NONE',
              action: async () => {
                await this.props.fmcService.master?.flightPlanService.setArrivalEnrouteTransition(
                  undefined,
                  this.loadedFlightPlanIndex.get(),
                  isAltn,
                );
              },
            },
          ];
          flightPlan.arrival.enrouteTransitions.forEach((el) => {
            trans.push({
              label: el.ident,
              action: async () => {
                await this.props.fmcService.master?.flightPlanService.setArrivalEnrouteTransition(
                  el.databaseId,
                  this.loadedFlightPlanIndex.get(),
                  isAltn,
                );
              },
            });
          });
          this.transOptions.set(trans);
          this.transDisabled.set(false);
        }
      } else {
        if (flightPlan.availableArrivals?.length > 0) {
          this.star.set('------');
        } else {
          this.star.set('NONE');
        }
        this.transDisabled.set(true);
      }

      if (flightPlan.arrivalEnrouteTransition) {
        this.trans.set(flightPlan.arrivalEnrouteTransition.ident);
      } else if (flightPlan?.arrival?.enrouteTransitions?.length === 0) {
        this.trans.set('NONE');
      } else {
        this.trans.set('------');
      }
    } else {
      this.toIcao.set('----');
    }
  }

  private GenerateRunwayOptions(
    flightPlan: FlightPlan<FlightPlanPerformanceData> | AlternateFlightPlan<FlightPlanPerformanceData>,
    isAltn: boolean,
  ) {
    if (flightPlan.destinationAirport) {
      this.toIcao.set(flightPlan.destinationAirport.ident);

      const runways: ButtonMenuItem[] = [];
      const sortedRunways = flightPlan.availableDestinationRunways.sort((a, b) => a.ident.localeCompare(b.ident));
      sortedRunways.forEach((rw) => {
        runways.push({
          label: `${rw.ident.substring(4).padEnd(3, ' ')} ${UnitType.METER.createNumber(rw.length).asUnit(this.lengthUnit.get()).toFixed(0).padStart(5, ' ')}${this.distanceUnitFormatter(this.lengthUnit.get())}`,
          action: async () => {
            await this.props.fmcService.master?.flightPlanService.setDestinationRunway(
              rw.ident,
              this.loadedFlightPlanIndex.get(),
              isAltn,
            );
            await this.props.fmcService.master?.flightPlanService.setApproach(
              undefined,
              this.loadedFlightPlanIndex.get(),
              isAltn,
            );
            await this.props.fmcService.master?.flightPlanService.setApproachVia(
              undefined,
              this.loadedFlightPlanIndex.get(),
              isAltn,
            );
          },
        });
      });
      this.rwyOptions.set(runways);
    }
  }

  private lengthNumberFormatter = NumberFormatter.create({
    nanString: '----',
    precision: 1,
  });

  private distanceUnitFormatter(unit: Unit<UnitFamily.Distance>) {
    return unit === UnitType.METER ? 'M' : 'FT';
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.tmpyActive.sub((v) => {
        if (this.returnButtonDiv.getOrDefault() && this.tmpyInsertButtonDiv.getOrDefault()) {
          this.returnButtonDiv.instance.style.visibility = v ? 'hidden' : 'visible';
          this.tmpyInsertButtonDiv.instance.style.visibility = v ? 'visible' : 'hidden';
        }
      }, true),
    );

    NXDataStore.getAndSubscribe(
      'CONFIG_USING_METRIC_UNIT',
      (key, value) => {
        this.lengthUnit.set(value === '0' ? UnitType.FOOT : UnitType.METER);
      },
      '1',
    );

    this.lengthUnit.sub(() => {
      if (!this.props.fmcService.master || !this.loadedFlightPlan) {
        return;
      }

      const isAltn = this.props.fmcService.master.revisedLegIsAltn.get() ?? false;
      const flightPlan = isAltn ? this.loadedFlightPlan.alternateFlightPlan : this.loadedFlightPlan;

      if (flightPlan.destinationAirport) {
        this.GenerateRunwayOptions(flightPlan, isAltn);
      }
    }, true);
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="mfd-fms-fpln-labeled-box-container">
          <span class="mfd-label mfd-spacing-right mfd-fms-fpln-labeled-box-label">SELECTED ARRIVAL</span>
          <div class="mfd-fms-fpln-label-bottom-space fr aic">
            <div class="fr aic" style="flex: 0.2;">
              <span class="mfd-label mfd-spacing-right">TO</span>
              <span
                class={{
                  'mfd-value': true,
                  tmpy: this.tmpyActive,
                  sec: this.secActive,
                }}
              >
                {this.toIcao}
              </span>
            </div>
            <div class="fc" style="flex: 0.2;">
              <span class="mfd-label mfd-fms-fpln-label-bottom-space">LS</span>
              <span
                class={{
                  'mfd-value': true,
                  tmpy: this.tmpyActive,
                  sec: this.secActive,
                }}
              >
                {this.approachLsIdent}
              </span>
            </div>
            <div class="fc" style="flex: 0.2;">
              <span class="mfd-label mfd-fms-fpln-label-bottom-space">RWY</span>
              <div>
                <span
                  class={{
                    'mfd-value': true,
                    tmpy: this.tmpyActive,
                    sec: this.secActive,
                  }}
                >
                  {this.rwyIdent}
                </span>
              </div>
            </div>
            <div class="fc" style="flex: 0.2;">
              <span class="mfd-label mfd-fms-fpln-label-bottom-space">LENGTH</span>
              <div>
                <span
                  class={{
                    'mfd-value': true,
                    tmpy: this.tmpyActive,
                    sec: this.secActive,
                  }}
                >
                  {this.rwyLength.asUnit(this.lengthUnit).map((v) => this.lengthNumberFormatter(v))}
                </span>
                <span class="mfd-label-unit mfd-unit-trailing">
                  {this.lengthUnit.map((v) => this.distanceUnitFormatter(v))}
                </span>
              </div>
            </div>
            <div class="fc" style="flex: 0.2;">
              <span class="mfd-label mfd-fms-fpln-label-bottom-space">CRS</span>
              <div>
                <span
                  class={{
                    'mfd-value': true,
                    tmpy: this.tmpyActive,
                    sec: this.secActive,
                  }}
                >
                  {this.rwyCrs}
                </span>
                <span class="mfd-label-unit mfd-unit-trailing">°</span>
              </div>
            </div>
          </div>
          <div class="fr aic">
            <div class="fc" style="flex: 0.2;">
              <span class="mfd-label mfd-fms-fpln-label-bottom-space">APPR</span>
              <span
                class={{
                  'mfd-value': true,
                  tmpy: this.tmpyActive,
                  sec: this.secActive,
                }}
              >
                {this.approachName}
              </span>
            </div>
            <div class="fc" style="flex: 0.2;">
              <span class="mfd-label mfd-fms-fpln-label-bottom-space">FREQ/CHAN</span>
              <span
                class={{
                  'mfd-value': true,
                  tmpy: this.tmpyActive,
                  sec: this.secActive,
                }}
              >
                {this.approachLsFrequencyChannel}
              </span>
            </div>
            <div class="fc" style="flex: 0.2;">
              <span class="mfd-label mfd-fms-fpln-label-bottom-space">VIA</span>
              <div>
                <span
                  class={{
                    'mfd-value': true,
                    tmpy: this.tmpyActive,
                    sec: this.secActive,
                  }}
                >
                  {this.via}
                </span>
              </div>
            </div>
            <div class="fc" style="flex: 0.2;">
              <span class="mfd-label mfd-fms-fpln-label-bottom-space">STAR</span>
              <div>
                <span
                  class={{
                    'mfd-value': true,
                    tmpy: this.tmpyActive,
                    sec: this.secActive,
                  }}
                >
                  {this.star}
                </span>
              </div>
            </div>
            <div class="fc" style="flex: 0.2;">
              <span class="mfd-label mfd-fms-fpln-label-bottom-space">TRANS</span>
              <div>
                <span
                  class={{
                    'mfd-value': true,
                    tmpy: this.tmpyActive,
                    sec: this.secActive,
                  }}
                >
                  {this.trans}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="fr" style="justify-content: space-between;">
          <Button
            label="RWY"
            onClick={() => {}}
            buttonStyle="width: 190px;"
            idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_f-pln-arr-rwy-btn`}
            menuItems={this.rwyOptions}
          />
          <Button
            label="APPR"
            onClick={() => {}}
            disabled={this.apprDisabled}
            buttonStyle="width: 160px;"
            idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_f-pln-arr-appr-btn`}
            menuItems={this.apprOptions}
            scrollToMenuItem={this.apprButtonScrollTo}
          />
          <Button
            label="VIA"
            onClick={() => {}}
            disabled={this.viaDisabled}
            buttonStyle="width: 125px;"
            idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_f-pln-arr-via-btn`}
            menuItems={this.viaOptions}
          />
          <Button
            label="STAR"
            onClick={() => {}}
            disabled={this.starDisabled}
            buttonStyle="width: 125px;"
            idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_f-pln-arr-star-btn`}
            menuItems={this.starOptions}
          />
          <Button
            label="TRANS"
            onClick={() => {}}
            disabled={this.transDisabled}
            buttonStyle="width: 125px;"
            idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_f-pln-arr-trans-btn`}
            menuItems={this.transOptions}
          />
        </div>
        <div style="flex-grow: 1;" />
        <div class="fr" style="justify-content: space-between;">
          <div ref={this.returnButtonDiv} style="display: flex; justify-content: flex-end; padding: 2px;">
            <Button
              label="RETURN"
              onClick={() => {
                this.props.fmcService.master?.resetRevisedWaypoint();
                this.props.mfd.uiService.navigateTo('back');
              }}
            />
          </div>
          <div ref={this.tmpyInsertButtonDiv} style="display: flex; justify-content: flex-end; padding: 2px;">
            <Button
              label="TMPY F-PLN"
              onClick={() => {
                this.props.fmcService.master?.resetRevisedWaypoint();
                this.props.mfd.uiService.navigateTo(`fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln`);
              }}
              buttonStyle="color: yellow"
            />
          </div>
        </div>
        {/* end page content */}
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
