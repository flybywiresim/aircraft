class A32NX_ADIRS {
    init() {

    }

    update(deltaTime) {
        const AllADIRSOn = ((SimVar.GetSimVarValue("L:A320_Neo_ADIRS_KNOB_1", "Enum") >= 1) && (SimVar.GetSimVarValue("L:A320_Neo_ADIRS_KNOB_2", "Enum") >= 1) && (SimVar.GetSimVarValue("L:A320_Neo_ADIRS_KNOB_3", "Enum") >= 1));
        const SomeADIRSOn = ((SimVar.GetSimVarValue("L:A320_Neo_ADIRS_KNOB_1", "Enum") >= 1) || (SimVar.GetSimVarValue("L:A320_Neo_ADIRS_KNOB_2", "Enum") >= 1) || (SimVar.GetSimVarValue("L:A320_Neo_ADIRS_KNOB_3", "Enum") >= 1));
        let ADIRSState = SimVar.GetSimVarValue("L:A320_Neo_ADIRS_STATE", "Enum");
        let ADIRSTimer = SimVar.GetSimVarValue("L:A320_Neo_ADIRS_TIME", "Seconds");

        if (!SomeADIRSOn && ADIRSState != 0) {
            //Turn off ADIRS
            SimVar.SetSimVarValue("L:A320_Neo_ADIRS_STATE", "Enum", 0);
            SimVar.SetSimVarValue("L:A320_Neo_ADIRS_IN_ALIGN", "Bool", 0);
            SimVar.SetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_FIRST", "Bool", 0);
            SimVar.SetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_ATT", "Bool", 0);
            ADIRSState = 0;
        }

        if (AllADIRSOn && ADIRSState == 0) {
            //Start ADIRS Alignment
            SimVar.SetSimVarValue("L:A320_Neo_ADIRS_STATE", "Enum", 1);
            SimVar.SetSimVarValue("L:A320_Neo_ADIRS_IN_ALIGN", "Bool", 1); // DEFAULT ALIGN ON GPS
            SimVar.SetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_FIRST", "Bool", 0);
            SimVar.SetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_ATT", "Bool", 0);
            ADIRSState = 1;
            const currentLatitude = SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude");
            ADIRSTimer = (Math.pow(currentLatitude, 2) * 0.095) + 310; // ADIRS ALIGN TIME DEPENDING ON LATITUDE.
            SimVar.SetSimVarValue("L:A320_Neo_ADIRS_TIME", "Seconds", ADIRSTimer);
            SimVar.SetSimVarValue("L:A32NX_Neo_ADIRS_START_TIME", "Seconds", ADIRSTimer);
        }

        if (ADIRSState == 1 && SimVar.GetSimVarValue("L:A320_Neo_ADIRS_IN_ALIGN", "Bool") == 1) {
            if (ADIRSTimer > 0) {
                ADIRSTimer -= deltaTime / 1000;
                SimVar.SetSimVarValue("L:A320_Neo_ADIRS_TIME", "Seconds", ADIRSTimer);
                const ADIRSTimerStartTime = SimVar.GetSimVarValue("L:A32NX_Neo_ADIRS_START_TIME", "Seconds");
                const secondsIntoAlignment = ADIRSTimerStartTime - ADIRSTimer;
                if (SimVar.GetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_FIRST", "Bool") == 0 && secondsIntoAlignment > 18) {
                    SimVar.SetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_FIRST", "Bool", 1);
                }
                if (SimVar.GetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_ATT", "Bool") == 0 && secondsIntoAlignment > 28) {
                    SimVar.SetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_ATT", "Bool", 1);
                }
                if (ADIRSTimer <= 0) {
                    //ADIRS Alignment Completed
                    SimVar.SetSimVarValue("L:A320_Neo_ADIRS_STATE", "Enum", 2);
                    SimVar.SetSimVarValue("L:A320_Neo_ADIRS_IN_ALIGN", "Bool", 0);
                }
            }
        }

        if (ADIRSState == 2) {
            SimVar.SetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_FIRST", "Bool", 1);
            SimVar.SetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_ATT", "Bool", 1);
        }

        //Align light
        SimVar.SetSimVarValue("L:A320_Neo_ADIRS_ALIGN_LIGHT_1", "Bool", (SimVar.GetSimVarValue("L:A320_Neo_ADIRS_KNOB_1", "Enum") == 1 && ADIRSState != 2));
        SimVar.SetSimVarValue("L:A320_Neo_ADIRS_ALIGN_LIGHT_2", "Bool", (SimVar.GetSimVarValue("L:A320_Neo_ADIRS_KNOB_2", "Enum") == 1 && ADIRSState != 2));
        SimVar.SetSimVarValue("L:A320_Neo_ADIRS_ALIGN_LIGHT_3", "Bool", (SimVar.GetSimVarValue("L:A320_Neo_ADIRS_KNOB_3", "Enum") == 1 && ADIRSState != 2));

    }
}