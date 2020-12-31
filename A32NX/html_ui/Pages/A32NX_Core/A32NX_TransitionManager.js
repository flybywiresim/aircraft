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
    transitionSelector() {
        const mode = NXDataStore.get("CONFIG_TRANSALT", "AUTO");
        if (mode === "AUTO") {
            let departureICAO = NXDataStore.get("PLAN_ORIGIN", "");
            let arrivalICAO = NXDataStore.get("PLAN_DESTINATION", "");
            this.departureLogic(departureICAO);
            this.arrivalLogic(arrivalICAO);
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
                let metar = data.metar;
                if (/A\D/.search(metar) !== -1) {
                    let QNH = parseInt(((parseInt((metar.substr(/A\D/.search(metar), 6))))*3386.39).substr(0, 4));
                    let arrivalTA = SimVar.GetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number");
                    let transLVL = (arrivalTA + 28*(1013 - QNH) + 2500)/2
                    SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_LVL", "Number", transLVL);
                } else if (/Q\D/.search(metar) !== -1) {
                    let HPA = metar.substr(/A\D/.search(metar), 5);
                    let arrivalTA = SimVar.GetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number");
                    let transLVL = (arrivalTA + 28*(1013 - HPA) + 2500)/2
                    SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_LVL", "Number", transLVL);
                } else {
                    console.log("can not search value");
                }
            }
        }
    }
}
