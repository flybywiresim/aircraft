class AS1000_AttitudeBackup extends NavSystem {
    get templateID() {
        return "AS1000_AttitudeBackup";
    }
    connectedCallback() {
        super.connectedCallback();
        this.addIndependentElementContainer(new NavSystemElementContainer("Horizon", "Horizon", new Backup_Attitude()));
    }
}
class Backup_Attitude extends NavSystemElement {
    constructor() {
        super();
        this.vDir = new Vec2();
    }
    init(root) {
        this.attitudeElement = this.gps.getChildById("Horizon");
        this.attitudeElement.setAttribute("is-backup", "true");
        if (this.gps) {
            const aspectRatio = this.gps.getAspectRatio();
            this.attitudeElement.setAttribute("aspect-ratio", aspectRatio.toString());
        }
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        const xyz = Simplane.getOrientationAxis();
        if (xyz) {
            this.attitudeElement.setAttribute("pitch", (xyz.pitch / Math.PI * 180).toString());
            this.attitudeElement.setAttribute("bank", (xyz.bank / Math.PI * 180).toString());
            this.attitudeElement.setAttribute("slip_skid", Simplane.getInclinometer().toString());
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
registerInstrument("as1000-attitudebackup-element", AS1000_AttitudeBackup);
//# sourceMappingURL=AS1000_AttitudeBackup.js.map