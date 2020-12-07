import React from "react";

import {getSimbriefData, IFuel, IWeights} from './simbriefApi';
import StatusBar from "./StatusBar/StatusBar";
import Toolbar from "./toolbar/Toolbar";
import DashboardWidget from "./dashboardWidget/DashboardWidget";

import './Efb.scss';
import './StatusBar/StatusBar.scss';
import './toolbar/Toolbar.scss';
import './dashboardWidget/DashboardWidget.scss';
import './loadsheetWidget/LoadsheetWidget.scss';
import './settings/Settings.scss';
import './profile/Profile.scss';

import 'material-design-icons/iconfont/material-icons.css'

type EfbProps = {
    logo: string,
};

type EfbState = {
    simbriefUsername: string;
    departingAirport: string;
    departingIata: string;
    arrivingAirport: string;
    arrivingIata: string;
    flightDistance: string;
    flightETAInSeconds: string;
    currentTime: Date,
    initTime: Date,
    timeSinceStart: string,
    weights: IWeights,
    fuels: IFuel,
    units: string,
    altIcao: string,
    altIata: string,
    altBurn: number,
    tripTime: number,
    contFuelTime: number,
    resFuelTime: number,
    taxiOutTime: number,
};

class Efb extends React.Component<EfbProps, EfbState> {
    constructor(props: EfbProps) {
        super(props);
        this.updateCurrentTime = this.updateCurrentTime.bind(this);
        this.updateTimeSinceStart = this.updateTimeSinceStart.bind(this);
        this.fetchSimbriefData = this.fetchSimbriefData.bind(this);
    }

    state: EfbState = {
        departingAirport: 'N/A',
        departingIata: 'N/A',
        arrivingAirport: 'N/A',
        arrivingIata: 'N/A',
        simbriefUsername: this.fetchSimbriefUsername(),
        flightDistance: 'N/A',
        flightETAInSeconds: 'N/A',
        currentTime: new Date(),
        initTime: new Date(),
        timeSinceStart: "00:00",
        weights: {
            cargo: 0,
            estLandingWeight: 0,
            estTakeOffWeight: 0,
            estZeroFuelWeight: 0,
            maxLandingWeight: 0,
            maxTakeOffWeight: 0,
            maxZeroFuelWeight: 0,
            passengerCount: 0,
            passengerWeight: 0,
            payload: 0,
        },
        fuels: {
            avgFuelFlow: 0,
            contingency: 0,
            enrouteBurn: 0,
            etops: 0,
            extra: 0,
            maxTanks: 0,
            minTakeOff: 0,
            planLanding: 0,
            planRamp: 0,
            planTakeOff: 0,
            reserve: 0,
            taxi: 0,
        },
        units: "kgs",
        altIcao: "N/A",
        altIata: "N/A",
        altBurn: 0,
        tripTime: 0,
        contFuelTime: 0,
        resFuelTime: 0,
        taxiOutTime: 0
    }

    updateCurrentTime(currentTime: Date) {
        this.setState({currentTime: currentTime});
    }

    updateTimeSinceStart(timeSinceStart: string) {
        this.setState({timeSinceStart: timeSinceStart});
    }

    fetchSimbriefUsername() {
        const username = window.localStorage.getItem("SimbriefUsername");
        if (username === null) {
            return '';
        } else {
            return username;
        }
    }

    async fetchSimbriefData() {
        if (!this.state.simbriefUsername) {
            return;
        }

        console.log("Fetching simbriefData");
        const simbriefData = await getSimbriefData(this.state.simbriefUsername);
        console.info(simbriefData);
        this.setState({
            departingAirport:    simbriefData.origin.icao,
            departingIata:       simbriefData.origin.iata,
            arrivingAirport:     simbriefData.destination.icao,
            arrivingIata:        simbriefData.destination.iata,
            flightDistance:      simbriefData.distance,
            flightETAInSeconds:  simbriefData.flightETAInSeconds,
            weights: {
                cargo:              simbriefData.weights.cargo,
                estLandingWeight:   simbriefData.weights.estLandingWeight,
                estTakeOffWeight:   simbriefData.weights.estTakeOffWeight,
                estZeroFuelWeight:  simbriefData.weights.estZeroFuelWeight,
                maxLandingWeight:   simbriefData.weights.maxLandingWeight,
                maxTakeOffWeight:   simbriefData.weights.maxTakeOffWeight,
                maxZeroFuelWeight:  simbriefData.weights.maxZeroFuelWeight,
                passengerCount:     simbriefData.weights.passengerCount,
                passengerWeight:    simbriefData.weights.passengerWeight,
                payload:            simbriefData.weights.payload,
            },
            fuels: {
                avgFuelFlow:     simbriefData.fuel.avgFuelFlow,
                contingency:     simbriefData.fuel.contingency,
                enrouteBurn:     simbriefData.fuel.enrouteBurn,
                etops:           simbriefData.fuel.etops,
                extra:           simbriefData.fuel.extra,
                maxTanks:        simbriefData.fuel.maxTanks,
                minTakeOff:      simbriefData.fuel.minTakeOff,
                planLanding:     simbriefData.fuel.planLanding,
                planRamp:        simbriefData.fuel.planRamp,
                planTakeOff:     simbriefData.fuel.planTakeOff,
                reserve:         simbriefData.fuel.reserve,
                taxi:            simbriefData.fuel.taxi,
            },
            units:              simbriefData.units,
            altIcao:            simbriefData.alternate.icao,
            altIata:            simbriefData.alternate.iata,
            altBurn:            simbriefData.alternate.burn,
            tripTime:           simbriefData.times.est_time_enroute,
            contFuelTime:       simbriefData.times.contfuel_time,
            resFuelTime:        simbriefData.times.reserve_time,
            taxiOutTime:        simbriefData.times.taxi_out
        });
    }

    changeSimbriefUsername = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ simbriefUsername: event.target.value.toString() });
        window.localStorage.setItem("SimbriefUsername", event.target.value.toString());
    }

    render() {
        return (
            <div>
                <StatusBar initTime={this.state.initTime} updateCurrentTime={this.updateCurrentTime} updateTimeSinceStart={this.updateTimeSinceStart}/>
                <Toolbar logo={this.props.logo} fetchSimbrief={this.fetchSimbriefData}/>
                <div id="main-container">
                    <DashboardWidget
                        departingAirport={this.state.departingAirport}
                        arrivingAirport={this.state.arrivingAirport}
                        flightDistance={this.state.flightDistance}
                        flightETAInSeconds={this.state.flightETAInSeconds}
                        timeSinceStart={this.state.timeSinceStart} />
                </div>
            </div>
        );
    }
}

export default Efb;
