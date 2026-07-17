#pragma once

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>

#include "A380FadecComputer.h"
#include "Arinc429.h"
#include "CalculatedRadioReceiver.h"
#include "InterpolatingLookupTable.h"
#include "LocalVariable.h"
#include "RateLimiter.h"
#include "SpoilersHandler.h"
#include "ThrottleAxisMapping.h"
#include "failures/FailuresConsumer.h"
#include "fcdc/Fcdc.h"
#include "fcu/Fcu.h"
#include "interface/SimConnectInterface.h"
#include "prim/Prim.h"
#include "recording/FlightDataRecorder.h"
#include "recording/RecordingDataTypes.h"
#include "sec/Sec.h"

#include "utils/HysteresisNode.h"
#include "utils/PulseNode.h"

class FlyByWireInterface {
 public:
  bool connect();

  void disconnect();

  bool update(double sampleTime);

 private:
  const std::string CONFIGURATION_FILEPATH = "\\work\\ModelConfiguration.ini";

  static constexpr double MAX_ACCEPTABLE_SAMPLE_TIME = (1.0 / 6.0);
  static constexpr uint32_t LOW_PERFORMANCE_TIMER_THRESHOLD = (3 * 6);
  uint32_t lowPerformanceTimer = 0;

  double previousSimulationTime = 0;
  double calculatedSampleTime = 0;

  double monotonicTime = 0;

  bool simulationRateReductionEnabled = true;
  bool limitSimulationRateByPerformance = true;

  double targetSimulationRate = 1;
  bool targetSimulationRateModified = false;

  int primDisabled = -1;
  bool primGeneralLogicDisabled = false;
  bool primFctlDisabled = false;
  bool primFeDisabled = false;
  bool primFgDisabled = false;
  int secDisabled = -1;
  int fcuDisabled = -1;
  int fadecDisabled = -1;
  bool tailstrikeProtectionEnabled = true;

  bool wasTcasEngaged = false;

  bool pauseDetected = false;
  // As fdr is not written when paused 'wasPaused' is used to detect previous pause state
  // changes and record them in fdr
  bool wasPaused = false;
  bool wasInSlew = false;

  double autothrustThrustLimitReversePercentageToga = 0.0;

  bool flightDirectorConnectLatch_1 = false;
  bool flightDirectorConnectLatch_2 = false;
  bool flightDirectorDisconnectLatch_1 = false;
  bool flightDirectorDisconnectLatch_2 = false;

  double flightControlsKeyChangeAileron = 0.0;
  double flightControlsKeyChangeElevator = 0.0;
  double flightControlsKeyChangeRudder = 0.0;

  double rudderTravelLimiterPosition = 25;

  bool disableXboxCompatibilityRudderAxisPlusMinus = false;
  bool enableRudder2AxisMode = false;

  bool clientDataEnabled = false;

  bool last_fd1_active = false;
  bool last_fd2_active = false;

  bool last_ls1_active = false;
  bool last_ls2_active = false;

  std::unique_ptr<Arinc429NumericWord> fmThrustReductionAltitude = std::make_unique<Arinc429NumericWord>();
  std::unique_ptr<Arinc429NumericWord> fmThrustReductionAltitudeGoAround = std::make_unique<Arinc429NumericWord>();
  std::unique_ptr<Arinc429NumericWord> fmAccelerationAltitude = std::make_unique<Arinc429NumericWord>();
  std::unique_ptr<Arinc429NumericWord> fmAccelerationAltitudeEngineOut = std::make_unique<Arinc429NumericWord>();
  std::unique_ptr<Arinc429NumericWord> fmAccelerationAltitudeGoAround = std::make_unique<Arinc429NumericWord>();
  std::unique_ptr<Arinc429NumericWord> fmAccelerationAltitudeGoAroundEngineOut = std::make_unique<Arinc429NumericWord>();

  FlightDataRecorder flightDataRecorder;

  SimConnectInterface simConnectInterface;

  FailuresConsumer failuresConsumer;

  A380FadecComputer fadecs[4];
  A380FadecComputer::ExternalInputs_A380FadecComputer_T fadecInputs[4];
  athr_output fadecOutputs[4];
  base_eec fadecBusOutputs[4];

  base_ra_bus raBusOutputs[3] = {};

  base_lgciu_bus lgciuBusOutputs[2] = {};

  base_sfcc_bus sfccBusOutputs[2] = {};

  base_adr_bus adrBusOutputs[3] = {};
  base_ir_bus irBusOutputs[3] = {};

  Prim prims[3] = {Prim(true, false, false), Prim(false, true, false), Prim(false, false, true)};
  base_prim_discrete_outputs primsDiscreteOutputs[3] = {};
  base_prim_analog_outputs primsAnalogOutputs[3] = {};
  base_prim_out_bus primsBusOutputs[3] = {};

  Sec secs[3] = {Sec(true, false, false), Sec(false, true, false), Sec(false, false, true)};
  base_sec_discrete_outputs secsDiscreteOutputs[3] = {};
  base_sec_analog_outputs secsAnalogOutputs[3] = {};
  base_sec_out_bus secsBusOutputs[3] = {};

  Fcdc fcdcs[2] = {Fcdc(true), Fcdc(false)};
  FcdcDiscreteOutputs fcdcsDiscreteOutputs[2] = {};
  FcdcBus fcdcsBusOutputs[2] = {};

  Fcu fcus[2] = {Fcu(), Fcu()};
  base_fcu_bus fcuBusOutputs[2] = {};
  bool fcuHealthy = false;

  InterpolatingLookupTable throttleLookupTable;

  RadioReceiver radioReceiver;

  PulseNode captureConditionPulseNode = PulseNode(true);

  bool wasFcuInitialized = false;
  double simulationTimeReady = 0.0;
  std::unique_ptr<LocalVariable> idIsReady;
  std::unique_ptr<LocalVariable> idStartState;

  std::unique_ptr<LocalVariable> idLeftWingWheelSpeed_rpm;
  std::unique_ptr<LocalVariable> idRightWingWheelSpeed_rpm;
  std::unique_ptr<LocalVariable> idLeftBodyWheelSpeed_rpm;
  std::unique_ptr<LocalVariable> idRightBodyWheelSpeed_rpm;

  bool developmentLocalVariablesEnabled = false;
  bool useCalculatedLocalizerAndGlideSlope = false;
  std::unique_ptr<LocalVariable> idDevelopmentAutoland_condition_Flare;
  std::unique_ptr<LocalVariable> idDevelopmentAutoland_H_dot_c_fpm;
  std::unique_ptr<LocalVariable> idDevelopmentAutoland_delta_Theta_H_dot_deg;
  std::unique_ptr<LocalVariable> idDevelopmentAutoland_delta_Theta_bz_deg;
  std::unique_ptr<LocalVariable> idDevelopmentAutoland_delta_Theta_bx_deg;
  std::unique_ptr<LocalVariable> idDevelopmentAutoland_delta_Theta_beta_c_deg;

  std::unique_ptr<LocalVariable> idLoggingFlightControlsEnabled;
  std::unique_ptr<LocalVariable> idLoggingThrottlesEnabled;

  std::unique_ptr<LocalVariable> idMinimumSimulationRate;
  std::unique_ptr<LocalVariable> idMaximumSimulationRate;

  std::unique_ptr<LocalVariable> idPerformanceWarningActive;

  std::unique_ptr<LocalVariable> idTrackingMode;
  std::unique_ptr<LocalVariable> idExternalOverride;

  std::unique_ptr<LocalVariable> idFdrEvent;

  std::unique_ptr<LocalVariable> idSideStickPositionX;
  std::unique_ptr<LocalVariable> idSideStickPositionY;
  std::unique_ptr<LocalVariable> idRudderPedalPosition;
  std::unique_ptr<LocalVariable> idRudderPedalAnimationPosition;
  std::unique_ptr<LocalVariable> idAutopilotNosewheelDemand;

  std::unique_ptr<LocalVariable> idFmaLateralMode;
  std::unique_ptr<LocalVariable> idFmaLateralArmed;
  std::unique_ptr<LocalVariable> idFmaVerticalMode;
  std::unique_ptr<LocalVariable> idFmaVerticalArmed;
  std::unique_ptr<LocalVariable> idFmaSoftAltModeActive;
  std::unique_ptr<LocalVariable> idFmaCruiseAltModeActive;
  std::unique_ptr<LocalVariable> idFmaExpediteModeActive;
  std::unique_ptr<LocalVariable> idFmaSpeedProtectionActive;
  std::unique_ptr<LocalVariable> idFmaTripleClick;
  std::unique_ptr<LocalVariable> idFmaModeReversion;

  std::unique_ptr<LocalVariable> idAutopilotTcasMessageDisarm;
  std::unique_ptr<LocalVariable> idAutopilotTcasMessageRaInhibited;
  std::unique_ptr<LocalVariable> idAutopilotTcasMessageTrkFpaDeselection;

  std::unique_ptr<LocalVariable> idFlightDirectorBank;
  std::unique_ptr<LocalVariable> idFlightDirectorPitch;
  std::unique_ptr<LocalVariable> idFlightDirectorYaw;

  std::unique_ptr<LocalVariable> idAutopilotAutolandWarning;

  std::unique_ptr<LocalVariable> idAutopilotActiveAny;
  std::unique_ptr<LocalVariable> idAutopilotActive_1;
  std::unique_ptr<LocalVariable> idAutopilotActive_2;

  std::unique_ptr<LocalVariable> idAutopilotAutothrustMode;

  std::unique_ptr<LocalVariable> idAutopilot_H_dot_radio;

  std::unique_ptr<LocalVariable> idFcuTrkFpaModeActive;
  std::unique_ptr<LocalVariable> idFcuNorthRefTrue;
  std::unique_ptr<LocalVariable> idFcuSelectedFpa;
  std::unique_ptr<LocalVariable> idFcuSelectedVs;
  std::unique_ptr<LocalVariable> idFcuSelectedHeading;

  std::unique_ptr<LocalVariable> idFcuLocModeActive;
  std::unique_ptr<LocalVariable> idFcuApprModeActive;
  std::unique_ptr<LocalVariable> idFcuHeadingSync;
  std::unique_ptr<LocalVariable> idFcuModeReversionActive;
  std::unique_ptr<LocalVariable> idFcuModeReversionTrkFpaActive;
  std::unique_ptr<LocalVariable> idFcuModeReversionTargetFpm;

  std::unique_ptr<LocalVariable> idFmLateralPlanAvail;
  std::unique_ptr<LocalVariable> idFmCrossTrackError;
  std::unique_ptr<LocalVariable> idFmTrackAngleError;
  std::unique_ptr<LocalVariable> idFmPhiCommand;
  std::unique_ptr<LocalVariable> idFmPhiLimit;
  std::unique_ptr<LocalVariable> idFmVerticalProfileAvail;
  std::unique_ptr<LocalVariable> idFmRequestedVerticalMode;
  std::unique_ptr<LocalVariable> idFmTargetAltitude;
  std::unique_ptr<LocalVariable> idFmTargetVerticalSpeed;
  std::unique_ptr<LocalVariable> idFmRnavAppSelected;
  std::unique_ptr<LocalVariable> idFmFinalCanEngage;
  std::unique_ptr<LocalVariable> idFmNavCaptureCondition;

  std::unique_ptr<LocalVariable> idFwcFlightPhase;
  std::unique_ptr<LocalVariable> idFwsDiscreteWord126[2];
  std::unique_ptr<LocalVariable> idFwsAbnProcImpactingLdgPerfActive[2];
  std::unique_ptr<LocalVariable> idFwsAbnProcImpactingLdgDistActive[2];

  std::unique_ptr<LocalVariable> idElecApuGenContactorClosed[2];
  std::unique_ptr<LocalVariable> idElecTrContactorClosed[4];

  std::unique_ptr<LocalVariable> idTcasFault;
  std::unique_ptr<LocalVariable> idTcasMode;
  std::unique_ptr<LocalVariable> idTcasTaOnly;
  std::unique_ptr<LocalVariable> idTcasState;
  std::unique_ptr<LocalVariable> idTcasRaCorrective;
  std::unique_ptr<LocalVariable> idTcasTargetGreenMin;
  std::unique_ptr<LocalVariable> idTcasTargetGreenMax;
  std::unique_ptr<LocalVariable> idTcasTargetRedMin;
  std::unique_ptr<LocalVariable> idTcasTargetRedMax;

  std::unique_ptr<LocalVariable> idOansFailed;
  std::unique_ptr<LocalVariable> idOansPposLost;

  std::unique_ptr<LocalVariable> idFmgcFlightPhase;
  std::unique_ptr<LocalVariable> idFmgcV2;
  std::unique_ptr<LocalVariable> idFmgcV_APP;
  std::unique_ptr<LocalVariable> idFmsManagedSpeedTarget;
  std::unique_ptr<LocalVariable> idFmsPresetMach;
  std::unique_ptr<LocalVariable> idFmsPresetSpeed;
  std::unique_ptr<LocalVariable> idFmgcAltitudeConstraint;
  std::unique_ptr<LocalVariable> idFmgcThrustReductionAltitude;
  std::unique_ptr<LocalVariable> idFmgcThrustReductionAltitudeGoAround;
  std::unique_ptr<LocalVariable> idFmgcAccelerationAltitude;
  std::unique_ptr<LocalVariable> idFmgcAccelerationAltitudeEngineOut;
  std::unique_ptr<LocalVariable> idFmgcAccelerationAltitudeGoAround;
  std::unique_ptr<LocalVariable> idFmgcAccelerationAltitudeGoAroundEngineOut;
  std::unique_ptr<LocalVariable> idFmgcCruiseAltitude;
  std::unique_ptr<LocalVariable> idFmgcFlexTemperature;
  std::unique_ptr<LocalVariable> idFmsLsCourse;
  std::unique_ptr<LocalVariable> idFmsSpeedMarginHigh;
  std::unique_ptr<LocalVariable> idFmsSpeedMarginLow;
  std::unique_ptr<LocalVariable> idFmsSpeedMarginVisible;

  std::unique_ptr<LocalVariable> idAirConditioningPack_1;
  std::unique_ptr<LocalVariable> idAirConditioningPack_2;

  std::unique_ptr<LocalVariable> thrustLeverAngle[4];
  std::unique_ptr<LocalVariable> idAutothrustN1_TLA[4];
  std::unique_ptr<LocalVariable> idAutothrustReverse[4];
  std::unique_ptr<LocalVariable> idAutothrustThrustLimitType;
  std::unique_ptr<LocalVariable> idAutothrustThrustLimit;
  std::unique_ptr<LocalVariable> idAutothrustThrustLimitREV;
  std::unique_ptr<LocalVariable> idAutothrustThrustLimitIDLE;
  std::unique_ptr<LocalVariable> idAutothrustThrustLimitCLB;
  std::unique_ptr<LocalVariable> idAutothrustThrustLimitMCT;
  std::unique_ptr<LocalVariable> idAutothrustThrustLimitFLX;
  std::unique_ptr<LocalVariable> idAutothrustThrustLimitTOGA;
  std::unique_ptr<LocalVariable> idAutothrustN1_c[4];
  std::unique_ptr<LocalVariable> idAutothrustStatus;
  std::unique_ptr<LocalVariable> idAutothrustMode;
  std::unique_ptr<LocalVariable> idAutothrustModeMessage;
  std::unique_ptr<LocalVariable> idAutothrustDisabled;
  std::unique_ptr<LocalVariable> idAutothrustThrustLeverWarningFlex;
  std::unique_ptr<LocalVariable> idAutothrustThrustLeverWarningToga;
  std::unique_ptr<LocalVariable> idAutothrustDisconnect;
  std::unique_ptr<LocalVariable> idThrottlePosition3d[4];
  InterpolatingLookupTable idThrottlePositionLookupTable3d;

  std::vector<std::shared_ptr<ThrottleAxisMapping>> throttleAxis;

  BaseData baseData = {};
  AircraftSpecificData aircraftSpecificData = {};

  std::unique_ptr<LocalVariable> idParkBrakeLeverPos;
  std::unique_ptr<LocalVariable> idBrakePedalLeftPos;
  std::unique_ptr<LocalVariable> idBrakePedalRightPos;
  std::unique_ptr<LocalVariable> idAutobrakeArmedMode;
  std::unique_ptr<LocalVariable> idAutobrakeActive;
  std::unique_ptr<LocalVariable> idBtvState;
  std::unique_ptr<LocalVariable> idAutobrakeDecelLight;
  std::unique_ptr<LocalVariable> idMasterWarning;
  std::unique_ptr<LocalVariable> idMasterCaution;

  std::unique_ptr<LocalVariable> idFlapsHandleIndex;
  std::unique_ptr<LocalVariable> idFlapsHandlePercent;

  std::unique_ptr<LocalVariable> flapsHandleIndexFlapConf;
  std::unique_ptr<LocalVariable> flapsPosition;

  std::unique_ptr<LocalVariable> idSpoilersArmed;
  std::unique_ptr<LocalVariable> idSpoilersHandlePosition;
  std::shared_ptr<SpoilersHandler> spoilersHandler;

  std::unique_ptr<LocalVariable> idRadioReceiverUsageEnabled;
  std::unique_ptr<LocalVariable> idRadioReceiverLocalizerValid;
  std::unique_ptr<LocalVariable> idRadioReceiverLocalizerDeviation;
  std::unique_ptr<LocalVariable> idRadioReceiverLocalizerDistance;
  std::unique_ptr<LocalVariable> idRadioReceiverGlideSlopeValid;
  std::unique_ptr<LocalVariable> idRadioReceiverGlideSlopeDeviation;

  std::unique_ptr<LocalVariable> idFm1BackbeamSelected;

  std::unique_ptr<LocalVariable> idRealisticTillerEnabled;
  std::unique_ptr<LocalVariable> idTillerHandlePosition;
  std::unique_ptr<LocalVariable> idNoseWheelPosition;

  std::unique_ptr<LocalVariable> idSyncFoEfisEnabled;

  std::unique_ptr<LocalVariable> idLs1Active;
  std::unique_ptr<LocalVariable> idLs2Active;
  std::unique_ptr<LocalVariable> idIsisLsActive;

  std::unique_ptr<LocalVariable> idWingAntiIce;

  std::unique_ptr<LocalVariable> idFmGrossWeight;

  std::unique_ptr<LocalVariable> idCgPercentMac;

  // RA bus inputs
  std::unique_ptr<LocalVariable> idRadioAltimeterHeight[3];

  // LGCIU inputs
  std::unique_ptr<LocalVariable> idLgciuNoseGearCompressed[2];
  std::unique_ptr<LocalVariable> idLgciuLeftMainGearCompressed[2];
  std::unique_ptr<LocalVariable> idLgciuRightMainGearCompressed[2];
  std::unique_ptr<LocalVariable> idLgciuDiscreteWord1[2];
  std::unique_ptr<LocalVariable> idLgciuDiscreteWord2[2];
  std::unique_ptr<LocalVariable> idLgciuDiscreteWord3[2];
  std::unique_ptr<LocalVariable> idLgciuDiscreteWord4[2];

  // BTV inputs (from Rust WASM)
  std::unique_ptr<LocalVariable> idBtvExitMissed;

  // SFCC inputs
  std::unique_ptr<LocalVariable> idSfccSlatFlapComponentStatusWord[2];
  std::unique_ptr<LocalVariable> idSfccSlatFlapSystemStatusWord[2];
  std::unique_ptr<LocalVariable> idSfccSlatFlapActualPositionWord[2];
  std::unique_ptr<LocalVariable> idSfccSlatActualPositionWord[2];
  std::unique_ptr<LocalVariable> idSfccFlapActualPositionWord[2];

  // ADR bus inputs
  std::unique_ptr<LocalVariable> idAdrAltitudeStandard[3];
  std::unique_ptr<LocalVariable> idAdrAltitudeCorrected1[3];
  std::unique_ptr<LocalVariable> idAdrAltitudeCorrected2[3];
  std::unique_ptr<LocalVariable> idAdrMach[3];
  std::unique_ptr<LocalVariable> idAdrAirspeedComputed[3];
  std::unique_ptr<LocalVariable> idAdrAirspeedTrue[3];
  std::unique_ptr<LocalVariable> idAdrVerticalSpeed[3];
  std::unique_ptr<LocalVariable> idAdrAoaCorrected[3];
  std::unique_ptr<LocalVariable> idAdrCorrectedAverageStaticPressure[3];

  // IR bus inputs
  std::unique_ptr<LocalVariable> idIrMaintWord[3];
  std::unique_ptr<LocalVariable> idIrLatitude[3];
  std::unique_ptr<LocalVariable> idIrLongitude[3];
  std::unique_ptr<LocalVariable> idIrGroundSpeed[3];
  std::unique_ptr<LocalVariable> idIrWindSpeed[3];
  std::unique_ptr<LocalVariable> idIrWindDirectionTrue[3];
  std::unique_ptr<LocalVariable> idIrTrackAngleMagnetic[3];
  std::unique_ptr<LocalVariable> idIrHeadingMagnetic[3];
  std::unique_ptr<LocalVariable> idIrDriftAngle[3];
  std::unique_ptr<LocalVariable> idIrFlightPathAngle[3];
  std::unique_ptr<LocalVariable> idIrPitchAngle[3];
  std::unique_ptr<LocalVariable> idIrRollAngle[3];
  std::unique_ptr<LocalVariable> idIrBodyPitchRate[3];
  std::unique_ptr<LocalVariable> idIrBodyRollRate[3];
  std::unique_ptr<LocalVariable> idIrBodyYawRate[3];
  std::unique_ptr<LocalVariable> idIrBodyLongAccel[3];
  std::unique_ptr<LocalVariable> idIrBodyLatAccel[3];
  std::unique_ptr<LocalVariable> idIrBodyNormalAccel[3];
  std::unique_ptr<LocalVariable> idIrTrackAngleRate[3];
  std::unique_ptr<LocalVariable> idIrPitchAttRate[3];
  std::unique_ptr<LocalVariable> idIrRollAttRate[3];
  std::unique_ptr<LocalVariable> idIrInertialVerticalSpeed[3];

  // FCDC bus label Lvars
  std::unique_ptr<LocalVariable> idFcdcHealthy[2];
  std::unique_ptr<LocalVariable> idFcdcDiscreteWord1[2];
  std::unique_ptr<LocalVariable> idFcdcDiscreteWord2[2];
  std::unique_ptr<LocalVariable> idFcdcDiscreteWord3[2];
  std::unique_ptr<LocalVariable> idFcdcDiscreteWord4[2];
  std::unique_ptr<LocalVariable> idFcdcDiscreteWord5[2];
  std::unique_ptr<LocalVariable> idFcdcFgDiscreteWord4[2];
  std::unique_ptr<LocalVariable> idFcdcFgDiscreteWord8[2];
  std::unique_ptr<LocalVariable> idFcdcLandingFctDiscreteWord[2];
  std::unique_ptr<LocalVariable> idFcdcCaptRollCommand[2];
  std::unique_ptr<LocalVariable> idFcdcFoRollCommand[2];
  std::unique_ptr<LocalVariable> idFcdcCaptPitchCommand[2];
  std::unique_ptr<LocalVariable> idFcdcFoPitchCommand[2];
  std::unique_ptr<LocalVariable> idFcdcRudderPedalPos[2];
  std::unique_ptr<LocalVariable> idFcdcAileronLeftPos[2];
  std::unique_ptr<LocalVariable> idFcdcElevatorLeftPos[2];
  std::unique_ptr<LocalVariable> idFcdcAileronRightPos[2];
  std::unique_ptr<LocalVariable> idFcdcElevatorRightPos[2];
  std::unique_ptr<LocalVariable> idFcdcElevatorTrimPos[2];
  std::unique_ptr<LocalVariable> idFcdcSpoilerLeft1Pos[2];
  std::unique_ptr<LocalVariable> idFcdcSpoilerLeft2Pos[2];
  std::unique_ptr<LocalVariable> idFcdcSpoilerLeft3Pos[2];
  std::unique_ptr<LocalVariable> idFcdcSpoilerLeft4Pos[2];
  std::unique_ptr<LocalVariable> idFcdcSpoilerLeft5Pos[2];
  std::unique_ptr<LocalVariable> idFcdcSpoilerRight1Pos[2];
  std::unique_ptr<LocalVariable> idFcdcSpoilerRight2Pos[2];
  std::unique_ptr<LocalVariable> idFcdcSpoilerRight3Pos[2];
  std::unique_ptr<LocalVariable> idFcdcSpoilerRight4Pos[2];
  std::unique_ptr<LocalVariable> idFcdcSpoilerRight5Pos[2];

  // FCDC discrete output Lvars
  std::unique_ptr<LocalVariable> idFcdcPriorityCaptGreen[2];
  std::unique_ptr<LocalVariable> idFcdcPriorityCaptRed[2];
  std::unique_ptr<LocalVariable> idFcdcPriorityFoGreen[2];
  std::unique_ptr<LocalVariable> idFcdcPriorityFoRed[2];
  std::unique_ptr<LocalVariable> idBtvLost;

  // PRIM discrete input Lvars
  std::unique_ptr<LocalVariable> idPrimPushbuttonPressed[3];

  // PRIM discrete output Lvars
  std::unique_ptr<LocalVariable> idPrimHealthy[3];
  std::unique_ptr<LocalVariable> idPrimApEngaged[3];

  // PRIM bus FCTL output Lvars
  std::unique_ptr<LocalVariable> idPrimFctlLawStatusWord[3];

  // PRIM bus FE output Lvars
  std::unique_ptr<LocalVariable> idPrimGammaA[3];
  std::unique_ptr<LocalVariable> idPrimGammaT[3];
  std::unique_ptr<LocalVariable> idPrimSideslipTarget[3];
  std::unique_ptr<LocalVariable> idPrimVAlphaLim[3];
  std::unique_ptr<LocalVariable> idPrimVLs[3];
  std::unique_ptr<LocalVariable> idPrimVStall[3];
  std::unique_ptr<LocalVariable> idPrimVAlphaProt[3];
  std::unique_ptr<LocalVariable> idPrimVStallWarn[3];
  std::unique_ptr<LocalVariable> idPrimSpeedTrend[3];
  std::unique_ptr<LocalVariable> idPrimV3[3];
  std::unique_ptr<LocalVariable> idPrimV4[3];
  std::unique_ptr<LocalVariable> idPrimVMan[3];
  std::unique_ptr<LocalVariable> idPrimVMax[3];
  std::unique_ptr<LocalVariable> idPrimVFeNext[3];

  // PRIM bus FG output Lvars
  std::unique_ptr<LocalVariable> idPrimPfdSpdTgt[3];
  std::unique_ptr<LocalVariable> idPrimPfdShortTermMngdSpd[3];
  std::unique_ptr<LocalVariable> idPrimSelectedSpd[3];
  std::unique_ptr<LocalVariable> idPrimSelectedMach[3];
  std::unique_ptr<LocalVariable> idPrimSelectedHdg[3];
  std::unique_ptr<LocalVariable> idPrimSelectedTrk[3];
  std::unique_ptr<LocalVariable> idPrimSelectedAlt[3];
  std::unique_ptr<LocalVariable> idPrimSelectedVs[3];
  std::unique_ptr<LocalVariable> idPrimSelectedFpa[3];
  std::unique_ptr<LocalVariable> idPrimPreselMach[3];
  std::unique_ptr<LocalVariable> idPrimPreselSpeed[3];
  std::unique_ptr<LocalVariable> idPrimRwyHdgMemo[3];
  std::unique_ptr<LocalVariable> idPrimRollFd1Command[3];
  std::unique_ptr<LocalVariable> idPrimPitchFd1Command[3];
  std::unique_ptr<LocalVariable> idPrimYawFd1Command[3];
  std::unique_ptr<LocalVariable> idPrimRollFd2Command[3];
  std::unique_ptr<LocalVariable> idPrimPitchFd2Command[3];
  std::unique_ptr<LocalVariable> idPrimYawFd2Command[3];
  std::unique_ptr<LocalVariable> idPrimFmAltConstraint[3];
  std::unique_ptr<LocalVariable> idPrimAtsDiscreteWord[3];
  std::unique_ptr<LocalVariable> idPrimAtsFmaDiscreteWord[3];
  std::unique_ptr<LocalVariable> idPrimFgDiscreteWord1[3];
  std::unique_ptr<LocalVariable> idPrimFgDiscreteWord2[3];
  std::unique_ptr<LocalVariable> idPrimFgDiscreteWord3[3];
  std::unique_ptr<LocalVariable> idPrimFgDiscreteWord4[3];
  std::unique_ptr<LocalVariable> idPrimFgDiscreteWord5[3];
  std::unique_ptr<LocalVariable> idPrimFgDiscreteWord6[3];
  std::unique_ptr<LocalVariable> idPrimSpeedMarginHigh[3];
  std::unique_ptr<LocalVariable> idPrimSpeedMarginLow[3];

  // SEC discrete input Lvars
  std::unique_ptr<LocalVariable> idSecPushbuttonPressed[3];

  // SEC discrete output Lvars
  std::unique_ptr<LocalVariable> idSecHealthy[3];
  std::unique_ptr<LocalVariable> idSecRudderStatusWord[3];
  std::unique_ptr<LocalVariable> idSecRudderTrimActualPos[3];

  // Flight controls solenoid valve energization Lvars
  std::unique_ptr<LocalVariable> idLeftInboardAileronSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idLeftInboardAileronCommandedPosition[2];
  std::unique_ptr<LocalVariable> idRightInboardAileronSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idRightInboardAileronCommandedPosition[2];
  std::unique_ptr<LocalVariable> idLeftMidboardAileronSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idLeftMidboardAileronCommandedPosition[2];
  std::unique_ptr<LocalVariable> idRightMidboardAileronSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idRightMidboardAileronCommandedPosition[2];
  std::unique_ptr<LocalVariable> idLeftOutboardAileronSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idLeftOutboardAileronCommandedPosition[2];
  std::unique_ptr<LocalVariable> idRightOutboardAileronSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idRightOutboardAileronCommandedPosition[2];
  std::unique_ptr<LocalVariable> idLeftSpoiler6EbhaElectronicEnable;
  std::unique_ptr<LocalVariable> idLeftSpoilerCommandedPosition[8];
  std::unique_ptr<LocalVariable> idRightSpoiler6EbhaElectronicEnable;
  std::unique_ptr<LocalVariable> idRightSpoilerCommandedPosition[8];
  std::unique_ptr<LocalVariable> idLeftInboardElevatorSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idLeftInboardElevatorCommandedPosition[2];
  std::unique_ptr<LocalVariable> idRightInboardElevatorSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idRightInboardElevatorCommandedPosition[2];
  std::unique_ptr<LocalVariable> idLeftOutboardElevatorSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idLeftOutboardElevatorCommandedPosition[2];
  std::unique_ptr<LocalVariable> idRightOutboardElevatorSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idRightOutboardElevatorCommandedPosition[2];
  std::unique_ptr<LocalVariable> idTHSSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idTHSCommandedPosition[2];
  std::unique_ptr<LocalVariable> idUpperRudderHydraulicModeSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idUpperRudderElectricModeSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idUpperRudderCommandedPosition[2];
  std::unique_ptr<LocalVariable> idLowerRudderHydraulicModeSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idLowerRudderElectricModeSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idLowerRudderCommandedPosition[2];
  std::unique_ptr<LocalVariable> idRudderTrimActiveModeCommanded[2];
  std::unique_ptr<LocalVariable> idRudderTrimCommandedPosition[2];
  std::unique_ptr<LocalVariable> idRudderTrimActualPosition;

  std::unique_ptr<LocalVariable> idLeftAileronInwardPosition;
  std::unique_ptr<LocalVariable> idLeftAileronMiddlePosition;
  std::unique_ptr<LocalVariable> idLeftAileronOutwardPosition;
  std::unique_ptr<LocalVariable> idRightAileronInwardPosition;
  std::unique_ptr<LocalVariable> idRightAileronMiddlePosition;
  std::unique_ptr<LocalVariable> idRightAileronOutwardPosition;
  std::unique_ptr<LocalVariable> idLeftSpoilerPosition[8];
  std::unique_ptr<LocalVariable> idRightSpoilerPosition[8];
  std::unique_ptr<LocalVariable> idLeftElevatorInwardPosition;
  std::unique_ptr<LocalVariable> idLeftElevatorOutwardPosition;
  std::unique_ptr<LocalVariable> idRightElevatorInwardPosition;
  std::unique_ptr<LocalVariable> idRightElevatorOutwardPosition;
  std::unique_ptr<LocalVariable> idUpperRudderPosition;
  std::unique_ptr<LocalVariable> idLowerRudderPosition;

  std::unique_ptr<LocalVariable> idElecDcEssBusPowered;
  std::unique_ptr<LocalVariable> idElecDcEhaBusPowered;
  std::unique_ptr<LocalVariable> idElecDc1BusPowered;
  std::unique_ptr<LocalVariable> idElecDc2BusPowered;
  std::unique_ptr<LocalVariable> idElecAc2BusPowered;
  std::unique_ptr<LocalVariable> idRatContactorClosed;
  std::unique_ptr<LocalVariable> idRatPosition;

  std::unique_ptr<LocalVariable> idHydYellowSystemPressure;
  std::unique_ptr<LocalVariable> idHydGreenSystemPressure;
  std::unique_ptr<LocalVariable> idHydYellowPressurised;
  std::unique_ptr<LocalVariable> idHydGreenPressurised;

  std::unique_ptr<LocalVariable> idCaptPriorityButtonPressed;
  std::unique_ptr<LocalVariable> idFoPriorityButtonPressed;

  std::unique_ptr<LocalVariable> idAttHdgSwtgKnob;
  std::unique_ptr<LocalVariable> idAirDataSwtgKnob;

  // CPIOM status
  std::unique_ptr<LocalVariable> idCpiomCxAvailable[2];

  // ADCN / AFDX connectivity
  std::unique_ptr<LocalVariable> idAfdx1_3Reachable;
  std::unique_ptr<LocalVariable> idAfdx11_13Reachable;
  std::unique_ptr<LocalVariable> idAfdx1_4Reachable;
  std::unique_ptr<LocalVariable> idAfdx11_14Reachable;
  std::unique_ptr<LocalVariable> idAfdx2_3Reachable;
  std::unique_ptr<LocalVariable> idAfdx12_13Reachable;
  std::unique_ptr<LocalVariable> idAfdx2_4Reachable;
  std::unique_ptr<LocalVariable> idAfdx12_14Reachable;
  std::unique_ptr<LocalVariable> idAfdx9_3Reachable;
  std::unique_ptr<LocalVariable> idAfdx19_13Reachable;
  std::unique_ptr<LocalVariable> idAfdx9_4Reachable;
  std::unique_ptr<LocalVariable> idAfdx19_14Reachable;

  std::unique_ptr<LocalVariable> idAfdxSwitch3Available;
  std::unique_ptr<LocalVariable> idAfdxSwitch13Available;
  std::unique_ptr<LocalVariable> idAfdxSwitch4Available;
  std::unique_ptr<LocalVariable> idAfdxSwitch14Available;

  // FCU
  std::unique_ptr<LocalVariable> idLightsTest;
  std::unique_ptr<LocalVariable> idFcuSwitchedOff;

  std::unique_ptr<LocalVariable> idFcuEisPanelBaroIsInhg[2];
  std::unique_ptr<LocalVariable> idFcuEisCpBackupActive[2];

  std::unique_ptr<LocalVariable> idFcuEisPanelVvLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelLsLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelTaxiLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelCstrLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelWptLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelVordLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelNdbLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelArptLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelTrafLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelWxLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelTerrLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelEfisMode[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelEfisRange[2];
  std::unique_ptr<LocalVariable> idFcuEisDisplayNavaid1Mode[2];
  std::unique_ptr<LocalVariable> idFcuEisDisplayNavaid2Mode[2];
  std::unique_ptr<LocalVariable> idFcuEisDisplayBaroIsInhg[2];
  std::unique_ptr<LocalVariable> idFcuEisDisplayBaroIsStd[2];
  std::unique_ptr<LocalVariable> idFcuEisDisplayBaroValue[2];
  std::unique_ptr<LocalVariable> idFcuEisDisplayBaroMode[2];
  std::unique_ptr<LocalVariable> idFcuEisDisplayBaroPresetVisible[2];
  std::unique_ptr<LocalVariable> idFcuEisCpActive[2];

  std::unique_ptr<LocalVariable> idFcuAfsPanelAltIncrement1000;

  std::unique_ptr<LocalVariable> idFcuAfsPanelAp1LightOn;
  std::unique_ptr<LocalVariable> idFcuAfsPanelAp2LightOn;
  std::unique_ptr<LocalVariable> idFcuAfsPanelAthrLightOn;
  std::unique_ptr<LocalVariable> idFcuAfsPanelFdLightOn;
  std::unique_ptr<LocalVariable> idFcuAfsPanelLocLightOn;
  std::unique_ptr<LocalVariable> idFcuAfsPanelAltLightOn;
  std::unique_ptr<LocalVariable> idFcuAfsPanelApprLightOn;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayTrkFpaMode;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayTrueMode;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayMachMode;
  std::unique_ptr<LocalVariable> idFcuAfsDisplaySpdMachValue;
  std::unique_ptr<LocalVariable> idFcuAfsDisplaySpdMachDashes;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayHdgTrkValue;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayHdgTrkDashes;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayAltValue;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayVsFpaValue;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayVsFpaDashes;
  std::unique_ptr<LocalVariable> idFcuAfsCpActive;

  std::unique_ptr<LocalVariable> idFcuEisDiscreteWord1[2];
  std::unique_ptr<LocalVariable> idFcuEisDiscreteWord2[2];
  std::unique_ptr<LocalVariable> idFcuEisBaro[2];
  std::unique_ptr<LocalVariable> idFcuEisBaroHpa[2];

  std::unique_ptr<LocalVariable> idFcuAfsDiscreteWord1[2];
  std::unique_ptr<LocalVariable> idFcuAfsDiscreteWord2[2];

  // FCU Shim
  // These variables are legacy variables and are driven by a shim from the new FCU to the old vars.
  std::unique_ptr<LocalVariable> idFcuShimLeftNavaid1Mode;
  std::unique_ptr<LocalVariable> idFcuShimLeftNavaid2Mode;
  std::unique_ptr<LocalVariable> idFcuShimLeftNdMode;
  std::unique_ptr<LocalVariable> idFcuShimLeftNdRange;
  std::unique_ptr<LocalVariable> idFcuShimLeftNdFilterOption;
  std::unique_ptr<LocalVariable> idFcuShimLeftLsActive;
  std::unique_ptr<LocalVariable> idFcuShimLeftBaroMode;
  std::unique_ptr<LocalVariable> idFcuShimRightNavaid1Mode;
  std::unique_ptr<LocalVariable> idFcuShimRightNavaid2Mode;
  std::unique_ptr<LocalVariable> idFcuShimRightNdMode;
  std::unique_ptr<LocalVariable> idFcuShimRightNdRange;
  std::unique_ptr<LocalVariable> idFcuShimRightNdFilterOption;
  std::unique_ptr<LocalVariable> idFcuShimRightLsActive;
  std::unique_ptr<LocalVariable> idFcuShimRightBaroMode;

  std::unique_ptr<LocalVariable> idFcuShimLeftBaroCorrectionAdirs;
  std::unique_ptr<LocalVariable> idFcuShimRightBaroCorrectionAdirs;

  void loadConfiguration();
  void setupLocalVariables();

  bool handleFcuInitialization(double sampleTime);

  bool readDataAndLocalVariables(double sampleTime);

  bool updatePerformanceMonitoring(double sampleTime);
  bool handleSimulationRate(double sampleTime);

  bool updateRadioReceiver(double sampleTime);

  bool updateBaseData(double sampleTime);
  bool updateAircraftSpecificData(double sampleTime);

  bool updateFlyByWire(double sampleTime);
  bool updateFadec(double sampleTime, int fadecIndex);

  bool updateRa(int raIndex);

  bool updateLgciu(int lgciuIndex);

  bool updateSfcc(int sfccIndex);

  bool updateAdirs(int adirsIndex);

  bool updatePrim(double sampleTime, int primIndex);

  bool updateSec(double sampleTime, int secIndex);

  bool updateFcdc(double sampleTime, int fcdcIndex);

  bool updateFcu(double sampleTime, int fcuIndex);

  bool updateFcuAfsLvars();

  bool updateFcuShim();

  bool updateServoSolenoidStatus();

  bool updateSpoilers(double sampleTime);

  bool updateFoSide(double sampleTime);

  bool updateAltimeterSetting(double sampleTime);

  double getTcasModeAvailable();

  double getTcasAdvisoryState();
};
