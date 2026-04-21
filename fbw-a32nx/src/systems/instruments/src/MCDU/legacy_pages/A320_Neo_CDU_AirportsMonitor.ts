import { NXSystemMessages } from '../messages/NXSystemMessages';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FmgcFlightPhase } from '@shared/flightphase';
import { Airport, isNearbyAirportFacility, MagVar, NearbyAirportFacility, NXUnits } from '@flybywiresim/fbw-sdk';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { bearingTo, distanceTo } from 'msfs-geo';
import { Predictions } from '@fmgc/guidance/vnav/Predictions';
import { UnitType } from '@microsoft/msfs-sdk';
import { A320AircraftConfig } from '@fmgc/flightplanning/A320AircraftConfig';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

interface AirportRow {
  airport?: Airport | NearbyAirportFacility;

  /** Bearing to the airport in degrees from true north. */
  bearing?: number;
  /** Distance calculated to the airport in nautical miles. */
  distance?: number;
  /** Estimated time of arrival the airport. */
  eta?: Date;
  /** Estimated fuel on board upon arrival at the airport in tonnes. */
  efob?: number;
}

export class CDUAirportsMonitor {
  private static readonly NUM_AIRPORTS = 4;
  private static readonly airportRows: AirportRow[] = Array.from(
    { length: CDUAirportsMonitor.NUM_AIRPORTS + 1 },
    () => ({}),
  );
  /** Effective wind for each airport (entered by pilot), in knots, +ve = tailwind. */
  private static readonly effectiveWinds = new Map<string, number>();
  private static pilotAirport = this.airportRows[CDUAirportsMonitor.NUM_AIRPORTS];
  private static magVar: number | null = 0;

  static ShowPage(mcdu: LegacyFmsPageInterface, frozen = false, showEfob = false, isRefresh = false) {
    mcdu.page.Current = mcdu.page.AirportsMonitor;
    mcdu.clearDisplay();

    // regular update due to showing dynamic data on this page
    mcdu.SelfPtr = setTimeout(() => {
      CDUAirportsMonitor.ShowPage(mcdu, frozen, showEfob, true);
    }, mcdu.PageTimeout.Default);

    const template = [
      ['CLOSEST AIRPORTS'],
      [
        '',
        '',
        showEfob
          ? '\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0EFOB\xa0\xa0\xa0EFF\xa0WIND\xa0'
          : '\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0BRG\xa0\xa0\xa0DIST\xa0\xa0UTC\xa0',
      ],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ];

    const ppos = mcdu.navigation?.getPpos();
    if (!ppos) {
      mcdu.setTemplate(template);
      if (!isRefresh) {
        mcdu.setScratchpadMessage(NXSystemMessages.acPositionInvalid);
      }
      return;
    }

    if (!frozen && !showEfob) {
      const newAirports =
        mcdu.navigation?.getNearbyAirports().map((ap) => ({ ...ap, distance: distanceTo(ppos, ap.location) })) ?? [];

      newAirports.sort((a, b) => a.distance - b.distance);
      newAirports.length = CDUAirportsMonitor.NUM_AIRPORTS;
      for (let i = 0; i < this.NUM_AIRPORTS; i++) {
        const newAirport = newAirports[i];
        if (newAirport && isNearbyAirportFacility(newAirport)) {
          this.airportRows[i].airport = newAirport;
        } else {
          this.airportRows[i].airport = undefined;
        }
        this.airportRows[i].bearing = undefined;
        this.airportRows[i].distance = undefined;
        this.airportRows[i].efob = undefined;
        this.airportRows[i].eta = undefined;
      }
    }

    // clear out old winds
    for (const key of this.effectiveWinds.keys()) {
      if (!this.airportRows.find((row) => row.airport?.ident === key)) {
        this.effectiveWinds.delete(key);
      }
    }

    if (showEfob) {
      for (let i = 0; i <= CDUAirportsMonitor.NUM_AIRPORTS; i++) {
        if (this.airportRows[i].airport) {
          // effective wind entry
          mcdu.onRightInput[i] = (value) => {
            const airport = this.airportRows[i].airport;
            if (value === Keypad.clrValue && airport) {
              this.effectiveWinds.delete(airport.ident);
            } else if (airport) {
              const match = value.match(/^(T|TL|\+|-|H|HD)?(\d{1,3})$/);
              if (match !== null) {
                const magnitude = parseInt(match[2]);
                if (magnitude > 250) {
                  mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                  return;
                }

                let sign = 1;
                switch (match[1]) {
                  case '-':
                  case 'H':
                  case 'HD':
                    sign = -1;
                    break;
                }

                this.effectiveWinds.set(airport.ident, sign * magnitude);
              } else {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                return;
              }
            }
            CDUAirportsMonitor.ShowPage(mcdu, frozen, showEfob, true);
          };
        }
      }
    }

    this.updatePredictions(mcdu);

    for (let i = 0; i < this.airportRows.length; i++) {
      this.renderAirportRow(template, i, showEfob, mcdu.isTrueRefMode);
    }

    // pilot airport entry
    mcdu.onLeftInput[4] = async (value) => {
      if (value === Keypad.clrValue) {
        this.pilotAirport.airport = undefined;
        this.pilotAirport.bearing = undefined;
        this.pilotAirport.distance = undefined;
        this.pilotAirport.efob = undefined;
        this.pilotAirport.eta = undefined;
      } else if (!value.match(/^[A-Z0-9]{4}$/)) {
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        return;
      } else {
        const airport = await mcdu.navigationDatabase.searchAirport(value);
        if (!airport) {
          mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
          return;
        }

        this.pilotAirport.airport = airport;
      }
      CDUAirportsMonitor.ShowPage(mcdu, frozen, showEfob, true);
    };

    if (showEfob) {
      template[11][2] = 'LIST FROZEN';
      template[12][2] = '{white}{RETURN{end}\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0';

      mcdu.onLeftInput[5] = () => CDUAirportsMonitor.ShowPage(mcdu, frozen, false, true);
    } else if (frozen) {
      template[11][2] = 'LIST FROZEN';
      template[12][2] = '{cyan}{UNFREEZE{end}\xa0\xa0\xa0\xa0\xa0{white}EFOB/WIND>{end}';

      mcdu.onLeftInput[5] = () => CDUAirportsMonitor.ShowPage(mcdu, false, showEfob, true);
      mcdu.onRightInput[5] = () => CDUAirportsMonitor.ShowPage(mcdu, frozen, true, true);
    } else {
      template[12][2] = '{cyan}{FREEZE{end}\xa0\xa0\xa0\xa0\xa0\xa0\xa0{white}EFOB/WIND>{end}';

      mcdu.onLeftInput[5] = () => CDUAirportsMonitor.ShowPage(mcdu, true, showEfob, true);
      mcdu.onRightInput[5] = () => CDUAirportsMonitor.ShowPage(mcdu, frozen, true, true);
    }

    mcdu.setTemplate(template);
  }

  private static updatePredictions(mcdu: LegacyFmsPageInterface) {
    const ppos = mcdu.navigation?.getPpos();
    const zfwLb = UnitType.POUND.convertFrom(mcdu.zeroFuelWeight ?? 0, UnitType.TONNE);
    const fobT = mcdu.getFOB(FlightPlanIndex.Active);
    const fobLb = UnitType.POUND.convertFrom(fobT ?? 0, UnitType.TONNE);
    const sat = mcdu.navigation?.getStaticAirTemperature() ?? null;
    const cruiseLevel = mcdu.flightPlanService.active?.performanceData.cruiseFlightLevel.get() ?? null;

    const doCruisePreds =
      mcdu.flightPhaseManager.phase === FmgcFlightPhase.Cruise &&
      cruiseLevel !== null &&
      isFinite(mcdu.zeroFuelWeight ?? NaN) &&
      fobT !== undefined &&
      zfwLb > 0 &&
      sat !== null;

    const isaDev = doCruisePreds ? sat - mcdu.getIsaTemp(cruiseLevel * 100) : 0;

    for (const rowData of this.airportRows) {
      if (ppos && rowData.airport) {
        rowData.bearing = bearingTo(ppos, rowData.airport.location);
        rowData.distance = distanceTo(ppos, rowData.airport.location);

        if (doCruisePreds) {
          const desAlt = cruiseLevel * 100 - (rowData.airport.location.alt ?? 0);
          const desFuelCoef = 0.412;
          const desBurn = (desFuelCoef * desAlt) / 41000;
          const desDistCoef = 123;
          const desDist = (desDistCoef * desAlt) / 41000;
          const desTime = (desDist / 300) * 3600_000;

          const cruiseCas = mcdu.managedSpeedCruise ?? 290;
          const cruiseMach = mcdu.managedSpeedCruiseMach ?? 0.78;

          const cruiseDist = Math.max(0, rowData.distance - desDist);
          const cruisePerf = Predictions.levelFlightStep(
            A320AircraftConfig,
            cruiseLevel * 100,
            cruiseDist,
            cruiseCas,
            cruiseMach,
            zfwLb,
            fobLb,
            -(this.effectiveWinds.get(rowData.airport.ident) ?? 0),
            isaDev,
            mcdu.tropo ?? 36089,
          );

          const cruiseBurn = UnitType.TONNE.convertFrom(cruisePerf.fuelBurned, UnitType.POUND);
          rowData.efob = fobT - cruiseBurn + desBurn;
          rowData.eta = new Date(Date.now() + cruisePerf.timeElapsed * 1000 + desTime);
        } else {
          rowData.efob = undefined;
          rowData.eta = undefined;
        }
      } else {
        rowData.bearing = undefined;
        rowData.distance = undefined;
        rowData.efob = undefined;
        rowData.eta = undefined;
      }
    }

    this.magVar = ppos ? MagVar.get(ppos) : 0;
  }

  private static renderAirportRow(template: string[][], index: number, showEfob: boolean, trueNorthActive: boolean) {
    const rowData = this.airportRows[index];
    const templateIndex = 2 + 2 * index;
    const isPilotAirport = index === CDUAirportsMonitor.NUM_AIRPORTS;

    template[templateIndex][2] =
      `{${isPilotAirport ? 'cyan' : 'green'}}${rowData.airport?.ident.padEnd(4, '\xa0') ?? (isPilotAirport ? '[\xa0\xa0]' : '\xa0\xa0\xa0\xa0')}\xa0\xa0\xa0\xa0{end}`;

    if (showEfob) {
      const effectiveWind = rowData.airport ? this.effectiveWinds.get(rowData.airport.ident) : undefined;
      const formattedWind =
        effectiveWind !== undefined
          ? effectiveWind >= 0
            ? `TL${effectiveWind.toFixed(0).padStart(3, '0')}`
            : `HD${Math.abs(effectiveWind).toFixed(0).padStart(3, '0')}`
          : rowData.airport
            ? '[\xa0\xa0\xa0]'
            : '\xa0\xa0\xa0\xa0\xa0';

      template[templateIndex][2] +=
        `{green}${rowData.efob !== undefined ? NXUnits.kgToUser(rowData.efob).toFixed(1).padStart(4, '\xa0') : '\xa0\xa0\xa0\xa0'}{end}\xa0\xa0${index === 0 ? '{small}{white}[KTS]{end}{end}' : '\xa0\xa0\xa0\xa0\xa0'}{cyan}${formattedWind}{end}`;
    } else {
      const isTrueNorthAirport = rowData.airport?.magVar === null;
      const magVar = this.magVar;
      const showTrueBearing = trueNorthActive || isTrueNorthAirport || magVar === null;

      const bearing =
        rowData.bearing !== undefined && !showTrueBearing
          ? MagVar.trueToMagnetic(rowData.bearing, magVar)
          : rowData.bearing;

      template[templateIndex][2] +=
        `{green}${bearing !== undefined ? bearing.toFixed(0).padStart(3, '0') + (trueNorthActive ? 'T' : '°') : '\xa0\xa0\xa0\xa0'}\xa0\xa0${rowData.distance !== undefined ? Math.min(rowData.distance, 9999).toFixed(0).padStart(4) : '\xa0\xa0\xa0\xa0'}\xa0\xa0${rowData.eta !== undefined ? rowData.eta.getUTCHours().toString().padStart(2, '0') : '\xa0\xa0'}${rowData.eta !== undefined ? rowData.eta.getUTCMinutes().toString().padStart(2, '0') : '\xa0\xa0'}{end}`;
    }
  }
}
