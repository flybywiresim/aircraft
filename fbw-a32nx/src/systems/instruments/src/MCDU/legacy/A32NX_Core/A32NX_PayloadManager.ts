import { BitFlags, NXUnits } from '@flybywiresim/fbw-sdk';

// FIXME move to extras host
/* eslint-disable no-undef */
export class A32NX_PayloadConstructor {
  public readonly paxStations = {
    rows1_6: {
      name: 'ROWS [1-6]',
      seats: 36,
      weight: Math.round(NXUnits.kgToUser(3024)),
      stationIndex: 0 + 1,
      position: 20.5,
      simVar: 'A32NX_PAX_A',
    },
    rows7_13: {
      name: 'ROWS [7-13]',
      seats: 42,
      weight: Math.round(NXUnits.kgToUser(3530)),
      stationIndex: 1 + 1,
      position: 1.5,
      simVar: 'A32NX_PAX_B',
    },
    rows14_21: {
      name: 'ROWS [14-21]',
      seats: 48,
      weight: Math.round(NXUnits.kgToUser(4032)),
      stationIndex: 2 + 1,
      position: -16.6,
      simVar: 'A32NX_PAX_C',
    },
    rows22_29: {
      name: 'ROWS [22-29]',
      seats: 48,
      weight: Math.round(NXUnits.kgToUser(4032)),
      stationIndex: 3 + 1,
      position: -35.6,
      simVar: 'A32NX_PAX_D',
    },
  };

  public readonly cargoStations = {
    fwdBag: {
      name: 'FWD BAGGAGE/CONTAINER',
      weight: Math.round(NXUnits.kgToUser(3402)),
      load: 0,
      stationIndex: 4 + 1,
      position: 17.3,
      visible: true,
      simVar: 'A32NX_CARGO_FWD_BAGGAGE_CONTAINER',
    },
    aftCont: {
      name: 'AFT CONTAINER',
      weight: Math.round(NXUnits.kgToUser(2426)),
      load: 0,
      stationIndex: 5 + 1,
      position: -24.1,
      visible: true,
      simVar: 'A32NX_CARGO_AFT_CONTAINER',
    },
    aftBag: {
      name: 'AFT BAGGAGE',
      weight: Math.round(NXUnits.kgToUser(2110)),
      load: 0,
      stationIndex: 6 + 1,
      position: -34.1,
      visible: true,
      simVar: 'A32NX_CARGO_AFT_BAGGAGE',
    },
    aftBulk: {
      name: 'AFT BULK/LOOSE',
      weight: Math.round(NXUnits.kgToUser(1497)),
      load: 0,
      stationIndex: 7 + 1,
      position: -42.4,
      visible: true,
      simVar: 'A32NX_CARGO_AFT_BULK_LOOSE',
    },
  };

  constructor() {}
}

const payloadConstruct = new A32NX_PayloadConstructor();
const paxStations = payloadConstruct.paxStations;
const cargoStations = payloadConstruct.cargoStations;
const MAX_SEAT_AVAILABLE = 174;

/**
 * Calculate %MAC ZWFCG of all stations
 */
export function getZfwcg() {
  const leMacZ = -5.383; // Accurate to 3 decimals, replaces debug weight values
  const macSize = 13.464; // Accurate to 3 decimals, replaces debug weight values

  const emptyWeight = SimVar.GetSimVarValue('EMPTY WEIGHT', getUserUnit());
  const emptyPosition = -9.42; // Value from flight_model.cfg
  const emptyMoment = emptyPosition * emptyWeight;
  const PAX_WEIGHT = SimVar.GetSimVarValue('L:A32NX_WB_PER_PAX_WEIGHT', 'Number');

  const paxTotalMass = Object.values(paxStations)
    .map((station) => new BitFlags(SimVar.GetSimVarValue(`L:${station.simVar}`, 'Number')).getTotalBits() * PAX_WEIGHT)
    .reduce((acc, cur) => acc + cur, 0);
  const paxTotalMoment = Object.values(paxStations)
    .map(
      (station) =>
        new BitFlags(SimVar.GetSimVarValue(`L:${station.simVar}`, 'Number')).getTotalBits() *
        PAX_WEIGHT *
        station.position,
    )
    .reduce((acc, cur) => acc + cur, 0);

  const cargoTotalMass = Object.values(cargoStations)
    .map((station) => SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, getUserUnit()))
    .reduce((acc, cur) => acc + cur, 0);
  const cargoTotalMoment = Object.values(cargoStations)
    .map(
      (station) =>
        SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, getUserUnit()) * station.position,
    )
    .reduce((acc, cur) => acc + cur, 0);

  const totalMass = emptyWeight + paxTotalMass + cargoTotalMass;
  const totalMoment = emptyMoment + paxTotalMoment + cargoTotalMoment;

  const cgPosition = totalMoment / totalMass;
  const cgPositionToLemac = cgPosition - leMacZ;
  const cgPercentMac = -100 * (cgPositionToLemac / macSize);

  return cgPercentMac;
}

export function getTotalCargo() {
  const cargoTotalMass = Object.values(cargoStations)
    .filter((station) => station.visible)
    .map((station) => SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, getUserUnit()))
    .reduce((acc, cur) => acc + cur, 0);
  return cargoTotalMass;
}

export function getTotalPayload() {
  const paxTotalMass = Object.values(paxStations)
    .map((station) => SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, getUserUnit()))
    .reduce((acc, cur) => acc + cur, 0);
  const cargoTotalMass = getTotalCargo();
  return paxTotalMass + cargoTotalMass;
}

export function getZfw() {
  const emptyWeight = SimVar.GetSimVarValue('EMPTY WEIGHT', getUserUnit());
  return emptyWeight + getTotalPayload();
}

export function getUserUnit() {
  const defaultUnit = NXUnits.userWeightUnit() == 'KG' ? 'Kilograms' : 'Pounds';
  return defaultUnit;
}
