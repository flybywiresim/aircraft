class AS530 extends BaseGPS {
    get templateID() {
        return "AS530";
    }
    connectedCallback() {
        super.connectedCallback();
        this.menuMaxElems = 11;
        const defaultNav = new GPS_DefaultNavPage(5, [3, 4, 9, 7, 10]);
        defaultNav.element.addElement(new MapInstrumentElement());
        this.pageGroups = [
            new NavSystemPageGroup("NAV", this, [
                defaultNav,
                new NavSystemPage("Map", "Map", new NavSystemElementGroup([new MapInstrumentElement(), new GPS_MapInfos()])),
                new NavSystemPage("ComNav", "ComNav", new GPS_ComNav(8)),
            ]),
            new NavSystemPageGroup("WPT", this, [
                new NavSystemPage("AirportLocation", "AirportLocation", new GPS_AirportWaypointLocation(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("AirportRunway", "AirportRunway", new GPS_AirportWaypointRunways(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("AirportFrequency", "AirportFrequency", new GPS_AirportWaypointFrequencies(this.airportWaypointsIcaoSearchField, 8)),
                new NavSystemPage("AirportApproach", "AirportApproach", new GPS_AirportWaypointApproaches(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("Intersection", "Intersection", new GPS_IntersectionWaypoint()),
                new NavSystemPage("NDB", "NDB", new GPS_NDBWaypoint()),
                new NavSystemPage("VOR", "VOR", new GPS_VORWaypoint())
            ]),
            new NavSystemPageGroup("NRST", this, [
                new NavSystemPage("NRSTAirport", "NRSTAirport", new GPS_NearestAirports(4)),
                new NavSystemPage("NRSTIntersection", "NRSTIntersection", new GPS_NearestIntersection(8)),
                new NavSystemPage("NRSTNDB", "NRSTNDB", new GPS_NearestNDB(8)),
                new NavSystemPage("NRSTVOR", "NRSTVOR", new GPS_NearestVOR(8)),
                new NavSystemPage("NRSTAirspace", "NRSTAirspace", new GPS_NearestAirpaces()),
            ]),
            new NavSystemPageGroup("AUX", this, [
                new NavSystemPage("COMSetup", "COMSetup", new GPS_COMSetup())
            ])
        ];
        this.addEventLinkedPageGroup("DirectTo_Push", new NavSystemPageGroup("DRCT", this, [new NavSystemPage("DRCT", "DRCT", new GPS_DirectTo())]));
        this.addEventLinkedPageGroup("FPL_Push", new NavSystemPageGroup("FPL", this, [new NavSystemPage("ActiveFPL", "FlightPlanEdit", new GPS_ActiveFPL())]));
        this.addEventLinkedPageGroup("PROC_Push", new NavSystemPageGroup("PROC", this, [new NavSystemPage("Procedures", "Procedures", new GPS_Procedures())]));
        this.addEventLinkedPageGroup("MSG_Push", new NavSystemPageGroup("MSG", this, [new NavSystemPage("MSG", "MSG", new GPS_Messages())]));
        this.addIndependentElementContainer(new NavSystemElementContainer("VorInfos", "RadioPart", new AS530_VorInfos()));
    }
}
class AS530_VorInfos extends NavSystemElement {
    init(root) {
        this.vor = this.gps.getChildById("vorValue");
        this.rad = this.gps.getChildById("radValue");
        this.dis = this.gps.getChildById("disValue");
    }
    onEnter() {
    }
    onExit() {
    }
    onEvent(_event) {
    }
    onUpdate(_deltaTime) {
        const ident = SimVar.GetSimVarValue("NAV IDENT:1", "string");
        Avionics.Utils.diffAndSet(this.vor, ident != "" ? ident : "___");
        Avionics.Utils.diffAndSet(this.rad, (SimVar.GetSimVarValue("NAV HAS NAV:1", "bool") ? Math.round(SimVar.GetSimVarValue("NAV RELATIVE BEARING TO STATION:1", "degrees")).toFixed(0) : "___") + "°");
        Avionics.Utils.diffAndSet(this.dis, (SimVar.GetSimVarValue("NAV HAS DME:1", "bool") ? Math.round(SimVar.GetSimVarValue("NAV DME:1", "Nautical Miles")).toFixed(1) : "__._"));
    }
}
registerInstrument("as530-element", AS530);
//# sourceMappingURL=AS530.js.map