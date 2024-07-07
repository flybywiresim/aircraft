// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export function checkA32NXBatOff(): boolean {
  const batOneOff = SimVar.GetSimVarValue('L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO', 'Number') === 0;
  const batTwoOff = SimVar.GetSimVarValue('L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO', 'Number') === 0;
  return batOneOff && batTwoOff;
}

export function checkA380XBatOff(): boolean {
  const bat1 = SimVar.GetSimVarValue('L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO', 'Number');
  const batEss = SimVar.GetSimVarValue('L:A32NX_OVHD_ELEC_BAT_ESS_PB_IS_AUTO', 'Number');
  const bat12 = SimVar.GetSimVarValue('L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO', 'Number');
  const bat1Apu = SimVar.GetSimVarValue('L:A32NX_OVHD_ELEC_BAT_APU_PB_IS_AUTO', 'Number');
  return bat1 === 0 && batEss === 0 && bat12 === 0 && bat1Apu === 0;
}

export function checkA32NXEnginesOff(): boolean {
  const eng1N2 = SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:1', 'Number');
  const eng2N2 = SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:2', 'Number');
  return eng1N2 <= 3 && eng2N2 <= 3;
}

export function checkA380XEnginesOff(): boolean {
  const eng1N1 = SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:1', 'Number');
  const eng2N1 = SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:2', 'Number');
  const eng3N1 = SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:3', 'Number');
  const eng4N1 = SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:4', 'Number');
  return eng1N1 <= 3 && eng2N1 <= 3 && eng3N1 <= 3 && eng4N1 <= 3;
}

export function checkA32NXFuelPumpsOff(): boolean {
  const pumpOneOff = !SimVar.GetSimVarValue('FUELSYSTEM PUMP ACTIVE:1', 'Number');
  const pumpTwoOff = !SimVar.GetSimVarValue('FUELSYSTEM PUMP ACTIVE:2', 'Number');
  const pumpThreeOff = !SimVar.GetSimVarValue('FUELSYSTEM PUMP ACTIVE:3', 'Number');
  const pumpFourOff = !SimVar.GetSimVarValue('FUELSYSTEM PUMP ACTIVE:4', 'Number');
  const pumpFiveOff = !SimVar.GetSimVarValue('FUELSYSTEM PUMP ACTIVE:5', 'Number');
  const pumpSixOff = !SimVar.GetSimVarValue('FUELSYSTEM PUMP ACTIVE:6', 'Number');
  return pumpOneOff && pumpTwoOff && pumpThreeOff && pumpFourOff && pumpFiveOff && pumpSixOff;
}

export function checkA380XFuelPumpsOff(): boolean {
  const fuelPumpROUTRTK = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:75', 'Bool');
  const fuelPumpRMIDFWDTK = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:77', 'Bool');
  const fuelPumpRMIDAFTTK = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:76', 'Bool');
  const fuelPumpRINRFWDTK = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:79', 'Bool');
  const fuelPumpRINRAFTTK = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:78', 'Bool');
  const fuelPumpLINRAFTTK = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:74', 'Bool');
  const fuelPumpLINRFWDTK = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:73', 'Bool');
  const fuelPumpLMIDAFTTK = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:72', 'Bool');
  const fuelPumpLMIDFWDTK = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:71', 'Bool');
  const fuelPumpLOUTRTK = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:70', 'Bool');
  const fuelPumpFeedTK4Stby = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:69', 'Bool');
  const fuelPumpFeedTK4Main = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:68', 'Bool');
  const fuelPumpFeedTK3Stby = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:67', 'Bool');
  const fuelPumpFeedTK3Main = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:66', 'Bool');
  const fuelPumpFeedTK2Stby = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:65', 'Bool');
  const fuelPumpFeedTK2Main = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:64', 'Bool');
  const fuelPumpFeedTK1Stby = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:3', 'Bool');
  const fuelPumpFeedTK1Main = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:2', 'Bool');
  const fuelTrimTKR = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:81', 'Bool');
  const fuelTrimTKL = SimVar.GetSimVarValue('A:CIRCUIT CONNECTION ON:80', 'Bool');
  return (
    !fuelTrimTKR &&
    !fuelTrimTKL &&
    !fuelPumpROUTRTK &&
    !fuelPumpRMIDFWDTK &&
    !fuelPumpRMIDAFTTK &&
    !fuelPumpRINRFWDTK &&
    !fuelPumpRINRAFTTK &&
    !fuelPumpLINRAFTTK &&
    !fuelPumpLINRFWDTK &&
    !fuelPumpLMIDAFTTK &&
    !fuelPumpLMIDFWDTK &&
    !fuelPumpLOUTRTK &&
    !fuelPumpFeedTK4Stby &&
    !fuelPumpFeedTK4Main &&
    !fuelPumpFeedTK3Stby &&
    !fuelPumpFeedTK3Main &&
    !fuelPumpFeedTK2Stby &&
    !fuelPumpFeedTK2Main &&
    !fuelPumpFeedTK1Stby &&
    !fuelPumpFeedTK1Main
  );
}

export function checkAdirsNav(): boolean {
  const ir1 = SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB', 'Number');
  const ir2 = SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB', 'Number');
  const ir3 = SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB', 'Number');
  return ir1 === 1 && ir2 === 1 && ir3 === 1;
}

export function checkAdirsOff(): boolean {
  const ir1 = SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB', 'Number');
  const ir2 = SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB', 'Number');
  const ir3 = SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB', 'Number');
  return ir1 === 0 && ir2 === 0 && ir3 === 0;
}

export function checkBeaconOn(): boolean {
  return !!SimVar.GetSimVarValue('LIGHT BEACON', 'Bool');
}

export function checkFDsOn(): boolean {
  return (
    SimVar.GetSimVarValue('AUTOPILOT FLIGHT DIRECTOR ACTIVE:1', 'Bool') &&
    SimVar.GetSimVarValue('AUTOPILOT FLIGHT DIRECTOR ACTIVE:2', 'Bool')
  );
}

export function checkOxygenOff(): boolean {
  return SimVar.GetSimVarValue('L:PUSH_OVHD_OXYGEN_CREW', 'bool');
}

export function checkParkingBrakeOn(): boolean {
  return SimVar.GetSimVarValue('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool');
}

export function checkRudderTrimReset(): boolean {
  return SimVar.GetSimVarValue('RUDDER TRIM PCT', 'percent') === 0;
}

export function checkSeatBeltsOn(): boolean {
  return SimVar.GetSimVarValue('CABIN SEATBELTS ALERT SWITCH', 'Number') === 1;
}

export function checkNoMobileOff(): boolean {
  return SimVar.GetSimVarValue('L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_POSITION', 'Number') === 2;
}

export function checkEmerExtLtOff(): boolean {
  return SimVar.GetSimVarValue('L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION', 'Number') === 2;
}

export function checkSignsOff(): boolean {
  return !checkSeatBeltsOn() && checkNoMobileOff() && checkEmerExtLtOff();
}

export function checkSignsOn(): boolean {
  return checkSeatBeltsOn() && !checkNoMobileOff() && !checkEmerExtLtOff();
}

export function checkWingLtOff(): boolean {
  return !!SimVar.GetSimVarValue('LIGHT WING', 'Bool');
}

export function checkWxOffPredWsOff(): boolean {
  const radarOff = SimVar.GetSimVarValue('L:XMLVAR_A320_WEATHERRADAR_SYS', 'Number') === 1;
  const predWsOff = SimVar.GetSimVarValue('L:A32NX_SWITCH_RADAR_PWS_POSITION', 'Number') === 0;
  return radarOff && predWsOff;
}

export function checkWxOnPredWsAuto(): boolean {
  const radarOn = SimVar.GetSimVarValue('L:XMLVAR_A320_WEATHERRADAR_SYS', 'Number') !== 1;
  const predWsAuto = SimVar.GetSimVarValue('L:A32NX_SWITCH_RADAR_PWS_POSITION', 'Number') === 1;
  return radarOn && predWsAuto;
}

export function checkYellowEPumpOff(): boolean {
  return SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_EPUMPY_PB_IS_AUTO', 'Bool') === 1;
}

export function checkSpoilerArmed(): boolean {
  return !!SimVar.GetSimVarValue('L:A32NX_SPOILERS_ARMED', 'Bool');
}

export function checkAutobrakeRTOArmed(): boolean {
  return !!SimVar.GetSimVarValue('L:A32NX_AUTOBRAKES_RTO_ARMED', 'Bool');
}

export function checkA380XLdgGearUp() {
  const gearCenterSmallPos = SimVar.GetSimVarValue('L:A32NX_GEAR_CENTER_SMALL_POSITION', 'percent');
  const gearCenterPos = SimVar.GetSimVarValue('L:A32NX_GEAR_CENTER_POSITION', 'percent');
  const gearLeftPos = SimVar.GetSimVarValue('L:A32NX_GEAR_LEFT_POSITION', 'percent');
  const gearRightPos = SimVar.GetSimVarValue('L:A32NX_GEAR_RIGHT_POSITION', 'percent');
  return gearCenterSmallPos === 0 && gearCenterPos === 0 && gearLeftPos === 0 && gearRightPos === 0;
}

export function checkA380XLdgGearDown() {
  const gearCenterSmallPos = SimVar.GetSimVarValue('L:A32NX_GEAR_CENTER_SMALL_POSITION', 'percent');
  const gearCenterPos = SimVar.GetSimVarValue('L:A32NX_GEAR_CENTER_POSITION', 'percent');
  const gearLeftPos = SimVar.GetSimVarValue('L:A32NX_GEAR_LEFT_POSITION', 'percent');
  const gearRightPos = SimVar.GetSimVarValue('L:A32NX_GEAR_RIGHT_POSITION', 'percent');
  return gearCenterSmallPos === 100 && gearCenterPos === 100 && gearLeftPos === 100 && gearRightPos === 100;
}

export function checkFlapsUp() {
  return SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number') === 0;
}

export function checkAPUMasterOff() {
  return SimVar.GetSimVarValue('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Number') === 0;
}

export function checkLandingLightsOff() {
  const noseWheelLandingLights = SimVar.GetSimVarValue('L:LIGHTING_LANDING_1', 'Number'); // Nose wheel landing lights 0=on
  const landingLights = SimVar.GetSimVarValue('L:LIGHTING_LANDING_2', 'Number'); // Landing lights 0=on
  return noseWheelLandingLights !== 0 && landingLights !== 0;
}

// TODO: once the two baro refs are separated, this function will need to be updated
export function checkBaroStd() {
  const baro1 = SimVar.GetSimVarValue('L:XMLVAR_Baro1_Mode', 'Number');
  return baro1 === 3;
}

export function checkAPUStarted() {
  const apuStartPbIsOn = !!SimVar.GetSimVarValue('L:A32NX_OVHD_APU_START_PB_IS_ON', 'Number');
  const apuStartPbIsAvail = !!SimVar.GetSimVarValue('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'Number');
  return apuStartPbIsOn || apuStartPbIsAvail;
}
