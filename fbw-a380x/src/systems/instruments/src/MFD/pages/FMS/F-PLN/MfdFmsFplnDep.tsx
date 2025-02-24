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

import './MfdFmsFpln.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { Button, ButtonMenuItem } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { AlternateFlightPlan } from '@fmgc/flightplanning/plans/AlternateFlightPlan';

interface MfdFmsFplnDepProps extends AbstractMfdPageProps {}

export class MfdFmsFplnDep extends FmsPage<MfdFmsFplnDepProps> {
  private readonly fromIcao = Subject.create<string>('');

  private readonly rwyIdent = Subject.create<string>('');

  private rwyLength = NumberUnitSubject.create(UnitType.METER.createNumber(NaN));

  private readonly rwyCrs = Subject.create<string>('');

  private readonly rwyEoSid = Subject.create<string>('');

  private readonly rwyFreq = Subject.create<string>('');

  private readonly rwySid = Subject.create<string>('');

  private readonly rwyTrans = Subject.create<string>('');

  private readonly rwyOptions = Subject.create<ButtonMenuItem[]>([]);

  private readonly sidDisabled = Subject.create<boolean>(false);

  private readonly sidOptions = Subject.create<ButtonMenuItem[]>([]);

  private readonly transDisabled = Subject.create<boolean>(false);

  private readonly transOptions = Subject.create<ButtonMenuItem[]>([]);

  private readonly returnButtonDiv = FSComponent.createRef<HTMLDivElement>();

  private readonly tmpyInsertButtonDiv = FSComponent.createRef<HTMLDivElement>();

  private lengthUnit = Subject.create<Unit<UnitFamily.Distance>>(UnitType.METER);

  protected onNewData(): void {
    const isAltn = this.props.fmcService.master?.revisedLegIsAltn.get();
    const flightPlan = isAltn ? this.loadedFlightPlan?.alternateFlightPlan : this.loadedFlightPlan;

    if (flightPlan?.originAirport) {
      this.GenerateRunwayOptions(flightPlan, isAltn);

      if (flightPlan.originRunway) {
        this.rwyIdent.set(flightPlan.originRunway.ident.substring(4));
        this.rwyLength.set(Number(flightPlan.originRunway.length.toFixed(0)), UnitType.METER);
        this.rwyCrs.set(flightPlan.originRunway.bearing.toFixed(0).padStart(3, '0') ?? '---');
        this.rwyEoSid.set('NONE');
        this.rwyFreq.set(flightPlan.originRunway.lsFrequencyChannel?.toFixed(2) ?? '---.--');

        if (flightPlan.availableDepartures?.length > 0) {
          const sids: ButtonMenuItem[] = [
            {
              label: 'NONE',
              action: async () => {
                await this.props.fmcService.master?.flightPlanService.setDepartureProcedure(
                  undefined,
                  this.loadedFlightPlanIndex.get(),
                  isAltn ?? false,
                );
                await this.props.fmcService.master?.flightPlanService.setDepartureEnrouteTransition(
                  undefined,
                  this.loadedFlightPlanIndex.get(),
                  isAltn ?? false,
                );
              },
            },
          ];
          const sortedDepartures = flightPlan.availableDepartures.sort((a, b) => a.ident.localeCompare(b.ident));
          sortedDepartures.forEach((dep) => {
            sids.push({
              label: dep.authorisationRequired ? `${dep.ident} (RNP)` : dep.ident,
              action: async () => {
                await this.props.fmcService.master?.flightPlanService.setDepartureProcedure(
                  dep.databaseId,
                  this.loadedFlightPlanIndex.get(),
                  isAltn ?? false,
                );
                await this.props.fmcService.master?.flightPlanService.setDepartureEnrouteTransition(
                  undefined,
                  this.loadedFlightPlanIndex.get(),
                  isAltn ?? false,
                );
              },
            });
          });
          this.sidOptions.set(sids);
          this.sidDisabled.set(false);
        }
      } else {
        this.rwyIdent.set('---');
        this.rwyLength.set(NaN);
        this.rwyCrs.set('---');
        this.rwyEoSid.set('------');
        this.rwyFreq.set('---.--');
        this.sidDisabled.set(true);
      }

      if (flightPlan.originDeparture) {
        this.rwySid.set(flightPlan.originDeparture.ident);

        if (flightPlan.originDeparture.enrouteTransitions?.length > 0) {
          const trans: ButtonMenuItem[] = [
            {
              label: 'NONE',
              action: () =>
                this.props.fmcService.master?.flightPlanService.setDepartureEnrouteTransition(
                  undefined,
                  this.loadedFlightPlanIndex.get(),
                  isAltn ?? false,
                ),
            },
          ];
          flightPlan.originDeparture.enrouteTransitions.forEach((el) => {
            trans.push({
              label: el.ident,
              action: () =>
                this.props.fmcService.master?.flightPlanService.setDepartureEnrouteTransition(
                  el.databaseId,
                  this.loadedFlightPlanIndex.get(),
                  isAltn ?? false,
                ),
            });
          });
          this.transOptions.set(trans);
          this.transDisabled.set(false);
        }
      } else {
        if (flightPlan.availableDepartures?.length > 0) {
          this.rwySid.set('------');
        } else {
          this.rwySid.set('NONE');
        }
        this.transDisabled.set(true);
      }

      if (flightPlan.departureEnrouteTransition) {
        this.rwyTrans.set(flightPlan.departureEnrouteTransition.ident);
      } else if (flightPlan?.originDeparture?.enrouteTransitions?.length === 0) {
        this.rwyTrans.set('NONE');
      } else {
        this.rwyTrans.set('------');
      }
    } else {
      this.fromIcao.set('----');
    }
  }

  private GenerateRunwayOptions(
    flightPlan: FlightPlan<FlightPlanPerformanceData> | AlternateFlightPlan<FlightPlanPerformanceData>,
    isAltn: boolean | null | undefined,
  ) {
    if (flightPlan.originAirport) {
      this.fromIcao.set(flightPlan.originAirport.ident);

      const sortedRunways = flightPlan.availableOriginRunways.sort((a, b) => a.ident.localeCompare(b.ident));
      const runways: ButtonMenuItem[] = sortedRunways.map((rw) => {
        return {
          label: `${rw.ident.substring(4).padEnd(3, ' ')} ${UnitType.METER.createNumber(rw.length).asUnit(this.lengthUnit.get()).toFixed(0).padStart(5, ' ')}${this.distanceUnitFormatter(this.lengthUnit.get())} ${rw.lsIdent ? 'ILS' : ''}`,
          action: async () => {
            await this.props.fmcService.master?.flightPlanService.setOriginRunway(
              rw.ident,
              this.loadedFlightPlanIndex.get(),
              isAltn ?? false,
            );
            await this.props.fmcService.master?.flightPlanService.setDepartureProcedure(
              undefined,
              this.loadedFlightPlanIndex.get(),
              isAltn ?? false,
            );
            await this.props.fmcService.master?.flightPlanService.setDepartureEnrouteTransition(
              undefined,
              this.loadedFlightPlanIndex.get(),
              isAltn ?? false,
            );
          },
        };
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
          <span class="mfd-label mfd-spacing-right mfd-fms-fpln-labeled-box-label">SELECTED DEPARTURE</span>
          <div class="mfd-fms-fpln-label-bottom-space fr aic">
            <div class="fr aic" style="flex: 3;">
              <span class="mfd-label mfd-spacing-right">FROM</span>
              <span
                class={{
                  'mfd-value': true,
                  tmpy: this.tmpyActive,
                  sec: this.secActive,
                }}
              >
                {this.fromIcao}
              </span>
            </div>
            <div class="fc" style="flex: 1;">
              <span class="mfd-label mfd-fms-fpln-label-bottom-space">RWY</span>
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
            <div class="fc" style="flex: 1.3;">
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
            <div class="fc" style="flex: 0.7;">
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
            <div class="fc" style="flex: 0.25;">
              <span class="mfd-label mfd-fms-fpln-label-bottom-space">EOSID</span>
              <span
                class={{
                  'mfd-value': true,
                  tmpy: this.tmpyActive,
                  sec: this.secActive,
                }}
              >
                {this.rwyEoSid}
              </span>
            </div>
            <div class="fc" style="flex: 0.3;">
              <span class="mfd-label mfd-fms-fpln-label-bottom-space">FREQ/CHAN</span>
              <span
                class={{
                  'mfd-value': true,
                  tmpy: this.tmpyActive,
                  sec: this.secActive,
                }}
              >
                {this.rwyFreq}
              </span>
            </div>
            <div class="fc" style="flex: 0.25;">
              <span class="mfd-label mfd-fms-fpln-label-bottom-space">SID</span>
              <div>
                <span
                  class={{
                    'mfd-value': true,
                    tmpy: this.tmpyActive,
                    sec: this.secActive,
                  }}
                >
                  {this.rwySid}
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
                  {this.rwyTrans}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="fr" style="margin-left: 50px;">
          <Button
            label="RWY"
            onClick={() => {}}
            buttonStyle="width: 250px;"
            idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_f-pln-dep-rwy-btn`}
            menuItems={this.rwyOptions}
          />
          <div style="width: 100px;" />
          <Button
            label="SID"
            onClick={() => {}}
            disabled={this.sidDisabled}
            buttonStyle="width: 140px;"
            idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_f-pln-dep-sid-btn`}
            menuItems={this.sidOptions}
          />
          <div style="width: 50px;" />
          <Button
            label="TRANS"
            onClick={() => {}}
            disabled={this.transDisabled}
            buttonStyle="width: 130px;"
            idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_f-pln-dep-trans-btn`}
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
