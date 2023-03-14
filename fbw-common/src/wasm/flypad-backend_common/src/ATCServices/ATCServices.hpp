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
  bool new_data_available;

  ID _selcalLVar{};
  ID _selcalResetLVar{};
  ID _volumeCOM1ACP1LVar{};
  ID _volumeCOM1ACP2LVar{};
  ID _volumeCOM1ACP3LVar{};
  ID _volumeCOM2ACP1LVar{};
  ID _volumeCOM2ACP2LVar{};
  ID _volumeCOM2ACP3LVar{};
  ID _knobCOM1ACP1LVar{};
  ID _knobCOM1ACP2LVar{};
  ID _knobCOM1ACP3LVar{};
  ID _knobCOM2ACP1LVar{};
  ID _knobCOM2ACP2LVar{};
  ID _knobCOM2ACP3LVar{};
  ID _updateATCServicesFromACPsLVar{};

  INT64 _previousVolumeCOM1 = 0;
  INT64 _previousVolumeCOM2 = 0;
  uint8_t _selcalActive = 0;  // Set to 1,2,4,8 depending on the receiver. 0 if inactive.

  ATCServicesData _data;

  std::chrono::system_clock::time_point _baseTime = std::chrono::system_clock::now();
  std::chrono::system_clock::time_point _previousTime = _baseTime;

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
  void onUpdate(INT64, INT64);
  void shutdown();

  void notifyATCServicesShutdown();
  void notifyATCServicesStart() const;
};
