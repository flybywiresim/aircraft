#include "ATCServices.hpp"

#define BLINK_LIGHT_TIME_MS 300
#define CALL_TIMEOUT_MS 60000

using Milliseconds = std::chrono::milliseconds;

ATCServices::ATCServices(HANDLE hSimConnect) : _hSimConnect(hSimConnect) {}

void ATCServices::initialize() {
  _isInitialized = true;

  notifyATCServicesStart();

  std::cout << "FLYPAD_BACKEND (ATCServices): ATCServices initialized" << std::endl;
}

void ATCServices::shutdown() {
  _isInitialized = false;
  std::cout << "FLYPAD_BACKEND (ATCServices): ATCServices shutdown" << std::endl;
}

void ATCServices::updateData(ATCServicesDataIVAO* data) {
  if (data->volumeCOM1 != this->_previousVolumeCOM1 || data->volumeCOM2 != this->_previousVolumeCOM2 ||
      data->selcal != this->_previousSelcal) {
    _data.volumeCOM1 = data->volumeCOM1;
    _data.volumeCOM2 = data->volumeCOM2;
    _data.selcal = data->selcal;

    new_data_available = true;
  }
}
void ATCServices::updateData(ATCServicesDataVPILOT* data) {
  if (data->selcal != this->_previousSelcal) {
    _data.selcal = data->selcal;
    _data.volumeCOM1 = UINT8_MAX;
    _data.volumeCOM2 = UINT8_MAX;

    new_data_available = true;
  }
}

void ATCServices::onUpdate(INT64 volumeCOM1, INT64 volumeCOM2) {
  if (!_isInitialized)
    return;

  if (this->new_data_available) {
    if (_data.volumeCOM1 != UINT8_MAX && get_named_variable_value(_volumeCOM1FromATCServicesLVar) >= 0 ||
        _data.volumeCOM2 != UINT8_MAX && get_named_variable_value(_volumeCOM2FromATCServicesLVar) >= 0) {
      // Waiting for lvars to be processed by Rust code
      return;
    }

    if (this->_selcalActive != _data.selcal) {
      this->_selcalActive = _data.selcal;
      this->_previousSelcal = _data.selcal;
      this->_previousTimeSELCAL = std::chrono::system_clock::now();
    }

    if (_data.volumeCOM1 != UINT8_MAX) {
      set_named_variable_value(_volumeCOM1FromATCServicesLVar, _data.volumeCOM1);
      this->_previousVolumeCOM1 = _data.volumeCOM1;
    } else {
      set_named_variable_value(_volumeCOM1FromATCServicesLVar, -1);
    }

    if (_data.volumeCOM2 != UINT8_MAX) {
      set_named_variable_value(_volumeCOM2FromATCServicesLVar, _data.volumeCOM2);
      this->_previousVolumeCOM2 = _data.volumeCOM2;
    } else {
      set_named_variable_value(_volumeCOM2FromATCServicesLVar, -1);
    }

    this->new_data_available = false;
  } else {
    auto now = std::chrono::system_clock::now();

    if (get_named_variable_value(_acpResetLVar) == 0) {
      if (this->_selcalActive) {
        // Makes CALL button (with id _selcalActive) blink
        // It sets the BLINK_ID (foundable in the XML behaviors) then 0 to make it blink
        if (std::chrono::duration_cast<Milliseconds>(now - this->_previousTimeSELCAL).count() >= BLINK_LIGHT_TIME_MS) {
          set_named_variable_value(_selcalLVar, get_named_variable_value(_selcalLVar) == this->_selcalActive ? 0 : this->_selcalActive);
          this->_previousTimeSELCAL = now;
        }
      }

      // Makes ATT and MECH CALL blink
      // Reset whenever 60 has passed, FCOM compliant

      /*
       * For now there is no use case for this but maybe in the future
       */

      if (this->_previousTimeATT == std::chrono::system_clock::from_time_t(0) && get_named_variable_value(_attCallingLVar) == 1) {
        this->_baseTimeATT = std::chrono::system_clock::now();
      }
      if (this->_previousTimeMECH == std::chrono::system_clock::from_time_t(0) && get_named_variable_value(_mechCallingLVar) == 1) {
        this->_baseTimeMECH = std::chrono::system_clock::now();
      }

      if (this->_baseTimeATT > std::chrono::system_clock::from_time_t(0)) {
        if (std::chrono::duration_cast<Milliseconds>(now - this->_previousTimeATT).count() >= BLINK_LIGHT_TIME_MS) {
          set_named_variable_value(_attCallingLVar, !get_named_variable_value(_attCallingLVar));
          this->_previousTimeATT = now;
        } else if (std::chrono::duration_cast<Milliseconds>(now - this->_baseTimeATT).count() >= CALL_TIMEOUT_MS) {
          this->_previousTimeATT = this->_baseTimeATT = {};
          set_named_variable_value(_attCallingLVar, 0);
        }
      }

      if (this->_baseTimeMECH > std::chrono::system_clock::from_time_t(0)) {
        if (std::chrono::duration_cast<Milliseconds>(now - this->_previousTimeMECH).count() >= BLINK_LIGHT_TIME_MS) {
          set_named_variable_value(_mechCallingLVar, !get_named_variable_value(_mechCallingLVar));
          this->_previousTimeMECH = now;
        } else if (std::chrono::duration_cast<Milliseconds>(now - this->_baseTimeMECH).count() >= CALL_TIMEOUT_MS) {
          this->_previousTimeMECH = this->_baseTimeMECH = {};
          set_named_variable_value(_mechCallingLVar, 0);
        }
      }
    } else {
      // Reset everything related to blinking if RESET push button was pressed on one ACP
      set_named_variable_value(_acpResetLVar, 0);
      set_named_variable_value(_attCallingLVar, 0);
      set_named_variable_value(_mechCallingLVar, 0);
      set_named_variable_value(_selcalLVar, 0);

      this->_selcalActive = 0;

      this->_baseTimeATT = {};
      this->_baseTimeMECH = {};

      setATCServicesDataIVAO(false, volumeCOM1, volumeCOM2);
      setATCServicesDataVPILOT(true, false);
    }

    // Update third party volume with volume from ACPs
    if (get_named_variable_value(_updateVolumeATCServicesFromACPLvar) == 1 &&
        (volumeCOM1 != this->_previousVolumeCOM1 || volumeCOM2 != this->_previousVolumeCOM2)) {
      set_named_variable_value(_updateVolumeATCServicesFromACPLvar, 0);
      this->_previousVolumeCOM1 = volumeCOM1;
      this->_previousVolumeCOM2 = volumeCOM2;

      setATCServicesDataIVAO(this->_selcalActive, volumeCOM1, volumeCOM2);
    }
  }
}

/* notifyATCServicesShutdown()
 *
 * Notifying the third party the plane is unloaded
 */
void ATCServices::notifyATCServicesShutdown() {
  // MSFS's start/stop sequence, fires start and stop events twice therefore
  // we have to uninit it to make notifyATCServicesStart ineffective
  _isInitialized = false;
  setATCServicesDataVPILOT(false, false);

  // No need to notify IVAO as it detects unloading itself
  // setATCServicesDataIVAO(false, 0, 0);
}

/* notifyATCServicesStart()
 *
 * Notifying the third party the plane is loaded
 */
void ATCServices::notifyATCServicesStart() const {
  if (_isInitialized) {
    // notifying vPilot the aircraft is loaded
    setATCServicesDataVPILOT(true, false);

    // No need to notify IVAO as it detects loading itself
    // setATCServicesDataIVAO(false, 80, 40);
  }
}
