#include <iostream>
#include <chrono>

#include "ThirdParty.h"

#define SELCAL_LIGHT_TIME_MS 300

ThirdParty::ThirdParty(HANDLE hSimConnect): _hSimConnect(hSimConnect) {}

void ThirdParty::initialize() {
    ThirdPartyDataIVAO dataVIAO {0, 80, 40};
    setThirdPartyDataIVAO(dataVIAO); // notifying Altitude the aircraft is loaded with default values

    ThirdPartyDataVPILOT dataVPILOT {1, 0};
    setThirdPartyDataVPILOT(dataVPILOT); // notifying vPilot the aircraft is loaded

    _selcal = register_named_variable("A32NX_ACP_SELCAL");
    _selcalReset = register_named_variable("A32NX_ACP_RESET");
    _volumeCOM1ACP1 = register_named_variable("A32NX_ACP1_Volume_VHF1");
    _volumeCOM1ACP2 = register_named_variable("A32NX_ACP2_Volume_VHF1");
    _volumeCOM1ACP3 = register_named_variable("A32NX_ACP3_Volume_VHF1");
    _volumeCOM2ACP1 = register_named_variable("A32NX_ACP1_Volume_VHF2");
    _volumeCOM2ACP2 = register_named_variable("A32NX_ACP2_Volume_VHF2");
    _volumeCOM2ACP3 = register_named_variable("A32NX_ACP3_Volume_VHF2");
    _updateReceiversFromThirdParty = register_named_variable("A32NX_COM_UpdateReceiversFromThirdParty");
}

void ThirdParty::shutdown() {
    ThirdPartyDataVPILOT dataVPILOT {0, 0};
    std::cout << unsigned(setThirdPartyDataVPILOT(dataVPILOT)) << std::endl; // notifying vPilot the aircraft is unloaded

    ThirdPartyDataIVAO dataIVAO {0, 0, 0};
    std::cout << unsigned(setThirdPartyDataIVAO(dataIVAO)) << std::endl; // notifying vPilot the aircraft is unloaded
}

void ThirdParty::onUpdate(double volumeCOM1, double volumeCOM2, ThirdPartyDataIVAO* IVAOData, ThirdPartyDataVPILOT* VPILOTData) {
    if(IVAOData) {
        bool update = false;

        this->_selcalActive = IVAOData->selcal;

        if(IVAOData->volumeCOM1 != this->_previousVolumeCOM1) {
            double volumeCOM1over100 = IVAOData->volumeCOM1 / 100.0;

            setSimVar(_volumeCOM1ACP1, volumeCOM1over100);
            setSimVar(_volumeCOM1ACP2, volumeCOM1over100);
            setSimVar(_volumeCOM1ACP3, volumeCOM1over100);

            this->_previousVolumeCOM1 = IVAOData->volumeCOM1;

            update = true;
        }

        if(IVAOData->volumeCOM2 != this->_previousVolumeCOM2) {
            double volumeCOM2over100 = IVAOData->volumeCOM2 / 100.0;

            setSimVar(_volumeCOM2ACP1, volumeCOM2over100);
            setSimVar(_volumeCOM2ACP2, volumeCOM2over100);
            setSimVar(_volumeCOM2ACP3, volumeCOM2over100);

            this->_previousVolumeCOM2 = IVAOData->volumeCOM2;

            update = true;
        }

        if(update) {
            setSimVar(_updateReceiversFromThirdParty, 1);
        }
    } else if(VPILOTData) {
        this->_selcalActive = VPILOTData->selcal;
    } else {
        FLOAT64 localSelcalReset = get_named_variable_value(_selcalReset);
        FLOAT64 localSelcal = get_named_variable_value(_selcal);

        if(localSelcalReset == 0) {
            if(this->_selcalActive) {
                // Make the SELCAL push button blink every SELCAL_LIGHT_TIME_MS
                // It sets the BLINK_ID (foundable in the XML behaviors) then 0 to make it blink
                if(std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now() - this->_previousTime).count() >= SELCAL_LIGHT_TIME_MS) {
                    setSimVar(_selcal, localSelcal == this->_selcalActive ? 0 : this->_selcalActive);
                    this->_previousTime = std::chrono::system_clock::now();
                }
            }
        } else {
            setSimVar(_selcalReset, 0);
            setSimVar(_selcal, 0);
            this->_selcalActive = 0;
        }

        ThirdPartyDataIVAO dataIVAO {this->_selcalActive, this->_previousVolumeCOM1, this->_previousVolumeCOM2};
        ThirdPartyDataVPILOT dataVPILOT {1, this->_selcalActive};

        if(volumeCOM1 != this->_previousVolumeCOM1 || volumeCOM2 != this->_previousVolumeCOM2) {
            dataIVAO.volumeCOM1 = volumeCOM1;
            dataIVAO.volumeCOM2 = volumeCOM2;

            this->_previousVolumeCOM1 = volumeCOM1;
            this->_previousVolumeCOM2 = volumeCOM2;
        }

        setThirdPartyDataIVAO(dataIVAO);
        setThirdPartyDataVPILOT(dataVPILOT);
    }
}
