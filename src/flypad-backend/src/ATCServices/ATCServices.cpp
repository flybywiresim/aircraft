#include "ATCServices.h"

#define SELCAL_LIGHT_TIME_MS 300

ATCServices::ATCServices(HANDLE hSimConnect) : _hSimConnect(hSimConnect) {}

void ATCServices::initialize() {
  _selcal = register_named_variable("A32NX_ACP_SELCAL");
  _selcalReset = register_named_variable("A32NX_ACP_RESET");
  _volumeCOM1ACP1 = register_named_variable("A32NX_ACP1_Volume_VHF1");
  _volumeCOM1ACP2 = register_named_variable("A32NX_ACP2_Volume_VHF1");
  _volumeCOM1ACP3 = register_named_variable("A32NX_ACP3_Volume_VHF1");
  _volumeCOM2ACP1 = register_named_variable("A32NX_ACP1_Volume_VHF2");
  _volumeCOM2ACP2 = register_named_variable("A32NX_ACP2_Volume_VHF2");
  _volumeCOM2ACP3 = register_named_variable("A32NX_ACP3_Volume_VHF2");
  _updateReceiversFromATCServices = register_named_variable("A32NX_COM_UpdateReceiversFromATCServices");

  _isInitialized = true;

  std::cout << "FLYPAD_BACKEND (ATCServices): ATCServices initialized" << std::endl;
}

void ATCServices::shutdown() {
  _isInitialized = false;
  std::cout << "FLYPAD_BACKEND (ATCServices): ATCServices shutdown" << std::endl;
}

void ATCServices::onUpdate(INT64 volumeCOM1, INT64 volumeCOM2, ATCServicesDataIVAO* IVAOData, ATCServicesDataVPILOT* VPILOTData) {
  if (!_isInitialized)
    return;

  bool update = false;

  if (IVAOData) {
    this->_selcalActive = IVAOData->selcal;

    if (IVAOData->volumeCOM1 != this->_previousVolumeCOM1) {
      double volumeCOM1over100 = IVAOData->volumeCOM1 / 100.0;

      setSimVar(_volumeCOM1ACP1, volumeCOM1over100);
      setSimVar(_volumeCOM1ACP2, volumeCOM1over100);
      setSimVar(_volumeCOM1ACP3, volumeCOM1over100);

      this->_previousVolumeCOM1 = IVAOData->volumeCOM1;

      update = true;
    }

    if (IVAOData->volumeCOM2 != this->_previousVolumeCOM2) {
      double volumeCOM2over100 = IVAOData->volumeCOM2 / 100.0;

      setSimVar(_volumeCOM2ACP1, volumeCOM2over100);
      setSimVar(_volumeCOM2ACP2, volumeCOM2over100);
      setSimVar(_volumeCOM2ACP3, volumeCOM2over100);

      this->_previousVolumeCOM2 = IVAOData->volumeCOM2;

      update = true;
    }

    if (update) {
      // Setting the lvar so the XML behavior can rotate the knobs and inc/dec the volume
      setSimVar(_updateReceiversFromATCServices, 1);
    }
  } else if (VPILOTData) {
    this->_selcalActive = VPILOTData->selcal;
  } else {
    if (get_named_variable_value(_selcalReset) == 0) {
      if (this->_selcalActive) {
        // Makes the push button blink every SELCAL_LIGHT_TIME_MS
        // It sets the BLINK_ID (foundable in the XML behaviors) then 0 to make it blink
        auto now = std::chrono::system_clock::now();
        if (std::chrono::duration_cast<std::chrono::milliseconds>(now - this->_previousTime).count() >= SELCAL_LIGHT_TIME_MS) {
          setSimVar(_selcal, get_named_variable_value(_selcal) == this->_selcalActive ? 0 : this->_selcalActive);
          this->_previousTime = now;
        }
      }
    } else {
      // Reset everything related to SELCAL if RESET push button was pressed on one ACP
      setSimVar(_selcalReset, 0);
      setSimVar(_selcal, 0);
      this->_selcalActive = 0;
      update = true;
    }

    // Handling the case the volume was changed via the knobs on the ACPs
    if (volumeCOM1 != this->_previousVolumeCOM1 || volumeCOM2 != this->_previousVolumeCOM2) {
      this->_previousVolumeCOM1 = volumeCOM1;
      this->_previousVolumeCOM2 = volumeCOM2;

      update = true;
    }

    if (update) {
      ATCServicesDataIVAO IVAODataTmp{this->_selcalActive, (uint8_t)this->_previousVolumeCOM1, (uint8_t)this->_previousVolumeCOM2};
      ATCServicesDataVPILOT VPILOTDataTmp{1, this->_selcalActive};

      setATCServicesDataIVAO(IVAODataTmp);
      setATCServicesDataVPILOT(VPILOTDataTmp);
    }
  }
}

/// @brief Notifying the third party the plane is unloaded
void ATCServices::notifyATCServicesShutdown() const {
  // notifying vPilot the aircraft is unloaded
  ATCServicesDataVPILOT dataVPILOT{0, 0};
  setATCServicesDataVPILOT(dataVPILOT);

  ATCServicesDataIVAO dataIVAO{0, 0, 0};
  setATCServicesDataIVAO(dataIVAO);
}

/// @brief Notifying the third party the plane is loaded
void ATCServices::notifyATCServicesStart() const {
  ATCServicesDataIVAO dataIVAO{0, 80, 40};
  setATCServicesDataIVAO(dataIVAO);

  // notifying vPilot the aircraft is loaded
  ATCServicesDataVPILOT dataVPILOT{1, 0};
  setATCServicesDataVPILOT(dataVPILOT);
}
