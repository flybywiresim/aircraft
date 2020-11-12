const vs = [
    [
        () => 124,
        (gw) => 124 + 1.4 * (gw - 40),
        (gw) => 131 + 1.4 * (gw - 45),
        (gw) => 138 + 1.4 * (gw - 50),
        (gw) => 145 + gw - 55,
        (gw) => 150 + 1.2 * (gw - 60),
        (gw) => 155 + 1.2 * (gw - 65),
        (gw) => 161 + gw - 70,
        (gw) => 166 + 1.2 * (gw - 75),
        () => 172
    ], // Clean Conf
    [
        () => 93,
        (gw) => 93 + gw - 40,
        (gw) => 98 + gw - 45,
        (gw) => 103 + gw - 50,
        (gw) => 108 + .8 * (gw - 55),
        (gw) => 112 + gw - 60,
        (gw) => 117 + .8 + (gw - 65),
        (gw) => 121 + .8 + (gw - 70),
        (gw) => 125 + gw - 75,
        () => 130
    ], // Conf 1 + F
    [
        () => 89,
        (gw) => 89 + gw - 40,
        (gw) => 94 + gw - 45,
        (gw) => 99 + .8 * (gw - 50),
        (gw) => 103 + gw - 55,
        (gw) => 108 + .8 * (gw - 60),
        (gw) => 112 + gw - 65,
        (gw) => 117 + .6 * (gw - 70),
        (gw) => 120 + .8 * (gw - 75),
        () => 124
    ], // Conf 2
    [
        () => 89,
        (gw) => 89 + gw - 40,
        (gw) => 94 + gw - 45,
        (gw) => 99 + .8 * (gw - 50),
        (gw) => 103 + gw - 55,
        (gw) => 108 + .8 * (gw - 60),
        (gw) => 112 + gw - 65,
        (gw) => 117 + .6 * (gw - 70),
        (gw) => 120 + .8 * (gw - 75),
        () => 124
    ], // Conf 3
    [
        () => 84,
        (gw) => 84 + .8 * (gw - 40),
        (gw) => 88 + gw - 45,
        (gw) => 93 + .8 * (gw - 50),
        (gw) => 97 + .8 * (gw - 55),
        (gw) => 101 + .8 * (gw - 60),
        (gw) => 105 + .8 * (gw - 65),
        (gw) => 109 + .8 * (gw - 70),
        (gw) => 113 + .6 * (gw - 75),
        () => 116
    ], // Conf Full
    [
        () => 102,
        (gw) => 102 + gw - 40,
        (gw) => 107 + gw - 45,
        (gw) => 112 + gw - 50,
        (gw) => 117 + 1.2 * (gw - 55),
        (gw) => 123 + .8 * (gw - 60),
        (gw) => 127 + gw - 65,
        (gw) => 132 + gw - 70,
        (gw) => 137 + .8 * (gw - 75),
        () => 141
    ] // Conf 1
];

const vls = [
    [
        () => 159,
        (gw) => 159 + 1.8 * (gw - 40),
        (gw) => 168 + 1.8 * (gw - 45),
        (gw) => 177 + 1.8 * (gw - 50),
        (gw) => 186 + 1.2 * (gw - 55),
        (gw) => 192 + 1.2 * (gw - 60),
        (gw) => 198 + 1.6 * (gw - 65),
        (gw) => 206 + 1.2 * (gw - 70),
        (gw) => 212 + 1.6 * (gw - 75),
        () => 220
    ], // Clean Config
    [
        (_, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => p ? 105 : 114,
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => p ? 105 + 1.2 * (gw - 40) : 114 + 1.4 * (gw - 40),
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => p ? 111 + gw - 45 : 121 + 1.2 * (gw - 45),
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => p ? 116 + 1.2 * (gw - 50) : 127 + 1.2 * (gw - 50),
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => (p ? 122 : 133) + gw - 55,
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => p ? 127 + gw - 60 : 138 + 1.2 * (gw - 60),
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => (p ? 132 : 144) + gw - 65,
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => p ? 137 + .8 * (gw - 70) : 149 + gw - 70,
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => p ? 141 + 1.2 * (gw - 75) : 154 + 1.2 * (gw - 75),
        (_, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => p ? 147 : 160
    ], // Config 1 + F
    [
        (_, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => p ? 101 : 109,
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => p ? 101 + 1.4 * (gw - 40) : 109 + 1.8 * (gw - 40),
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => (p ? 108 : 118) + 1.2 * (gw - 45),
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => p ? 114 + gw - 50 : 124 + 1.2 * (gw - 50),
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => (p ? 119 : 130) + 1.2 * (gw - 55),
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => (p ? 125 : 136) + gw - 60,
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => p ? 130 + .4 * (gw - 65) : 141 + .6 * (gw - 65),
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => (p ? 132 : 144) + .8 * (gw - 70),
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => p ? 136 + .8 * (gw - 75) : 148 + gw - 75,
        (_, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => p ? 140 : 153
    ], // Config 2
    [
        (_, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => p ? 101 : 116,
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB, cg = SimVar.GetSimVarValue("CG PERCENT", "percent")) => p ? 101 + 1.4 * (gw - 40) : ((isNaN(cg)) ? 24 : cg) < 25 ? 116 + .4 * (gw - 40) : 116,
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB, cg = SimVar.GetSimVarValue("CG PERCENT", "percent")) => p ? 108 + 1.2 * (gw - 45) : ((isNaN(cg)) ? 24 : cg) < 25 ? 118 + 1.2 * (gw - 45) : 116 + 1.4 * (gw - 45),
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB, cg = SimVar.GetSimVarValue("CG PERCENT", "percent")) => p ? 114 + gw - 50 : ((isNaN(cg)) ? 24 : cg) < 25 ? 124 + 1.2 * (gw - 50) : 123 + 1.2 * (gw - 50),
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB, cg = SimVar.GetSimVarValue("CG PERCENT", "percent")) => p ? 119 + 1.2 * (gw - 55) : ((isNaN(cg)) ? 24 : cg) < 25 ? 130 + 1.2 * (gw - 55) : 129 + gw - 55,
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB, cg = SimVar.GetSimVarValue("CG PERCENT", "percent")) => p ? 125 + gw - 60 : ((isNaN(cg)) ? 24 : cg) < 25 ? 136 + gw - 60 : 134 + 1.2 * (gw - 60),
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB, cg = SimVar.GetSimVarValue("CG PERCENT", "percent")) => p ? 130 + .8 * (gw - 65) : (((isNaN(cg)) ? 24 : cg) < 25 ? 141 : 140) + gw - 65,
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB, cg = SimVar.GetSimVarValue("CG PERCENT", "percent")) => p ? 134 + gw - 70 : (((isNaN(cg)) ? 24 : cg) < 25 ? 146 : 145) + gw - 70,
        (gw, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB, cg = SimVar.GetSimVarValue("CG PERCENT", "percent")) => p ? 139 + .6 * (gw - 75) : ((isNaN(cg)) ? 24 : cg) < 25 ? 151 + .8 * (gw - 75) : 150 + gw - 65,
        (_, p = Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) => p ? 142 : 155
    ], // Config 3
    [
        () => 116,
        () => 116,
        () => 116,
        (gw, cg = SimVar.GetSimVarValue("CG PERCENT", "percent")) => 116 + (((isNaN(cg)) ? 24 : cg) < 25 ? .8 : .6) * (gw - 50),
        (gw, cg = SimVar.GetSimVarValue("CG PERCENT", "percent")) => (((isNaN(cg)) ? 24 : cg) < 25 ? 120 : 119) + gw - 55,
        (gw, cg = SimVar.GetSimVarValue("CG PERCENT", "percent")) => (((isNaN(cg)) ? 24 : cg) < 25 ? 125 : 124) + gw - 60,
        (gw, cg = SimVar.GetSimVarValue("CG PERCENT", "percent")) => (((isNaN(cg)) ? 24 : cg) < 25 ? 130 : 129) + gw - 65,
        (gw, cg = SimVar.GetSimVarValue("CG PERCENT", "percent")) => ((isNaN(cg)) ? 24 : cg) < 25 ? 135 + .8 * (gw - 70) : 134 + gw - 70,
        (gw) => 139 + .8 * (gw - 75),
        () => 143
    ], // Config Full
    [
        () => 125,
        (gw) => 125 + 1.4 * (gw - 40),
        (gw) => 132 + 1.2 * (gw - 45),
        (gw) => 138 + 1.2 * (gw - 50),
        (gw) => 144 + 1.4 * (gw - 55),
        (gw) => 151 + gw - 60,
        (gw) => 156 + 1.2 * (gw - 65),
        (gw) => 162 + 1.4 * (gw - 70),
        (gw) => 169 + .8 * (gw - 75),
        () => 173
    ] // Config 1
];

class A32NX_Vspeeds {
    constructor() {
        console.log('A32NX_VSPEEDS constructed');
    }

    init() {
        console.log('A32NX_VSPEEDS init');
        SimVar.SetSimVarValue("L:A32NX_VS", "number", 0);
        SimVar.SetSimVarValue("L:A32NX_VLS", "number", 0);
        this.lastGw = -1;
        this.lastFhi = -1;
        this.curFhi = -1;
    }

    update(_deltaTime) {
        const gw = SimVar.GetSimVarValue("TOTAL WEIGHT", "kg") / 1000;
        const fhi = Simplane.getFlapsHandleIndex();
        if (fhi !== this.lastFhi) {
            this.curFhi = this.lastFhi === 0 ? 5 : fhi;
            this.lastFhi = fhi;
            this.updateVspeeds(gw);
        } else if ((Math.round(gw * 10) / 10) !== this.lastGw) {
            this.lastGw = Math.round(gw * 10) / 10;
            this.updateVspeeds(gw);
        }
    }

    updateVspeeds(gw) {
        const cgw = Math.ceil(((gw > 80 ? 80 : gw) - 40) / 5);
        SimVar.SetSimVarValue("L:A32NX_VS", "number", vs[this.curFhi][cgw](gw));
        SimVar.SetSimVarValue("L:A32NX_VLS", "number", vls[this.curFhi][cgw](gw));
    }
}