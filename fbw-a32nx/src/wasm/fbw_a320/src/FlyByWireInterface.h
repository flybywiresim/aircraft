#pragma once

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>

#include "Arinc429.h"
#include "CalculatedRadioReceiver.h"
#include "FadecComputer.h"
#include "InterpolatingLookupTable.h"
#include "LocalVariable.h"
#include "RateLimiter.h"
#include "SimConnectInterface.h"
#include "SpoilersHandler.h"
#include "ThrottleAxisMapping.h"
#include "elac/Elac.h"
#include "fac/Fac.h"
#include "failures/FailuresConsumer.h"
#include "fcdc/Fcdc.h"
#include "fcu/Fcu.h"
#include "fmgc/Fmgc.h"
#include "recording/FlightDataRecorder.h"
#include "recording/RecordingDataTypes.h"
#include "sec/Sec.h"

#include "utils/ConfirmNode.h"
#include "utils/HysteresisNode.h"
#include "utils/SRFlipFlop.h"

class FlyByWireInterface {
 public:
  bool connect();

  void disconnect();

  bool update(double sampleTime);

 private:
  const std::string CONFIGURATION_FILEPATH = "\\work\\ModelConfiguration.ini";

  static constexpr double MAX_ACCEPTABLE_SAMPLE_TIME = 0.22;
  static constexpr uint32_t LOW_PERFORMANCE_TIMER_THRESHOLD = 10;
  uint32_t lowPerformanceTimer = 0;

  double previousSimulationTime = 0;
  double calculatedSampleTime = 0;

  double monotonicTime = 0;

  int currentApproachCapability = 0;
  double previousApproachCapabilityUpdateTime = 0;

  bool simulationRateReductionEnabled = true;
  bool limitSimulationRateByPerformance = true;

  double targetSimulationRate = 1;
  bool targetSimulationRateModified = false;

  int elacDisabled = -1;
  int secDisabled = -1;
  int facDisabled = -1;
  bool fcuDisabled = false;
  int fmgcDisabled = -1;
  int fadecDisabled = -1;
  bool tailstrikeProtectionEnabled = true;

  ConfirmNode elac2EmerPowersupplyRelayTimer = ConfirmNode(true, 30);
  SRFlipFlop elac2EmerPowersupplyNoseGearConditionLatch = SRFlipFlop(true);

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

  bool autolandWarningLatch = false;
  bool autolandWarningTriggered = false;

  double hDotFilterPrevU = 0;
  double hDotFilterPrevY = 0;

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

  base_ra_bus raBusOutputs[2] = {};

  base_lgciu_bus lgciuBusOutputs[2] = {};

  base_sfcc_bus sfccBusOutputs[2] = {};

  base_ils_bus ilsBusOutputs[2] = {};

  base_adr_bus adrBusOutputs[3] = {};
  base_ir_bus irBusOutputs[3] = {};

  base_tcas_bus tcasBusOutputs = {};

  Elac elacs[2] = {Elac(true), Elac(false)};
  base_elac_discrete_outputs elacsDiscreteOutputs[2] = {};
  base_elac_analog_outputs elacsAnalogOutputs[2] = {};
  base_elac_out_bus elacsBusOutputs[2] = {};

  Sec secs[3] = {Sec(true, false), Sec(false, false), Sec(false, true)};
  base_sec_discrete_outputs secsDiscreteOutputs[3] = {};
  base_sec_analog_outputs secsAnalogOutputs[3] = {};
  base_sec_out_bus secsBusOutputs[3] = {};

  Fcdc fcdcs[2] = {Fcdc(true), Fcdc(false)};
  FcdcDiscreteOutputs fcdcsDiscreteOutputs[2] = {};
  base_fcdc_bus fcdcsBusOutputs[2] = {};

  Fmgc fmgcs[2] = {Fmgc(true), Fmgc(false)};
  base_fmgc_discrete_outputs fmgcsDiscreteOutputs[2] = {};
  base_fmgc_bus_outputs fmgcsBusOutputs[2] = {};

  Fcu fcu = Fcu();
  base_fcu_bus fcuBusOutputs = {};
  bool fcuHealthy = false;

  Fac facs[2] = {Fac(true), Fac(false)};
  base_fac_discrete_outputs facsDiscreteOutputs[2] = {};
  base_fac_analog_outputs facsAnalogOutputs[2] = {};
  base_fac_bus facsBusOutputs[2] = {};

  FadecComputer fadecs[2];
  FadecComputer::ExternalInputs_FadecComputer_T fadecInputs[2];
  athr_output fadecOutputs[2];
  base_ecu_bus fadecBusOutputs[2];

  InterpolatingLookupTable throttleLookupTable;

  RadioReceiver radioReceiver;

  bool wasFcuInitialized = false;
  double simulationTimeReady = 0.0;
  std::unique_ptr<LocalVariable> idIsReady;
  std::unique_ptr<LocalVariable> idStartState;

  bool developmentLocalVariablesEnabled = false;
  bool useCalculatedLocalizerAndGlideSlope = false;
  std::unique_ptr<LocalVariable> idDevelopmentAutoland_condition_Flare;
  std::unique_ptr<LocalVariable> idDevelopmentAutoland_H_dot_fpm;
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

  std::unique_ptr<LocalVariable> idTcasFault;
  std::unique_ptr<LocalVariable> idTcasMode;
  std::unique_ptr<LocalVariable> idTcasTaOnly;
  std::unique_ptr<LocalVariable> idTcasState;
  std::unique_ptr<LocalVariable> idTcasRaCorrective;
  std::unique_ptr<LocalVariable> idTcasRaType;
  std::unique_ptr<LocalVariable> idTcasRaRateToMaintain;
  std::unique_ptr<LocalVariable> idTcasRaUpAdvStatus;
  std::unique_ptr<LocalVariable> idTcasRaDownAdvStatus;
  std::unique_ptr<LocalVariable> idTcasSensitivityLevel;

  std::unique_ptr<LocalVariable> idFwcFlightPhase;
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
  std::unique_ptr<LocalVariable> idFmgcDirToTrigger;
  std::unique_ptr<LocalVariable> idFmsLsCourse;
  std::unique_ptr<LocalVariable> idFmsSpeedMarginHigh;
  std::unique_ptr<LocalVariable> idFmsSpeedMarginLow;
  std::unique_ptr<LocalVariable> idFmsSpeedMarginVisible;

  std::unique_ptr<LocalVariable> idAirConditioningPack_1;
  std::unique_ptr<LocalVariable> idAirConditioningPack_2;

  std::unique_ptr<LocalVariable> thrustLeverAngle_1;
  std::unique_ptr<LocalVariable> thrustLeverAngle_2;
  std::unique_ptr<LocalVariable> idAutothrustN1_TLA_1;
  std::unique_ptr<LocalVariable> idAutothrustN1_TLA_2;
  std::unique_ptr<LocalVariable> idAutothrustReverse_1;
  std::unique_ptr<LocalVariable> idAutothrustReverse_2;
  std::unique_ptr<LocalVariable> idAutothrustThrustLimitType;
  std::unique_ptr<LocalVariable> idAutothrustThrustLimit;
  std::unique_ptr<LocalVariable> idAutothrustThrustLimitREV;
  std::unique_ptr<LocalVariable> idAutothrustThrustLimitIDLE;
  std::unique_ptr<LocalVariable> idAutothrustThrustLimitCLB;
  std::unique_ptr<LocalVariable> idAutothrustThrustLimitMCT;
  std::unique_ptr<LocalVariable> idAutothrustThrustLimitFLX;
  std::unique_ptr<LocalVariable> idAutothrustThrustLimitTOGA;
  std::unique_ptr<LocalVariable> idAutothrustN1_c_1;
  std::unique_ptr<LocalVariable> idAutothrustN1_c_2;
  std::unique_ptr<LocalVariable> idAutothrustDisabled;
  std::unique_ptr<LocalVariable> idAutothrustDisconnect;
  std::unique_ptr<LocalVariable> idThrottlePosition3d_1;
  std::unique_ptr<LocalVariable> idThrottlePosition3d_2;
  InterpolatingLookupTable idThrottlePositionLookupTable3d;

  std::vector<std::shared_ptr<ThrottleAxisMapping>> throttleAxis;

  BaseData baseData = {};
  AircraftSpecificData aircraftSpecificData = {};

  std::unique_ptr<LocalVariable> idParkBrakeLeverPos;
  std::unique_ptr<LocalVariable> idBrakePedalLeftPos;
  std::unique_ptr<LocalVariable> idBrakePedalRightPos;
  std::unique_ptr<LocalVariable> idAutobrakeArmedMode;
  std::unique_ptr<LocalVariable> idAutobrakeDecelLight;
  std::unique_ptr<LocalVariable> idHydraulicGreenPressure;
  std::unique_ptr<LocalVariable> idHydraulicBluePressure;
  std::unique_ptr<LocalVariable> idHydraulicYellowPressure;
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

  // RA bus inputs
  std::unique_ptr<LocalVariable> idRadioAltimeterHeight[2];

  // LGCIU inputs
  std::unique_ptr<LocalVariable> idLgciu1NoseGearDownlocked;

  std::unique_ptr<LocalVariable> idLgciuNoseGearCompressed[2];
  std::unique_ptr<LocalVariable> idLgciuLeftMainGearCompressed[2];
  std::unique_ptr<LocalVariable> idLgciuRightMainGearCompressed[2];
  std::unique_ptr<LocalVariable> idLgciuDiscreteWord1[2];
  std::unique_ptr<LocalVariable> idLgciuDiscreteWord2[2];
  std::unique_ptr<LocalVariable> idLgciuDiscreteWord3[2];

  // SFCC inputs
  std::unique_ptr<LocalVariable> idSfccSlatFlapComponentStatusWord;
  std::unique_ptr<LocalVariable> idSfccSlatFlapSystemStatusWord;
  std::unique_ptr<LocalVariable> idSfccSlatFlapActualPositionWord;
  std::unique_ptr<LocalVariable> idSfccSlatActualPositionWord;
  std::unique_ptr<LocalVariable> idSfccFlapActualPositionWord;

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
  std::unique_ptr<LocalVariable> idIrLatitude[3];
  std::unique_ptr<LocalVariable> idIrLongitude[3];
  std::unique_ptr<LocalVariable> idIrGroundSpeed[3];
  std::unique_ptr<LocalVariable> idIrWindSpeed[3];
  std::unique_ptr<LocalVariable> idIrWindDirectionTrue[3];
  std::unique_ptr<LocalVariable> idIrTrackAngleMagnetic[3];
  std::unique_ptr<LocalVariable> idIrTrackAngleTrue[3];
  std::unique_ptr<LocalVariable> idIrHeadingMagnetic[3];
  std::unique_ptr<LocalVariable> idIrHeadingTrue[3];
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
  std::unique_ptr<LocalVariable> idFcdcDiscreteWord1[2];
  std::unique_ptr<LocalVariable> idFcdcDiscreteWord2[2];
  std::unique_ptr<LocalVariable> idFcdcDiscreteWord3[2];
  std::unique_ptr<LocalVariable> idFcdcDiscreteWord4[2];
  std::unique_ptr<LocalVariable> idFcdcDiscreteWord5[2];
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

  // fault input Lvars
  std::unique_ptr<LocalVariable> idElevFaultLeft[2];
  std::unique_ptr<LocalVariable> idElevFaultRight[2];
  std::unique_ptr<LocalVariable> idAilFaultLeft[2];
  std::unique_ptr<LocalVariable> idAilFaultRight[2];
  std::unique_ptr<LocalVariable> idSplrFaultLeft[5];
  std::unique_ptr<LocalVariable> idSplrFaultRight[5];

  // THS Override Signal LVar
  std::unique_ptr<LocalVariable> idThsOverrideActive;

  // ELAC discrete input Lvars
  std::unique_ptr<LocalVariable> idElacPushbuttonPressed[2];

  // ELAC discrete output Lvars
  std::unique_ptr<LocalVariable> idElacDigitalOpValidated[2];

  // SEC discrete input Lvars
  std::unique_ptr<LocalVariable> idSecPushbuttonPressed[3];

  // SEC discrete output Lvars
  std::unique_ptr<LocalVariable> idSecFaultLightOn[3];
  std::unique_ptr<LocalVariable> idSecGroundSpoilersOut[3];

  // Flight controls solenoid valve energization Lvars
  std::unique_ptr<LocalVariable> idLeftAileronSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idLeftAileronCommandedPosition[2];
  std::unique_ptr<LocalVariable> idRightAileronSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idRightAileronCommandedPosition[2];
  std::unique_ptr<LocalVariable> idLeftSpoilerCommandedPosition[5];
  std::unique_ptr<LocalVariable> idRightSpoilerCommandedPosition[5];
  std::unique_ptr<LocalVariable> idLeftElevatorSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idLeftElevatorCommandedPosition[2];
  std::unique_ptr<LocalVariable> idRightElevatorSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idRightElevatorCommandedPosition[2];
  std::unique_ptr<LocalVariable> idTHSActiveModeCommanded[3];
  std::unique_ptr<LocalVariable> idTHSCommandedPosition[3];
  std::unique_ptr<LocalVariable> idYawDamperSolenoidEnergized[2];
  std::unique_ptr<LocalVariable> idYawDamperCommandedPosition[2];
  std::unique_ptr<LocalVariable> idRudderTrimActiveModeCommanded[2];
  std::unique_ptr<LocalVariable> idRudderTrimCommandedPosition[2];
  std::unique_ptr<LocalVariable> idRudderTravelLimitActiveModeCommanded[2];
  std::unique_ptr<LocalVariable> idRudderTravelLimCommandedPosition[2];

  // FAC discrete input Lvars
  std::unique_ptr<LocalVariable> idFacPushbuttonPressed[2];
  // FAC discrete output Lvars
  std::unique_ptr<LocalVariable> idFacHealthy[2];

  std::unique_ptr<LocalVariable> idFacDiscreteWord1[2];
  std::unique_ptr<LocalVariable> idFacGammaA[2];
  std::unique_ptr<LocalVariable> idFacGammaT[2];
  std::unique_ptr<LocalVariable> idFacWeight[2];
  std::unique_ptr<LocalVariable> idFacCenterOfGravity[2];
  std::unique_ptr<LocalVariable> idFacSideslipTarget[2];
  std::unique_ptr<LocalVariable> idFacSlatAngle[2];
  std::unique_ptr<LocalVariable> idFacFlapAngle[2];
  std::unique_ptr<LocalVariable> idFacDiscreteWord2[2];
  std::unique_ptr<LocalVariable> idFacRudderTravelLimitCommand[2];
  std::unique_ptr<LocalVariable> idFacDeltaRYawDamperVoted[2];
  std::unique_ptr<LocalVariable> idFacEstimatedSideslip[2];
  std::unique_ptr<LocalVariable> idFacVAlphaLim[2];
  std::unique_ptr<LocalVariable> idFacVLs[2];
  std::unique_ptr<LocalVariable> idFacVStall[2];
  std::unique_ptr<LocalVariable> idFacVAlphaProt[2];
  std::unique_ptr<LocalVariable> idFacVStallWarn[2];
  std::unique_ptr<LocalVariable> idFacSpeedTrend[2];
  std::unique_ptr<LocalVariable> idFacV3[2];
  std::unique_ptr<LocalVariable> idFacV4[2];
  std::unique_ptr<LocalVariable> idFacVMan[2];
  std::unique_ptr<LocalVariable> idFacVMax[2];
  std::unique_ptr<LocalVariable> idFacVFeNext[2];
  std::unique_ptr<LocalVariable> idFacDiscreteWord3[2];
  std::unique_ptr<LocalVariable> idFacDiscreteWord4[2];
  std::unique_ptr<LocalVariable> idFacDiscreteWord5[2];
  std::unique_ptr<LocalVariable> idFacDeltaRRudderTrim[2];
  std::unique_ptr<LocalVariable> idFacRudderTrimPos[2];
  std::unique_ptr<LocalVariable> idFacRudderTravelLimitReset[2];

  std::unique_ptr<LocalVariable> idLeftAileronPosition;
  std::unique_ptr<LocalVariable> idRightAileronPosition;
  std::unique_ptr<LocalVariable> idLeftElevatorPosition;
  std::unique_ptr<LocalVariable> idRightElevatorPosition;

  std::unique_ptr<LocalVariable> idRudderTrimPosition;
  std::unique_ptr<LocalVariable> idRudderTravelLimiterPosition;

  std::unique_ptr<LocalVariable> idLeftSpoilerPosition[5];
  std::unique_ptr<LocalVariable> idRightSpoilerPosition[5];

  std::unique_ptr<LocalVariable> idElecDcBus2Powered;
  std::unique_ptr<LocalVariable> idElecDcEssShedBusPowered;
  std::unique_ptr<LocalVariable> idElecDcEssBusPowered;
  std::unique_ptr<LocalVariable> idElecBat1HotBusPowered;
  std::unique_ptr<LocalVariable> idElecBat2HotBusPowered;

  std::unique_ptr<LocalVariable> idElecBtc1Closed;
  std::unique_ptr<LocalVariable> idElecBtc2Closed;
  std::unique_ptr<LocalVariable> idElecDcBatToDc2ContactorClosed;

  std::unique_ptr<LocalVariable> idHydYellowSystemPressure;
  std::unique_ptr<LocalVariable> idHydGreenSystemPressure;
  std::unique_ptr<LocalVariable> idHydBlueSystemPressure;
  std::unique_ptr<LocalVariable> idHydYellowPressurised;
  std::unique_ptr<LocalVariable> idHydGreenPressurised;
  std::unique_ptr<LocalVariable> idHydBluePressurised;

  std::unique_ptr<LocalVariable> idCaptPriorityButtonPressed;
  std::unique_ptr<LocalVariable> idFoPriorityButtonPressed;

  std::unique_ptr<LocalVariable> idAttHdgSwtgKnob;
  std::unique_ptr<LocalVariable> idAirDataSwtgKnob;

  // FMGC legacy/shim Lvars
  std::unique_ptr<LocalVariable> idAutopilotShimNosewheelDemand;
  std::unique_ptr<LocalVariable> idAutopilotShimFmaLateralMode;
  std::unique_ptr<LocalVariable> idAutopilotShimFmaLateralArmed;
  std::unique_ptr<LocalVariable> idAutopilotShimFmaVerticalMode;
  std::unique_ptr<LocalVariable> idAutopilotShimFmaVerticalArmed;
  std::unique_ptr<LocalVariable> idAutopilotShimFmaExpediteModeActive;
  std::unique_ptr<LocalVariable> idAutopilotShimFmaTripleClick;
  std::unique_ptr<LocalVariable> idAutopilotShimAutolandWarning;
  std::unique_ptr<LocalVariable> idAutopilotShimActiveAny;
  std::unique_ptr<LocalVariable> idAutopilotShimActive_1;
  std::unique_ptr<LocalVariable> idAutopilotShimActive_2;
  std::unique_ptr<LocalVariable> idAutopilotShim_H_dot_radio;
  std::unique_ptr<LocalVariable> idAutothrustShimStatus;
  std::unique_ptr<LocalVariable> idAutothrustShimMode;
  std::unique_ptr<LocalVariable> idAutothrustShimModeMessage;

  // FMGC discrete output Lvars
  std::unique_ptr<LocalVariable> idFmgcHealthy[2];
  std::unique_ptr<LocalVariable> idFmgcAthrEngaged[2];
  std::unique_ptr<LocalVariable> idFmgcFdEngaged[2];
  std::unique_ptr<LocalVariable> idFmgcApEngaged[2];
  std::unique_ptr<LocalVariable> idFmgcIlsTuneInhibit[2];

  // FMGC A Bus output Lvars
  std::unique_ptr<LocalVariable> idFmgcABusPfdSelectedSpeed[2];
  std::unique_ptr<LocalVariable> idFmgcABusPreselMach[2];
  std::unique_ptr<LocalVariable> idFmgcABusPreselSpeed[2];
  std::unique_ptr<LocalVariable> idFmgcABusRwyHdgMemo[2];
  std::unique_ptr<LocalVariable> idFmgcABusRollFdCommand[2];
  std::unique_ptr<LocalVariable> idFmgcABusPitchFdCommand[2];
  std::unique_ptr<LocalVariable> idFmgcABusYawFdCommand[2];
  std::unique_ptr<LocalVariable> idFmgcABusDiscreteWord5[2];
  std::unique_ptr<LocalVariable> idFmgcABusDiscreteWord4[2];
  std::unique_ptr<LocalVariable> idFmgcABusFmAltConstraint[2];
  std::unique_ptr<LocalVariable> idFmgcABusAtsDiscreteWord[2];
  std::unique_ptr<LocalVariable> idFmgcABusAtsFmaDiscreteWord[2];
  std::unique_ptr<LocalVariable> idFmgcABusDiscreteWord3[2];
  std::unique_ptr<LocalVariable> idFmgcABusDiscreteWord1[2];
  std::unique_ptr<LocalVariable> idFmgcABusDiscreteWord2[2];
  std::unique_ptr<LocalVariable> idFmgcABusDiscreteWord6[2];
  std::unique_ptr<LocalVariable> idFmgcABusDiscreteWord7[2];
  std::unique_ptr<LocalVariable> idFmgcABusSpeedMarginHigh[2];
  std::unique_ptr<LocalVariable> idFmgcABusSpeedMarginLow[2];

  std::unique_ptr<LocalVariable> idStickLockActive;

  std::unique_ptr<LocalVariable> idApInstinctiveDisconnect;
  std::unique_ptr<LocalVariable> idAthrInstinctiveDisconnect;

  std::unique_ptr<LocalVariable> idLightsTest;

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

  std::unique_ptr<LocalVariable> idFcuShimSpdDashes;
  std::unique_ptr<LocalVariable> idFcuShimSpdDot;
  std::unique_ptr<LocalVariable> idFcuShimSpdValue;
  std::unique_ptr<LocalVariable> idFcuShimTrkFpaActive;
  std::unique_ptr<LocalVariable> idFcuShimHdgValue1;
  std::unique_ptr<LocalVariable> idFcuShimHdgValue2;
  std::unique_ptr<LocalVariable> idFcuShimShowHdg;
  std::unique_ptr<LocalVariable> idFcuShimHdgDashes;
  std::unique_ptr<LocalVariable> idFcuShimHdgDot;
  std::unique_ptr<LocalVariable> idFcuShimAltManaged;
  std::unique_ptr<LocalVariable> idFcuShimVsValue;
  std::unique_ptr<LocalVariable> idFcuShimFpaValue;
  std::unique_ptr<LocalVariable> idFcuShimVsManaged;

  std::unique_ptr<LocalVariable> idFcuSelectedHeading;
  std::unique_ptr<LocalVariable> idFcuSelectedAltitude;
  std::unique_ptr<LocalVariable> idFcuSelectedAirspeed;
  std::unique_ptr<LocalVariable> idFcuSelectedVerticalSpeed;
  std::unique_ptr<LocalVariable> idFcuSelectedTrack;
  std::unique_ptr<LocalVariable> idFcuSelectedFpa;
  std::unique_ptr<LocalVariable> idFcuAtsDiscreteWord;
  std::unique_ptr<LocalVariable> idFcuAtsFmaDiscreteWord;
  std::unique_ptr<LocalVariable> idFcuEisLeftDiscreteWord1;
  std::unique_ptr<LocalVariable> idFcuEisLeftDiscreteWord2;
  std::unique_ptr<LocalVariable> idFcuEisLeftBaro;
  std::unique_ptr<LocalVariable> idFcuEisLeftBaroHpa;
  std::unique_ptr<LocalVariable> idFcuEisRightDiscreteWord1;
  std::unique_ptr<LocalVariable> idFcuEisRightDiscreteWord2;
  std::unique_ptr<LocalVariable> idFcuEisRightBaro;
  std::unique_ptr<LocalVariable> idFcuEisRightBaroHpa;
  std::unique_ptr<LocalVariable> idFcuDiscreteWord1;
  std::unique_ptr<LocalVariable> idFcuDiscreteWord2;

  std::unique_ptr<LocalVariable> idFcuEisPanelEfisMode[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelEfisRange[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelNavaid1Mode[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelNavaid2Mode[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelBaroIsInhg[2];

  std::unique_ptr<LocalVariable> idFcuEisPanelFdLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelLsLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelCstrLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelWptLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelVordLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelNdbLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisPanelArptLightOn[2];
  std::unique_ptr<LocalVariable> idFcuEisDisplayBaroValueMode[2];
  std::unique_ptr<LocalVariable> idFcuEisDisplayBaroValue[2];
  std::unique_ptr<LocalVariable> idFcuEisDisplayBaroMode[2];

  std::unique_ptr<LocalVariable> idFcuAfsPanelAltIncrement1000;

  std::unique_ptr<LocalVariable> idFcuAfsPanelAp1LightOn;
  std::unique_ptr<LocalVariable> idFcuAfsPanelAp2LightOn;
  std::unique_ptr<LocalVariable> idFcuAfsPanelAthrLightOn;
  std::unique_ptr<LocalVariable> idFcuAfsPanelLocLightOn;
  std::unique_ptr<LocalVariable> idFcuAfsPanelExpedLightOn;
  std::unique_ptr<LocalVariable> idFcuAfsPanelApprLightOn;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayTrkFpaMode;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayMachMode;
  std::unique_ptr<LocalVariable> idFcuAfsDisplaySpdMachValue;
  std::unique_ptr<LocalVariable> idFcuAfsDisplaySpdMachDashes;
  std::unique_ptr<LocalVariable> idFcuAfsDisplaySpdMachManaged;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayHdgTrkValue;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayHdgTrkDashes;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayHdgTrkManaged;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayAltValue;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayLvlChManaged;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayVsFpaValue;
  std::unique_ptr<LocalVariable> idFcuAfsDisplayVsFpaDashes;

  std::unique_ptr<LocalVariable> idFcuHealthy;

  std::unique_ptr<LocalVariable> idEcuMaintenanceWord6[2];

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

  bool updateFadec(int fadecIndex);

  bool updateIls(int ilsIndex);

  bool updateAdirs(int adirsIndex);

  bool updateTcas();

  bool updateElac(double sampleTime, int elacIndex);

  bool updateSec(double sampleTime, int secIndex);

  bool updateFcdc(double sampleTime, int fcdcIndex);

  bool updateFmgc(double sampleTime, int fmgcIndex);

  bool updateFmgcShim(double sampleTime);

  bool updateFcu(double sampleTime);

  bool updateFcuShim();

  bool updateFac(double sampleTime, int facIndex);

  bool updateServoSolenoidStatus();

  bool updateSpoilers(double sampleTime);

  bool updateAltimeterSetting(double sampleTime);
};
