import React from 'react';
import { IconPlane } from '@tabler/icons';

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
        <div className='flight-widget'>
            <div id={'flight-' + props.name} className="flight-card">
                <div className='flight-widget-toolbar'>
                    <a
                        id="primary-button"
                        href="/dashboard/primary"
                        style={props.name === "todays" ? {borderBottom: "solid #00C2CB .1em"} : {borderBottom: "none"}}
                    >
                        Primary
                    </a>
                    <a
                        id="secondary-button"
                        href="/dashboard/secondary"
                        style={props.name !== "todays" ? {borderBottom: "solid #00C2CB .1em"} : {borderBottom: "none"}}
                    >
                        Secondary
                    </a>
                </div>
                <div id='origin-destination'>
                    <span>{props.dep}</span>
                    &nbsp;&nbsp;
                    <IconPlane size={40} stroke={1.5} strokeLinejoin="miter" />
                    &nbsp;&nbsp;
                    <span>{props.arr}</span>
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
        </div>
    );
};

export default FlightWidget;