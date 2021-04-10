var A320_Neo_LowerECAM_Elec;
(function (A320_Neo_LowerECAM_Elec) {
    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
        }
        get templateID() {
            return "LowerECAMElecTemplate";
        }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            this.e_BAT2_BOX = this.querySelector("#BAT2_BOX");
            this.e_BAT2_OFF = this.querySelector("#BAT2_OFF");
            this.e_BAT2_TITLE = this.querySelector("#BAT2_TITLE");
            this.e_BAT2_TITLE_NUMBER = this.querySelector("#BAT2_TITLE_NUMBER");
            this.e_BAT2_VOLTS_VALUE = this.querySelector("#BAT2_VOLTS_VALUE");
            this.e_BAT2_VOLTS_UNIT = this.querySelector("#BAT2_VOLTS_UNIT");
            this.e_BAT2_AMPS_VALUE = this.querySelector("#BAT2_AMPS_VALUE");
            this.e_BAT2_AMPS_UNIT = this.querySelector("#BAT2_AMPS_UNIT");

            this.e_DCBATBUS_BOX = this.querySelector("#DCBATBUS_BOX");
            this.e_DCBATBUS_TITLE = this.querySelector("#DCBATBUS_TITLE");

            this.e_BAT1_BOX = this.querySelector("#BAT1_BOX");
            this.e_BAT1_OFF = this.querySelector("#BAT1_OFF");
            this.e_BAT1_TITLE = this.querySelector("#BAT1_TITLE");
            this.e_BAT1_TITLE_NUMBER = this.querySelector("#BAT1_TITLE_NUMBER");
            this.e_BAT1_VOLTS_VALUE = this.querySelector("#BAT1_VOLTS_VALUE");
            this.e_BAT1_VOLTS_UNIT = this.querySelector("#BAT1_VOLTS_UNIT");
            this.e_BAT1_AMPS_VALUE = this.querySelector("#BAT1_AMPS_VALUE");
            this.e_BAT1_AMPS_UNIT = this.querySelector("#BAT1_AMPS_UNIT");

            this.e_DCBUS2_BOX = this.querySelector("#DCBUS2_BOX");
            this.e_DCBUS2_TITLE = this.querySelector("#DCBUS2_TITLE");
            this.e_DCBUS2_TITLE_NUMBER = this.querySelector("#DCBUS2_TITLE_NUMBER");

            this.e_DCESSBUS_BOX = this.querySelector("#DCESSBUS_BOX");
            this.e_DCESSBUS_TITLE = this.querySelector("#DCESSBUS_TITLE");
            this.e_DCESSBUS_SHED = this.querySelector("#DCESSBUS_SHED");

            this.e_DCBUS1_BOX = this.querySelector("#DCBUS1_BOX");
            this.e_DCBUS1_TITLE = this.querySelector("#DCBUS1_TITLE");
            this.e_DCBUS1_TITLE_NUMBER = this.querySelector("#DCBUS1_TITLE_NUMBER");

            this.e_TR2_BOX = this.querySelector("#TR2_BOX");
            this.e_TR2_TITLE = this.querySelector("#TR2_TITLE");
            this.e_TR2_TITLE_NUMBER = this.querySelector("#TR2_TITLE_NUMBER");
            this.e_TR2_VOLTS_VALUE = this.querySelector("#TR2_VOLTS_VALUE");
            this.e_TR2_VOLTS_UNIT = this.querySelector("#TR2_VOLTS_UNIT");
            this.e_TR2_AMPS_VALUE = this.querySelector("#TR2_AMPS_VALUE");
            this.e_TR2_AMPS_UNIT = this.querySelector("#TR2_AMPS_UNIT");

            this.e_EMERGEN_BOX = this.querySelector("#EMERGEN_BOX");
            this.e_EMERGEN_TITLE = this.querySelector("#EMERGEN_TITLE");
            this.e_EMERGEN_OFFLINE = this.querySelector("#EMERGEN_OFFLINE");
            this.e_EMERGEN_VOLTS_VALUE = this.querySelector("#EMERGEN_VOLTS_VALUE");
            this.e_EMERGEN_VOLTS_UNIT = this.querySelector("#EMERGEN_VOLTS_UNIT");
            this.e_EMERGEN_FREQ_VALUE = this.querySelector("#EMERGEN_FREQ_VALUE");
            this.e_EMERGEN_FREQ_UNIT = this.querySelector("#EMERGEN_FREQ_UNIT");

            this.e_ESSTR_BOX = this.querySelector("#ESSTR_BOX");
            this.e_ESSTR_TITLE = this.querySelector("#ESSTR_TITLE");
            this.e_ESSTR_VOLTS_VALUE = this.querySelector("#ESSTR_VOLTS_VALUE");
            this.e_ESSTR_VOLTS_UNIT = this.querySelector("#ESSTR_VOLTS_UNIT");
            this.e_ESSTR_AMPS_VALUE = this.querySelector("#ESSTR_AMPS_VALUE");
            this.e_ESSTR_AMPS_UNIT = this.querySelector("#ESSTR_AMPS_UNIT");

            this.e_TR1_BOX = this.querySelector("#TR1_BOX");
            this.e_TR1_TITLE = this.querySelector("#TR1_TITLE");
            this.e_TR1_TITLE_NUMBER = this.querySelector("#TR1_TITLE_NUMBER");
            this.e_TR1_VOLTS_VALUE = this.querySelector("#TR1_VOLTS_VALUE");
            this.e_TR1_VOLTS_UNIT = this.querySelector("#TR1_VOLTS_UNIT");
            this.e_TR1_AMPS_VALUE = this.querySelector("#TR1_AMPS_VALUE");
            this.e_TR1_AMPS_UNIT = this.querySelector("#TR1_AMPS_UNIT");

            this.e_ACBUS2_BOX = this.querySelector("#ACBUS2_BOX");
            this.e_ACBUS2_TITLE = this.querySelector("#ACBUS2_TITLE");
            this.e_ACBUS2_TITLE_NUMBER = this.querySelector("#ACBUS2_TITLE_NUMBER");

            this.e_ACESSBUS_BOX = this.querySelector("#ACESSBUS_BOX");
            this.e_ACESSBUS_TITLE = this.querySelector("#ACESSBUS_TITLE");
            this.e_ACESSBUS_SHED = this.querySelector("#ACESSBUS_SHED");

            this.e_ACBUS1_BOX = this.querySelector("#ACBUS1_BOX");
            this.e_ACBUS1_TITLE = this.querySelector("#ACBUS1_TITLE");
            this.e_ACBUS1_TITLE_NUMBER = this.querySelector("#ACBUS1_TITLE_NUMBER");

            this.e_GEN2_BOX = this.querySelector("#GEN2_BOX");
            this.e_GEN2_TITLE = this.querySelector("#GEN2_TITLE");
            this.e_GEN2_TITLE_NUMBER = this.querySelector("#GEN2_TITLE_NUMBER");
            this.e_GEN2_OFF = this.querySelector("#GEN2_OFF");
            this.e_GEN2_LOAD_VALUE = this.querySelector("#GEN2_LOAD_VALUE");
            this.e_GEN2_LOAD_UNIT = this.querySelector("#GEN2_LOAD_UNIT");
            this.e_GEN2_VOLTS_VALUE = this.querySelector("#GEN2_VOLTS_VALUE");
            this.e_GEN2_VOLTS_UNIT = this.querySelector("#GEN2_VOLTS_UNIT");
            this.e_GEN2_FREQ_VALUE = this.querySelector("#GEN2_FREQ_VALUE");
            this.e_GEN2_FREQ_UNIT = this.querySelector("#GEN2_FREQ_UNIT");

            this.e_EXTPWR_BOX = this.querySelector("#EXTPWR_BOX");
            this.e_EXTPWR_TITLE = this.querySelector("#EXTPWR_TITLE");
            this.e_EXTPWR_VOLTS_VALUE = this.querySelector("#EXTPWR_VOLTS_VALUE");
            this.e_EXTPWR_VOLTS_UNIT = this.querySelector("#EXTPWR_VOLTS_UNIT");
            this.e_EXTPWR_FREQ_VALUE = this.querySelector("#EXTPWR_FREQ_VALUE");
            this.e_EXTPWR_FREQ_UNIT = this.querySelector("#EXTPWR_FREQ_UNIT");

            this.e_APUGEN_BOX = this.querySelector("#APUGEN_BOX");
            this.e_APUGEN_TITLE = this.querySelector("#APUGEN_TITLE");
            this.e_APUGEN_OFF = this.querySelector("#APUGEN_OFF");
            this.e_APUGEN_LOAD_VALUE = this.querySelector("#APUGEN_LOAD_VALUE");
            this.e_APUGEN_LOAD_UNIT = this.querySelector("#APUGEN_LOAD_UNIT");
            this.e_APUGEN_VOLTS_VALUE = this.querySelector("#APUGEN_VOLTS_VALUE");
            this.e_APUGEN_VOLTS_UNIT = this.querySelector("#APUGEN_VOLTS_UNIT");
            this.e_APUGEN_FREQ_VALUE = this.querySelector("#APUGEN_FREQ_VALUE");
            this.e_APUGEN_FREQ_UNIT = this.querySelector("#APUGEN_FREQ_UNIT");

            this.e_GEN1_BOX = this.querySelector("#GEN1_BOX");
            this.e_GEN1_TITLE = this.querySelector("#GEN1_TITLE");
            this.e_GEN1_TITLE_NUMBER = this.querySelector("#GEN1_TITLE_NUMBER");
            this.e_GEN1_OFF = this.querySelector("#GEN1_OFF");
            this.e_GEN1_LOAD_VALUE = this.querySelector("#GEN1_LOAD_VALUE");
            this.e_GEN1_LOAD_UNIT = this.querySelector("#GEN1_LOAD_UNIT");
            this.e_GEN1_VOLTS_VALUE = this.querySelector("#GEN1_VOLTS_VALUE");
            this.e_GEN1_VOLTS_UNIT = this.querySelector("#GEN1_VOLTS_UNIT");
            this.e_GEN1_FREQ_VALUE = this.querySelector("#GEN1_FREQ_VALUE");
            this.e_GEN1_FREQ_UNIT = this.querySelector("#GEN1_FREQ_UNIT");

            this.e_IDG2_TITLE = this.querySelector("#IDG2_TITLE");
            this.e_IDG2_TITLE_NUMBER = this.querySelector("#IDG2_TITLE_NUMBER");
            this.e_IDG2_TEMP_VALUE = this.querySelector("#IDG2_TEMP_VALUE");
            this.e_IDG2_TEMP_UNIT = this.querySelector("#IDG2_TEMP_UNIT");
            this.e_IDG2_DISC = this.querySelector("#IDG2_DISC");

            this.e_IDG1_TITLE = this.querySelector("#IDG1_TITLE");
            this.e_IDG1_TITLE_NUMBER = this.querySelector("#IDG1_TITLE_NUMBER");
            this.e_IDG1_TEMP_VALUE = this.querySelector("#IDG1_TEMP_VALUE");
            this.e_IDG1_TEMP_UNIT = this.querySelector("#IDG1_TEMP_UNIT");
            this.e_IDG1_DISC = this.querySelector("#IDG1_DISC");

            this.e_GALLEY_SHED_TOP = this.querySelector("#GALLEY_SHED_TOP");
            this.e_GALLEY_SHED_BOTTOM = this.querySelector("#GALLEY_SHED_BOTTOM");

            this.e_TITLE_HEADING = this.querySelector("#TITLE_HEADING");
            this.e_TITLE_UNDERLINE = this.querySelector("#TITLE_UNDERLINE");

            this.e_STATINV_BAT_TITLE = this.querySelector("#STATINV_BAT_TITLE");

            this.e_STATINV_BOX = this.querySelector("#STATINV_BOX");
            this.e_STATINV_TITLE = this.querySelector("#STATINV_TITLE");
            this.e_STATINV_VOLTS_VALUE = this.querySelector("#STATINV_VOLTS_VALUE");
            this.e_STATINV_VOLTS_UNIT = this.querySelector("#STATINV_VOLTS_UNIT");
            this.e_STATINV_FREQ_VALUE = this.querySelector("#STATINV_FREQ_VALUE");
            this.e_STATINV_FREQ_UNIT = this.querySelector("#STATINV_FREQ_UNIT");

            this.e_WIRE_EXT_PWR_AC_BUS_1 = this.querySelector("#WIRE_EXT_PWR_AC_BUS_1");
            this.e_WIRE_EXT_PWR_AC_BUS_2 = this.querySelector("#WIRE_EXT_PWR_AC_BUS_2");
            this.e_WIRE_EXT_PWR_AC_BUS_1_2 = this.querySelector("#WIRE_EXT_PWR_AC_BUS_1_2");

            this.e_WIRE_APU_GEN_AC_BUS_1 = this.querySelector("#WIRE_APU_GEN_AC_BUS_1");
            this.e_WIRE_APU_GEN_AC_BUS_2 = this.querySelector("#WIRE_APU_GEN_AC_BUS_2");
            this.e_WIRE_APU_GEN_AC_BUS_1_2 = this.querySelector("#WIRE_APU_GEN_AC_BUS_1_2");

            this.e_WIRE_GEN1_AC_BUS_1 = this.querySelector("#WIRE_GEN1_AC_BUS_1");
            this.e_WIRE_GEN1_AC_BUS_1_2 = this.querySelector("#WIRE_GEN1_AC_BUS_1_2");

            this.e_WIRE_GEN2_AC_BUS_2 = this.querySelector("#WIRE_GEN2_AC_BUS_2");
            this.e_WIRE_GEN2_AC_BUS_1_2 = this.querySelector("#WIRE_GEN2_AC_BUS_1_2");

            this.e_WIRE_AC1_ACESS = this.querySelector("#WIRE_AC1_ACESS");
            this.e_WIRE_AC2_ACESS = this.querySelector("#WIRE_AC2_ACESS");

            this.e_WIRE_DC1_DCBAT = this.querySelector("#WIRE_DC1_DCBAT");
            this.e_WIRE_DC1_DCBAT_DCESS = this.querySelector("#WIRE_DC1_DCBAT_DCESS");

            this.e_WIRE_DCBAT_DCESS = this.querySelector("#WIRE_DCBAT_DCESS");

            this.e_WIRE_DC2_DCBAT = this.querySelector("#WIRE_DC2_DCBAT");

            this.e_WIRE_AC1_TR1 = this.querySelector("#WIRE_AC1_TR1");
            this.e_WIRE_TR1_DC1 = this.querySelector("#WIRE_TR1_DC1");
            this.e_WIRE_ACESS_ESSTR = this.querySelector("#WIRE_ACESS_ESSTR");

            this.e_WIRE_BAT1_DCBAT_FULL = this.querySelector("#WIRE_BAT1_DCBAT_FULL");
            this.e_WIRE_DCBAT_BAT1 = this.querySelector("#WIRE_DCBAT_BAT1");
            this.e_ARROW_DCBAT_BAT1 = this.querySelector("#ARROW_DCBAT_BAT1");
            this.e_WIRE_BAT1_DCBAT = this.querySelector("#WIRE_BAT1_DCBAT");
            this.e_ARROW_BAT1_DCBAT = this.querySelector("#ARROW_BAT1_DCBAT");

            this.e_WIRE_BAT2_DCBAT_FULL = this.querySelector("#WIRE_BAT2_DCBAT_FULL");
            this.e_WIRE_DCBAT_BAT2 = this.querySelector("#WIRE_DCBAT_BAT2");
            this.e_ARROW_DCBAT_BAT2 = this.querySelector("#ARROW_DCBAT_BAT2");
            this.e_WIRE_BAT2_DCBAT = this.querySelector("#WIRE_BAT2_DCBAT");
            this.e_ARROW_BAT2_DCBAT = this.querySelector("#ARROW_BAT2_DCBAT");

            this.e_WIRE_AC2_TR2 = this.querySelector("#WIRE_AC2_TR2");
            this.e_WIRE_TR2_DC2 = this.querySelector("#WIRE_TR2_DC2");
            this.e_WIRE_EMERGEN_ESSTR = this.querySelector("#WIRE_EMERGEN_ESSTR");
            this.e_WIRE_EMERGEN_ACESS = this.querySelector("#WIRE_EMERGEN_ACESS");
            this.e_WIRE_ESSTR_DCESS = this.querySelector("#WIRE_ESSTR_DCESS");

            this.e_ARROW_ESSTR_DCESS = this.querySelector("#ARROW_ESSTR_DCESS");
            this.e_ARROW_XFEED_AC1 = this.querySelector("#ARROW_XFEED_AC1");
            this.e_ARROW_XFEED_AC2 = this.querySelector("#ARROW_XFEED_AC2");
            this.e_ARROW_EXTPWR_XFEED = this.querySelector("#ARROW_EXTPWR_XFEED");
            this.e_ARROW_APUGEN_XFEED = this.querySelector("#ARROW_APUGEN_XFEED");
            this.e_ARROW_EMERGEN_ESSTR = this.querySelector("#ARROW_EMERGEN_ESSTR");
            this.e_ARROW_EMERGEN_ACESS = this.querySelector("#ARROW_EMERGEN_ACESS");
            this.e_ARROW_BAT1_STATINV = this.querySelector("#ARROW_BAT1_STATINV");

            this.updateThrottler = new UpdateThrottler(500);

            this.isInitialised = true;

            this.draw();
            this.show(this.querySelector("#main-elec"));
        }

        update(deltaTime) {
            if (!this.isInitialised || this.updateThrottler.canUpdate(deltaTime) === -1) {
                return;
            }

            this.draw();
        }

        draw() {
            this.drawApuGenerator();
            this.drawEngineGenerators();
            this.drawExternalPower();
            this.drawAcPowerSourcesToAcReceivers();
            this.drawPowerSourcesToDcReceivers();
            this.drawBuses();
            this.drawTransformerRectifiers();
            this.drawBatteries();
            this.drawEmergencyGenerator();
            this.drawStaticInverter();
            this.drawIntegratedDriveGenerators();
            this.drawGalleyShed();
        }

        drawApuGenerator() {
            const apuMasterSwPbOn = !!SimVar.GetSimVarValue("L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON", "Bool");
            const apuGenSwitchOn = !!SimVar.GetSimVarValue('APU GENERATOR SWITCH:1', 'Bool');
            this.toggle(this.e_APUGEN_OFF, apuMasterSwPbOn && !apuGenSwitchOn);
            this.toggle(this.e_APUGEN_BOX, apuMasterSwPbOn);

            this.setValue(this.e_APUGEN_LOAD_VALUE, 50);
            this.toggle(this.e_APUGEN_LOAD_VALUE, apuMasterSwPbOn && apuGenSwitchOn);
            this.toggle(this.e_APUGEN_LOAD_UNIT, apuMasterSwPbOn && apuGenSwitchOn);
            this.toggle(this.e_APUGEN_VOLTS_VALUE, apuMasterSwPbOn && apuGenSwitchOn);
            this.toggle(this.e_APUGEN_VOLTS_UNIT, apuMasterSwPbOn && apuGenSwitchOn);
            this.toggle(this.e_APUGEN_FREQ_VALUE, apuMasterSwPbOn && apuGenSwitchOn);
            this.toggle(this.e_APUGEN_FREQ_UNIT, apuMasterSwPbOn && apuGenSwitchOn);

            let allParametersWithinAcceptableRange = false;
            if (apuMasterSwPbOn && apuGenSwitchOn) {
                this.setValue(this.e_APUGEN_LOAD_VALUE, Math.round(SimVar.GetSimVarValue("L:A32NX_ELEC_APU_GEN_1_LOAD", "Percent")));
                const loadWithinNormalRange = !!SimVar.GetSimVarValue("L:A32NX_ELEC_APU_GEN_1_LOAD_NORMAL", "Bool");
                this.greenWhen(this.e_APUGEN_LOAD_VALUE, loadWithinNormalRange);

                this.setValue(this.e_APUGEN_VOLTS_VALUE, Math.round(SimVar.GetSimVarValue("L:A32NX_ELEC_APU_GEN_1_POTENTIAL", "Volts")));
                const potentialWithinNormalRange = SimVar.GetSimVarValue("L:A32NX_ELEC_APU_GEN_1_POTENTIAL_NORMAL", "Bool");
                this.greenWhen(this.e_APUGEN_VOLTS_VALUE, potentialWithinNormalRange);

                this.setValue(this.e_APUGEN_FREQ_VALUE, Math.round(SimVar.GetSimVarValue("L:A32NX_ELEC_APU_GEN_1_FREQUENCY", "Hertz")));
                const frequencyWithinNormalRange = SimVar.GetSimVarValue("L:A32NX_ELEC_APU_GEN_1_FREQUENCY_NORMAL", "Bool");
                this.greenWhen(this.e_APUGEN_FREQ_VALUE, frequencyWithinNormalRange);

                allParametersWithinAcceptableRange = loadWithinNormalRange && potentialWithinNormalRange && frequencyWithinNormalRange;
            }

            this.toggle(this.e_APUGEN_TITLE, true);
            this.whiteWhen(this.e_APUGEN_TITLE, (!apuMasterSwPbOn || (apuGenSwitchOn && allParametersWithinAcceptableRange)));
        }

        drawEngineGenerators() {
            this.drawEngineGenerator(1, {
                off: this.e_GEN1_OFF,
                box: this.e_GEN1_BOX,
                title: this.e_GEN1_TITLE,
                titleNumber: this.e_GEN1_TITLE_NUMBER,
                loadValue: this.e_GEN1_LOAD_VALUE,
                loadUnit: this.e_GEN1_LOAD_UNIT,
                voltsValue: this.e_GEN1_VOLTS_VALUE,
                voltsUnit: this.e_GEN1_VOLTS_UNIT,
                frequencyValue: this.e_GEN1_FREQ_VALUE,
                frequencyUnit: this.e_GEN1_FREQ_UNIT
            });

            this.drawEngineGenerator(2, {
                off: this.e_GEN2_OFF,
                box: this.e_GEN2_BOX,
                title: this.e_GEN2_TITLE,
                titleNumber: this.e_GEN2_TITLE_NUMBER,
                loadValue: this.e_GEN2_LOAD_VALUE,
                loadUnit: this.e_GEN2_LOAD_UNIT,
                voltsValue: this.e_GEN2_VOLTS_VALUE,
                voltsUnit: this.e_GEN2_VOLTS_UNIT,
                frequencyValue: this.e_GEN2_FREQ_VALUE,
                frequencyUnit: this.e_GEN2_FREQ_UNIT
            });
        }

        drawEngineGenerator(number, elements) {
            const engineGeneratorPbOn = !!SimVar.GetSimVarValue("GENERAL ENG MASTER ALTERNATOR:" + number, "Bool");

            this.toggle(elements.off, !engineGeneratorPbOn);
            this.toggle(elements.box, true);

            this.toggle(elements.loadValue, engineGeneratorPbOn);
            this.setValue(elements.loadValue, Math.round(SimVar.GetSimVarValue("L:A32NX_ELEC_ENG_GEN_" + number + "_LOAD", "Percent")));
            const loadWithinNormalRange = !!SimVar.GetSimVarValue("L:A32NX_ELEC_ENG_GEN_" + number + "_LOAD_NORMAL", "Bool");
            this.greenWhen(elements.loadValue, loadWithinNormalRange);
            this.toggle(elements.loadUnit, engineGeneratorPbOn);

            this.toggle(elements.voltsValue, engineGeneratorPbOn);
            this.setValue(elements.voltsValue, Math.round(SimVar.GetSimVarValue("L:A32NX_ELEC_ENG_GEN_" + number + "_POTENTIAL", "Volts")));
            const potentialWithinNormalRange = !!SimVar.GetSimVarValue("L:A32NX_ELEC_ENG_GEN_" + number + "_POTENTIAL_NORMAL", "Bool");
            this.greenWhen(elements.voltsValue, potentialWithinNormalRange);
            this.toggle(elements.voltsUnit, engineGeneratorPbOn);

            this.toggle(elements.frequencyValue, engineGeneratorPbOn);
            this.setValue(elements.frequencyValue, Math.round(SimVar.GetSimVarValue("L:A32NX_ELEC_ENG_GEN_" + number + "_FREQUENCY", "Hertz")));
            const frequencyWithinNormalRange = !!SimVar.GetSimVarValue("L:A32NX_ELEC_ENG_GEN_" + number + "_FREQUENCY_NORMAL", "Bool");
            this.greenWhen(elements.frequencyValue, frequencyWithinNormalRange);
            this.toggle(elements.frequencyUnit, engineGeneratorPbOn);

            const allParametersWithinAcceptableRange = loadWithinNormalRange && potentialWithinNormalRange && frequencyWithinNormalRange;
            this.whiteWhen(elements.title, engineGeneratorPbOn && allParametersWithinAcceptableRange);
            this.whiteWhen(elements.titleNumber, engineGeneratorPbOn && allParametersWithinAcceptableRange);
        }

        drawExternalPower() {
            const externalPowerAvailable = !!SimVar.GetSimVarValue("EXTERNAL POWER AVAILABLE:1", "Bool");

            this.toggle(this.e_EXTPWR_BOX, externalPowerAvailable);
            this.toggle(this.e_EXTPWR_TITLE, externalPowerAvailable);

            this.toggle(this.e_EXTPWR_VOLTS_VALUE, externalPowerAvailable);
            this.setValue(this.e_EXTPWR_VOLTS_VALUE, Math.round(SimVar.GetSimVarValue("L:A32NX_ELEC_EXT_PWR_POTENTIAL", "Volts")));
            const potentialWithinNormalRange = !!SimVar.GetSimVarValue("L:A32NX_ELEC_EXT_PWR_POTENTIAL_NORMAL", "Bool");
            this.greenWhen(this.e_EXTPWR_VOLTS_VALUE, potentialWithinNormalRange);
            this.toggle(this.e_EXTPWR_VOLTS_UNIT, externalPowerAvailable);

            this.toggle(this.e_EXTPWR_FREQ_VALUE, externalPowerAvailable);
            this.setValue(this.e_EXTPWR_FREQ_VALUE, Math.round(SimVar.GetSimVarValue("L:A32NX_ELEC_EXT_PWR_FREQUENCY", "Hertz")));
            const frequencyWithinNormalRange = !!SimVar.GetSimVarValue("L:A32NX_ELEC_EXT_PWR_FREQUENCY_NORMAL", "Bool");
            this.greenWhen(this.e_EXTPWR_FREQ_VALUE, frequencyWithinNormalRange);
            this.toggle(this.e_EXTPWR_FREQ_UNIT, externalPowerAvailable);

            const allParametersWithinAcceptableRange = potentialWithinNormalRange && frequencyWithinNormalRange;
            this.whiteWhen(this.e_EXTPWR_TITLE, allParametersWithinAcceptableRange);
        }

        drawAcPowerSourcesToAcReceivers() {
            const generatorLineContactor1Closed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_9XU1_IS_CLOSED", "Bool");
            const generatorLineContactor2Closed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_9XU2_IS_CLOSED", "Bool");
            const busTieContactor1Closed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_11XU1_IS_CLOSED", "Bool");
            const busTieContactor2Closed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_11XU2_IS_CLOSED", "Bool");

            this.toggle(this.e_ARROW_XFEED_AC1, generatorLineContactor1Closed || busTieContactor1Closed);
            this.toggle(this.e_WIRE_GEN1_AC_BUS_1, generatorLineContactor1Closed && !busTieContactor1Closed);
            this.toggle(this.e_WIRE_GEN1_AC_BUS_1_2, generatorLineContactor1Closed && busTieContactor1Closed && busTieContactor2Closed);

            this.toggle(this.e_ARROW_XFEED_AC2, generatorLineContactor2Closed || busTieContactor2Closed);
            this.toggle(this.e_WIRE_GEN2_AC_BUS_2, generatorLineContactor2Closed && !busTieContactor2Closed);
            this.toggle(this.e_WIRE_GEN2_AC_BUS_1_2, generatorLineContactor2Closed && busTieContactor1Closed && busTieContactor2Closed);

            const externalPowerContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_3XG_IS_CLOSED", "Bool");
            this.toggle(this.e_WIRE_EXT_PWR_AC_BUS_1, externalPowerContactorClosed && busTieContactor1Closed && !busTieContactor2Closed);
            this.toggle(this.e_WIRE_EXT_PWR_AC_BUS_2, externalPowerContactorClosed && !busTieContactor1Closed && busTieContactor2Closed);
            this.toggle(this.e_WIRE_EXT_PWR_AC_BUS_1_2, externalPowerContactorClosed && busTieContactor1Closed && busTieContactor2Closed);
            this.toggle(this.e_ARROW_EXTPWR_XFEED, externalPowerContactorClosed && (busTieContactor1Closed || busTieContactor2Closed));

            const apuGeneratorContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_3XS_IS_CLOSED", "Bool");
            this.toggle(this.e_WIRE_APU_GEN_AC_BUS_1, apuGeneratorContactorClosed && busTieContactor1Closed && !busTieContactor2Closed);
            this.toggle(this.e_WIRE_APU_GEN_AC_BUS_2, apuGeneratorContactorClosed && !busTieContactor1Closed && busTieContactor2Closed);
            this.toggle(this.e_WIRE_APU_GEN_AC_BUS_1_2, apuGeneratorContactorClosed && busTieContactor1Closed && busTieContactor2Closed);
            this.toggle(this.e_ARROW_APUGEN_XFEED, apuGeneratorContactorClosed && (busTieContactor1Closed || busTieContactor2Closed));

            const acEssFeedContactor1Closed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_3XC1_IS_CLOSED", "Bool");
            this.toggle(this.e_WIRE_AC1_ACESS, acEssFeedContactor1Closed);

            const acEssFeedContactor2Closed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_3XC2_IS_CLOSED", "Bool");
            this.toggle(this.e_WIRE_AC2_ACESS, acEssFeedContactor2Closed);

            // This particular wire is always visible. It becomes amber when AC BUS 1 is (partially) unpowered.
            const acBus1IsPowered = !!SimVar.GetSimVarValue("L:A32NX_ELEC_AC_1_BUS_IS_POWERED", "Bool");
            this.toggle(this.e_WIRE_AC1_TR1, true);
            this.greenWhen(this.e_WIRE_AC1_TR1, acBus1IsPowered);

            // This particular wire is always visible. It becomes amber when AC BUS 2 is (partially) unpowered.
            const acBus2IsPowered = !!SimVar.GetSimVarValue("L:A32NX_ELEC_AC_2_BUS_IS_POWERED", "Bool");
            this.toggle(this.e_WIRE_AC2_TR2, true);
            this.greenWhen(this.e_WIRE_AC2_TR2, acBus2IsPowered);
        }

        drawBuses() {
            const acBus1IsPowered = !!SimVar.GetSimVarValue("L:A32NX_ELEC_AC_1_BUS_IS_POWERED", "Bool");
            this.greenWhen(this.e_ACBUS1_TITLE, acBus1IsPowered);
            this.greenWhen(this.e_ACBUS1_TITLE_NUMBER, acBus1IsPowered);

            const acBus2IsPowered = !!SimVar.GetSimVarValue("L:A32NX_ELEC_AC_2_BUS_IS_POWERED", "Bool");
            this.greenWhen(this.e_ACBUS2_TITLE, acBus2IsPowered);
            this.greenWhen(this.e_ACBUS2_TITLE_NUMBER, acBus2IsPowered);

            const acEssBusIsPowered = !!SimVar.GetSimVarValue("L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED", "Bool");
            this.greenWhen(this.e_ACESSBUS_TITLE, acEssBusIsPowered);
            const acEssShedBusIsPowered = !!SimVar.GetSimVarValue("L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED", "Bool");
            this.toggle(this.e_ACESSBUS_SHED, !acEssShedBusIsPowered);

            const dcBatBusIsPowered = !!SimVar.GetSimVarValue("L:A32NX_ELEC_DC_BAT_BUS_IS_POWERED", "Bool");
            const atLeastOneBatteryIsAuto = !!SimVar.GetSimVarValue("L:A32NX_OVHD_ELEC_BAT_10_PB_IS_AUTO", "Bool")
                || !!SimVar.GetSimVarValue("L:A32NX_OVHD_ELEC_BAT_11_PB_IS_AUTO", "Bool");

            // It's good to note that in the real aircraft, the battery charge limiters (BCLs) are
            // responsible for supplying the DC BAT BUS potential information to the SDAC. When the battery push
            // button is off the associated BCL is unpowered and thus not sending a signal to the SDAC.
            // If neither BCL sends signals to the SDAC this is translated into the amber XX you see
            // on the ECAM screen.
            // Once the SDAC is implemented we can likely simplify the logic here to read a single value
            // with three states: normal, abnormal, and no signal.
            const dcBatBusPotentialNormal = !!SimVar.GetSimVarValue("L:A32NX_ELEC_DC_BAT_BUS_POTENTIAL_NORMAL", "Bool");
            this.greenWhen(this.e_DCBATBUS_TITLE, dcBatBusIsPowered && dcBatBusPotentialNormal && atLeastOneBatteryIsAuto);
            this.setValue(this.e_DCBATBUS_TITLE, atLeastOneBatteryIsAuto ? "DC BAT" : "XX");

            const dcBus1IsPowered = !!SimVar.GetSimVarValue("L:A32NX_ELEC_DC_1_BUS_IS_POWERED", "Bool");
            this.greenWhen(this.e_DCBUS1_TITLE, dcBus1IsPowered);
            this.greenWhen(this.e_DCBUS1_TITLE_NUMBER, dcBus1IsPowered);

            const dcBus2IsPowered = !!SimVar.GetSimVarValue("L:A32NX_ELEC_DC_2_BUS_IS_POWERED", "Bool");
            this.greenWhen(this.e_DCBUS2_TITLE, dcBus2IsPowered);
            this.greenWhen(this.e_DCBUS2_TITLE_NUMBER, dcBus2IsPowered);

            const dcEssBusIsPowered = !!SimVar.GetSimVarValue("L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED", "Bool");
            this.greenWhen(this.e_DCESSBUS_TITLE, dcEssBusIsPowered);
            const dcEssShedBusIsPowered = !!SimVar.GetSimVarValue("L:A32NX_ELEC_DC_ESS_SHED_BUS_IS_POWERED", "Bool");
            this.toggle(this.e_DCESSBUS_SHED, !dcEssShedBusIsPowered);
        }

        drawPowerSourcesToDcReceivers() {
            const tr1ContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_5PU1_IS_CLOSED", "Bool");
            this.toggle(this.e_WIRE_TR1_DC1, tr1ContactorClosed);

            const tr2ContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_5PU2_IS_CLOSED", "Bool");
            this.toggle(this.e_WIRE_TR2_DC2, tr2ContactorClosed);

            const dcBus1ToBatBusContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_1PC1_IS_CLOSED", "Bool");
            const dcBatBusToDcEssBusContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_4PC_IS_CLOSED", "Bool");
            this.toggle(this.e_WIRE_DC1_DCBAT, dcBus1ToBatBusContactorClosed && !dcBatBusToDcEssBusContactorClosed);
            this.toggle(this.e_WIRE_DC1_DCBAT_DCESS, dcBus1ToBatBusContactorClosed && dcBatBusToDcEssBusContactorClosed);

            const dcBus2ToBatBusContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_1PC2_IS_CLOSED", "Bool");
            this.toggle(this.e_WIRE_DC2_DCBAT, dcBus2ToBatBusContactorClosed);

            this.drawBatteryWire(10, "6PB1", {
                wireOnly: this.e_WIRE_BAT1_DCBAT_FULL,
                wireFromBusToBat: this.e_WIRE_DCBAT_BAT1,
                arrowFromBusToBat: this.e_ARROW_DCBAT_BAT1,
                wireFromBatToBus: this.e_WIRE_BAT1_DCBAT,
                arrowFromBatToBus: this.e_ARROW_BAT1_DCBAT
            });

            this.drawBatteryWire(11, "6PB2", {
                wireOnly: this.e_WIRE_BAT2_DCBAT_FULL,
                wireFromBusToBat: this.e_WIRE_DCBAT_BAT2,
                arrowFromBusToBat: this.e_ARROW_DCBAT_BAT2,
                wireFromBatToBus: this.e_WIRE_BAT2_DCBAT,
                arrowFromBatToBus: this.e_ARROW_BAT2_DCBAT
            });
        }

        drawBatteryWire(number, contactor, elements) {
            const batteryContactorClosed = !!SimVar.GetSimVarValue(`L:A32NX_ELEC_CONTACTOR_${contactor}_IS_CLOSED`, "Bool");
            const batteryCurrent = SimVar.GetSimVarValue(`L:A32NX_ELEC_BAT_${number}_CURRENT`, "Ampere");
            const showArrowWhenContactorClosed = batteryContactorClosed &&
                !!SimVar.GetSimVarValue(`L:A32NX_ELEC_CONTACTOR_${contactor}_SHOW_ARROW_WHEN_CLOSED`, "Bool");

            const isCharging = batteryCurrent > 0;
            const isDischarging = batteryCurrent < 0;
            this.toggle(elements.wireOnly, batteryContactorClosed && !showArrowWhenContactorClosed);
            this.toggle(elements.wireFromBusToBat, batteryContactorClosed && showArrowWhenContactorClosed && isCharging);
            this.toggle(elements.arrowFromBusToBat, batteryContactorClosed && showArrowWhenContactorClosed && isCharging);
            this.toggle(elements.wireFromBatToBus, batteryContactorClosed && showArrowWhenContactorClosed && isDischarging);
            this.toggle(elements.arrowFromBatToBus, batteryContactorClosed && showArrowWhenContactorClosed && isDischarging);
        }

        drawTransformerRectifiers() {
            this.drawTransformerRectifier(1, {
                title: this.e_TR1_TITLE,
                titleNumber: this.e_TR1_TITLE_NUMBER,
                voltsValue: this.e_TR1_VOLTS_VALUE,
                ampsValue: this.e_TR1_AMPS_VALUE
            });
            this.drawTransformerRectifier(2, {
                title: this.e_TR2_TITLE,
                titleNumber: this.e_TR2_TITLE_NUMBER,
                voltsValue: this.e_TR2_VOLTS_VALUE,
                ampsValue: this.e_TR2_AMPS_VALUE
            });

            const trEssContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_3PE_IS_CLOSED", "Bool");
            this.toggle(this.e_ESSTR_BOX, trEssContactorClosed);
            this.toggle(this.e_ESSTR_VOLTS_VALUE, trEssContactorClosed);
            this.toggle(this.e_ESSTR_VOLTS_UNIT, trEssContactorClosed);
            this.toggle(this.e_ESSTR_AMPS_VALUE, trEssContactorClosed);
            this.toggle(this.e_ESSTR_AMPS_UNIT, trEssContactorClosed);
            this.toggle(this.e_WIRE_ESSTR_DCESS, trEssContactorClosed);
            this.greenOrWhiteOtherwise(this.e_ARROW_ESSTR_DCESS, trEssContactorClosed);

            const emergencyGenContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_2XE_IS_CLOSED", "Bool");
            const acEssBusContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_15XE1_IS_CLOSED", "Bool");
            this.toggle(this.e_WIRE_ACESS_ESSTR, acEssBusContactorClosed && !emergencyGenContactorClosed);

            this.drawTransformerRectifier(3, {
                title: this.e_ESSTR_TITLE,
                voltsValue: this.e_ESSTR_VOLTS_VALUE,
                ampsValue: this.e_ESSTR_AMPS_VALUE
            }, !trEssContactorClosed);
        }

        drawTransformerRectifier(number, elements, titleMustRemainWhite) {
            const potentialWithinNormalRange = !!SimVar.GetSimVarValue(`L:A32NX_ELEC_TR_${number}_POTENTIAL_NORMAL`, "Bool");
            this.setValue(elements.voltsValue, Math.round(SimVar.GetSimVarValue(`L:A32NX_ELEC_TR_${number}_POTENTIAL`, "Volts")));
            this.greenWhen(elements.voltsValue, potentialWithinNormalRange);

            const currentWithinNormalRange = !!SimVar.GetSimVarValue(`L:A32NX_ELEC_TR_${number}_CURRENT_NORMAL`, "Bool");
            this.setValue(elements.ampsValue, Math.round(SimVar.GetSimVarValue(`L:A32NX_ELEC_TR_${number}_CURRENT`, "Ampere")));
            this.greenWhen(elements.ampsValue, currentWithinNormalRange);

            const allParametersWithinAcceptableRange = potentialWithinNormalRange && currentWithinNormalRange;
            this.whiteWhen(elements.title, titleMustRemainWhite || allParametersWithinAcceptableRange);
            if (elements.titleNumber) {
                this.whiteWhen(elements.titleNumber, allParametersWithinAcceptableRange);
            }
        }

        drawBatteries() {
            this.drawBattery(10, {
                off: this.e_BAT1_OFF,
                title: this.e_BAT1_TITLE,
                titleNumber: this.e_BAT1_TITLE_NUMBER,
                voltsValue: this.e_BAT1_VOLTS_VALUE,
                voltsUnit: this.e_BAT1_VOLTS_UNIT,
                ampsValue: this.e_BAT1_AMPS_VALUE,
                ampsUnit: this.e_BAT1_AMPS_UNIT,
            });
            this.drawBattery(11, {
                off: this.e_BAT2_OFF,
                title: this.e_BAT2_TITLE,
                titleNumber: this.e_BAT2_TITLE_NUMBER,
                voltsValue: this.e_BAT2_VOLTS_VALUE,
                voltsUnit: this.e_BAT2_VOLTS_UNIT,
                ampsValue: this.e_BAT2_AMPS_VALUE,
                ampsUnit: this.e_BAT2_AMPS_UNIT,
            });
        }

        drawBattery(number, elements) {
            const batPushButtonIsAuto = !!SimVar.GetSimVarValue(`L:A32NX_OVHD_ELEC_BAT_${number}_PB_IS_AUTO`, "Bool");

            this.toggle(elements.off, !batPushButtonIsAuto);

            this.toggle(elements.voltsValue, batPushButtonIsAuto);
            this.setValue(elements.voltsValue, Math.round(SimVar.GetSimVarValue(`L:A32NX_ELEC_BAT_${number}_POTENTIAL`, "Volts")));
            const potentialWithinNormalRange = !!SimVar.GetSimVarValue(`L:A32NX_ELEC_BAT_${number}_POTENTIAL_NORMAL`, "Bool");
            this.greenWhen(elements.voltsValue, potentialWithinNormalRange);
            this.toggle(elements.voltsUnit, batPushButtonIsAuto);

            this.toggle(elements.ampsValue, batPushButtonIsAuto);
            this.setValue(elements.ampsValue, Math.abs(Math.round(SimVar.GetSimVarValue(`L:A32NX_ELEC_BAT_${number}_CURRENT`, "Ampere"))));
            const currentWithinNormalRange = !!SimVar.GetSimVarValue(`L:A32NX_ELEC_BAT_${number}_CURRENT_NORMAL`, "Bool");
            this.greenWhen(elements.ampsValue, currentWithinNormalRange);
            this.toggle(elements.ampsUnit, batPushButtonIsAuto);

            const allParametersWithinAcceptableRange = potentialWithinNormalRange && currentWithinNormalRange;
            this.whiteWhen(elements.title, !batPushButtonIsAuto || allParametersWithinAcceptableRange);
            this.whiteWhen(elements.titleNumber, !batPushButtonIsAuto || allParametersWithinAcceptableRange);
        }

        drawEmergencyGenerator() {
            const emergencyGenContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_2XE_IS_CLOSED", "Bool");
            this.toggle(this.e_EMERGEN_OFFLINE, !emergencyGenContactorClosed);
            this.toggle(this.e_EMERGEN_BOX, emergencyGenContactorClosed);
            this.toggle(this.e_EMERGEN_TITLE, emergencyGenContactorClosed);

            this.toggle(this.e_EMERGEN_VOLTS_VALUE, emergencyGenContactorClosed);
            this.setValue(this.e_EMERGEN_VOLTS_VALUE, Math.round(SimVar.GetSimVarValue("L:A32NX_ELEC_EMER_GEN_POTENTIAL", "Volts")));
            const potentialWithinNormalRange = !!SimVar.GetSimVarValue("L:A32NX_ELEC_EMER_GEN_POTENTIAL_NORMAL", "Bool");
            this.greenWhen(this.e_EMERGEN_VOLTS_VALUE, potentialWithinNormalRange);
            this.toggle(this.e_EMERGEN_VOLTS_UNIT, emergencyGenContactorClosed);

            this.toggle(this.e_EMERGEN_FREQ_VALUE, emergencyGenContactorClosed);
            this.setValue(this.e_EMERGEN_FREQ_VALUE, Math.round(SimVar.GetSimVarValue("L:A32NX_ELEC_EMER_GEN_FREQUENCY", "Hertz")));
            const currentWithinNormalRange = !!SimVar.GetSimVarValue("L:A32NX_ELEC_EMER_GEN_FREQUENCY_NORMAL", "Bool");
            this.greenWhen(this.e_EMERGEN_FREQ_VALUE, currentWithinNormalRange);
            this.toggle(this.e_EMERGEN_FREQ_UNIT, emergencyGenContactorClosed);

            const allParametersWithinAcceptableRange = potentialWithinNormalRange && currentWithinNormalRange;
            this.whiteWhen(this.e_EMERGEN_TITLE, allParametersWithinAcceptableRange);

            this.greenOrWhiteOtherwise(this.e_ARROW_EMERGEN_ESSTR, emergencyGenContactorClosed);
            this.toggle(this.e_WIRE_EMERGEN_ESSTR, emergencyGenContactorClosed);

            const acEssBusContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_15XE1_IS_CLOSED", "Bool");
            this.toggle(this.e_ARROW_EMERGEN_ACESS, acEssBusContactorClosed && emergencyGenContactorClosed);
            this.toggle(this.e_WIRE_EMERGEN_ACESS, acEssBusContactorClosed && emergencyGenContactorClosed);
        }

        drawStaticInverter() {
            const staticInverterToAcEssContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_15XE2_IS_CLOSED", "Bool");
            this.toggle(this.e_ARROW_BAT1_STATINV, staticInverterToAcEssContactorClosed);
            this.toggle(this.e_STATINV_BAT_TITLE, staticInverterToAcEssContactorClosed);

            this.toggle(this.e_STATINV_BOX, staticInverterToAcEssContactorClosed);
            this.toggle(this.e_STATINV_TITLE, staticInverterToAcEssContactorClosed);

            this.toggle(this.e_STATINV_VOLTS_VALUE, staticInverterToAcEssContactorClosed);
            this.setValue(this.e_STATINV_VOLTS_VALUE, Math.round(SimVar.GetSimVarValue("L:A32NX_ELEC_STAT_INV_POTENTIAL", "Volts")));
            const potentialWithinNormalRange = !!SimVar.GetSimVarValue("L:A32NX_ELEC_STAT_INV_POTENTIAL_NORMAL", "Bool");
            this.greenWhen(this.e_STATINV_VOLTS_VALUE, potentialWithinNormalRange);
            this.toggle(this.e_STATINV_VOLTS_UNIT, staticInverterToAcEssContactorClosed);

            this.toggle(this.e_STATINV_FREQ_VALUE, staticInverterToAcEssContactorClosed);
            this.setValue(this.e_STATINV_FREQ_VALUE, Math.round(SimVar.GetSimVarValue("L:A32NX_ELEC_STAT_INV_FREQUENCY", "Ampere")));
            const frequencyWithinNormalRange = !!SimVar.GetSimVarValue("L:A32NX_ELEC_STAT_INV_FREQUENCY_NORMAL", "Bool");
            this.greenWhen(this.e_STATINV_FREQ_VALUE, frequencyWithinNormalRange);
            this.toggle(this.e_STATINV_FREQ_UNIT, staticInverterToAcEssContactorClosed);

            const allParametersWithinAcceptableRange = potentialWithinNormalRange && frequencyWithinNormalRange;
            this.whiteWhen(this.e_STATINV_TITLE, allParametersWithinAcceptableRange);
        }

        drawIntegratedDriveGenerators() {
            this.drawIntegratedDriveGenerator(1, {
                title: this.e_IDG1_TITLE,
                tempValue: this.e_IDG1_TEMP_VALUE,
                disc: this.e_IDG1_DISC
            });
            this.drawIntegratedDriveGenerator(2, {
                title: this.e_IDG2_TITLE,
                tempValue: this.e_IDG2_TEMP_VALUE,
                disc: this.e_IDG2_DISC
            });
        }

        drawIntegratedDriveGenerator(number, elements) {
            const temperature = Math.round(SimVar.GetSimVarValue(`L:A32NX_ELEC_ENG_GEN_${number}_IDG_OIL_OUTLET_TEMPERATURE`, "Celsius"));
            this.setValue(elements.tempValue, temperature);

            const connected = !!SimVar.GetSimVarValue(`L:A32NX_ELEC_ENG_GEN_${number}_IDG_IS_CONNECTED`, "Bool");
            this.whiteWhen(elements.title, connected);
            this.toggle(elements.disc, !connected);
        }

        drawGalleyShed() {
            const galleyIsShed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_GALLEY_IS_SHED", "Bool");
            this.toggle(this.e_GALLEY_SHED_TOP, galleyIsShed);
            this.toggle(this.e_GALLEY_SHED_BOTTOM, galleyIsShed);
        }

        toggle(element, condition) {
            if (condition) {
                this.show(element);
            } else {
                this.hide(element);
            }
        }

        whiteWhen(element, condition) {
            if (condition) {
                this.white(element);
            } else {
                this.amber(element);
            }
        }

        greenWhen(element, condition) {
            if (condition) {
                this.green(element);
            } else {
                this.amber(element);
            }
        }

        greenOrWhiteOtherwise(element, condition) {
            if (condition) {
                this.green(element);
            } else {
                this.white(element);
            }
        }

        setValue(element, value) {
            element.textContent = value;
        }

        /**
         * Element Control
         */
        hide(element) {
            element.classList.add("hidden");
        }

        show(element) {
            element.classList.remove("hidden");
        }

        green(element) {
            element.classList.remove("amber");
            element.classList.add("green");
        }

        amber(element) {
            element.classList.remove("green");
            element.classList.add("amber");
        }

        white(element) {
            element.classList.remove("green");
            element.classList.remove("amber");
        }

        onEvent(_event) {

        }
    }
    A320_Neo_LowerECAM_Elec.Page = Page;
})(A320_Neo_LowerECAM_Elec || (A320_Neo_LowerECAM_Elec = {}));
customElements.define("a320-neo-lower-ecam-elec", A320_Neo_LowerECAM_Elec.Page);
