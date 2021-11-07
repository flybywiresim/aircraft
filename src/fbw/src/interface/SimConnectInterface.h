#pragma once

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>
#include <string>
#include <vector>

#include "../ElevatorTrimHandler.h"
#include "../FlapsHandler.h"
#include "../LocalVariable.h"
#include "../RudderTrimHandler.h"
#include "../SpoilersHandler.h"
#include "../ThrottleAxisMapping.h"
#include "SimConnectData.h"

class SimConnectInterface {
 public:
  enum Events {
    AXIS_ELEVATOR_SET,
    AXIS_AILERONS_SET,
    AXIS_RUDDER_SET,
    RUDDER_SET,
    RUDDER_LEFT,
    RUDDER_AXIS_PLUS,
    RUDDER_CENTER,
    RUDDER_RIGHT,
    RUDDER_AXIS_MINUS,
    RUDDER_TRIM_LEFT,
    RUDDER_TRIM_RESET,
    RUDDER_TRIM_RIGHT,
    RUDDER_TRIM_SET,
    RUDDER_TRIM_SET_EX1,
    AILERON_SET,
    AILERONS_LEFT,
    AILERONS_RIGHT,
    CENTER_AILER_RUDDER,
    ELEVATOR_SET,
    ELEV_DOWN,
    ELEV_UP,
    ELEV_TRIM_DN,
    ELEV_TRIM_UP,
    ELEVATOR_TRIM_SET,
    AXIS_ELEV_TRIM_SET,
    AP_MASTER,
    AUTOPILOT_OFF,
    AUTOPILOT_ON,
    AUTOPILOT_DISENGAGE_SET,
    AUTOPILOT_DISENGAGE_TOGGLE,
    TOGGLE_FLIGHT_DIRECTOR,
    A32NX_FCU_AP_1_PUSH,
    A32NX_FCU_AP_2_PUSH,
    A32NX_FCU_AP_DISCONNECT_PUSH,
    A32NX_FCU_ATHR_PUSH,
    A32NX_FCU_ATHR_DISCONNECT_PUSH,
    A32NX_FCU_SPD_INC,
    A32NX_FCU_SPD_DEC,
    A32NX_FCU_SPD_SET,
    A32NX_FCU_SPD_PUSH,
    A32NX_FCU_SPD_PULL,
    A32NX_FCU_SPD_MACH_TOGGLE_PUSH,
    A32NX_FCU_HDG_INC,
    A32NX_FCU_HDG_DEC,
    A32NX_FCU_HDG_SET,
    A32NX_FCU_HDG_PUSH,
    A32NX_FCU_HDG_PULL,
    A32NX_FCU_TRK_FPA_TOGGLE_PUSH,
    A32NX_FCU_TO_AP_HDG_PUSH,
    A32NX_FCU_TO_AP_HDG_PULL,
    A32NX_FCU_ALT_INC,
    A32NX_FCU_ALT_DEC,
    A32NX_FCU_ALT_SET,
    A32NX_FCU_ALT_PUSH,
    A32NX_FCU_ALT_PULL,
    A32NX_FCU_ALT_INCREMENT_TOGGLE,
    A32NX_FCU_ALT_INCREMENT_SET,
    A32NX_FCU_VS_INC,
    A32NX_FCU_VS_DEC,
    A32NX_FCU_VS_SET,
    A32NX_FCU_VS_PUSH,
    A32NX_FCU_VS_PULL,
    A32NX_FCU_TO_AP_VS_PUSH,
    A32NX_FCU_TO_AP_VS_PULL,
    A32NX_FCU_LOC_PUSH,
    A32NX_FCU_APPR_PUSH,
    A32NX_FCU_EXPED_PUSH,
    A32NX_FMGC_DIR_TO_TRIGGER,
    AP_SPEED_SLOT_INDEX_SET,
    AP_SPD_VAR_INC,
    AP_SPD_VAR_DEC,
    AP_HEADING_SLOT_INDEX_SET,
    HEADING_BUG_INC,
    HEADING_BUG_DEC,
    AP_ALTITUDE_SLOT_INDEX_SET,
    AP_VS_SLOT_INDEX_SET,
    AP_VS_VAR_INC,
    AP_VS_VAR_DEC,
    AP_APR_HOLD,
    AP_LOC_HOLD,
    AUTO_THROTTLE_ARM,
    AUTO_THROTTLE_DISCONNECT,
    AUTO_THROTTLE_TO_GA,
    A32NX_ATHR_RESET_DISABLE,
    A32NX_THROTTLE_MAPPING_LOAD_FROM_FILE,
    A32NX_THROTTLE_MAPPING_LOAD_FROM_LOCAL_VARIABLES,
    A32NX_THROTTLE_MAPPING_SAVE_TO_FILE,
    THROTTLE_SET,
    THROTTLE1_SET,
    THROTTLE2_SET,
    THROTTLE_AXIS_SET_EX1,
    THROTTLE1_AXIS_SET_EX1,
    THROTTLE2_AXIS_SET_EX1,
    THROTTLE_FULL,
    THROTTLE_CUT,
    THROTTLE_INCR,
    THROTTLE_DECR,
    THROTTLE_INCR_SMALL,
    THROTTLE_DECR_SMALL,
    THROTTLE_10,
    THROTTLE_20,
    THROTTLE_30,
    THROTTLE_40,
    THROTTLE_50,
    THROTTLE_60,
    THROTTLE_70,
    THROTTLE_80,
    THROTTLE_90,
    THROTTLE1_FULL,
    THROTTLE1_CUT,
    THROTTLE1_INCR,
    THROTTLE1_DECR,
    THROTTLE1_INCR_SMALL,
    THROTTLE1_DECR_SMALL,
    THROTTLE2_FULL,
    THROTTLE2_CUT,
    THROTTLE2_INCR,
    THROTTLE2_DECR,
    THROTTLE2_INCR_SMALL,
    THROTTLE2_DECR_SMALL,
    THROTTLE_REVERSE_THRUST_TOGGLE,
    THROTTLE_REVERSE_THRUST_HOLD,
    FLAPS_UP,
    FLAPS_1,
    FLAPS_2,
    FLAPS_3,
    FLAPS_DOWN,
    FLAPS_INCR,
    FLAPS_DECR,
    FLAPS_SET,
    AXIS_FLAPS_SET,
    SPOILERS_ON,
    SPOILERS_OFF,
    SPOILERS_TOGGLE,
    SPOILERS_SET,
    AXIS_SPOILER_SET,
    SPOILERS_ARM_ON,
    SPOILERS_ARM_OFF,
    SPOILERS_ARM_TOGGLE,
    SPOILERS_ARM_SET,
    SIM_RATE_INCR,
    SIM_RATE_DECR,
    SIM_RATE_SET,
  };

  SimConnectInterface() = default;

  ~SimConnectInterface() = default;

  bool connect(bool clientDataEnabled,
               bool autopilotStateMachineEnabled,
               bool autopilotLawsEnabled,
               bool flyByWireEnabled,
               const std::vector<std::shared_ptr<ThrottleAxisMapping>>& throttleAxis,
               std::shared_ptr<FlapsHandler> flapsHandler,
               std::shared_ptr<SpoilersHandler> spoilersHandler,
               std::shared_ptr<ElevatorTrimHandler> elevatorTrimHandler,
               std::shared_ptr<RudderTrimHandler> rudderTrimHandler,
               double keyChangeAileron,
               double keyChangeElevator,
               double keyChangeRudder,
               bool disableXboxCompatibilityRudderPlusMinus,
               double maxSimulationRate,
               bool limitSimulationRateByPerformance);

  void disconnect();

  void setSampleTime(double sampleTime);

  bool requestReadData();

  bool requestData();

  bool readData();

  bool sendData(SimOutput output);

  bool sendData(SimOutputEtaTrim output);

  bool sendData(SimOutputZetaTrim output);

  bool sendData(SimOutputThrottles output);

  bool sendData(SimOutputFlaps output);

  bool sendData(SimOutputSpoilers output);

  bool sendData(SimOutputAltimeter output);

  bool sendEvent(Events eventId);

  bool sendEvent(Events eventId, DWORD data);

  bool sendEvent(Events eventId, DWORD data, DWORD priority);

  bool setClientDataLocalVariables(ClientDataLocalVariables output);

  bool setClientDataLocalVariablesAutothrust(ClientDataLocalVariablesAutothrust output);

  void resetSimInputAutopilot();

  void resetSimInputThrottles();

  SimData getSimData();

  SimInput getSimInput();

  SimInputAutopilot getSimInputAutopilot();

  SimInputThrottles getSimInputThrottles();

  bool setClientDataAutopilotStateMachine(ClientDataAutopilotStateMachine output);
  ClientDataAutopilotStateMachine getClientDataAutopilotStateMachine();

  bool setClientDataAutopilotLaws(ClientDataAutopilotLaws output);
  ClientDataAutopilotLaws getClientDataAutopilotLaws();

  ClientDataAutothrust getClientDataAutothrust();

  bool setClientDataFlyByWireInput(ClientDataFlyByWireInput output);

  bool setClientDataFlyByWire(ClientDataFlyByWire output);
  ClientDataFlyByWire getClientDataFlyByWire();

  void setLoggingFlightControlsEnabled(bool enabled);
  bool getLoggingFlightControlsEnabled();

  void setLoggingThrottlesEnabled(bool enabled);
  bool getLoggingThrottlesEnabled();

 private:
  enum ClientData {
    AUTOPILOT_STATE_MACHINE,
    AUTOPILOT_LAWS,
    AUTOTHRUST,
    FLY_BY_WIRE_INPUT,
    FLY_BY_WIRE,
    LOCAL_VARIABLES,
    LOCAL_VARIABLES_AUTOTHRUST,
  };

  bool isConnected = false;
  HANDLE hSimConnect = 0;

  double sampleTime = 0;

  double maxSimulationRate = 0;
  bool limitSimulationRateByPerformance = true;
  bool clientDataEnabled = false;

  bool loggingFlightControlsEnabled = false;
  bool loggingThrottlesEnabled = false;

  SimData simData = {};
  SimInput simInput = {};
  SimInputAutopilot simInputAutopilot = {};

  SimInputThrottles simInputThrottles = {};
  std::vector<std::shared_ptr<ThrottleAxisMapping>> throttleAxis;

  std::shared_ptr<FlapsHandler> flapsHandler;
  std::shared_ptr<SpoilersHandler> spoilersHandler;
  std::shared_ptr<ElevatorTrimHandler> elevatorTrimHandler;
  std::shared_ptr<RudderTrimHandler> rudderTrimHandler;

  ClientDataAutopilotStateMachine clientDataAutopilotStateMachine = {};
  ClientDataAutopilotLaws clientDataAutopilotLaws = {};
  ClientDataAutothrust clientDataAutothrust = {};
  ClientDataFlyByWire clientDataFlyByWire = {};

  double flightControlsKeyChangeAileron = 0.0;
  double flightControlsKeyChangeElevator = 0.0;
  double flightControlsKeyChangeRudder = 0.0;
  bool disableXboxCompatibilityRudderPlusMinus = false;

  std::unique_ptr<LocalVariable> idFcuEventSetSPEED;
  std::unique_ptr<LocalVariable> idFcuEventSetHDG;
  std::unique_ptr<LocalVariable> idFcuEventSetVS;

  bool prepareSimDataSimConnectDataDefinitions();

  bool prepareSimInputSimConnectDataDefinitions();

  bool prepareSimOutputSimConnectDataDefinitions();

  bool prepareClientDataDefinitions();

  void simConnectProcessDispatchMessage(SIMCONNECT_RECV* pData, DWORD* cbData);

  void simConnectProcessEvent(const SIMCONNECT_RECV_EVENT* event);

  void simConnectProcessSimObjectData(const SIMCONNECT_RECV_SIMOBJECT_DATA* data);

  void simConnectProcessClientData(const SIMCONNECT_RECV_CLIENT_DATA* data);

  bool sendClientData(SIMCONNECT_DATA_DEFINITION_ID id, DWORD size, void* data);
  bool sendData(SIMCONNECT_DATA_DEFINITION_ID id, DWORD size, void* data);

  static bool addDataDefinition(const HANDLE connectionHandle,
                                const SIMCONNECT_DATA_DEFINITION_ID id,
                                const SIMCONNECT_DATATYPE dataType,
                                const std::string& dataName,
                                const std::string& dataUnit);

  static bool addInputDataDefinition(const HANDLE connectionHandle,
                                     const SIMCONNECT_DATA_DEFINITION_ID groupId,
                                     const SIMCONNECT_CLIENT_EVENT_ID eventId,
                                     const std::string& eventName,
                                     const bool maskEvent);

  static bool isSimConnectDataTypeStruct(SIMCONNECT_DATATYPE dataType);

  static std::string getSimConnectExceptionString(SIMCONNECT_EXCEPTION exception);
};
