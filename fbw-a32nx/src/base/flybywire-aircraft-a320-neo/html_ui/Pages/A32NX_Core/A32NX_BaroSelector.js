const IN_HG_REGIONS = ["K", "C", "M", "P", "RJ", "RO", "TI", "TJ"];

class A32NX_BaroSelector {
    init() {
        const configInitBaroUnit = NXDataStore.get("CONFIG_INIT_BARO_UNIT", "IN HG");
        if (configInitBaroUnit != "AUTO") {
            this.setBaroSelector(configInitBaroUnit == "HPA");
        } else {
            const interval = setInterval(() => {
                const inGame = window.parent && window.parent.document.body.getAttribute("gamestate") === "ingame";
                if (inGame) {
                    clearInterval(interval);
                    this.autoSetBaroUnit();
                }
            }, 100);
        }
    }
    update(_deltaTime, _core) {
        // noop
    }
    setBaroSelector(value) {
        SimVar.SetSimVarValue("L:XMLVAR_Baro_Selector_HPA_1", "bool", value);
        this.baroSelectionCompleted = true;
    }
    /** @private */
    async autoSetBaroUnit() {
        const sessionId = await Coherent.call("START_NEAREST_SEARCH_SESSION", 1 /* AIRPORT */);
        const handler = Coherent.on("NearestSearchCompleted", (result) => {
            if (result.sessionId === sessionId) {
                handler.clear();
                const useInHg = result.added.length > 0 && (
                    IN_HG_REGIONS.includes(result.added[0].charAt(7))
                    || IN_HG_REGIONS.includes(result.added[0].substring(7, 9))
                );
                this.setBaroSelector(!useInHg);
            }
        });

        const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        const lon = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");

        Coherent.call("SEARCH_NEAREST", sessionId, lat, lon, 50000, 1);
    }
}
