#include "ATCServices.hpp"

#define SELCAL_LIGHT_TIME_MS 300
#define FLASHING_LIGHTS_TIMEOUT_MS 60000

using Milliseconds = std::chrono::milliseconds;

ATCServices::ATCServices(HANDLE hSimConnect) : _hSimConnect(hSimConnect) {}

void ATCServices::initialize() {
  _selcalLVar = register_named_variable("A32NX_ACP_SELCAL");
  _selcalResetLVar = register_named_variable("A32NX_ACP_RESET");
  _volumeCOM1FromATCServicesLVar = register_named_variable("A32NX_VOLUME_VHF1_FROM_ATC_SERVICES");
  _volumeCOM2FromATCServicesLVar = register_named_variable("A32NX_VOLUME_VHF2_FROM_ATC_SERVICES");

  _isInitialized = true;

  notifyATCServicesStart();

  std::cout << "FLYPAD_BACKEND (ATCServices): ATCServices initialized" << std::endl;
}

void ATCServices::shutdown() {
  _isInitialized = false;
  std::cout << "FLYPAD_BACKEND (ATCServices): ATCServices shutdown" << std::endl;
}

void ATCServices::updateData(ATCServicesDataIVAO* data) {
  std::cout << "NEW DATA IVAO " << std::endl;
  _data.selcal = data->selcal;
  _data.volumeCOM1 = data->volumeCOM1;
  _data.volumeCOM2 = data->volumeCOM2;
  new_data_available = true;
}
void ATCServices::updateData(ATCServicesDataVPILOT* data) {
  std::cout << "NEW DATA vpilot  " << std::endl;
  _data.selcal = data->selcal;
  _data.volumeCOM1 = UINT8_MAX;
  _data.volumeCOM2 = UINT8_MAX;
  new_data_available = true;
}

void ATCServices::onUpdate(/*INT64 volumeCOM1, INT64 volumeCOM2*/) {
  if (!_isInitialized)
    return;

  if (this->new_data_available) {
    // std::cout << "TODO NEW DATA = " << (unsigned)_data.volumeCOM1 << "   " << (unsigned)_data.volumeCOM2 << std::endl;

    if (_data.volumeCOM1 != UINT8_MAX && get_named_variable_value(_volumeCOM1FromATCServicesLVar) >= 0 ||
        _data.volumeCOM2 != UINT8_MAX && get_named_variable_value(_volumeCOM2FromATCServicesLVar) >= 0) {
      // Waiting for lvars to be processed by Rust code
      return;
    }

    // std::cout << "TODO NEW DATA passed" << std::endl;

    this->_baseTime = std::chrono::system_clock::now();

    this->_selcalActive = _data.selcal;

    if (_data.volumeCOM1 != UINT8_MAX) {
      set_named_variable_value(_volumeCOM1FromATCServicesLVar, _data.volumeCOM1);
    } else {
      set_named_variable_value(_volumeCOM1FromATCServicesLVar, -1);
    }

    if (_data.volumeCOM2 != UINT8_MAX) {
      set_named_variable_value(_volumeCOM2FromATCServicesLVar, _data.volumeCOM2);
    } else {
      set_named_variable_value(_volumeCOM2FromATCServicesLVar, -1);
    }

    this->new_data_available = false;
  } else {
    auto now = std::chrono::system_clock::now();

    // Reset everything if RESET is pressed OR if 60 seconds have passed (FCOM compliant)
    if (get_named_variable_value(_selcalResetLVar) == 0 &&
        std::chrono::duration_cast<Milliseconds>(now - this->_baseTime).count() < FLASHING_LIGHTS_TIMEOUT_MS) {
      if (this->_selcalActive) {
        // Makes the push button blink every SELCAL_LIGHT_TIME_MS
        // It sets the BLINK_ID (foundable in the XML behaviors) then 0 to make it blink
        if (std::chrono::duration_cast<Milliseconds>(now - this->_previousTime).count() >= SELCAL_LIGHT_TIME_MS) {
          set_named_variable_value(_selcalLVar, get_named_variable_value(_selcalLVar) == this->_selcalActive ? 0 : this->_selcalActive);
          this->_previousTime = now;
        }
      }
    } else {
      // Reset everything related to SELCAL if RESET push button was pressed on one ACP
      // OR 60s have passed (according to FCOM)
      set_named_variable_value(_selcalResetLVar, 0);
      set_named_variable_value(_selcalLVar, 0);
      this->_selcalActive = 0;
      this->_previousTime = now;

      // No volume, IVAO reads it via A:COM VOLUME:1/2
      setATCServicesDataIVAO(false, 0, 0);
      setATCServicesDataVPILOT(true, false);
    }
  }
}

/// @brief Notifying the third party the plane is unloaded
void ATCServices::notifyATCServicesShutdown() {
  // In MSFS's start/stop sequence, start and stop events are called twice therefore
  // we have to uninit it to make notifyATCServicesStart ineffective
  _isInitialized = false;
  setATCServicesDataVPILOT(false, false);

  // No need to notify IVAO
  // setATCServicesDataIVAO(false, 0, 0);
}

/// @brief Notifying the third party the plane is loaded
void ATCServices::notifyATCServicesStart() const {
  if (_isInitialized) {
    // No need to notify IVAO
    setATCServicesDataIVAO(false, 80, 40);

    // notifying vPilot the aircraft is loaded
    setATCServicesDataVPILOT(true, false);
  }
}
