#pragma once

#include <MSFS/Legacy/gauges.h>
#include <MSFS/MSFS.h>
#include <MSFS/MSFS_Render.h>
#include <SimConnect.h>

#include "../FlyPadBackend.h"

class ATCServices {
 private:
  HANDLE _hSimConnect;

  bool _isInitialized = false;
  bool new_data_available = false;

  ID _selcalLVar = register_named_variable("A32NX_ACP_SELCAL");
  ID _acpResetLVar = register_named_variable("A32NX_ACP_RESET");
  ID _volumeCOM1FromATCServicesLVar = register_named_variable("A32NX_VOLUME_VHF1_FROM_ATC_SERVICES");
  ID _volumeCOM2FromATCServicesLVar = register_named_variable("A32NX_VOLUME_VHF2_FROM_ATC_SERVICES");
  ID _updateVolumeATCServicesFromACPLvar = register_named_variable("A32NX_UPDATE_VOLUME_ATC_SERVICES_FROM_ACP");

  ID _attCallingLVar = register_named_variable("A32NX_ACP_ATT_CALLING");
  ID _mechCallingLVar = register_named_variable("A32NX_ACP_MECH_CALLING");

  INT64 _previousVolumeCOM1 = 0;
  INT64 _previousVolumeCOM2 = 0;
  bool _previousSelcal = false;

  uint8_t _selcalActive = 0;  // Set to 1,2,4,8 depending on the receiver. 0 if inactive.

  ATCServicesData _data = {};

  std::chrono::system_clock::time_point _baseTimeATT = {};
  std::chrono::system_clock::time_point _baseTimeMECH = {};
  std::chrono::system_clock::time_point _previousTimeSELCAL = {};
  std::chrono::system_clock::time_point _previousTimeATT = {};
  std::chrono::system_clock::time_point _previousTimeMECH = {};

  inline bool setATCServicesDataVPILOT(bool loaded, bool selcalActive) const {
    ATCServicesDataVPILOT output{loaded, selcalActive};

    return S_OK == SimConnect_SetClientData(_hSimConnect, ClientData::VPILOT, DataStructureIDs::VPILOTDataID,
                                            SIMCONNECT_CLIENT_DATA_SET_FLAG_DEFAULT, 0, sizeof(output), &output);
  }
  inline bool setATCServicesDataIVAO(bool selcalActive, uint8_t volumeCOM1, uint8_t volumeCOM2) const {
    ATCServicesDataIVAO output{selcalActive, volumeCOM1, volumeCOM2};

    return S_OK == SimConnect_SetClientData(_hSimConnect, ClientData::IVAO, DataStructureIDs::IVAODataID,
                                            SIMCONNECT_CLIENT_DATA_SET_FLAG_DEFAULT, 0, sizeof(output), &output);
  }

 public:
  explicit ATCServices(HANDLE);

  void initialize();
  void updateData(ATCServicesDataIVAO*);
  void updateData(ATCServicesDataVPILOT*);
  void onUpdate(/*INT64, INT64*/);
  void shutdown();

  void notifyATCServicesShutdown();
  void notifyATCServicesStart() const;
};
