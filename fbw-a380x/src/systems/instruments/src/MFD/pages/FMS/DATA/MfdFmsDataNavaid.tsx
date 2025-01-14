// Copyright (c) 2023-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ArraySubject, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';
import { coordinateToString, VhfNavaid } from '@flybywiresim/fbw-sdk';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { NavigationDatabaseService } from '@fmgc/index';
import { NAVAID_TYPE_STRINGS } from 'instruments/src/MFD/pages/FMS/POSITION/MfdFmsPositionNavaids';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { ConditionalComponent } from 'instruments/src/MFD/pages/common/ConditionalComponent';
import {
  AltitudeFormat,
  LatitudeFormat,
  LengthFormat,
  NavaidIdentFormat,
} from 'instruments/src/MFD/pages/common/DataEntryFormats';

import './MfdFmsDataNavaid.scss';

interface MfdFmsDataAirportProps extends AbstractMfdPageProps {}

/** The information about a navaid. */
interface NavaidData {
  airportIdent: string;
  ident: string;
  class: string;
  latLong: string;
  elevation: string;
  stationDeclination: string;
  declinationCardinalDir: string;
  runwayIdent: string;
  freq: string;
  category: string;
  course: string;
  figOfMerit: string;
}

/** The class of a navaid. */
export enum NavaidClass {
  VOR = 0,
  DME = 1,
  LOC = 2,
  ILS = 3,
  GLS = 4,
  NDB = 5,
  VOR_DME = 6,
}

/** The type of navaid that is selected. */
export enum SelectedNavaidType {
  LS = 0,
  VOR = 1,
}

/** The category of an ILS. */
export enum NavaidCategory {
  CAT1 = 0,
  CAT2 = 1,
  CAT3 = 2,
}

/** The figure of merit of a navaid. */
export enum NavaidFom {
  FOM0 = 0,
  FOM1 = 1,
  FOM2 = 2,
  FOM3 = 3,
}

/** The field to display for a navaid. */
interface NavaidField {
  /** The label to display for the field. */
  label: string;
  /** The value to display for the field. */
  value: (data: NavaidData) => string;
  /** The class to apply to the field. */
  class?: string;
  /** The unit to display for the field. */
  unit?: string | ((data: NavaidData) => string);
}

export class MfdFmsDataNavaid extends FmsPage<MfdFmsDataAirportProps> {
  private readonly selectedPageIndex = Subject.create<number>(0);
  private readonly storedNavaids = Subject.create('00');
  private readonly deleteStoredElementsDisabled = Subject.create(true);
  private readonly isSwapConfirmVisible = Subject.create(false);

  private readonly db = NavigationDatabaseService.activeDatabase.backendDatabase;

  private readonly selectedNavaid = Subject.create<string | null>(null);
  private readonly selectedNavaidType = Subject.create<SelectedNavaidType | null>(null);
  private readonly freq = Subject.create<string | null>(null);

  private readonly newNavaidIdent = Subject.create<string | null>(null);
  private readonly newNavaidClass = Subject.create<NavaidClass | null>(NavaidClass.VOR);
  private readonly newNavaidCat = Subject.create<NavaidCategory | null>(NavaidCategory.CAT1);
  private readonly newNavaidFom = Subject.create<NavaidFom | null>(NavaidFom.FOM0);

  static defaultNavaidData: NavaidData = {
    airportIdent: '',
    ident: '',
    class: '',
    latLong: '',
    elevation: '',
    stationDeclination: '',
    declinationCardinalDir: '',
    runwayIdent: '',
    freq: '',
    category: '',
    course: '',
    figOfMerit: '',
  };

  private readonly navaidData = Subject.create<NavaidData>(MfdFmsDataNavaid.defaultNavaidData);

  private getNavaidType(navaid: VhfNavaid): string {
    const typeMapping = {
      [1 << 1]: NAVAID_TYPE_STRINGS[2],
      [1 << 2]: NAVAID_TYPE_STRINGS[3],
      [1 << 3]: NAVAID_TYPE_STRINGS[1],
      [1 << 4]: NAVAID_TYPE_STRINGS[5],
      [1 << 5]: NAVAID_TYPE_STRINGS[4],
      [1 << 7]: NAVAID_TYPE_STRINGS[6],
    };
    return typeMapping[navaid.type] || 'N/A';
  }

  private getILSCategory(navaid: VhfNavaid): string {
    const catStr = navaid.name?.match(/CAT\s+(I{1,3})/)?.[1];

    switch (catStr) {
      case 'I':
        return '1';
      case 'II':
        return '2';
      case 'III':
        return '3';
      default:
        return 'N/A';
    }
  }

  private async getLocBearing(navaid: VhfNavaid): Promise<number | null> {
    if (navaid.type === 1 << 7) {
      const ilsData = await this.db.getILSs([navaid.ident]);
      const selectedILS = await this.props.mfd.deduplicateFacilities(ilsData);

      if (selectedILS) {
        return selectedILS.locBearing;
      }
    }
    return null;
  }

  private async fetchNavaid(ident: string | null): Promise<void> {
    if (!ident) return;

    try {
      const selectedNavaid = await this.getSelectedNavaid(ident);
      const locBearing = await this.getLocBearing(selectedNavaid);
      const frequency = this.formatFrequency(selectedNavaid.frequency);

      this.freq.set(frequency);

      console.log(selectedNavaid);

      const navaidInfo = this.createNavaidInfo(selectedNavaid, locBearing, frequency);

      this.updateContainerDisplay(navaidInfo.runwayIdent);
      this.navaidData.set(navaidInfo);
    } catch (e) {
      console.error(`[FMS/FPM] Error loading navaid: ${e}`);
    }
  }

  private async getSelectedNavaid(ident: string): Promise<VhfNavaid> {
    const navaids = await this.db.getNavaids([ident]);
    const selectedNavaid = await this.props.mfd.deduplicateFacilities(navaids);

    if (!selectedNavaid) {
      throw new Error(`[FMS/FPM] Can't find navaid with ICAO '${ident}'`);
    }

    return selectedNavaid;
  }

  private formatFrequency(frequency: number): string {
    // As per the FCOM, we should display the frequency with one decimal place if the last digit is 0.
    return frequency.toFixed(2).endsWith('0') ? frequency.toFixed(1) : frequency.toFixed(2);
  }

  private createNavaidInfo(selectedNavaid: VhfNavaid, locBearing: number | null, frequency: string): NavaidData {
    return {
      airportIdent: selectedNavaid.airportIdent,
      ident: selectedNavaid.ident,
      class: this.getNavaidType(selectedNavaid),
      latLong: coordinateToString(selectedNavaid.location.lat, selectedNavaid.location.long, false),
      elevation: 'N/A',
      stationDeclination: selectedNavaid.stationDeclination.toFixed(1).replace('-', ''),
      declinationCardinalDir: selectedNavaid.stationDeclination > 0 ? 'E' : 'W',
      runwayIdent: selectedNavaid.name?.includes('RW')
        ? `${selectedNavaid.airportIdent}${selectedNavaid.name.split('RW')[1]}`
        : 'N/A',
      freq: frequency ?? 'N/A',
      category: this.getILSCategory(selectedNavaid),
      course: locBearing?.toFixed(0) ?? 'N/A',
      figOfMerit: selectedNavaid.figureOfMerit.toFixed(0),
    };
  }

  /* Toggle the display of the LS or VOR container depending on whether or not a rwyIdent is set. */
  private updateContainerDisplay(rwyIdent: string | null): void {
    const isRwyIdentAvailable = rwyIdent !== 'N/A';
    this.selectedNavaidType.set(isRwyIdentAvailable ? SelectedNavaidType.LS : SelectedNavaidType.VOR);
  }

  protected onNewData() {
    const storedElements = this.props.fmcService.master?.getDataManager()?.numberOfStoredElements();
    if (storedElements) {
      this.storedNavaids.set(storedElements.navaids.toFixed(0).padStart(2, '0'));
      this.deleteStoredElementsDisabled.set(storedElements.total === 0);
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.selectedNavaid.sub((icao: string | null) => {
      this.fetchNavaid(icao);
    });

    this.subs.push(
      this.props.mfd.uiService.activeUri.sub((val) => {
        if (val.extra === 'acft-status') {
          this.selectedPageIndex.set(0);
        } else if (val.extra === 'fms-pn') {
          this.selectedPageIndex.set(1);
        }
      }, true),
    );
  }

  private renderNavaidFields(type: SelectedNavaidType): VNode {
    const commonFields: NavaidField[] = [
      { label: 'CLASS', value: (data: NavaidData) => data.class },
      { label: 'LAT/LONG', value: (data: NavaidData) => data.latLong },
      { label: 'ELEVATION', value: (data: NavaidData) => data.elevation, class: 'indent-1' },
    ];

    const lsFields = [
      { label: 'RWY IDENT', value: (data: NavaidData) => data.runwayIdent },
      { label: 'FREQ', value: (data: NavaidData) => data.freq },
      { label: 'CAT', value: (data: NavaidData) => data.category },
      { label: 'CRS', value: (data: NavaidData) => data.course, unit: '°', class: 'indent-0' },
      { label: 'FIG OF MERIT', value: (data: NavaidData) => data.figOfMerit },
    ];

    const vorFields = [
      {
        label: 'STATION DEC',
        value: (data: NavaidData) => data.stationDeclination,
        unit: (data: NavaidData) => `°${data.declinationCardinalDir}`,
      },
      { label: 'FREQ', value: (data: NavaidData) => data.freq },
      { label: 'FIG OF MERIT', value: (data: NavaidData) => data.figOfMerit },
    ];

    const fields = type === SelectedNavaidType.LS ? [...commonFields, ...lsFields] : [...commonFields, ...vorFields];

    return (
      <div class={`mfd-data-navaid-information-row`}>
        {fields.map((field) => (
          <div class="mfd-label">{field.label}</div>
        ))}
        <div class={`mfd-data-navaid-information-row right`}>
          {fields.map((field: NavaidField) => (
            <div class={`mfd-value bigger ${field.class || ''}`}>
              {this.navaidData.map((data) => field.value(data))}
              {field.unit && <span class="mfd-label-unit mfd-unit-trailing">{field.unit ? field.unit : ''}</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  public render(): VNode {
    return (
      <>
        {super.render()}
        <div class="mfd-page-container">
          <TopTabNavigator
            pageTitles={Subject.create(['DATABASE NAVAIDS', 'PILOT STORED NAVAIDS'])}
            selectedPageIndex={this.selectedPageIndex}
            pageChangeCallback={(val) => {
              this.selectedPageIndex.set(val);
              this.isSwapConfirmVisible.set(false);
            }}
            selectedTabTextColor="white"
            tabBarSlantedEdgeAngle={25}
          >
            <TopTabNavigatorPage containerStyle="height: 680px;">
              <div class="mfd-data-navaid-input-container">
                <div class="mfd-label" style="margin-right: 90px">
                  NAVAID IDENT
                </div>
                <InputField<string>
                  dataEntryFormat={new NavaidIdentFormat()}
                  dataHandlerDuringValidation={async (v) => {
                    this.selectedNavaid.set(v);
                  }}
                  mandatory={Subject.create(true)}
                  canBeCleared={Subject.create(false)}
                  value={this.selectedNavaid}
                  alignText="center"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                  containerStyle="margin-right: 60px"
                />
              </div>

              <div class="mfd-data-navaid-information-container">
                <ConditionalComponent
                  condition={this.selectedNavaidType.map((type) => type === SelectedNavaidType.LS)}
                  componentIfTrue={this.renderNavaidFields(SelectedNavaidType.LS)}
                  componentIfFalse={<></>}
                />
                <ConditionalComponent
                  condition={this.selectedNavaidType.map((type) => type === SelectedNavaidType.VOR)}
                  componentIfTrue={this.renderNavaidFields(SelectedNavaidType.VOR)}
                  componentIfFalse={<></>}
                />
              </div>
            </TopTabNavigatorPage>
            <TopTabNavigatorPage containerStyle="height: 680px;">
              <div class="mfd-label" style={'align-self: center; position: relative; top: 45px;'}>
                NO PILOT STORED NAVAID
              </div>
              <Button
                label={'NEW NAVAID'}
                onClick={() => {}}
                buttonStyle="width: 170px; height: 60px; position: absolute; right: 0; top: 630px;"
                disabled={Subject.create(true)}
              />
              <div class="new-navaid-container" style={'display: none;'}>
                <div class="mfd-data-navaid-input-container">
                  <div class="mfd-label" style={'position: relative; right: 90px;'}>
                    NAVAID IDENT
                  </div>
                  <div>
                    <InputField<string>
                      dataEntryFormat={new NavaidIdentFormat()}
                      dataHandlerDuringValidation={async (v) => {
                        this.newNavaidIdent.set(v);
                      }}
                      mandatory={Subject.create(true)}
                      canBeCleared={Subject.create(true)}
                      value={this.newNavaidIdent}
                      alignText="center"
                      errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                      containerStyle="position: relative; right: 60px;"
                    />
                  </div>
                </div>
                <div class="mfd-data-navaid-options">
                  <div class="option class">
                    <div class="mfd-label">CLASS</div>
                    <DropdownMenu
                      values={ArraySubject.create(['VOR', 'DME', 'LOC', 'ILS', 'GLS', 'NDB', 'VOR/DME'])}
                      freeTextAllowed={false}
                      selectedIndex={this.newNavaidClass}
                      onModified={(v) => this.newNavaidClass.set(v)}
                      alignLabels={'center'}
                      idPrefix={''}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </div>
                  <div class="option lat-long">
                    <div class="mfd-label">LAT/LONG</div>
                    <InputField
                      dataEntryFormat={new LatitudeFormat(Subject.create('-------'))}
                      dataHandlerDuringValidation={async (v) => {
                        console.log(v);
                      }}
                      mandatory={Subject.create(false)}
                      canBeCleared={Subject.create(true)}
                      value={Subject.create<number | null>(null)}
                      alignText="center"
                      errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                    <span>/</span>
                    <InputField
                      dataEntryFormat={new LatitudeFormat(Subject.create('-------'))}
                      dataHandlerDuringValidation={async (v) => {
                        console.log(v);
                      }}
                      mandatory={Subject.create(false)}
                      canBeCleared={Subject.create(true)}
                      value={Subject.create<number | null>(null)}
                      alignText="center"
                      errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </div>
                  <div class="option elevation">
                    <div class="mfd-label">ELEVATION</div>
                    <InputField
                      dataEntryFormat={new AltitudeFormat()}
                      dataHandlerDuringValidation={async (v) => {
                        console.log(v);
                      }}
                      mandatory={Subject.create(false)}
                      canBeCleared={Subject.create(true)}
                      value={Subject.create<number | null>(null)}
                      alignText="center"
                      errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </div>
                  <div class="option station-dec">
                    <div class="mfd-label">STATION DEC</div>
                    <InputField
                      dataEntryFormat={new LengthFormat()}
                      dataHandlerDuringValidation={async (v) => {
                        console.log(v);
                      }}
                      mandatory={Subject.create(false)}
                      canBeCleared={Subject.create(true)}
                      value={Subject.create<number | null>(null)}
                      alignText="center"
                      errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </div>
                  <div class="option cat">
                    <div class="mfd-label">CAT</div>
                    <DropdownMenu
                      values={ArraySubject.create(['1', '2', '3'])}
                      freeTextAllowed={false}
                      selectedIndex={this.newNavaidCat}
                      onModified={(v) => this.newNavaidCat.set(v)}
                      alignLabels={'center'}
                      idPrefix={''}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </div>
                  <div class="option fom">
                    <div class="mfd-label">FIG OF MERIT</div>
                    <DropdownMenu
                      values={ArraySubject.create(['0 (40NM)', '1 (70NM)', '2 (130NM)', '3 (250NM)'])}
                      freeTextAllowed={false}
                      selectedIndex={this.newNavaidFom}
                      onModified={(v) => this.newNavaidFom.set(v)}
                      alignLabels={'center'}
                      idPrefix={''}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </div>
                </div>
              </div>
            </TopTabNavigatorPage>
          </TopTabNavigator>
          <div style="flex-grow: 1;" />
          {/* fill space vertically */}
        </div>
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
