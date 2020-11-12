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
    }

    update(_deltaTime) {
        const gw = SimVar.GetSimVarValue("TOTAL WEIGHT", "kg") / 1000;
        const fhi = Simplane.getFlapsHandleIndex();
        if ((Math.round(gw * 10) / 10) !== this.lastGw || fhi !== this.lastFhi) {
            SimVar.SetSimVarValue("L:A32NX_VS", "number", this.getVs(gw, this.lastFhi === 0 ? 5 : fhi));
            SimVar.SetSimVarValue("L:A32NX_VLS", "number", this.getVls(gw, this.lastFhi === 0 ? 5 : fhi));
            this.lastGw = Math.round(gw * 10) / 10;
            this.lastFhi = fhi;
        }
    }

    getVs(gw, fhi) {
        switch (fhi) {
            // Clean Conf
            case 0: {
                switch (true) {
                    case (gw <= 40):
                        return 124;
                    case (gw <= 55):
                        return 124 + 1.4 * (gw - 40);
                    case (gw <= 65):
                        return 145 + gw - 55;
                    case (gw <= 70):
                        return 155 + 1.2 * (gw - 65);
                    case (gw <= 75):
                        return 161 + gw - 70;
                    default:
                        return 166 + 1.2 * (gw - 75);
                }
            }
            // Conf 1 + F
            case 1: {
                switch (true) {
                    case (gw <= 40):
                        return 93;
                    case (gw <= 55):
                        return 93 + gw - 40;
                    case (gw <= 60):
                        return 108 + .8 * (gw - 55);
                    case (gw <= 65):
                        return 112 + gw - 60;
                    case (gw <= 75):
                        return 117 + .8 + (gw - 65);
                    default:
                        return 125 + gw - 75;
                }
            }
            // Conf 2
            case 2: {
                switch (true) {
                    case (gw <= 40):
                        return 89;
                    case (gw <= 45):
                        return 89 + gw - 40;
                    case (gw <= 50):
                        return 94 + gw - 45;
                    case (gw <= 55):
                        return 99 + .8 * (gw - 50);
                    case (gw <= 60):
                        return 103 + gw - 55;
                    case (gw <= 65):
                        return 108 + .8 * (gw - 60);
                    case (gw <= 70):
                        return 112 + gw - 65;
                    case (gw <= 75):
                        return 117 + .6 * (gw - 70);
                    default:
                        return 120 + .8 * (gw - 75);
                }
            }
            // Conf 3
            case 3: {
                switch (true) {
                    case (gw <= 40):
                        return 89;
                    case (gw <= 45):
                        return 89 + gw - 40;
                    case (gw <= 50):
                        return 94 + gw - 45;
                    case (gw <= 55):
                        return 99 + .8 * (gw - 50);
                    case (gw <= 60):
                        return 103 + gw - 55;
                    case (gw <= 65):
                        return 108 + .8 * (gw - 60);
                    case (gw <= 70):
                        return 112 + gw - 65;
                    case (gw <= 75):
                        return 117 + .6 * (gw - 70);
                    default:
                        return 120 + .8 * (gw - 75);
                }
            }
            // Conf Full
            case 4: {
                switch (true) {
                    case (gw <= 40):
                        return 100;
                    case (gw <= 45):
                        return 84 + .8 * (gw - 40);
                    case (gw <= 50):
                        return 88 + gw - 45;
                    case (gw <= 75):
                        return 93 + .8 * (gw - 50);
                    default:
                        return 113 + .6 * (gw - 75);
                }
            }
            // Conf 1
            default: {
                switch (true) {
                    case (gw <= 40):
                        return 102;
                    case (gw <= 55):
                        return 102 + gw - 40;
                    case (gw <= 60):
                        return 117 + 1.2 * (gw - 55);
                    case (gw <= 65):
                        return 123 + .8 * (gw - 60);
                    case (gw <= 75):
                        return 132 + gw - 65;
                    default:
                        return 137 + .8 * (gw - 75);
                }
            }
        }
    }

    getVls(gw, fhi) {
        const cfp = Simplane.getCurrentFlightPhase();
        switch (fhi) {
            // Clean Conf
            case 0: {
                switch (true) {
                    case (gw <= 40):
                        return 159;
                    case (gw <= 55):
                        return 159 + 1.8 * (gw - 40);
                    case (gw <= 65):
                        return 186 + 1.2 * (gw - 55);
                    case (gw <= 70):
                        return 198 + 1.6 * (gw - 65);
                    case (gw <= 75):
                        return 206 + 1.2 * (gw - 70);
                    default:
                        return 212 + 1.6 * (gw - 75);
                }
            }
            // Conf 1 + F
            case 1: {
                if (cfp < FlightPhase.FLIGHT_PHASE_CLIMB) {
                    switch (true) {
                        case (gw <= 40):
                            return 105;
                        case (gw <= 45):
                            return 105 + 1.2 * (gw - 40);
                        case (gw <= 50):
                            return 111 + gw - 45;
                        case (gw <= 55):
                            return 116 + 1.2 * (gw - 50);
                        case (gw <= 70):
                            return 122 + gw - 55;
                        case (gw <= 75):
                            return 137 + .8 * (gw - 70);
                        default:
                            return 141 + 1.2 * (gw - 75);
                    }
                } else {
                    switch (true) {
                        case (gw <= 40):
                            return 114;
                        case (gw <= 45):
                            return 114 + 1.4 * (gw - 40);
                        case (gw <= 55):
                            return 121 + 1.2 * (gw - 45);
                        case (gw <= 60):
                            return 133 + gw - 55;
                        case (gw <= 65):
                            return 138 + 1.2 * (gw - 60);
                        case (gw <= 70):
                            return 144 + gw - 65;
                        default:
                            return 154 + 1.2 * (gw - 75);
                    }
                }
            }
            // Conf 2
            case 2: {
                if (cfp < FlightPhase.FLIGHT_PHASE_CLIMB) {
                    switch (true) {
                        case (gw <= 40):
                            return 101;
                        case (gw <= 45):
                            return 101 + 1.4 * (gw - 40);
                        case (gw <= 50):
                            return 108 + 1.2 * (gw - 45);
                        case (gw <= 55):
                            return 114 + gw - 50;
                        case (gw <= 60):
                            return 119 + 1.2 * (gw - 55);
                        case (gw <= 65):
                            return 125 + gw - 60;
                        case (gw <= 70):
                            return 130 + .4 * (gw - 65);
                        default:
                            return 132 + .8 * (gw - 70);
                    }
                } else {
                    switch (true) {
                        case (gw <= 40):
                            return 109;
                        case (gw <= 45):
                            return 109 + 1.8 * (gw - 40);
                        case (gw <= 60):
                            return 118 + 1.2 * (gw - 45);
                        case (gw <= 65):
                            return 136 + gw - 60;
                        case (gw <= 70):
                            return 141 + .43 * (gw - 65);
                        case (gw <= 75):
                            return 144 + .8 * (gw - 70);
                        default:
                            return 148 + gw - 75;
                    }
                }
            }
            // Conf 3
            case 3: {
                if (cfp < FlightPhase.FLIGHT_PHASE_CLIMB) {
                    switch (true) {
                        case (gw <= 40):
                            return 101;
                        case (gw <= 45):
                            return 101 + 1.4 * (gw - 40);
                        case (gw <= 50):
                            return 108 + 1.2 * (gw - 45);
                        case (gw <= 55):
                            return 114 + gw - 50;
                        case (gw <= 60):
                            return 119 + 1.2 * (gw - 55);
                        case (gw <= 65):
                            return 125 + gw - 60;
                        case (gw <= 70):
                            return 130 + .8 * (gw - 65);
                        case (gw <= 75):
                            return 134 + gw - 70;
                        default:
                            return 139 + .6 * (gw - 75);
                    }
                } else {
                    const cg = SimVar.GetSimVarValue("CG PERCENT", "percent");
                    if (((isNaN(cg)) ? 24 : cg) < 25) {
                        switch (true) {
                            case (gw <= 40):
                                return 116;
                            case (gw <= 45):
                                return 116 + .4 * (gw - 40);
                            case (gw <= 60):
                                return 118 + 1.2 * (gw - 45);
                            case (gw <= 75):
                                return 136 + gw - 60;
                            default:
                                return 150 + gw - 75;
                        }
                    }
                    switch (true) {
                        case (gw <= 45):
                            return 116;
                        case (gw <= 50):
                            return 116 + 1.4 * (gw - 45);
                        case (gw <= 55):
                            return 123 + 1.2 * (gw - 50);
                        case (gw <= 60):
                            return 129 + gw - 55;
                        case (gw <= 65):
                            return 134 + 1.2 * (gw - 60);
                        default:
                            return 140 + gw - 65;
                    }
                }
            }
            // Conf Full
            case 4: {
                const cg = SimVar.GetSimVarValue("CG PERCENT", "percent");
                if (((isNaN(cg)) ? 24 : cg) < 25) {
                    switch (true) {
                        case (gw <= 50):
                            return 116;
                        case (gw >= 75):
                            return 139 + .8 * (gw - 75);
                        case (gw <= 55):
                            return 116 + .8 * (gw - 50);
                        case (gw <= 70):
                            return 120 + gw - 55;
                        default:
                            return 135 + .8 * (gw - 70);
                    }
                }
                switch (true) {
                    case (gw <= 50):
                        return 116;
                    case (gw >= 75):
                        return 139 + .8 * (gw - 75);
                    case (gw <= 55):
                        return 116 + .6 * (gw - 50);
                    default:
                        return 119 + gw - 55;
                }
            }
            // Conf 1
            default: {
                switch (true) {
                    case (gw <= 40):
                        return 125;
                    case (gw <= 45):
                        return 125 + 1.4 * (gw - 40);
                    case (gw <= 55):
                        return 132 + 1.2 * (gw - 45);
                    case (gw <= 60):
                        return 144 + 1.4 * (gw - 55);
                    case (gw <= 65):
                        return 151 + gw - 60;
                    case (gw <= 70):
                        return 156 + 1.2 * (gw - 65);
                    case (gw <= 75):
                        return 162 + 1.4 * (gw - 70);
                    default:
                        return 169 + .8 * (gw - 75);
                }
            }
        }
    }
}