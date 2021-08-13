import React from 'react';
import {
    IconBox,
    IconLink,
    IconPlane,
    IconPlaneDeparture,
    IconPlaneArrival,
} from '@tabler/icons';
import { SimbriefData } from '../../Efb';
import fuselage from '../../Assets/320neo-outline-nose.svg';

type FlightWidgetProps = {
    simbriefData: SimbriefData,
    fetchSimbrief: Function,
}

const FlightWidget = (props: FlightWidgetProps) => {
    const { simbriefData } = props;

    let schedInParsed = '--:--';
    let schedOutParsed = '--:--';
    let crzAlt = '-----';
    let avgWind = '---/---';
    let estimatedZfw = '--.-';

    if (simbriefData.schedIn !== '--:--') {
        const sta = new Date(parseInt(simbriefData.schedIn) * 1000);
        schedInParsed = `${sta.getUTCHours().toString().padStart(2, '0')}:${sta.getUTCMinutes().toString().padStart(2, '0')}z`;
    }

    if (simbriefData.schedOut !== '--:--') {
        const std = new Date(parseInt(simbriefData.schedOut) * 1000);
        schedOutParsed = `${std.getUTCHours().toString().padStart(2, '0')}:${std.getUTCMinutes().toString().padStart(2, '0')}z`;
    }

    if (simbriefData.cruiseAltitude !== 0) {
        const flightLevel = (simbriefData.cruiseAltitude / 100);
        crzAlt = `FL${flightLevel}`;
    }

    if (simbriefData.weather.avgWindDir !== '---' && simbriefData.weather.avgWindSpeed !== '---') {
        avgWind = `${simbriefData.weather.avgWindDir}/${simbriefData.weather.avgWindSpeed}`;
    }

    if (simbriefData.weights.estZeroFuelWeight !== 0) {
        const eZfwUnround = simbriefData.weights.estZeroFuelWeight / 100;
        const eZfw = Math.round(eZfwUnround) / 10;
        estimatedZfw = `${eZfw}`;
    }

    return (
        <div className="w-2/5 h-full bg-navy-lighter text-white rounded-2xl mr-3 shadow-lg p-6 overflow-hidden">
            <div className="h-full flex flex-col justify-between">
                <div className="w-full">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-medium">{(simbriefData.airline.length > 0 ? simbriefData.airline : '') + simbriefData.flightNum}</h1>
                        <span className="text-lg">{simbriefData.aircraftReg}</span>
                        {' '}
                        <br />
                        <span className="text-lg">A320-251N</span>
                    </div>

                    <div className="flex items-center justify-center mb-6 text-lg">
                        [
                        {simbriefData.departingIata}
                        ]
                        {' '}
                        <span className="mx-3 text-3xl">{simbriefData.departingAirport}</span>
                        <IconPlane size={35} stroke={1.5} strokeLinejoin="miter" />
                        <span className="mx-3 text-3xl">{simbriefData.arrivingAirport}</span>
                        {' '}
                        [
                        {simbriefData.arrivingIata}
                        ]
                    </div>

                    <div className="flex">
                        <div className="w-1/2 mr-4">
                            <div className="flex justify-end text-lg">
                                STD
                                {' '}
                                <IconPlaneDeparture className="ml-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                            </div>
                            <div className="text-right mt-1 text-2xl">{schedOutParsed}</div>
                        </div>
                        <div className="w-1/2 ml-4">
                            <div className="flex justify-start text-lg">
                                <IconPlaneArrival className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                STA
                            </div>
                            <div className="text-left mt-1 text-2xl">{schedInParsed}</div>
                        </div>
                    </div>
                </div>
                <div className="w-full my-3">
                    <img src={fuselage} alt="Aircraft outline" className="flip-horizontal -ml-48" />
                </div>
                <div className="w-full mt-3">
                    <div className="grid grid-cols-3 gap-4 text-center mb-10">
                        <div className="mb-3">
                            <h3 className="text-xl font-medium">ALTN</h3>
                            <span className="text-lg font-mono font-light">{simbriefData.altIcao}</span>
                        </div>
                        <div className="mb-3">
                            <h3 className="text-xl font-medium">CO RTE</h3>
                            <span className="text-lg font-mono font-light">{simbriefData.departingIata + simbriefData.arrivingIata}</span>
                        </div>
                        <div className="mb-3">
                            <h3 className="text-xl font-medium">ZFW</h3>
                            <span className="text-lg font-mono font-light">{estimatedZfw}</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-medium">AVG WIND</h3>
                            <span className="text-lg font-mono font-light">{avgWind}</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-medium">CI</h3>
                            <span className="text-lg font-mono font-light">{simbriefData.costInd}</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-medium">CRZ</h3>
                            <span className="text-lg font-mono font-light">{crzAlt}</span>
                        </div>
                    </div>
                    <div className="flex">
                        <button
                            type="button"
                            onClick={() => props.fetchSimbrief()}
                            className="mr-1 w-1/2 text-white bg-teal-light p-2 flex items-center justify-center rounded-lg focus:outline-none text-lg"
                        >
                            <IconBox className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                            {' '}
                            FROM SIMBRIEF
                        </button>
                        <button
                            type="button"
                            className="ml-1 w-1/2 text-white bg-green-500 p-2 flex items-center justify-center rounded-lg focus:outline-none opacity-50 text-lg"
                        >
                            <IconLink className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                            {' '}
                            LINK MCDU
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlightWidget;
