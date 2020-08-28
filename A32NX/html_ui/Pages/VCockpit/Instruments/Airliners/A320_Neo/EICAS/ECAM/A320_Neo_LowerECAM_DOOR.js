var A320_Neo_LowerECAM_DOOR;
(function (A320_Neo_LowerECAM_DOOR) {
    class Definitions {
    }
    A320_Neo_LowerECAM_DOOR.Definitions = Definitions;
    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
        }
        get templateID() { return "LowerECAMDOORTemplate"; }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            // Doors
            this.cabinDoorShape = this.querySelector("#DoorFrontLeft");
            this.cateringDoorShape = this.querySelector("#DoorBackRight");
            this.forwardCargoDoorShape = this.querySelector("#DoorFwdCargo");

            // Slide text
            this.slide1 = this.querySelector("#slide1");
            this.slide2 = this.querySelector("#slide2");
            this.slide3 = this.querySelector("#slide3");
            this.slide4 = this.querySelector("#slide4");
            this.slide5 = this.querySelector("#slide5");
            this.slide6 = this.querySelector("#slide6");

            // Door text
            this.cabin1 = this.querySelector("#cabin1");
            this.cabin4 = this.querySelector("#cabin4");
            this.cargo1 = this.querySelector("#cargo1");
            this.cabin1dash = this.querySelector("#cabin1dash");
            this.cabin4dash = this.querySelector("#cabin4dash");
            this.cargo1dash = this.querySelector("#cargo1dash");

            this.isInitialised = true;
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            // Get door statuses
            var cabinDoorPctOpen = SimVar.GetSimVarValue("INTERACTIVE POINT OPEN:0", "percent");
            var cateringDoorPctOpen = SimVar.GetSimVarValue("INTERACTIVE POINT OPEN:3", "percent");
            var fwdCargoPctOpen = SimVar.GetSimVarValue("INTERACTIVE POINT OPEN:5", "percent");

            // Get info for arming slides
            var isBeaconOn = SimVar.GetSimVarValue("LIGHT BEACON ON", "bool");
            var isOnGround = SimVar.GetSimVarValue("SIM ON GROUND", "bool");
            var isOnRunway = SimVar.GetSimVarValue("ON ANY RUNWAY", "bool");

            if (cabinDoorPctOpen >= 20) {
                this.cabinDoorShape.setAttribute("class", "DoorWarningShape");
                this.cabin1.setAttribute("visibility", "visible");
                this.cabin1dash.setAttribute("visibility", "visible");
            } else {
                this.cabinDoorShape.setAttribute("class", "DoorShape");
                this.cabin1.setAttribute("visibility", "hidden");
                this.cabin1dash.setAttribute("visibility", "hidden");
            }
            if (cateringDoorPctOpen >= 20) {
                this.cateringDoorShape.setAttribute("class", "DoorWarningShape");
                this.cabin4.setAttribute("visibility", "visible");
                this.cabin4dash.setAttribute("visibility", "visible");
            } else {
                this.cateringDoorShape.setAttribute("class", "DoorShape");
                this.cabin4.setAttribute("visibility", "hidden");
                this.cabin4dash.setAttribute("visibility", "hidden");
            }
            if (fwdCargoPctOpen >= 20) {
                this.forwardCargoDoorShape.setAttribute("class", "DoorWarningShape");
                this.cargo1.setAttribute("visibility", "visible");
                this.cargo1dash.setAttribute("visibility", "visible");
            } else {
                this.forwardCargoDoorShape.setAttribute("class", "DoorShape");
                this.cargo1.setAttribute("visibility", "hidden");
                this.cargo1dash.setAttribute("visibility", "hidden");
            }

            if ((cabinDoorPctOpen < 5 && cateringDoorPctOpen < 5 && fwdCargoPctOpen < 5 && isBeaconOn) || !isOnGround || isOnRunway) {
                this.slide1.setAttribute("visibility", "visible");
                this.slide2.setAttribute("visibility", "visible");
                this.slide3.setAttribute("visibility", "visible");
                this.slide4.setAttribute("visibility", "visible");
                this.slide5.setAttribute("visibility", "visible");
                this.slide6.setAttribute("visibility", "visible");
            } else {
                this.slide1.setAttribute("visibility", "hidden");
                this.slide2.setAttribute("visibility", "hidden");
                this.slide3.setAttribute("visibility", "hidden");
                this.slide4.setAttribute("visibility", "hidden");
                this.slide5.setAttribute("visibility", "hidden");
                this.slide6.setAttribute("visibility", "hidden");
            }
        }
    }
    A320_Neo_LowerECAM_DOOR.Page = Page;
})(A320_Neo_LowerECAM_DOOR || (A320_Neo_LowerECAM_DOOR = {}));
customElements.define("a320-neo-lower-ecam-door", A320_Neo_LowerECAM_DOOR.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_DOOR.js.map
