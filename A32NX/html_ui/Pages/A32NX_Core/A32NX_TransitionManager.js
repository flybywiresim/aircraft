class A32NX_TransitionManager {
    init() {
        console.log('A32NX_TransitionManager init');
        this.totalDeltaTime = 0;
        const mode = NXDataStore.get("CONFIG_TRANSALT", "AUTO");
        if (mode !== "AUTO") {
            this.transitionManual();
        }
    }
    update(_deltaTime, _core) {
        this.transitionSelector();
    }
    transitionSelector(_deltaTime) {
        const mode = NXDataStore.get("CONFIG_TRANSALT", "AUTO");
        this.totalDeltaTime += _deltaTime;
        if (mode === "AUTO") {
            let departureICAO = NXDataStore.get("PLAN_ORIGIN", "");
            let arrivalICAO = NXDataStore.get("PLAN_DESTINATION", "");
            if (totalDeltaTime > 180000) {
                this.departureLogic(departureICAO); //working every 3 min
                this.arrivalLogic(arrivalICAO); //working every 3 min
                this.totalDeltaTime = 0;
            }
        }
    }
    transitionManual() {
        const storedDepartTransAlt = parseInt(NXDataStore.get("CONFIG_DEPART_TRANSALT", "10000"));
        const storedArrivalTransAlt = parseInt(NXDataStore.get("CONFIG_ARRIVAL_TRANSALT", "10000"))
        SimVar.SetSimVarValue("L:AIRLINER_TRANS_ALT", "Number", storedDepartTransAlt);
        SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number", storedArrivalTransAlt);
    }
    async departureLogic(airport) {
        if (airport !== "") {
            await NXApi.getAirport(airport)
            .then((data) => {
                let departureTA = data.transAlt;
                if (departureTA === -1) {
                    console.log("NO DEPARTURE TA");
                } else {
                    SimVar.SetSimVarValue("L:AIRLINER_TRANS_ALT", "Number", departureTA);
                }
            })
        }
    }
    async arrivalLogic(airport) {
        if (airport !== "") {
            await NXApi.getAirport(airport)
            .then((data) => {
                let arrivalTA = data.transAlt;
                if (arrivalTA === -1) {
                    console.log("NO ARRIVAL TA");
                } else {
                    SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number", arrivalTA);
                }
            })
        }
    }
    async transLVL(airport) {
        if (airport !== "") {
            await NXApi.getMetar(airport, "ms")
            .then((data) => {
                NXDataStore.set("testmetar", data.metar);
                let metar = data.metar;
                const formatQNH = /A[0-9]{4}/;
                const formatHPA = /Q[0-9]{4}/;
                if (formatQNH.search(metar) !== -1) {
                    let QNH = parseInt(metar.substr(formatQNH.search(metar)+1, 5));
                    let HPA = parseInt(QNH*3386.39/10000);
                    let arrivalTA = SimVar.GetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number");
                    let transLVL = ((arrivalTA + 28*(1013 - HPA) + 2500)/2);
                    SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_LVL", "Number", transLVL);
                } else if (formatHPA.search(metar) !== -1) {
                    let HPA = parseInt(metar.substr(formatHPA.search(metar)+1, 4));
                    let arrivalTA = SimVar.GetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number");
                    let transLVL = ((arrivalTA + 28*(1013 - HPA) + 2500)/2);
                    SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_LVL", "Number", transLVL);
                } else {
                    console.log("can not search value");
                }
            })
        }
    }
}
