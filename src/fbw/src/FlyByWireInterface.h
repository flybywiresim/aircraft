#pragma once

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>

#include "AnimationAileronHandler.h"
#include "AutopilotLaws.h"
#include "AutopilotStateMachine.h"
#include "Autothrust.h"
#include "ElevatorTrimHandler.h"
#include "EngineData.h"
#include "FlapsHandler.h"
#include "FlightDataRecorder.h"
#include "FlyByWire.h"
#include "InterpolatingLookupTable.h"
#include "LocalVariable.h"
#include "RateLimiter.h"
#include "RudderTrimHandler.h"
#include "SimConnectInterface.h"
#include "SpoilersHandler.h"
#include "ThrottleAxisMapping.h"

class FlyByWireInterface {
 public:
  bool connect();

  void disconnect();

  bool update(double sampleTime);

 private:
  const std::string CONFIGURATION_FILEPATH = "\\work\\ModelConfiguration.ini";

  static constexpr double MAX_ACCEPTABLE_SAMPLE_TIME = 0.06;
  static constexpr uint32_t LOW_PERFORMANCE_CYCLE_THRESHOLD = 10;
  static constexpr uint32_t LOW_PERFORMANCE_CYCLE_MAX = 15;
  uint32_t lowPerformanceCycleCounter = 0;

  double previousSimulationTime = 0;
  double calculatedSampleTime = 0;

  int currentApproachCapability = 0;
  double previousApproachCapabilityUpdateTime = 0;

  double maxSimulationRate = 4;

  bool flightDirectorSmoothingEnabled = false;
  double flightDirectorSmoothingFactor = 0;
  double flightDirectorSmoothingLimit = 0;
  bool customFlightGuidanceEnabled = false;
  bool gpsCourseToSteerEnabled = false;
  bool autopilotStateMachineEnabled = false;
  bool autopilotLawsEnabled = false;
  bool flyByWireEnabled = false;
  bool autoThrustEnabled = false;
  bool tailstrikeProtectionEnabled = true;

  bool pauseDetected = false;
  bool wasInSlew = false;

  bool flightDirectorConnectLatch_1 = false;
  bool flightDirectorConnectLatch_2 = false;
  bool flightDirectorDisconnectLatch_1 = false;
  bool flightDirectorDisconnectLatch_2 = false;

  bool autolandWarningLatch = false;
  bool autolandWarningTriggered = false;

  double flightGuidanceCrossTrackError = 0.0;
  double flightGuidanceTrackAngleError = 0.0;
  double flightGuidancePhiPreCommand = 0.0;

  double flightControlsKeyChangeAileron = 0.0;
  double flightControlsKeyChangeElevator = 0.0;
  double flightControlsKeyChangeRudder = 0.0;

  bool disableXboxCompatibilityRudderAxisPlusMinus = false;

  FlightDataRecorder flightDataRecorder;

  SimConnectInterface simConnectInterface;

  FlyByWireModelClass flyByWire;
  FlyByWireModelClass::ExternalInputs_FlyByWire_T flyByWireInput = {};
  fbw_output flyByWireOutput;

  AutopilotStateMachineModelClass autopilotStateMachine;
  AutopilotStateMachineModelClass::ExternalInputs_AutopilotStateMachine_T autopilotStateMachineInput = {};
  ap_raw_laws_input autopilotStateMachineOutput;

  AutopilotLawsModelClass autopilotLaws;
  AutopilotLawsModelClass::ExternalInputs_AutopilotLaws_T autopilotLawsInput = {};
  ap_raw_output autopilotLawsOutput;

  AutothrustModelClass autoThrust;
  AutothrustModelClass::ExternalInputs_Autothrust_T autoThrustInput = {};
  athr_output autoThrustOutput;

  InterpolatingLookupTable throttleLookupTable;

  std::unique_ptr<LocalVariable> idPerformanceWarningActive;

  std::unique_ptr<LocalVariable> idExternalOverride;

  std::unique_ptr<LocalVariable> idFdrEvent;

  std::unique_ptr<LocalVariable> idSideStickPositionX;
  std::unique_ptr<LocalVariable> idSideStickPositionY;
  std::unique_ptr<LocalVariable> idRudderPedalPosition;

  std::unique_ptr<LocalVariable> idSpeedAlphaProtection;
  std::unique_ptr<LocalVariable> idSpeedAlphaMax;

  std::unique_ptr<LocalVariable> idAlphaMaxPercentage;

  std::unique_ptr<LocalVariable> idFmaLateralMode;
  std::unique_ptr<LocalVariable> idFmaLateralArmed;
  std::unique_ptr<LocalVariable> idFmaVerticalMode;
  std::unique_ptr<LocalVariable> idFmaVerticalArmed;
  std::unique_ptr<LocalVariable> idFmaSoftAltModeActive;
  std::unique_ptr<LocalVariable> idFmaCruiseAltModeActive;
  std::unique_ptr<LocalVariable> idFmaExpediteModeActive;
  std::unique_ptr<LocalVariable> idFmaSpeedProtectionActive;
  std::unique_ptr<LocalVariable> idFmaApproachCapability;
  std::unique_ptr<LocalVariable> idFmaTripleClick;
  std::unique_ptr<LocalVariable> idFmaModeReversion;

  std::unique_ptr<LocalVariable> idFlightDirectorBank;
  std::unique_ptr<LocalVariable> idFlightDirectorPitch;
  std::unique_ptr<LocalVariable> idFlightDirectorYaw;

  std::unique_ptr<LocalVariable> idAutopilotAutolandWarning;

  std::unique_ptr<LocalVariable> idAutopilotActiveAny;
  std::unique_ptr<LocalVariable> idAutopilotActive_1;
  std::unique_ptr<LocalVariable> idAutopilotActive_2;

  std::unique_ptr<LocalVariable> idAutopilotAutothrustMode;

  std::unique_ptr<LocalVariable> idFcuTrkFpaModeActive;
  std::unique_ptr<LocalVariable> idFcuSelectedFpa;
  std::unique_ptr<LocalVariable> idFcuSelectedVs;
  std::unique_ptr<LocalVariable> idFcuSelectedHeading;

  std::unique_ptr<LocalVariable> idFcuLocModeActive;
  std::unique_ptr<LocalVariable> idFcuApprModeActive;
  std::unique_ptr<LocalVariable> idFcuModeReversionActive;
  std::unique_ptr<LocalVariable> idFcuModeReversionTrkFpaActive;

  std::unique_ptr<LocalVariable> idFlightGuidanceAvailable;
  std::unique_ptr<LocalVariable> idFlightGuidanceCrossTrackError;
  std::unique_ptr<LocalVariable> idFlightGuidanceTrackAngleError;
  std::unique_ptr<LocalVariable> idFlightGuidancePhiCommand;

  std::unique_ptr<LocalVariable> idFwcFlightPhase;
  std::unique_ptr<LocalVariable> idFmgcFlightPhase;
  std::unique_ptr<LocalVariable> idFmgcV2;
  std::unique_ptr<LocalVariable> idFmgcV_APP;
  std::unique_ptr<LocalVariable> idFmgcV_LS;
  std::unique_ptr<LocalVariable> idFmgcV_MAX;
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
  std::unique_ptr<LocalVariable> idAutothrustN1_c_1;
  std::unique_ptr<LocalVariable> idAutothrustN1_c_2;
  std::unique_ptr<LocalVariable> idAutothrustStatus;
  std::unique_ptr<LocalVariable> idAutothrustMode;
  std::unique_ptr<LocalVariable> idAutothrustModeMessage;
  std::unique_ptr<LocalVariable> idAutothrustDisabled;
  std::unique_ptr<LocalVariable> idAutothrustThrustLeverWarningFlex;
  std::unique_ptr<LocalVariable> idAutothrustThrustLeverWarningToga;
  std::unique_ptr<LocalVariable> idAutothrustDisconnect;
  std::unique_ptr<LocalVariable> idThrottlePosition3d_1;
  std::unique_ptr<LocalVariable> idThrottlePosition3d_2;
  InterpolatingLookupTable idThrottlePositionLookupTable3d;

  std::vector<std::shared_ptr<ThrottleAxisMapping>> throttleAxis;

  EngineData engineData = {};
  std::unique_ptr<LocalVariable> engineEngine1N2;
  std::unique_ptr<LocalVariable> engineEngine2N2;
  std::unique_ptr<LocalVariable> engineEngine1N1;
  std::unique_ptr<LocalVariable> engineEngine2N1;
  std::unique_ptr<LocalVariable> engineEngineIdleN1;
  std::unique_ptr<LocalVariable> engineEngineIdleN2;
  std::unique_ptr<LocalVariable> engineEngineIdleFF;
  std::unique_ptr<LocalVariable> engineEngineIdleEGT;
  std::unique_ptr<LocalVariable> engineEngine1EGT;
  std::unique_ptr<LocalVariable> engineEngine2EGT;
  std::unique_ptr<LocalVariable> engineEngine1Oil;
  std::unique_ptr<LocalVariable> engineEngine2Oil;
  std::unique_ptr<LocalVariable> engineEngine1TotalOil;
  std::unique_ptr<LocalVariable> engineEngine2TotalOil;
  std::unique_ptr<LocalVariable> engineEngine1FF;
  std::unique_ptr<LocalVariable> engineEngine2FF;
  std::unique_ptr<LocalVariable> engineEngine1PreFF;
  std::unique_ptr<LocalVariable> engineEngine2PreFF;
  std::unique_ptr<LocalVariable> engineEngineImbalance;
  std::unique_ptr<LocalVariable> engineFuelUsedLeft;
  std::unique_ptr<LocalVariable> engineFuelUsedRight;
  std::unique_ptr<LocalVariable> engineFuelLeftPre;
  std::unique_ptr<LocalVariable> engineFuelRightPre;
  std::unique_ptr<LocalVariable> engineFuelAuxLeftPre;
  std::unique_ptr<LocalVariable> engineFuelAuxRightPre;
  std::unique_ptr<LocalVariable> engineFuelCenterPre;
  std::unique_ptr<LocalVariable> engineEngineCycleTime;
  std::unique_ptr<LocalVariable> engineEngine1State;
  std::unique_ptr<LocalVariable> engineEngine2State;
  std::unique_ptr<LocalVariable> engineEngine1Timer;
  std::unique_ptr<LocalVariable> engineEngine2Timer;

  std::unique_ptr<LocalVariable> idFlapsHandleIndex;
  std::unique_ptr<LocalVariable> idFlapsHandlePercent;
  std::shared_ptr<FlapsHandler> flapsHandler;
  std::unique_ptr<LocalVariable> flapsHandleIndexFlapConf;
  std::unique_ptr<LocalVariable> flapsPosition;

  std::unique_ptr<LocalVariable> idSpoilersArmed;
  std::unique_ptr<LocalVariable> idSpoilersHandlePosition;
  std::unique_ptr<LocalVariable> idSpoilersGroundSpoilersActive;
  std::shared_ptr<SpoilersHandler> spoilersHandler;

  std::shared_ptr<ElevatorTrimHandler> elevatorTrimHandler;
  std::shared_ptr<RudderTrimHandler> rudderTrimHandler;

  std::unique_ptr<LocalVariable> idAileronPositionLeft;
  std::unique_ptr<LocalVariable> idAileronPositionRight;
  std::shared_ptr<AnimationAileronHandler> animationAileronHandler;

  std::unique_ptr<LocalVariable> idRadioReceiverLocalizerValid;
  std::unique_ptr<LocalVariable> idRadioReceiverLocalizerDeviation;
  std::unique_ptr<LocalVariable> idRadioReceiverLocalizerDistance;
  std::unique_ptr<LocalVariable> idRadioReceiverGlideSlopeValid;
  std::unique_ptr<LocalVariable> idRadioReceiverGlideSlopeDeviation;

  void loadConfiguration();
  void setupLocalVariables();

  bool readDataAndLocalVariables(double sampleTime);

  bool updateEngineData(double sampleTime);

  bool updateAutopilotStateMachine(double sampleTime);
  bool updateAutopilotLaws(double sampleTime);
  bool updateFlyByWire(double sampleTime);
  bool updateAutothrust(double sampleTime);

  bool updateFlapsSpoilers(double sampleTime);

  bool updateAltimeterSetting(double sampleTime);

  double smoothFlightDirector(double sampleTime, double factor, double limit, double currentValue, double targetValue);

  double getHeadingAngleError(double u1, double u2);
};
