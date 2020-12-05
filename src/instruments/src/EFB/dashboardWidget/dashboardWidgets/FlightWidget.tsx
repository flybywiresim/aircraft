import React from 'react';
import {Link} from "react-router-dom";

type FlightWidgetProps = {
    name: string,
    dep: string,
    arr: string,
    elapsedTime: string,
    distance: string,
    eta: string,
    timeSinceStart: string,
}

const FlightWidget = (props: FlightWidgetProps) => {
    return (
        <div id={'flight-' + props.name} className="flight-card">
            <div className='flight-widget-toolbar'>
                <Link
                    id="primary-button"
                    to="/dashboard/primary"
                    style={props.name === "todays" ? {borderBottom: "solid #00C2CB .1em"} : {borderBottom: "none"}}
                >
                    Primary
                </Link>
                <Link
                    id="secondary-button"
                    to="/dashboard/secondary"
                    style={props.name !== "todays" ? {borderBottom: "solid #00C2CB .1em"} : {borderBottom: "none"}}
                >
                    Secondary
                </Link>
            </div>
            <div className='origin-destination'>
                <p>
                    {props.dep}
                    <i> </i>
                    <i className="material-icons">send</i>
                    <i> </i>
                    {props.arr}
                </p>
            </div>
            <div id="Time">
                <p className="Title">TIME</p>
                <p>{props.name === "todays" ? props.timeSinceStart : "01:43"}</p>
            </div>
            <div id="Distance">
                <p className="Title">DISTANCE</p>
                <p>{props.distance}</p>
            </div>
            <div id="ETA">
                <p className="Title">{props.name === "todays" ? "ETA (UTC)" : "ETA (UTC)"}</p>
                <p>{props.eta}</p>
            </div>
        </div>
    );
};

export default FlightWidget;