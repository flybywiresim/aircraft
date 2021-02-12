var A320_Neo_LowerECAM_Elec;
(function (A320_Neo_LowerECAM_Elec) {
    const ENUM_BUS = {
        0: 'OFF',
        1: 'GEN1',
        2: 'GEN2',
        3: 'EXTPWR',
        4: 'APUGEN',
        5: 'EMERGEN',
        6: '???',
        7: 'TR1',
        8: 'TR2',
        9: 'TRESS',
        10: 'BAT1',
        11: 'BAT2',
    };

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
            this.e_IDG2_LOPR = this.querySelector("#IDG2_LOPR");

            this.e_IDG1_TITLE = this.querySelector("#IDG1_TITLE");
            this.e_IDG1_TITLE_NUMBER = this.querySelector("#IDG1_TITLE_NUMBER");
            this.e_IDG1_TEMP_VALUE = this.querySelector("#IDG1_TEMP_VALUE");
            this.e_IDG1_TEMP_UNIT = this.querySelector("#IDG1_TEMP_UNIT");
            this.e_IDG1_DISC = this.querySelector("#IDG1_DISC");
            this.e_IDG1_LOPR = this.querySelector("#IDG1_LOPR");

            this.e_GALLEY_SHED_TOP = this.querySelector("#GALLEY_SHED_TOP");
            this.e_GALLEY_SHED_BOTTOM = this.querySelector("#GALLEY_SHED_BOTTOM");

            this.e_TITLE_HEADING = this.querySelector("#TITLE_HEADING");
            this.e_TITLE_UNDERLINE = this.querySelector("#TITLE_UNDERLINE");

            this.e_STATINV_TITLE = this.querySelector("#STATINV_TITLE");

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

            this.e_WIRE_XFEED_C = this.querySelector("#WIRE_XFEED-C");
            this.e_WIRE_XFEED_B = this.querySelector("#WIRE_XFEED-B");
            this.e_WIRE_XFEED_A = this.querySelector("#WIRE_XFEED-A");
            this.e_WIRE_APUGEN_XFEED = this.querySelector("#WIRE_APUGEN_XFEED");
            this.e_WIRE_EXTPWR_XFEED = this.querySelector("#WIRE_EXTPWR_XFEED");
            this.e_WIRE_XFEED_AC1 = this.querySelector("#WIRE_XFEED_AC1");
            this.e_WIRE_GEN1_XFEED = this.querySelector("#WIRE_GEN1_XFEED");
            this.e_WIRE_XFEED_AC2 = this.querySelector("#WIRE_XFEED_AC2");
            this.e_WIRE_GEN2_XFEED = this.querySelector("#WIRE_GEN2_XFEED");
            this.e_WIRE_AC1_TR1 = this.querySelector("#WIRE_AC1_TR1");
            this.e_WIRE_TR1_DC1 = this.querySelector("#WIRE_TR1_DC1");
            this.e_WIRE_ACESS_ESSTR = this.querySelector("#WIRE_ACESS_ESSTR");
            this.e_WIRE_DC1_DCBAT_A = this.querySelector("#WIRE_DC1_DCBAT-A");
            this.e_WIRE_DC1_DCBAT_B = this.querySelector("#WIRE_DC1_DCBAT-B");
            this.e_WIRE_DCESS_DCBAT = this.querySelector("#WIRE_DCESS_DCBAT");
            this.e_WIRE_DCBAT_BAT2 = this.querySelector("#WIRE_DCBAT_BAT2");
            this.e_WIRE_BAT2_DCBAT = this.querySelector("#WIRE_BAT2_DCBAT");
            this.e_WIRE_DC2_DCBAT_A = this.querySelector("#WIRE_DC2_DCBAT-A");
            this.e_WIRE_DC2_DCBAT_B = this.querySelector("#WIRE_DC2_DCBAT-B");
            this.e_WIRE_BAT1_DCBAT = this.querySelector("#WIRE_BAT1_DCBAT");
            this.e_WIRE_DCBAT_BAT1 = this.querySelector("#WIRE_DCBAT_BAT1");
            this.e_WIRE_BAT1_DCBAT_FULL = this.querySelector("#WIRE_BAT1_DCBAT_FULL");
            this.e_WIRE_BAT2_DCBAT_FULL = this.querySelector("#WIRE_BAT2_DCBAT_FULL");
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
            this.e_ARROW_BAT1_DCBAT = this.querySelector("#ARROW_BAT1_DCBAT");
            this.e_ARROW_BAT2_DCBAT = this.querySelector("#ARROW_BAT2_DCBAT");
            this.e_ARROW_DCBAT_BAT1 = this.querySelector("#ARROW_DCBAT_BAT1");
            this.e_ARROW_DCBAT_BAT2 = this.querySelector("#ARROW_DCBAT_BAT2");
            this.e_ARROW_EMERGEN_ACESS = this.querySelector("#ARROW_EMERGEN_ACESS");
            this.e_ARROW_BAT1_STATINV = this.querySelector("#ARROW_BAT1_STATINV");

            this.systems = {};
            this.values = {};
            this.buses = {};
            this.internals = {};
            this.switches = {};

            this.setBAT1_OFF();
            this.setBAT2_OFF();
            this.setGEN1_OFF();
            this.setGEN2_OFF();
            this.setAPUGEN_OFF();
            this.setEXTPWR_OFF();
            this.setESSTR_OFF();
            this.setEMERGEN_OFF();
            this.setDCESSBUS_SHED_OFF();
            this.setACESSBUS_SHED_OFF();
            this.setIDG1_LOPR_OFF();
            this.setIDG1_DISC_OFF();
            this.setIDG2_LOPR_OFF();
            this.setIDG2_DISC_OFF();
            this.setGALLEY_SHED_OFF();
            this.setSTATINV_OFF();

            this.setCONNECTION_DCBAT_BAT1_OFF();
            this.setCONNECTION_DCBAT_BAT2_OFF();
            this.setCONNECTION_BAT1_DCBAT_DISCHARGE_OFF();
            this.setCONNECTION_BAT2_DCBAT_DISCHARGE_OFF();
            this.setCONNECTION_DCBAT_BAT1_CHARGE_OFF();
            this.setCONNECTION_DCBAT_BAT2_CHARGE_OFF();
            this.setCONNECTION_DC1_DCBAT_OFF();
            this.setCONNECTION_DC2_DCBAT_OFF();
            this.setCONNECTION_DCESS_DCBAT_OFF();
            this.setCONNECTION_EMERGEN_ESSTR_OFF();
            this.setCONNECTION_EMERGEN_ACESS_OFF();
            this.setCONNECTION_ESSTR_DCESS_OFF();
            this.setCONNECTION_ACESS_ESSTR_OFF();
            this.setCONNECTION_APUGEN_XFEED_OFF();
            this.setCONNECTION_EXTPWR_XFEED_OFF();
            this.setCONNECTION_AC1_ACESS_OFF();
            this.setCONNECTION_AC2_ACESS_OFF();
            this.setCONNECTION_GEN1_AC1_OFF();
            this.setCONNECTION_GEN2_AC2_OFF();
            this.setCONNECTION_XFEED_OFF();
            this.setCONNECTION_AC1_TR1_OFF();
            this.setCONNECTION_AC2_TR2_OFF();
            this.setCONNECTION_TR1_DC1_OFF();
            this.setCONNECTION_TR2_DC2_OFF();

            this.updateThrottler = new UpdateThrottler(500);

            this.isInitialised = true;

            this.updateVariablesRandom();
            this.systemDraw();
        }

        update(_deltaTime) {
            if (this.updateThrottler.canUpdate(_deltaTime) === -1) {
                return;
            }
            this.updateVariables();
            this.systemDraw();
        }

        updateVariablesRandom() {
            this.systems.BAT1 = this.getSimVar_ONOFF('BATT1_ONLINE');
            this.systems.BAT2 = this.getSimVar_ONOFF('BATT2_ONLINE');
            this.values.BAT1_CAP = this.getSimVar_Number('BATT1_CAPACITY');
            this.values.BAT2_CAP = this.getSimVar_Number('BATT2_CAPACITY');
            this.values.BAT1_VOLTS = this.getSimVar_Number('BATT1_VOLTAGE');
            this.values.BAT2_VOLTS = this.getSimVar_Number('BATT2_VOLTAGE');
            this.values.BAT1_AMPS = this.getSimVar_Number('BATT1_AMPERAGE');
            this.values.BAT2_AMPS = this.getSimVar_Number('BATT2_AMPERAGE');
            this.values.DCBAT_LOAD = this.getSimVar_Number('BATT_BUS_LOAD');

            this.systems.EXTPWR = this.getSimVar_ONOFF('EXT_GEN_ONLINE');
            this.values.EXTPWR_VOLTS = this.getSimVar_Number('EXT_GEN_VOLTAGE');
            this.values.EXTPWR_AMPS = this.getSimVar_Number('EXT_GEN_AMPERAGE');
            this.values.EXTPWR_FREQ = this.getSimVar_Number('EXT_GEN_FREQ');

            this.systems.GEN1 = this.getSimVar_ONOFF('GEN1_ONLINE');
            this.systems.GEN2 = this.getSimVar_ONOFF('GEN2_ONLINE');
            this.values.GEN1_VOLTS = this.getSimVar_Number('GEN1_VOLTAGE');
            this.values.GEN2_VOLTS = this.getSimVar_Number('GEN2_VOLTAGE');
            this.values.GEN1_AMPS = this.getSimVar_Number('GEN1_AMPERAGE');
            this.values.GEN2_AMPS = this.getSimVar_Number('GEN2_AMPERAGE');
            this.values.GEN1_FREQ = this.getSimVar_Number('GEN1_FREQ');
            this.values.GEN2_FREQ = this.getSimVar_Number('GEN2_FREQ');
            this.values.IDG1_TEMP = this.getSimVar_Number('GEN1_IDG_TEMP');
            this.values.IDG2_TEMP = this.getSimVar_Number('GEN2_IDG_TEMP');

            this.systems.EMERGEN = this.getSimVar_ONOFF('EMER_ONLINE');
            this.values.EMERGEN_VOLTS = this.getSimVar_Number('EMER_VOLTAGE');
            this.values.EMERGEN_AMPS = this.getSimVar_Number('EMER_AMPERAGE');
            this.values.EMERGEN_FREQ = this.getSimVar_Number('EMER_FREQ');

            this.buses.AC1 = this.getSimVar_BusEnum('AC_BUS1');
            this.buses.AC2 = this.getSimVar_BusEnum('AC_BUS2');
            this.buses.ACESS = this.getSimVar_BusEnum('AC_ESS');
            this.buses.ACSHED = this.getSimVar_BusEnum('AC_SHED');
            this.buses.GALLEY_SHED = this.getSimVar_BusEnum('GALLEY_SHED');
            this.buses.DC1 = this.getSimVar_BusEnum('DC_BUS1');
            this.buses.DC2 = this.getSimVar_BusEnum('DC_BUS2');
            this.buses.DCBAT = this.getSimVar_BusEnum('DC_BATBUS');
            this.buses.DCESS = this.getSimVar_BusEnum('DC_ESS');
            this.buses.DCSHED = this.getSimVar_BusEnum('DC_SHED');
            this.buses.HOT1 = this.getSimVar_BusEnum('HOT_BUS1');
            this.buses.HOT2 = this.getSimVar_BusEnum('HOT_BUS2');

            this.systems.TR1 = this.getSimVar_ONOFF('TR1_ONLINE');
            this.systems.TR2 = this.getSimVar_ONOFF('TR2_ONLINE');
            this.systems.TRESS = this.getSimVar_ONOFF('TRESS_ONLINE');
            this.values.TR1_VOLTS = this.getSimVar_Number('TR1_VOLTAGE');
            this.values.TR2_VOLTS = this.getSimVar_Number('TR2_VOLTAGE');
            this.values.TRESS_VOLTS = this.getSimVar_Number('TRESS_VOLTAGE');
            this.values.TR1_AMPS = this.getSimVar_Number('TR1_AMPERAGE');
            this.values.TR2_AMPS = this.getSimVar_Number('TR2_AMPERAGE');
            this.values.TRESS_AMPS = this.getSimVar_Number('TRESS_AMPERAGE');

            this.systems.STATINV = this.getSimVar_ONOFF('STATICINV_ONLINE');
            this.values.STATINV_VOLTS = this.getSimVar_Number('STATICINV_VOLTAGE');
            this.values.STATINV_AMPS = this.getSimVar_Number('STATICINV_AMPERAGE');
            this.values.STATINV_FREQ = this.getSimVar_Number('STATICINV_FREQ');

            this.internals.AC_AVAIL = this.getSimVar_Bool('ACPowerAvailable');
            this.internals.DC_AVAIL = this.getSimVar_Bool('DCPowerAvailable');

            this.switches.ACESS_FEED_AUTO = this.getSimVar_Bool('A32NX_OVHD_ELEC_AC_ESS_FEED_PB_IS_NORMAL');
            this.switches.COMMERCIAL_ON = this.getSimVar_Bool('A32NX_OVHD_ELEC_COMMERCIAL_PB_IS_ON');
            this.switches.GALYCAB_ON = this.getSimVar_Bool('A32NX_OVHD_ELEC_GALY_AND_CAB_PB_IS_AUTO');
        }

        updateVariables() {
            this.switches.ACESS_FEED_AUTO = SimVar.GetSimVarValue('L:A32NX_ELEC_AC_ESS_FEED_ACTIVATED', 'bool') !== 0;
        }

        getSimVar_Bool(varName) {
            return Math.random() > 0.5;
        }

        getSimVar_Number(varName) {
            return (Math.random() * 300).toFixed(0);
        }

        getSimVar_ONOFF(varName) {
            return Math.random() > 0.5 ? 'ON' : 'OFF';
        }

        getSimVar_BusEnum(varName) {
            const index = Math.floor(Math.random() * 11);
            return ENUM_BUS[index];
        }

        systemDraw() {
            this.switches.ACESS_FEED_AUTO = SimVar.GetSimVarValue('L:A32NX_OVHD_ELEC_AC_ESS_FEED_PB_IS_NORMAL', 'bool') !== 0;
            const apuGenOn = SimVar.GetSimVarValue('APU GENERATOR SWITCH:1', 'Bool') === 1;

            // Level 1 - Generators
            // if (this.systems.GEN1 === 'ON') {
            //     this.setGEN1_ON();
            //     this.setCONNECTION_GEN1_AC1_ON();
            //     this.buses.AC1 = 'ON'; // move to after gen layer
            //     if (this.systems.EXTPWR === 'OFF' && !apuGenOn && this.systems.GEN2 === 'OFF') {
            //         this.setCONNECTION_XFEED_ON();
            //         this.setCONNECTION_XFEED_AC2_ON();
            //         this.buses.AC2 = 'ON';
            //     }
            // } else {
            //     this.setGEN1_OFF();
            //     this.setCONNECTION_GEN1_XFEED_OFF();
            //     if (this.systems.GEN2 === 'OFF' && !apuGenOn && this.systems.EXTPWR === 'OFF') {
            //         this.setCONNECTION_XFEED_AC1_OFF();
            //     }
            // }

            // if (this.systems.GEN2 === 'ON') {
            //     this.setGEN2_ON();
            //     this.setCONNECTION_GEN2_AC2_ON();
            //     this.buses.AC2 = 'ON';
            //     if (this.systems.EXTPWR === 'OFF' && !apuGenOn && this.systems.GEN1 === 'OFF') {
            //         this.setCONNECTION_XFEED_ON();
            //         this.setCONNECTION_XFEED_AC1_ON();
            //         this.buses.AC1 = 'ON';
            //     }
            // } else {
            //     this.setGEN2_OFF();
            //     this.setCONNECTION_GEN2_XFEED_OFF();
            //     if (this.systems.GEN1 === 'OFF' && !apuGenOn && this.systems.EXTPWR === 'OFF') {
            //         this.setCONNECTION_XFEED_AC2_OFF();
            //     }
            // }

            // if (this.systems.EXTPWR === 'ON') {
            //     this.setCONNECTION_XFEED_OFF();
            //     this.setEXTPWR_ON();
            //     if (this.systems.GEN1 === 'OFF' || this.systems.GEN2 === 'OFF') {
            //         this.setCONNECTION_EXTPWR_XFEED_ON();
            //         if (this.systems.GEN1 === 'OFF') {
            //             this.setCONNECTION_XFEED_A_ON();
            //             this.setCONNECTION_XFEED_B_ON();
            //             this.setCONNECTION_XFEED_AC1_ON();
            //             this.buses.AC1 = 'ON';
            //         }
            //         if (this.systems.GEN2 === 'OFF') {
            //             this.setCONNECTION_XFEED_C_ON();
            //             this.setCONNECTION_XFEED_AC2_ON();
            //             this.buses.AC2 = 'ON';
            //         }
            //     } else {
            //         this.setCONNECTION_EXTPWR_XFEED_OFF();
            //     }
            // } else {
            //     this.setEXTPWR_OFF();
            //     this.setCONNECTION_EXTPWR_XFEED_OFF();
            // }

            // if (apuGenOn) {
            //     this.setAPUGEN_ON();
            //     if (this.systems.EXTPWR === 'OFF') {
            //         this.setCONNECTION_XFEED_OFF();
            //         if (this.systems.GEN1 === 'OFF' || this.systems.GEN2 === 'OFF') {
            //             this.setCONNECTION_APUGEN_XFEED_ON();
            //             if (this.systems.GEN1 === 'OFF') {
            //                 this.setCONNECTION_XFEED_A_ON();
            //                 this.setCONNECTION_XFEED_AC1_ON();
            //                 this.buses.AC1 = 'ON';
            //             }
            //             if (this.systems.GEN2 === 'OFF') {
            //                 this.setCONNECTION_XFEED_B_ON();
            //                 this.setCONNECTION_XFEED_C_ON();
            //                 this.setCONNECTION_XFEED_AC2_ON();
            //                 this.buses.AC2 = 'ON';
            //             }
            //         } else {
            //             this.setCONNECTION_APUGEN_XFEED_OFF();
            //         }
            //     } else {
            //         this.setCONNECTION_APUGEN_XFEED_OFF();
            //     }
            // } else {
            //     this.setAPUGEN_OFF();
            //     this.setCONNECTION_APUGEN_XFEED_OFF();
            // }

            // // Level 2 - AC Buses
            // if (this.buses.AC1 === 'ON') {
            //     this.setCONNECTION_AC1_TR1_ON();
            //     this.systems.TR1 = 'ON';
            //     if (this.switches.ACESS_FEED_AUTO === true || this.buses.AC2 === 'OFF') {
            //         this.setCONNECTION_AC1_ACESS_ON();
            //         this.setCONNECTION_AC2_ACESS_OFF();
            //         this.buses.ACESS = 'ON';
            //     }
            // }
            // if (this.buses.AC2 === 'ON') {
            //     this.setCONNECTION_AC2_TR2_ON();
            //     this.systems.TR2 = 'ON';
            //     if (this.switches.ACESS_FEED_AUTO === false || this.buses.AC1 === 'OFF') {
            //         this.setCONNECTION_AC2_ACESS_ON();
            //         this.setCONNECTION_AC1_ACESS_OFF();
            //         this.buses.ACESS = 'ON';
            //     }
            // }
            // if (this.buses.GALLEY_SHED === true) {
            //     this.setGALLEY_SHED_ON();
            // } else {
            //     this.setGALLEY_SHED_OFF();
            // }

            // // Level 3 - TR
            // if (this.systems.TR1 === 'ON') {
            //     this.setCONNECTION_TR1_DC1_ON();
            //     this.buses.DC1 = 'ON';
            // }
            // if (this.systems.TR2 === 'ON') {
            //     this.setCONNECTION_TR2_DC2_ON();
            //     this.buses.DC2 = 'ON';
            // }

            // Level 4A - Batteries
            // if (this.systems.BAT1 === 'ON') {
            //     this.setBAT1_ON()
            //     if (this.internal.BAT1_DIR === 'CHARGE') {
            //         this.setCONNECTION_DCBAT_BAT1_OFF()
            //         this.setCONNECTION_BAT1_DCBAT_DISCHARGE_OFF()
            //         this.setCONNECTION_DCBAT_BAT1_CHARGE_ON()
            //     } else if (this.internal.BAT1_DIR === 'DISCHARGE') {
            //         this.setCONNECTION_DCBAT_BAT1_OFF()
            //         this.setCONNECTION_DCBAT_BAT1_CHARGE_OFF()
            //         this.setCONNECTION_BAT1_DCBAT_DISCHARGE_ON()
            //     } else if (this.internal.BAT1_DIR === 'IDLE') {
            //         this.setCONNECTION_DCBAT_BAT1_CHARGE_OFF()
            //         this.setCONNECTION_BAT1_DCBAT_DISCHARGE_OFF()
            //         this.setCONNECTION_DCBAT_BAT1_ON()
            //     } else {
            //         this.setCONNECTION_DCBAT_BAT1_OFF()
            //         this.setCONNECTION_DCBAT_BAT1_CHARGE_OFF()
            //         this.setCONNECTION_BAT1_DCBAT_DISCHARGE_OFF()
            //     }
            // } else {
            //     this.setBAT1_OFF()
            //     if (this.internal.BAT2_DIR === 'CHARGE') {
            //         this.setCONNECTION_DCBAT_BAT2_OFF()
            //         this.setCONNECTION_BAT2_DCBAT_DISCHARGE_OFF()
            //         this.setCONNECTION_DCBAT_BAT2_CHARGE_ON()
            //     } else if (this.internal.BAT2_DIR === 'DISCHARGE') {
            //         this.setCONNECTION_DCBAT_BAT2_OFF()
            //         this.setCONNECTION_DCBAT_BAT2_CHARGE_OFF()
            //         this.setCONNECTION_DCBAT_BAT2_DISCHARGE_ON()
            //     } else if (this.internal.BAT2_DIR === 'IDLE') {
            //         this.setCONNECTION_DCBAT_BAT2_CHARGE_OFF()
            //         this.setCONNECTION_BAT2_DCBAT_DISCHARGE_OFF()
            //         this.setCONNECTION_DCBAT_BAT2_ON()
            //     } else {
            //         this.setCONNECTION_DCBAT_BAT2_OFF()
            //         this.setCONNECTION_DCBAT_BAT2_CHARGE_OFF()
            //         this.setCONNECTION_BAT2_DCBAT_DISCHARGE_OFF()
            //     }
            // }

            if (this.systems.BAT2 === 'ON') {
                this.setBAT2_ON();
            } else {
                this.setBAT2_OFF();
            }

            // Level 4 - DC Buses
            if (this.buses.DC1 === 'ON') {
                this.setCONNECTION_DC1_DCBAT_ON();
                this.buses.DCBAT = 'ON';
                this.setCONNECTION_DCESS_DCBAT_ON();
                this.buses.DCESS = 'ON';
            }
            if (this.buses.DC2 === 'ON') {

            }

            this.drawApuGenerator();
            this.drawEngineGenerators();
            this.drawExternalPower();
            this.drawAcPowerSourcesToAcReceivers();
            this.drawPowerSourcesToDcReceivers();
            this.drawBuses();
            this.drawTransformerRectifiers();
            this.drawBatteries();
            this.drawEmergencyGenerator();
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
            const externalPowerAvailable = SimVar.GetSimVarValue("EXTERNAL POWER AVAILABLE:1", "Bool");

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
            this.toggle(this.e_ACESSBUS_SHED, !acEssBusIsPowered);

            const dcBatBusIsPowered = !!SimVar.GetSimVarValue("L:A32NX_ELEC_DC_BAT_BUS_IS_POWERED", "Bool");
            // TODO: When battery voltage is implemented. The title should also be amber when BAT BUS voltage < 25 V.
            // However, with < 25 V it should keep displaying DC BAT. Unless the bus is fully unpowered.
            this.greenWhen(this.e_DCBATBUS_TITLE, dcBatBusIsPowered);
            this.setValue(this.e_DCBATBUS_TITLE, dcBatBusIsPowered ? "DC BAT" : "XX");

            const dcBus1IsPowered = !!SimVar.GetSimVarValue("L:A32NX_ELEC_DC_1_BUS_IS_POWERED", "Bool");
            this.greenWhen(this.e_DCBUS1_TITLE, dcBus1IsPowered);
            this.greenWhen(this.e_DCBUS1_TITLE_NUMBER, dcBus1IsPowered);

            const dcBus2IsPowered = !!SimVar.GetSimVarValue("L:A32NX_ELEC_DC_2_BUS_IS_POWERED", "Bool");
            this.greenWhen(this.e_DCBUS2_TITLE, dcBus2IsPowered);
            this.greenWhen(this.e_DCBUS2_TITLE_NUMBER, dcBus2IsPowered);

            const dcEssBusIsPowered = !!SimVar.GetSimVarValue("L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED", "Bool");
            this.greenWhen(this.e_DCESSBUS_TITLE, dcEssBusIsPowered);
            this.toggle(this.e_DCESSBUS_SHED, !dcEssBusIsPowered);
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

            const battery1ContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_6PB1_IS_CLOSED", "Bool");
            this.toggle(this.e_WIRE_BAT1_DCBAT_FULL, battery1ContactorClosed);

            const battery2ContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_6PB2_IS_CLOSED", "Bool");
            this.toggle(this.e_WIRE_BAT2_DCBAT_FULL, battery2ContactorClosed);
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

            this.toggle(this.e_WIRE_ACESS_ESSTR, trEssContactorClosed);

            this.toggle(this.e_WIRE_ESSTR_DCESS, trEssContactorClosed);
            this.greenOrWhiteOtherwise(this.e_ARROW_ESSTR_DCESS, trEssContactorClosed);

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
            this.setValue(elements.ampsValue, Math.round(SimVar.GetSimVarValue(`L:A32NX_ELEC_BAT_${number}_CURRENT`, "Ampere")));
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
            this.setValue(this.e_EMERGEN_FREQ_VALUE, Math.round(SimVar.GetSimVarValue("L:A32NX_ELEC_EMER_GEN_CURRENT", "Ampere")));
            const currentWithinNormalRange = !!SimVar.GetSimVarValue("L:A32NX_ELEC_EMER_GEN_CURRENT_NORMAL", "Bool");
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
         * Individual Indicator Controls
         */
        setFAULT_TR1_ON() {
            this.amber(this.e_TR1_TITLE);
            this.amber(this.e_TR1_TITLE_NUMBER);
            this.amber(this.e_TR1_VOLTS_VALUE);
            this.amber(this.e_TR1_AMPS_VALUE);
        }
        setFAULT_TR1_OFF() {
            this.green(this.e_TR1_TITLE);
            this.green(this.e_TR1_TITLE_NUMBER);
            this.green(this.e_TR1_VOLTS_VALUE);
            this.green(this.e_TR1_AMPS_VALUE);
        }

        setFAULT_TR2_ON() {
            this.amber(this.e_TR2_TITLE);
            this.amber(this.e_TR2_TITLE_NUMBER);
            this.amber(this.e_TR2_VOLTS_VALUE);
            this.amber(this.e_TR2_AMPS_VALUE);
        }
        setFAULT_TR2_OFF() {
            this.green(this.e_TR2_TITLE);
            this.green(this.e_TR2_TITLE_NUMBER);
            this.green(this.e_TR2_VOLTS_VALUE);
            this.green(this.e_TR2_AMPS_VALUE);
        }

        setBAT1_ON() {
            this.hide(this.e_BAT1_OFF);
            this.show(this.e_BAT1_BOX);
            this.show(this.e_BAT1_TITLE);
            this.show(this.e_BAT1_VOLTS_VALUE);
            this.show(this.e_BAT1_VOLTS_UNIT);
            this.show(this.e_BAT1_AMPS_VALUE);
            this.show(this.e_BAT1_AMPS_UNIT);
        }
        setBAT1_OFF() {
            this.show(this.e_BAT1_OFF);
            this.show(this.e_BAT1_BOX);
            this.show(this.e_BAT1_TITLE);
            this.hide(this.e_BAT1_VOLTS_VALUE);
            this.hide(this.e_BAT1_VOLTS_UNIT);
            this.hide(this.e_BAT1_AMPS_VALUE);
            this.hide(this.e_BAT1_AMPS_UNIT);
        }

        setBAT2_ON() {
            this.hide(this.e_BAT2_OFF);
            this.show(this.e_BAT2_BOX);
            this.show(this.e_BAT2_TITLE);
            this.show(this.e_BAT2_VOLTS_VALUE);
            this.show(this.e_BAT2_VOLTS_UNIT);
            this.show(this.e_BAT2_AMPS_VALUE);
            this.show(this.e_BAT2_AMPS_UNIT);
        }
        setBAT2_OFF() {
            this.show(this.e_BAT2_OFF);
            this.show(this.e_BAT2_BOX);
            this.show(this.e_BAT2_TITLE);
            this.hide(this.e_BAT2_VOLTS_VALUE);
            this.hide(this.e_BAT2_VOLTS_UNIT);
            this.hide(this.e_BAT2_AMPS_VALUE);
            this.hide(this.e_BAT2_AMPS_UNIT);
        }

        setGEN1_ON() {
            this.hide(this.e_GEN1_OFF);
            this.show(this.e_GEN1_BOX);
            this.show(this.e_GEN1_TITLE);
            this.show(this.e_GEN1_TITLE_NUMBER);
            this.show(this.e_GEN1_LOAD_VALUE);
            this.show(this.e_GEN1_LOAD_UNIT);
            this.show(this.e_GEN1_VOLTS_VALUE);
            this.show(this.e_GEN1_VOLTS_UNIT);
            this.show(this.e_GEN1_FREQ_VALUE);
            this.show(this.e_GEN1_FREQ_UNIT);
        }
        setGEN1_OFF() {
            this.show(this.e_GEN1_OFF);
            this.show(this.e_GEN1_BOX);
            this.show(this.e_GEN1_TITLE);
            this.show(this.e_GEN1_TITLE_NUMBER);
            this.hide(this.e_GEN1_LOAD_VALUE);
            this.hide(this.e_GEN1_LOAD_UNIT);
            this.hide(this.e_GEN1_VOLTS_VALUE);
            this.hide(this.e_GEN1_VOLTS_UNIT);
            this.hide(this.e_GEN1_FREQ_VALUE);
            this.hide(this.e_GEN1_FREQ_UNIT);
        }

        setGEN2_ON() {
            this.hide(this.e_GEN2_OFF);
            this.show(this.e_GEN2_BOX);
            this.show(this.e_GEN2_TITLE);
            this.show(this.e_GEN2_TITLE_NUMBER);
            this.show(this.e_GEN2_LOAD_VALUE);
            this.show(this.e_GEN2_LOAD_UNIT);
            this.show(this.e_GEN2_VOLTS_VALUE);
            this.show(this.e_GEN2_VOLTS_UNIT);
            this.show(this.e_GEN2_FREQ_VALUE);
            this.show(this.e_GEN2_FREQ_UNIT);
        }
        setGEN2_OFF() {
            this.show(this.e_GEN2_OFF);
            this.show(this.e_GEN2_BOX);
            this.show(this.e_GEN2_TITLE);
            this.show(this.e_GEN2_TITLE_NUMBER);
            this.hide(this.e_GEN2_LOAD_VALUE);
            this.hide(this.e_GEN2_LOAD_UNIT);
            this.hide(this.e_GEN2_VOLTS_VALUE);
            this.hide(this.e_GEN2_VOLTS_UNIT);
            this.hide(this.e_GEN2_FREQ_VALUE);
            this.hide(this.e_GEN2_FREQ_UNIT);
        }

        setAPUGEN_ON() {
            this.hide(this.e_APUGEN_OFF);
            this.show(this.e_APUGEN_BOX);
            this.show(this.e_APUGEN_TITLE);
            this.show(this.e_APUGEN_LOAD_VALUE);
            this.show(this.e_APUGEN_LOAD_UNIT);
            this.show(this.e_APUGEN_VOLTS_VALUE);
            this.show(this.e_APUGEN_VOLTS_UNIT);
            this.show(this.e_APUGEN_FREQ_VALUE);
            this.show(this.e_APUGEN_FREQ_UNIT);
        }
        setAPUGEN_OFF() {
            this.hide(this.e_APUGEN_OFF);
            this.hide(this.e_APUGEN_BOX);
            this.show(this.e_APUGEN_TITLE);
            this.hide(this.e_APUGEN_LOAD_VALUE);
            this.hide(this.e_APUGEN_LOAD_UNIT);
            this.hide(this.e_APUGEN_VOLTS_VALUE);
            this.hide(this.e_APUGEN_VOLTS_UNIT);
            this.hide(this.e_APUGEN_FREQ_VALUE);
            this.hide(this.e_APUGEN_FREQ_UNIT);
        }

        setEXTPWR_ON() {
            this.show(this.e_EXTPWR_BOX);
            this.show(this.e_EXTPWR_TITLE);
            this.show(this.e_EXTPWR_VOLTS_VALUE);
            this.show(this.e_EXTPWR_VOLTS_UNIT);
            this.show(this.e_EXTPWR_FREQ_VALUE);
            this.show(this.e_EXTPWR_FREQ_UNIT);
        }
        setEXTPWR_OFF() {
            this.hide(this.e_EXTPWR_BOX);
            this.hide(this.e_EXTPWR_TITLE);
            this.hide(this.e_EXTPWR_VOLTS_VALUE);
            this.hide(this.e_EXTPWR_VOLTS_UNIT);
            this.hide(this.e_EXTPWR_FREQ_VALUE);
            this.hide(this.e_EXTPWR_FREQ_UNIT);
        }

        setESSTR_ON() {
            this.show(this.e_ESSTR_BOX);
            this.show(this.e_ESSTR_TITLE);
            this.show(this.e_ESSTR_VOLTS_VALUE);
            this.show(this.e_ESSTR_VOLTS_UNIT);
            this.show(this.e_ESSTR_AMPS_VALUE);
            this.show(this.e_ESSTR_AMPS_UNIT);
        }
        setESSTR_OFF() {
            this.hide(this.e_ESSTR_BOX);
            this.show(this.e_ESSTR_TITLE);
            this.hide(this.e_ESSTR_VOLTS_VALUE);
            this.hide(this.e_ESSTR_VOLTS_UNIT);
            this.hide(this.e_ESSTR_AMPS_VALUE);
            this.hide(this.e_ESSTR_AMPS_UNIT);
        }

        setEMERGEN_ON() {
            this.hide(this.e_EMERGEN_OFFLINE);
            this.show(this.e_EMERGEN_BOX);
            this.show(this.e_EMERGEN_TITLE);
            this.show(this.e_EMERGEN_VOLTS_VALUE);
            this.show(this.e_EMERGEN_VOLTS_UNIT);
            this.show(this.e_EMERGEN_FREQ_VALUE);
            this.show(this.e_EMERGEN_FREQ_UNIT);
        }
        setEMERGEN_OFF() {
            this.show(this.e_EMERGEN_OFFLINE);
            this.hide(this.e_EMERGEN_BOX);
            this.hide(this.e_EMERGEN_TITLE);
            this.hide(this.e_EMERGEN_VOLTS_VALUE);
            this.hide(this.e_EMERGEN_VOLTS_UNIT);
            this.hide(this.e_EMERGEN_FREQ_VALUE);
            this.hide(this.e_EMERGEN_FREQ_UNIT);
        }

        setACESSBUS_SHED_ON() {
            this.show(this.e_ACESSBUS_SHED);
        }
        setACESSBUS_SHED_OFF() {
            this.hide(this.e_ACESSBUS_SHED);
        }

        setIDG1_LOPR_ON() {
            this.show(this.e_IDG1_LOPR);
        }
        setIDG1_LOPR_OFF() {
            this.hide(this.e_IDG1_LOPR);
        }

        setIDG2_LOPR_ON() {
            this.show(this.e_IDG2_LOPR);
        }
        setIDG2_LOPR_OFF() {
            this.hide(this.e_IDG2_LOPR);
        }

        setIDG1_DISC_ON() {
            this.show(this.e_IDG1_DISC);
        }
        setIDG1_DISC_OFF() {
            this.hide(this.e_IDG1_DISC);
        }

        setIDG2_DISC_ON() {
            this.show(this.e_IDG2_DISC);
        }
        setIDG2_DISC_OFF() {
            this.hide(this.e_IDG2_DISC);
        }

        setDCESSBUS_SHED_ON() {
            this.show(this.e_DCESSBUS_SHED);
        }
        setDCESSBUS_SHED_OFF() {
            this.hide(this.e_DCESSBUS_SHED);
        }

        setGALLEY_SHED_ON() {
            this.show(this.e_GALLEY_SHED_TOP);
            this.show(this.e_GALLEY_SHED_BOTTOM);
        }
        setGALLEY_SHED_OFF() {
            this.hide(this.e_GALLEY_SHED_TOP);
            this.hide(this.e_GALLEY_SHED_BOTTOM);
        }

        setSTATINV_ON() {
            this.show(this.e_STATINV_TITLE);
            this.show(this.e_ARROW_BAT1_STATINV);
        }
        setSTATINV_OFF() {
            this.hide(this.e_STATINV_TITLE);
            this.hide(this.e_ARROW_BAT1_STATINV);
        }

        setCONNECTION_DCBAT_BAT1_ON() {
            this.show(this.e_WIRE_DCBAT_BAT1);
            this.show(this.e_WIRE_BAT1_DCBAT);
        }
        setCONNECTION_DCBAT_BAT1_OFF() {
            this.hide(this.e_WIRE_DCBAT_BAT1);
            this.hide(this.e_WIRE_BAT1_DCBAT);
        }

        setCONNECTION_DCBAT_BAT2_ON() {
            this.show(this.e_WIRE_DCBAT_BAT2);
            this.show(this.e_WIRE_BAT2_DCBAT);
        }
        setCONNECTION_DCBAT_BAT2_OFF() {
            this.hide(this.e_WIRE_DCBAT_BAT2);
            this.hide(this.e_WIRE_BAT2_DCBAT);
        }

        setCONNECTION_DCBAT_BAT1_CHARGE_ON() {
            this.show(this.e_WIRE_DCBAT_BAT1);
            this.show(this.e_ARROW_DCBAT_BAT1);
        }
        setCONNECTION_DCBAT_BAT1_CHARGE_OFF() {
            this.hide(this.e_WIRE_DCBAT_BAT1);
            this.hide(this.e_ARROW_DCBAT_BAT1);
        }

        setCONNECTION_DCBAT_BAT2_CHARGE_ON() {
            this.show(this.e_WIRE_DCBAT_BAT2);
            this.show(this.e_ARROW_DCBAT_BAT2);
        }
        setCONNECTION_DCBAT_BAT2_CHARGE_OFF() {
            this.hide(this.e_WIRE_DCBAT_BAT2);
            this.hide(this.e_ARROW_DCBAT_BAT2);
        }

        setCONNECTION_BAT1_DCBAT_DISCHARGE_ON() {
            this.show(this.e_WIRE_BAT1_DCBAT);
            this.show(this.e_ARROW_BAT1_DCBAT);
        }
        setCONNECTION_BAT1_DCBAT_DISCHARGE_OFF() {
            this.hide(this.e_WIRE_BAT1_DCBAT);
            this.hide(this.e_ARROW_BAT1_DCBAT);
        }

        setCONNECTION_BAT2_DCBAT_DISCHARGE_ON() {
            this.show(this.e_WIRE_BAT2_DCBAT);
            this.show(this.e_ARROW_BAT2_DCBAT);
        }
        setCONNECTION_BAT2_DCBAT_DISCHARGE_OFF() {
            this.hide(this.e_WIRE_BAT2_DCBAT);
            this.hide(this.e_ARROW_BAT2_DCBAT);
        }

        setCONNECTION_DC1_DCBAT_ON() {
            this.show(this.e_WIRE_DC1_DCBAT_A);
            this.show(this.e_WIRE_DC1_DCBAT_B);
        }
        setCONNECTION_DC1_DCBAT_OFF() {
            this.hide(this.e_WIRE_DC1_DCBAT_A);
            this.hide(this.e_WIRE_DC1_DCBAT_B);
        }

        setCONNECTION_DC2_DCBAT_ON() {
            this.show(this.e_WIRE_DC2_DCBAT_A);
            this.show(this.e_WIRE_DC2_DCBAT_B);
        }
        setCONNECTION_DC2_DCBAT_OFF() {
            this.hide(this.e_WIRE_DC2_DCBAT_A);
            this.hide(this.e_WIRE_DC2_DCBAT_B);
        }

        setCONNECTION_DCESS_DCBAT_ON() {
            this.show(this.e_WIRE_DCESS_DCBAT);
            this.show(this.e_WIRE_DC1_DCBAT_B);
        }
        setCONNECTION_DCESS_DCBAT_OFF() {
            this.hide(this.e_WIRE_DCESS_DCBAT);
            this.hide(this.e_WIRE_DC1_DCBAT_B);
        }

        setCONNECTION_ESSTR_DCESS_ON() {
            this.show(this.e_WIRE_ESSTR_DCESS);
        }
        setCONNECTION_ESSTR_DCESS_OFF() {
            this.hide(this.e_WIRE_ESSTR_DCESS);
        }

        setCONNECTION_EMERGEN_ESSTR_ON() {
            this.show(this.e_WIRE_EMERGEN_ESSTR);
        }
        setCONNECTION_EMERGEN_ESSTR_OFF() {
            this.hide(this.e_WIRE_EMERGEN_ESSTR);
        }

        setCONNECTION_EMERGEN_ACESS_ON() {
            this.show(this.e_WIRE_EMERGEN_ACESS);
            this.show(this.e_ARROW_EMERGEN_ACESS);
        }
        setCONNECTION_EMERGEN_ACESS_OFF() {
            this.hide(this.e_WIRE_EMERGEN_ACESS);
            this.hide(this.e_ARROW_EMERGEN_ACESS);
        }

        setCONNECTION_ACESS_ESSTR_ON() {
            this.show(this.e_WIRE_ACESS_ESSTR);
        }
        setCONNECTION_ACESS_ESSTR_OFF() {
            this.hide(this.e_WIRE_ACESS_ESSTR);
        }

        setCONNECTION_APUGEN_XFEED_ON() {
            this.show(this.e_WIRE_APUGEN_XFEED);
            this.show(this.e_ARROW_APUGEN_XFEED);
        }
        setCONNECTION_APUGEN_XFEED_OFF() {
            this.hide(this.e_WIRE_APUGEN_XFEED);
            this.hide(this.e_ARROW_APUGEN_XFEED);
        }

        setCONNECTION_EXTPWR_XFEED_ON() {
            this.show(this.e_WIRE_EXTPWR_XFEED);
            this.show(this.e_ARROW_EXTPWR_XFEED);
        }
        setCONNECTION_EXTPWR_XFEED_OFF() {
            this.hide(this.e_WIRE_EXTPWR_XFEED);
            this.hide(this.e_ARROW_EXTPWR_XFEED);
        }

        setCONNECTION_AC1_ACESS_ON() {
            this.show(this.e_WIRE_AC1_ACESS);
        }
        setCONNECTION_AC1_ACESS_OFF() {
            this.hide(this.e_WIRE_AC1_ACESS);
        }

        setCONNECTION_AC2_ACESS_ON() {
            this.show(this.e_WIRE_AC2_ACESS);
        }
        setCONNECTION_AC2_ACESS_OFF() {
            this.hide(this.e_WIRE_AC2_ACESS);
        }

        setCONNECTION_GEN1_AC1_ON() {
            this.show(this.e_WIRE_GEN1_XFEED);
            this.show(this.e_WIRE_XFEED_AC1);
            this.show(this.e_ARROW_XFEED_AC1);
        }
        setCONNECTION_GEN1_AC1_OFF() {
            this.hide(this.e_WIRE_GEN1_XFEED);
            this.hide(this.e_WIRE_XFEED_AC1);
            this.hide(this.e_ARROW_XFEED_AC1);
        }

        setCONNECTION_GEN2_AC2_ON() {
            this.show(this.e_WIRE_GEN2_XFEED);
            this.show(this.e_WIRE_XFEED_AC2);
            this.show(this.e_ARROW_XFEED_AC2);
        }
        setCONNECTION_GEN2_AC2_OFF() {
            this.hide(this.e_WIRE_GEN2_XFEED);
            this.hide(this.e_WIRE_XFEED_AC2);
            this.hide(this.e_ARROW_XFEED_AC2);
        }

        setCONNECTION_GEN1_XFEED_ON() {
            this.show(this.e_WIRE_GEN1_XFEED);
        }
        setCONNECTION_GEN1_XFEED_OFF() {
            this.hide(this.e_WIRE_GEN1_XFEED);
        }

        setCONNECTION_GEN2_XFEED_ON() {
            this.show(this.e_WIRE_GEN2_XFEED);
        }
        setCONNECTION_GEN2_XFEED_OFF() {
            this.hide(this.e_WIRE_GEN2_XFEED);
        }

        setCONNECTION_XFEED_ON() {
            this.show(this.e_WIRE_XFEED_A);
            this.show(this.e_WIRE_XFEED_B);
            this.show(this.e_WIRE_XFEED_C);
        }
        setCONNECTION_XFEED_OFF() {
            this.hide(this.e_WIRE_XFEED_A);
            this.hide(this.e_WIRE_XFEED_B);
            this.hide(this.e_WIRE_XFEED_C);
        }

        setCONNECTION_XFEED_A_ON() {
            this.show(this.e_WIRE_XFEED_A);
        }
        setCONNECTION_XFEED_A_OFF() {
            this.hide(this.e_WIRE_XFEED_A);
        }

        setCONNECTION_XFEED_B_ON() {
            this.show(this.e_WIRE_XFEED_B);
        }
        setCONNECTION_XFEED_B_OFF() {
            this.hide(this.e_WIRE_XFEED_B);
        }

        setCONNECTION_XFEED_C_ON() {
            this.show(this.e_WIRE_XFEED_C);
        }
        setCONNECTION_XFEED_C_OFF() {
            this.hide(this.e_WIRE_XFEED_C);
        }

        setCONNECTION_XFEED_AC1_ON() {
            this.show(this.e_WIRE_XFEED_AC1);
            this.show(this.e_ARROW_XFEED_AC1);
        }
        setCONNECTION_XFEED_AC1_OFF() {
            this.hide(this.e_WIRE_XFEED_AC1);
            this.hide(this.e_ARROW_XFEED_AC1);
        }

        setCONNECTION_XFEED_AC2_ON() {
            this.show(this.e_WIRE_XFEED_AC2);
            this.show(this.e_ARROW_XFEED_AC2);
        }
        setCONNECTION_XFEED_AC2_OFF() {
            this.hide(this.e_WIRE_XFEED_AC2);
            this.hide(this.e_ARROW_XFEED_AC2);
        }

        setCONNECTION_AC1_TR1_ON() {
            this.show(this.e_WIRE_AC1_TR1);
        }
        setCONNECTION_AC1_TR1_OFF() {
            this.hide(this.e_WIRE_AC1_TR1);
        }

        setCONNECTION_AC2_TR2_ON() {
            this.show(this.e_WIRE_AC2_TR2);
        }
        setCONNECTION_AC2_TR2_OFF() {
            this.hide(this.e_WIRE_AC2_TR2);
        }

        setCONNECTION_TR1_DC1_ON() {
            this.show(this.e_WIRE_TR1_DC1);
        }
        setCONNECTION_TR1_DC1_OFF() {
            this.hide(this.e_WIRE_TR1_DC1);
        }

        setCONNECTION_TR2_DC2_ON() {
            this.show(this.e_WIRE_TR2_DC2);
        }
        setCONNECTION_TR2_DC2_OFF() {
            this.hide(this.e_WIRE_TR2_DC2);
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
//# sourceMappingURL=A320_Neo_LowerECAM_Elec.js.map
