#pragma once

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>
#include <string>
#include <vector>

#include "../LocalVariable.h"
#include "../SpoilersHandler.h"
#include "../ThrottleAxisMapping.h"
#include "SimConnectData.h"

#include "../model/ElacComputer_types.h"
#include "../model/FacComputer_types.h"
#include "../model/FadecComputer_types.h"
#include "../model/FcuComputer_types.h"
#include "../model/FmgcComputer_types.h"
#include "../model/SecComputer_types.h"

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
    AP_MASTER,
    AUTOPILOT_OFF,
    AUTOPILOT_ON,
    AUTOPILOT_DISENGAGE_SET,
    AUTOPILOT_DISENGAGE_TOGGLE,
    TOGGLE_FLIGHT_DIRECTOR,
    A32NX_AUTOPILOT_DISENGAGE,
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
    A32NX_FCU_ALT_INC,
    A32NX_FCU_ALT_DEC,
    A32NX_FCU_ALT_SET,
    A32NX_FCU_ALT_PUSH,
    A32NX_FCU_ALT_PULL,
    A32NX_FCU_ALT_INCREMENT_TOGGLE,
    A32NX_FCU_ALT_INCREMENT_SET,
    A32NX_FCU_METRIC_ALT_TOGGLE_PUSH,
    A32NX_FCU_VS_INC,
    A32NX_FCU_VS_DEC,
    A32NX_FCU_VS_SET,
    A32NX_FCU_VS_PUSH,
    A32NX_FCU_VS_PULL,
    A32NX_FCU_LOC_PUSH,
    A32NX_FCU_APPR_PUSH,
    A32NX_FCU_EXPED_PUSH,
    A32NX_FCU_EFIS_L_FD_PUSH,
    A32NX_FCU_EFIS_L_LS_PUSH,
    A32NX_FCU_EFIS_L_BARO_INC,
    A32NX_FCU_EFIS_L_BARO_DEC,
    A32NX_FCU_EFIS_L_BARO_SET,
    A32NX_FCU_EFIS_L_BARO_PUSH,
    A32NX_FCU_EFIS_L_BARO_PULL,
    A32NX_FCU_EFIS_L_CSTR_PUSH,
    A32NX_FCU_EFIS_L_WPT_PUSH,
    A32NX_FCU_EFIS_L_VORD_PUSH,
    A32NX_FCU_EFIS_L_NDB_PUSH,
    A32NX_FCU_EFIS_L_ARPT_PUSH,
    A32NX_FCU_EFIS_R_FD_PUSH,
    A32NX_FCU_EFIS_R_LS_PUSH,
    A32NX_FCU_EFIS_R_BARO_INC,
    A32NX_FCU_EFIS_R_BARO_DEC,
    A32NX_FCU_EFIS_R_BARO_SET,
    A32NX_FCU_EFIS_R_BARO_PUSH,
    A32NX_FCU_EFIS_R_BARO_PULL,
    A32NX_FCU_EFIS_R_CSTR_PUSH,
    A32NX_FCU_EFIS_R_WPT_PUSH,
    A32NX_FCU_EFIS_R_VORD_PUSH,
    A32NX_FCU_EFIS_R_NDB_PUSH,
    A32NX_FCU_EFIS_R_ARPT_PUSH,
    A32NX_FMGC_DIR_TO_TRIGGER,
    A32NX_FMGC_PRESET_SPD_ACTIVATE,
    A32NX_FMGC_SPD_MODE_ACTIVATE,
    A32NX_FMGC_MACH_MODE_ACTIVATE,
    A32NX_EFIS_L_CHRONO_PUSHED,
    A32NX_EFIS_R_CHRONO_PUSHED,
    AP_AIRSPEED_ON,
    AP_AIRSPEED_OFF,
    AP_HDG_HOLD_ON,
    AP_HDG_HOLD_OFF,
    AP_ALT_HOLD_ON,
    AP_ALT_HOLD_OFF,
    AP_VS_ON,
    AP_VS_OFF,
    AP_SPEED_SLOT_INDEX_SET,
    AP_SPD_VAR_INC,
    AP_SPD_VAR_DEC,
    AP_SPD_VAR_SET,
    AP_MACH_VAR_INC,
    AP_MACH_VAR_DEC,
    AP_HEADING_SLOT_INDEX_SET,
    HEADING_BUG_INC,
    HEADING_BUG_DEC,
    HEADING_BUG_SET,
    AP_ALTITUDE_SLOT_INDEX_SET,
    AP_ALT_VAR_INC,
    AP_ALT_VAR_DEC,
    AP_ALT_VAR_SET,
    AP_VS_SLOT_INDEX_SET,
    AP_VS_VAR_INC,
    AP_VS_VAR_DEC,
    AP_APR_HOLD,
    AP_LOC_HOLD,
    AP_ALT_HOLD,
    AP_VS_HOLD,
    AP_ATT_HOLD,
    AP_MACH_HOLD,
    KOHLSMAN_SET,
    KOHLSMAN_INC,
    KOHLSMAN_DEC,
    BAROMETRIC_STD_PRESSURE,
    BAROMETRIC,
    AUTO_THROTTLE_ARM,
    AUTO_THROTTLE_DISCONNECT,
    A32NX_AUTO_THROTTLE_DISCONNECT,
    AUTO_THROTTLE_TO_GA,
    A32NX_ATHR_RESET_DISABLE,
    A32NX_THROTTLE_MAPPING_SET_DEFAULTS,
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
    SYSTEM_EVENT_PAUSE,
  };

  SimConnectInterface() = default;

  ~SimConnectInterface() = default;

  bool connect(bool clientDataEnabled,
               int elacDisabled,
               int secDisabled,
               int facDisabled,
               int fmgcDisabled,
               bool fcuDisabled,
               const std::vector<std::shared_ptr<ThrottleAxisMapping>>& throttleAxis,
               std::shared_ptr<SpoilersHandler> spoilersHandler,
               double keyChangeAileron,
               double keyChangeElevator,
               double keyChangeRudder,
               bool disableXboxCompatibilityRudderPlusMinus,
               bool enableRudder2AxisMode,
               double minSimulationRate,
               double maxSimulationRate,
               bool limitSimulationRateByPerformance);

  void disconnect();

  void setSampleTime(double sampleTime);

  bool requestData();

  bool readData();

  bool sendData(SimOutputZetaTrim output);

  bool sendData(SimOutputThrottles output);

  bool sendData(SimOutputFlaps output);

  bool sendData(SimOutputSpoilers output);

  bool sendData(SimOutputAltimeter output);

  bool sendData(SimOutputAltimeter output, int altimeterIndex);

  bool sendEvent(Events eventId);

  bool sendEvent(Events eventId, DWORD data);

  bool sendEvent(Events eventId, DWORD data, DWORD priority);

  bool sendEventEx1(Events eventId, DWORD priority, DWORD data0, DWORD data1 = 0, DWORD data2 = 0, DWORD data3 = 0, DWORD data4 = 0);

  void resetSimInputRudderTrim();

  void resetFcuFrontPanelInputs();

  void resetSimInputAutopilot();

  void resetSimInputThrottles();

  SimData& getSimData();

  SimInput& getSimInput();

  SimInputAutopilot& getSimInputAutopilot();

  base_fcu_afs_panel_inputs& getFcuAfsPanelInputs();

  base_fcu_efis_panel_inputs& getFcuEfisPanelInputs(int side);

  SimInputRudderTrim& getSimInputRudderTrim();

  SimInputThrottles& getSimInputThrottles();

  bool setClientDataElacDiscretes(base_elac_discrete_inputs& output);
  bool setClientDataElacAnalog(base_elac_analog_inputs& output);
  bool setClientDataElacBusInput(base_elac_out_bus& output, int elacIndex);

  base_elac_discrete_outputs& getClientDataElacDiscretesOutput();
  base_elac_analog_outputs& getClientDataElacAnalogsOutput();
  base_elac_out_bus& getClientDataElacBusOutput();

  bool setClientDataSecDiscretes(base_sec_discrete_inputs& output);
  bool setClientDataSecAnalog(base_sec_analog_inputs& output);
  bool setClientDataSecBus(base_sec_out_bus& output, int secIndex);

  base_sec_discrete_outputs& getClientDataSecDiscretesOutput();
  base_sec_analog_outputs& getClientDataSecAnalogsOutput();
  base_sec_out_bus& getClientDataSecBusOutput();

  bool setClientDataFacDiscretes(base_fac_discrete_inputs& output);
  bool setClientDataFacAnalog(base_fac_analog_inputs& output);
  bool setClientDataFacBus(base_fac_bus& output, int facIndex);

  base_fac_discrete_outputs& getClientDataFacDiscretesOutput();
  base_fac_analog_outputs& getClientDataFacAnalogsOutput();
  base_fac_bus& getClientDataFacBusOutput();

  bool setClientDataFcuBus(base_fcu_bus& output);

  base_fcu_discrete_outputs& getClientDataFcuDiscreteOutput();
  base_fcu_bus& getClientDataFcuBusOutput();

  bool setClientDataFmgcDiscretes(base_fmgc_discrete_inputs& output);
  bool setClientDataFmgcFmsData(base_fms_inputs& output);
  bool setClientDataFmgcABus(base_fmgc_a_bus& output, int fmgcIndex);
  bool setClientDataFmgcBBus(base_fmgc_b_bus& output, int fmgcIndex);

  base_fmgc_discrete_outputs& getClientDataFmgcDiscretesOutput();
  base_fmgc_a_bus& getClientDataFmgcABusOutput();
  base_fmgc_b_bus& getClientDataFmgcBBusOutput();

  bool setClientDataFadecData(athr_data& output);
  bool setClientDataFadecInput(athr_input& output);

  athr_output& getClientDataFadecOutput();

  bool setClientDataAdr(base_adr_bus& output, int adrIndex);
  bool setClientDataIr(base_ir_bus& output, int irIndex);
  bool setClientDataRa(base_ra_bus& output, int raIndex);
  bool setClientDataLgciu(base_lgciu_bus& output, int lgciuIndex);
  bool setClientDataSfcc(base_sfcc_bus& output, int sfccIndex);
  bool setClientDataIls(base_ils_bus& output, int ilsIndex);
  bool setClientDataTcas(base_tcas_bus& output);
  bool setClientDataFadec(base_ecu_bus& output, int fadecIndex);

  void setLoggingFlightControlsEnabled(bool enabled);
  bool getLoggingFlightControlsEnabled();

  void setLoggingThrottlesEnabled(bool enabled);
  bool getLoggingThrottlesEnabled();

  // remove when aileron events can be processed via SimConnect
  static void processKeyEvent(ID32 event, UINT32 evdata0, UINT32 evdata1, UINT32 evdata2, UINT32 evdata3, UINT32 evdata4, PVOID userdata);

  void updateSimulationRateLimits(double minSimulationRate, double maxSimulationRate);

  bool isSimInAnyPause();
  bool isSimInActivePause();
  bool isSimInPause();

  bool wasLastBaroInputRightSide() const { return lastBaroInputWasRightSide; }

 private:
  enum ClientData {
    ELAC_DISCRETE_INPUTS,
    ELAC_ANALOG_INPUTS,
    ELAC_DISCRETE_OUTPUTS,
    ELAC_ANALOG_OUTPUTS,
    ELAC_1_BUS_OUTPUT,
    ELAC_2_BUS_OUTPUT,
    SEC_DISCRETE_INPUTS,
    SEC_ANALOG_INPUTS,
    SEC_DISCRETE_OUTPUTS,
    SEC_ANALOG_OUTPUTS,
    SEC_1_BUS_OUTPUT,
    SEC_2_BUS_OUTPUT,
    FAC_DISCRETE_INPUTS,
    FAC_ANALOG_INPUTS,
    FAC_DISCRETE_OUTPUTS,
    FAC_ANALOG_OUTPUTS,
    FAC_1_BUS_OUTPUT,
    FAC_2_BUS_OUTPUT,
    FCU_DISCRETE_OUTPUT,
    FCU_BUS_OUTPUT,
    FMGC_DISCRETE_INPUTS,
    FMGC_FMS_INPUTS,
    FMGC_DISCRETE_OUTPUTS,
    FMGC_1_BUS_A_OUTPUT,
    FMGC_2_BUS_A_OUTPUT,
    FMGC_1_BUS_B_OUTPUT,
    FMGC_2_BUS_B_OUTPUT,
    FADEC_DATA,
    FADEC_INPUTS,
    FADEC_OUTPUTS,
    FADEC_1_BUS,
    FADEC_2_BUS,
    ADR_1_INPUTS,
    ADR_2_INPUTS,
    ADR_3_INPUTS,
    IR_1_INPUTS,
    IR_2_INPUTS,
    IR_3_INPUTS,
    RA_1_BUS,
    RA_2_BUS,
    LGCIU_1_BUS,
    LGCIU_2_BUS,
    SFCC_1_BUS,
    SFCC_2_BUS,
    ILS_1_BUS,
    ILS_2_BUS,
    TCAS_BUS,
  };

  bool isConnected = false;
  HANDLE hSimConnect = 0;

  double sampleTime = 0;

  double minSimulationRate = 0;
  double maxSimulationRate = 0;
  bool limitSimulationRateByPerformance = true;
  bool clientDataEnabled = false;

  int elacDisabled = -1;
  int secDisabled = -1;
  int facDisabled = -1;
  int fmgcDisabled = -1;
  bool fcuDisabled = false;

  long pauseState = 0;

  // change to non-static when aileron events can be processed via SimConnect
  static bool loggingFlightControlsEnabled;
  bool loggingThrottlesEnabled = false;

  SimData simData = {};
  // change to non-static when aileron events can be processed via SimConnect
  static SimInput simInput;
  SimInputRudderTrim simInputRudderTrim = {};
  SimInputAutopilot simInputAutopilot = {};
  base_fcu_afs_panel_inputs fcuAfsPanelInputs = {};
  base_fcu_efis_panel_inputs fcuEfisPanelInputs[2] = {};

  SimInputThrottles simInputThrottles = {};
  std::vector<std::shared_ptr<ThrottleAxisMapping>> throttleAxis;

  std::shared_ptr<SpoilersHandler> spoilersHandler;

  base_elac_discrete_outputs clientDataElacDiscreteOutputs = {};
  base_elac_analog_outputs clientDataElacAnalogOutputs = {};
  base_elac_out_bus clientDataElacBusOutputs = {};

  base_sec_discrete_outputs clientDataSecDiscreteOutputs = {};
  base_sec_analog_outputs clientDataSecAnalogOutputs = {};
  base_sec_out_bus clientDataSecBusOutputs = {};

  base_fac_discrete_outputs clientDataFacDiscreteOutputs = {};
  base_fac_analog_outputs clientDataFacAnalogOutputs = {};
  base_fac_bus clientDataFacBusOutputs = {};

  base_fcu_discrete_outputs clientDataFcuDiscreteOutputs = {};
  base_fcu_bus clientDataFcuBusOutputs = {};

  base_fmgc_discrete_outputs clientDataFmgcDiscreteOutputs = {};
  base_fmgc_a_bus clientDataFmgcABusOutputs = {};
  base_fmgc_b_bus clientDataFmgcBBusOutputs = {};

  athr_output clientDataFadecOutputs = {};

  // change to non-static when aileron events can be processed via SimConnect
  static double flightControlsKeyChangeAileron;
  double flightControlsKeyChangeElevator = 0.0;
  double flightControlsKeyChangeRudder = 0.0;
  bool disableXboxCompatibilityRudderPlusMinus = false;

  // For user using two axis for rudder we need to calculate the combined output base on the two axis
  // Therefore we need to store the last value of each axis to allow calculating these in event handlers.
  bool enableRudder2AxisMode = false;
  double rudderLeftAxis = -1;
  double rudderRightAxis = -1;

  std::unique_ptr<LocalVariable> idSyncFoEfisEnabled;

  bool lastBaroInputWasRightSide = false;

  bool prepareSimDataSimConnectDataDefinitions();

  bool prepareSimInputSimConnectDataDefinitions();

  bool prepareSimOutputSimConnectDataDefinitions();

  bool prepareClientDataDefinitions();

  void simConnectProcessDispatchMessage(SIMCONNECT_RECV* pData, DWORD* cbData);

  /**
   * @brief Process a SimConnect event.
   *
   * These events are triggered by the SimConnect clients usually calling
   * `SimConnect_TransmitClientEvent` and have exactly one data parameter stored
   * in the event->dwData field of the SIMCONNECT_RECV_EVENT struct.
   *
   * @param event The pointer to the corresponding event data
   * @see
   * https://docs.flightsimulator.com/flighting/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_TransmitClientEvent.htm
   */
  void simConnectProcessEvent(const SIMCONNECT_RECV_EVENT* event);

  /**
   * @brief Process a SimConnect EX1 event with up to 5 parameter.
   *
   * These events are triggered by the SimConnect clients usually calling
   * `SimConnect_TransmitClientEvent_EX1` and have up to 5 data parameter stored
   * in the event->dwData0-4 fields of the SIMCONNECT_RECV_EVENT_EX1 struct.
   *
   * As currently the fbw only uses events with one parameter, this function is
   * only used as a wrapper so that `SimConnect_TransmitClientEvent_EX1` can be
   * used by clients. It will essentially call `processEventWithOneParam` and ignore
   * all other parameters.
   *
   * @param event The pointer to the corresponding event data
   * @see
   * https://docs.flightsimulator.com/flighting/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_TransmitClientEvent_EX1.htm
   */
  void simConnectProcessEvent_EX1(const SIMCONNECT_RECV_EVENT_EX1* event);

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

 private:
  /**
   * @brief Process a SimConnect event with one parameter.
   * @param eventId Specifies the ID of the client event.
   * @param data0 Double word containing any additional number required by the event.
   * @param data1 Double word containing any additional number required by the event.
   *                If called by non-EX1 Event Handler, default to 0.
   */
  void processEvent(const DWORD eventId, const DWORD data0, const DWORD data1 = 0);
};
