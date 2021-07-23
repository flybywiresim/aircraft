class A32NX_PACK {
    constructor() {
        console.log('A32NX_PACK constructed');
    }
    init() {
        console.log('A32NX_PACK init');

        this.engTempMultiplier1 = 0.08;
        this.engTempMultiplier2 = 0.0000009;
        this.engTempMultiplier3 = 0.31;
        this.engTempOffsetH = -510;
        this.engTempOffsetV = 200;
        this.engTempOffsetH2 = -860;
        this.engTempOffsetV2 = 276.4;

        this.temperatureVariationSpeed = 0.01;

        this.packInMultiplier = 0.9;
        this.packInMultiplierApu = 0.8;
        this.packOutMultiplier1 = 0.055;
        this.packOutMultiplier2 = 0.055;
        this.packOutMultiplierApu = 0.1;
    }
    update(_deltaTime) {
        this.xBleedValve();
        this.packState();
        this.engTemp();
        this.engPackTemp();
        this.packFault(1);
        this.packFault(2);
        this.packFlow();
    }

    engTemp() {
        const eng1TmpValue = SimVar.GetSimVarValue("ENG EXHAUST GAS TEMPERATURE:1", "Celsius");
        const eng2TmpValue = SimVar.GetSimVarValue("ENG EXHAUST GAS TEMPERATURE:2", "Celsius");

        let eng1TmpComputed;
        let eng2TmpComputed;

        if (eng1TmpValue < 860) {
            eng1TmpComputed = Math.round((this.engTempMultiplier1 * (eng1TmpValue + this.engTempOffsetH)) + (this.engTempMultiplier2 * (eng1TmpValue + this.engTempOffsetH) ** 3) + this.engTempOffsetV);
        } else {
            eng1TmpComputed = Math.round(this.engTempMultiplier3 * (eng1TmpValue + this.engTempOffsetH2) + this.engTempOffsetV2);
        }

        if (eng2TmpValue < 860) {
            eng2TmpComputed = Math.round(((this.engTempMultiplier1 * (eng2TmpValue + this.engTempOffsetH)) + (this.engTempMultiplier2 * (eng2TmpValue + this.engTempOffsetH) ** 3) + this.engTempOffsetV));
        } else {
            eng2TmpComputed = Math.round(this.engTempMultiplier3 * (eng2TmpValue + this.engTempOffsetH2) + this.engTempOffsetV2);
        }

        this.eng1Tmp = eng1TmpComputed;
        this.eng2Tmp = eng2TmpComputed;
        SimVar.SetSimVarValue("L:A32NX_ENG1_TEMP", "Celsius", eng1TmpComputed);
        SimVar.SetSimVarValue("L:A32NX_ENG2_TEMP", "Celsius", eng2TmpComputed);
    }

    engPackTemp() {
        const isEng1Running = SimVar.GetSimVarValue("L:A32NX_ENGINE_STATE:1", "Number");
        const isEng2Running = SimVar.GetSimVarValue("L:A32NX_ENGINE_STATE:2", "Number");

        const eng1TLA = SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_TLA:1", "number");
        const eng2TLA = SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_TLA:2", "number");
        const isAircraftOnToga = eng1TLA > 42 && eng2TLA > 42;

        const pack1Button = SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK1_TOGGLE", "Number");
        const pack2Button = SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK1_TOGGLE", "Number");
        const isBothPackOn = pack1Button && pack2Button;

        const packRequestedlvl = Math.min(...[SimVar.GetSimVarValue("L:A320_Neo_AIRCOND_LVL_1", "number"),
            SimVar.GetSimVarValue("L:A320_Neo_AIRCOND_LVL_2", "number"),
            SimVar.GetSimVarValue("L:A320_Neo_AIRCOND_LVL_3", "number")]);
        const packRequestedTemp = 18 + (0.12 * packRequestedlvl);

        const apuTMPcomputed = SimVar.GetSimVarValue("L:A32NX_APU_TEMP", "Celsius");

        const eng1Tmp = SimVar.GetSimVarValue("L:A32NX_ENG1_TEMP", "Celsius");
        const eng2Tmp = SimVar.GetSimVarValue("L:A32NX_ENG2_TEMP", "Celsius");

        const currentPackFlow = SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACKFLOW_MODE", "Number");

        const eng1PackInTmp = Math.round(eng1Tmp * this.packInMultiplier);
        const eng2PackInTmp = Math.round(eng2Tmp * this.packInMultiplier);
        const apuPackInTmp = Math.round(apuTMPcomputed * this.packInMultiplierApu);

        const eng1PackOutTmp = Math.round(eng1Tmp * this.packOutMultiplier1);
        const eng2PackOutTmp = Math.round(eng2Tmp * this.packOutMultiplier2);
        const apuPackOutTmp = Math.round(apuTMPcomputed * this.packOutMultiplierApu);

        let packTemperatureVariation1 = 0;
        let packTemperatureVariation2 = 0;

        if (isEng1Running !== 0 && isBothPackOn && !isAircraftOnToga) {
            packTemperatureVariation1 = ((((packRequestedTemp / eng1PackOutTmp) * this.packOutMultiplier1) - this.packOutMultiplier1));
            this.packOutMultiplier1 += packTemperatureVariation1 * (this.temperatureVariationSpeed * (0.8 + (currentPackFlow * 0.2)));
        } else if (isEng1Running !== 0) {
            packTemperatureVariation1 = ((((packRequestedTemp / eng1PackOutTmp) * this.packOutMultiplier1) - this.packOutMultiplier1));
            this.packOutMultiplier1 += packTemperatureVariation1 * (this.temperatureVariationSpeed * (1.2));
        }

        if (isEng2Running !== 0 && isBothPackOn && !isAircraftOnToga) {
            packTemperatureVariation2 = ((((packRequestedTemp / eng2PackOutTmp) * this.packOutMultiplier2) - this.packOutMultiplier2));
            this.packOutMultiplier2 += packTemperatureVariation2 * (this.temperatureVariationSpeed * (0.8 + (currentPackFlow * 0.2)));
        } else if (isEng2Running !== 0) {
            packTemperatureVariation2 = ((((packRequestedTemp / eng1PackOutTmp) * this.packOutMultiplier2) - this.packOutMultiplier2));
            this.packOutMultiplier2 += packTemperatureVariation2 * (this.temperatureVariationSpeed * (1.2));
        }

        if (isBothPackOn && !isAircraftOnToga) {
            const packTemperatureVariationAPU = ((((packRequestedTemp / apuPackOutTmp) * this.packOutMultiplierApu) - this.packOutMultiplierApu));
            this.packOutMultiplierApu += packTemperatureVariationAPU * (this.temperatureVariationSpeed * (0.8 + (currentPackFlow * 0.2)));
        } else {
            const packTemperatureVariationAPU = ((((packRequestedTemp / apuPackOutTmp) * this.packOutMultiplierApu) - this.packOutMultiplierApu));
            this.packOutMultiplierApu += packTemperatureVariationAPU * (this.temperatureVariationSpeed * (1.2));
        }

        SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK1_IN_TEMP", "Celsius", eng1PackInTmp);
        SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK2_IN_TEMP", "Celsius", eng2PackInTmp);
        SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK_APU_IN_TEMP", "Celsius", apuPackInTmp);

        SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK1_OUT_TEMP", "Celsius", eng1PackOutTmp);
        SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK2_OUT_TEMP", "Celsius", eng2PackOutTmp);
        SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK_APU_OUT_TEMP", "Celsius", apuPackOutTmp);
    }

    xBleedValve() {
        const ovhdXBleedPosition = SimVar.GetSimVarValue("L:A32NX_KNOB_OVHD_AIRCOND_XBLEED_Position", "Number");
        const isApuBleedAirValveOpen = SimVar.GetSimVarValue("L:A32NX_APU_BLEED_AIR_VALVE_OPEN", "Bool");

        if (ovhdXBleedPosition === 2) {
            SimVar.SetSimVarValue("L:A32NX_XBLEED_VALVE", "Bool", true);
            return;
        } else if (ovhdXBleedPosition === 1 && isApuBleedAirValveOpen) {
            SimVar.SetSimVarValue("L:A32NX_XBLEED_VALVE", "Bool", true);
            return;
        }
        SimVar.SetSimVarValue("L:A32NX_XBLEED_VALVE", "Bool", false);
    }

    packState() {
        const eng1State = SimVar.GetSimVarValue("L:A32NX_ENGINE_STATE:1", "Number");
        const eng2State = SimVar.GetSimVarValue("L:A32NX_ENGINE_STATE:2", "Number");
        const isXBleedValveOpen = SimVar.GetSimVarValue("L:A32NX_XBLEED_VALVE", "Bool");
        const pack1Button = SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK1_TOGGLE", "Bool");
        const pack2Button = SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK1_TOGGLE", "Bool");

        if ((eng1State === 2 || eng2State === 2) && isXBleedValveOpen) {
            SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK1_OPEN", "Bool", false);
            SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK2_OPEN", "Bool", false);
            return;
        } else if (eng2State === 2 && !isXBleedValveOpen) {
            SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK2_OPEN", "Bool", false);
            return;
        } else if (eng1State === 2 && !isXBleedValveOpen) {
            SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK1_OPEN", "Bool", false);
            return;
        } else {
            SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK1_OPEN", "Bool", pack1Button);
            SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK2_OPEN", "Bool", pack2Button);
        }
    }

    packFault(pack) {
        SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK" + pack + "_FAULT", "bool", false);

        const packValve = SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK" + pack + "_OPEN", "Bool");
        const isEngProvideBleed = SimVar.GetSimVarValue("BLEED AIR ENGINE:" + pack, "Bool");
        const engState = SimVar.GetSimVarValue("L:A32NX_ENGINE_STATE:" + pack, "Number");
        if (packValve && isEngProvideBleed && engState !== 0) {
            return;
        }

        const isApuBleedValueOpen = SimVar.GetSimVarValue("L:A32NX_APU_BLEED_AIR_VALVE_OPEN", "Bool");
        if (packValve && isApuBleedValueOpen && xBleedValve) {
            return;
        }

        let otherEngineProvideBleed;
        if (pack === 1) {
            otherEngineProvideBleed = SimVar.GetSimVarValue("BLEED AIR ENGINE:2", "Bool");
        } else {
            otherEngineProvideBleed = SimVar.GetSimVarValue("BLEED AIR ENGINE:1", "Bool");
        }

        let otherEngineState;
        if (pack === 1) {
            otherEngineState = SimVar.GetSimVarValue("L:A32NX_ENGINE_STATE:2", "Number");
        } else {
            otherEngineState = SimVar.GetSimVarValue("L:A32NX_ENGINE_STATE:1", "Number");
        }

        const xBleedValve = SimVar.GetSimVarValue("L:A32NX_XBLEED_VALVE", "Bool");
        if (packValve && xBleedValve && otherEngineState !== 0 && otherEngineProvideBleed) {
            return;
        }

        console.log("this is pack " + pack);

        SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK" + pack + "_FAULT", "bool", true);
    }

    packFlow() {
        const packFlowKnob = SimVar.GetSimVarValue("L:A32NX_KNOB_OVHD_AIRCOND_PACKFLOW_Position", "Number");
        const isApuBleedValueOpen = SimVar.GetSimVarValue("L:A32NX_APU_BLEED_AIR_VALVE_OPEN", "Bool");

        const isLeftPackOpen = SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK1_OPEN", "Bool");
        const isRightPackOpen = SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK2_OPEN", "Bool");
        const isAircraftOnSinglePack = !!(!(isLeftPackOpen && isRightPackOpen) && (isLeftPackOpen || isRightPackOpen));

        const eng1TLA = SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_TLA:1", "Number");
        const eng2TLA = SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_TLA:2", "Number");
        const isAircraftOnToga = eng1TLA > 42 && eng2TLA > 42;

        const isEng1ProvideBleed = SimVar.GetSimVarValue("BLEED AIR ENGINE:1", "Bool");
        const isEng2ProvideBleed = SimVar.GetSimVarValue("BLEED AIR ENGINE:2", "Bool");

        const packFlowPosition = (isAircraftOnToga || isAircraftOnSinglePack || (isApuBleedValueOpen && !isEng1ProvideBleed && !isEng2ProvideBleed)) ? 2 : packFlowKnob;

        SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACKFLOW_MODE", "Number", packFlowPosition);
    }
}
