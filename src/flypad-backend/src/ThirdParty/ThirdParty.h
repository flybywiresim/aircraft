#pragma once

#include <MSFS/Legacy/gauges.h>
#include <MSFS/MSFS.h>
#include <MSFS/MSFS_Render.h>
#include <SimConnect.h>

#include "FlyPadBackend.h"

struct ThirdPartyDataIVAO {
  uint8_t selcal;
  uint8_t volumeCOM1;
  uint8_t volumeCOM2;
};

struct ThirdPartyDataVPILOT {
  uint8_t loaded; // Set to 1 if the aircraft is loaded. 0 once unloaded. If loaded, vPilot does not play the SELCAL sound
  uint8_t selcal;
};

class ThirdParty{
private:
    HANDLE _hSimConnect;
    bool _isInitialized = false;

    ID _selcal{};
    ID _selcalReset{};
    ID _volumeCOM1ACP1{};
    ID _volumeCOM1ACP2{};
    ID _volumeCOM1ACP3{};
    ID _volumeCOM2ACP1{};
    ID _volumeCOM2ACP2{};
    ID _volumeCOM2ACP3{};
    ID _updateReceiversFromThirdParty{};

    INT64 _previousVolumeCOM1 = 0;
    INT64 _previousVolumeCOM2 = 0;
    uint8_t _selcalActive = 0; // Set to 1,2,4,8 depending on the receiver. 0 if inactive.

    std::chrono::system_clock::time_point _previousTime = std::chrono::system_clock::now();

  inline bool setThirdPartyDataVPILOT(ThirdPartyDataVPILOT& output) const {
    return S_OK == SimConnect_SetClientData(_hSimConnect, ClientData::VPILOT, DataStructureIDs::AllVPILOTDataID, SIMCONNECT_CLIENT_DATA_SET_FLAG_DEFAULT, 0, sizeof(output), &output);
  }
  inline bool setThirdPartyDataIVAO(ThirdPartyDataIVAO& output) const {
    return S_OK == SimConnect_SetClientData(_hSimConnect, ClientData::IVAO, DataStructureIDs::AllIVAODataID, SIMCONNECT_CLIENT_DATA_SET_FLAG_DEFAULT, 0, sizeof(output), &output);
  }

  static inline void setSimVar(ID var, FLOAT64 value) {
    set_named_variable_value(var, value);
  }

 public:
    explicit ThirdParty(HANDLE);

    void initialize();
    void onUpdate(INT64, INT64, ThirdPartyDataIVAO*, ThirdPartyDataVPILOT*);
    void shutdown();

    void notifyShutdownThirdParty();
    void notifyStartThirdParty();
};
