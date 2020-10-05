class A32NX_GPWS {
    constructor() {
        console.log('A32NX_GPWS constructed');
    }
    init() {
        console.log('A32NX_GPWS init');

        SimVar.SetSimVarValue("L:GPWS_SINK_RATE", "Bool", 0);
        SimVar.SetSimVarValue("L:GPWS_PULL_UP", "Bool", 0);
        SimVar.SetSimVarValue("L:GPWS_DONT_SINK", "Bool", 0);
        SimVar.SetSimVarValue("L:GPWS_TOO_LOW", "Enum", 0); // 0 (Off) 1 (Too Low Terrain) 2 (Too Low Gear) 3 (Too Low Flaps)

        //SimVar.SetSimVarValue("L:GPWS_MODE_2", "Enum", 0); // GPWS Mode 2 = 0 (Off) 1 (Terrain Terrain Pull Up) 2 (Terrain)
        //SimVar.SetSimVarValue("L:GPWS_MODE_5", "Enum", 0); // GPWS Mode 5 = 0 (Off)
    }

    update(deltaTime, _core) {
        this.faults();
        this.gpws();
    }

    gpws() {
        const SYS_PushButton = SimVar.GetSimVarValue("L:PUSH_OVHD_GPWS_SYS", "Bool");
        const FLAP_PushButton = SimVar.GetSimVarValue("L:PUSH_OVHD_GPWS_FLAP", "Bool");
        const altitude = Simplane.getAltitudeAboveGround();
        const vSpeed = Simplane.getVerticalSpeed();
        const Airspeed = SimVar.GetSimVarValue("AIRSPEED INDICATED", "Knots");

        if (!SYS_PushButton && altitude >= 10 && altitude <= 2450) { //Activate between 10 - 2450 radio alt unless SYS is off
            this.gpws_pull_up(altitude, vSpeed);
            this.gpws_sink_rate(altitude, vSpeed);
            this.gpws_dont_sink(altitude, vSpeed);
            this.gpws_too_low(altitude, Airspeed, FLAP_PushButton);
        } 
        else {
            SimVar.SetSimVarValue("L:GPWS_SINK_RATE", "Bool", 0);
            SimVar.SetSimVarValue("L:GPWS_PULL_UP", "Bool", 0);
            SimVar.SetSimVarValue("L:GPWS_DONT_SINK", "Bool", 0);
            SimVar.SetSimVarValue("L:GPWS_TOO_LOW", "Enum", 0);
        }
    }

    gpws_sink_rate(altitude, vSpeed) {
        let sink_rate = (altitude < 2500 && altitude > 1000 && vSpeed <= -2000) || (altitude < 1000 && vSpeed <= -1200);

        SimVar.SetSimVarValue("L:GPWS_SINK_RATE", "Bool", sink_rate);
    }

    gpws_pull_up(altitude, vSpeed) {
        let pull_up = (altitude < 2500 && altitude > 1000 && vSpeed <= -4000) || (altitude < 1000 && vSpeed <= -2400);

        SimVar.SetSimVarValue("L:GPWS_PULL_UP", "Bool", pull_up);
    }

    gpws_dont_sink(altitude, vSpeed) {
        let phase = SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "Enum");
        let dont_sink = false;

        if (phase == FlightPhase.FLIGHT_PHASE_TAKEOFF || phase == FlightPhase.FLIGHT_PHASE_GOAROUND) {
            if (altitude > 50 && altitude <= 100 && vSpeed <= -200)
                dont_sink = true;
            else if (altitude > 100 && altitude <= 600 && vSpeed <= -300)
                dont_sink = true;
            else if (altitude > 600 && altitude <= 750 && vSpeed <= -1000)
                dont_sink = true;
        }

        SimVar.SetSimVarValue("L:GPWS_DONT_SINK", "Bool", dont_sink);
    }

    gpws_too_low(altitude, Airspeed, FLAP_PushButton) {
        const phase = SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "Enum");
        const flaps = SimVar.GetSimVarValue("FLAPS HANDLE INDEX", "Number");
        const gear = SimVar.GetSimVarValue("GEAR POSITION:0", "Enum");

        let too_low_gear = false;
        let too_low_flaps = false;
        let too_low_terrain = false;

        if (phase != FlightPhase.FLIGHT_PHASE_TAKEOFF && FLAP_PushButton != 1) {
            too_low_gear = altitude < 500 && Airspeed < 195 && gear != 1;
            too_low_flaps = altitude < 250 && Airspeed < 160 && flaps != 4;
            if (Airspeed >= 240)
                too_low_terrain = altitude < 1000 && (gear != 1 || flaps != 4);
            else
                too_low_terrain = altitude < (Airspeed - 140) * 10 && (gear != 1 || flaps != 4);
        }

        if (too_low_gear)
            SimVar.SetSimVarValue("L:GPWS_TOO_LOW", "Enum", 2);
        else if (too_low_flaps)
            SimVar.SetSimVarValue("L:GPWS_TOO_LOW", "Enum", 3);
        else if (too_low_terrain)
            SimVar.SetSimVarValue("L:GPWS_TOO_LOW", "Enum", 1);
        else
            SimVar.SetSimVarValue("L:GPWS_TOO_LOW", "Enum", 0);
    }

    faults() { //GPWS System Fault Checks
        this.terr_fault();
        this.sys_fault();
    }

    terr_fault() {
        const posLAT = SimVar.GetSimVarValue("A:GPS POSITION LAT", "degree latitude");
        const ADIRS = SimVar.GetSimVarValue("L:A320_Neo_ADIRS_STATE", "Enum");
        const ADIRS_TIME = SimVar.GetSimVarValue("L:A320_Neo_ADIRS_TIME", "seconds");

        if (ADIRS == 0)
            SimVar.SetSimVarValue("L:PUSH_OVHD_GPWS_TERR_FAULT", "Bool", 1);
        else if (ADIRS == 1) //Maths will only be calculated if ADIRS in state 1 to save update time
            if (ADIRS_TIME > 120 + (0.055 * Math.pow(posLAT, 2))) //120 0.055 (A:GPS POSITION LAT, degree latitude) 2 pow * +
                SimVar.SetSimVarValue("L:PUSH_OVHD_GPWS_TERR_FAULT", "Bool", 1);
        else
            SimVar.SetSimVarValue("L:PUSH_OVHD_GPWS_TERR_FAULT", "Bool", 0);
    }

    sys_fault() {
        const posLAT = SimVar.GetSimVarValue("A:GPS POSITION LAT", "degree latitude");
        const ADIRS = SimVar.GetSimVarValue("L:A320_Neo_ADIRS_STATE", "Enum");
        const ADIRS_TIME = SimVar.GetSimVarValue("L:A320_Neo_ADIRS_TIME", "seconds");

        if (ADIRS == 0)
            SimVar.SetSimVarValue("L:PUSH_OVHD_GPWS_SYS_FAULT", "Bool", 1);
        else if (ADIRS == 1) //Maths will only be calculated if ADIRS in state 1 to save update time
            if (ADIRS_TIME > 305 + (0.095 * Math.pow(posLAT, 2)) - posLAT / 2) //305 0.095 (A:GPS POSITION LAT, degree latitude) 2 pow * + (A:GPS POSITION LAT, degree latitude) 2 / -
                SimVar.SetSimVarValue("L:PUSH_OVHD_GPWS_SYS_FAULT", "Bool", 1);
        else
            SimVar.SetSimVarValue("L:PUSH_OVHD_GPWS_SYS_FAULT", "Bool", 0);
    }
}