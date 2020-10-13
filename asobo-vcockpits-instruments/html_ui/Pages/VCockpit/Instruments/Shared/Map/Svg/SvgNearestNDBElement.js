class SvgNearestNDBElement extends SvgWaypointElement {
    get ndbType() {
        if (this._ndbType) {
            return this._ndbType;
        }
        if (this.source) {
            return this.source.ndbType;
        }
    }
    set ndbType(v) {
        this._ndbType = v;
    }
    constructor(source) {
        super(source);
        this.textOffsetRatio = 0;
        this.sortIndex = 1;
    }
    id(map) {
        return "nrst-ndb-" + this.ident + "-map-" + map.index;
    }
    class() {
        return "map-nrst-ndb";
    }
    imageFileName() {
        let fName = "";
        if (this.source && this.source.imageFileName) {
            fName = this.source.imageFileName();
        } else {
            if (this.ndbType === 1) {
                fName = "ICON_MAP_NDB_WAYPOINT.svg";
            } else {
                fName = "ICON_MAP_NDB_WAYPOINT.svg";
            }
        }
        if (BaseInstrument.useSvgImages) {
            return fName;
        }
        return fName.replace(".svg", ".png");
    }
}
//# sourceMappingURL=SvgNearestNDBElement.js.map