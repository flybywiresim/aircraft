import React, {useState, useEffect} from 'react';
import { IconLicense } from '@tabler/icons';

type OverviewPageProps = {
    weights: {
        cargo: number,
        estLandingWeight: number,
        estTakeOffWeight: number,
        estZeroFuelWeight: number,
        maxLandingWeight: number,
        maxTakeOffWeight: number,
        maxZeroFuelWeight: number,
        passengerCount: number,
        passengerWeight: number,
        payload: number,
    },
    fuels: {
        avgFuelFlow: number,
        contingency: number,
        enrouteBurn: number,
        etops: number,
        extra: number,
        maxTanks: number,
        minTakeOff: number,
        planLanding: number,
        planRamp: number,
        planTakeOff: number,
        reserve: number,
        taxi: number,
    },
    units: string,
    arrivingAirport: string,
    arrivingIata: string,
    departingAirport: string,
    departingIata: string,
    altBurn: number,
    altIcao: string,
    altIata: string,
    tripTime: number,
    contFuelTime: number,
    resFuelTime: number,
    taxiOutTime: number,
    nose: string
};

type OverviewPageState = {
    unitConversion: number;
};

const OverviewPage = (props: OverviewPageProps) => {

    const [unitConversion, setunitConversion] = useState(1000);

    useEffect(() => {
        const unitConv = (props.units === "kgs") ? 1000 : 2240;
        console.log("Units changed to " + unitConv);
        setunitConversion(unitConv);
    }, [props.units]);

    return (
        <div className="px-6">
            <div className="flex w-full">
                <div className="w-1/2 bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4">
                    <div className="font-medium text-lg p-2 flex items-center justify-center mb-8">
                        <IconLicense className="mr-2" size={25} stroke={1.5} strokeLinejoin="miter" /> Payload
                    </div>
                    <table className="text-lg table-auto font-mono font-medium mx-8 my-6">
                        <thead>
                            <tr>
                                <th className="text-left">&nbsp;</th>
                                <th className="px-12 text-right">EST</th>
                                <th className="px-12 text-right">MAX</th>
                                <th className="px-12 text-right">NOTES</th>
                            </tr>
                        </thead>
                        <div className="h-6"></div>
                        <tbody>
                            <tr>
                                <td className="text-left"> -- PAX</td>
                                <td className="px-12 text-right">{props.weights.passengerCount}</td>
                                <td>&nbsp;</td>
                                <td className="px-12 text-right">&nbsp;</td>
                            </tr>
                            <tr>
                                <td className="text-left"> -- CARGO</td>
                                <td className="px-12 text-right">{(props.weights.cargo / unitConversion).toFixed(1)}</td>
                                <td>&nbsp;</td>
                                <td className="px-12 text-right">&nbsp;</td>
                            </tr>
                            <tr>
                                <td className="text-left"> -- PAYLOAD</td>
                                <td className="px-12 text-right">{(props.weights.payload / unitConversion).toFixed(1)}</td>
                                <td>&nbsp;</td>
                                <td className="px-12 text-right">&nbsp;</td>
                            </tr>
                            <tr>
                                <td className="text-left"> -- ZFW</td>
                                <td className="px-12 text-right">{(props.weights.estZeroFuelWeight / unitConversion).toFixed(1)}</td>
                                <td className="px-12 text-right">{(props.weights.maxZeroFuelWeight / unitConversion).toFixed(1)}</td>
                                <td className="px-12 text-right">&nbsp;</td>
                            </tr>
                            <tr>
                                <td className="text-left"> -- FUEL</td>
                                <td className="px-12 text-right">{(props.fuels.planRamp / unitConversion).toFixed(1)}</td>
                                <td className="px-12 text-right">????</td>
                                <td className="px-12 text-right"></td>
                            </tr>
                            <tr>
                                <td className="text-left"> -- TOW</td>
                                <td className="px-12 text-right">{(props.weights.estTakeOffWeight / unitConversion).toFixed(1)}</td>
                                <td className="px-12 text-right">{(props.weights.maxTakeOffWeight / unitConversion).toFixed(1)}</td>
                                <td className="px-12 text-right">&nbsp;</td>
                            </tr>
                            <tr>
                                <td className="text-left"> -- LAW</td>
                                <td className="px-12 text-right">{(props.weights.estLandingWeight / unitConversion).toFixed(1)}</td>
                                <td className="px-12 text-right">{(props.weights.maxLandingWeight / unitConversion).toFixed(1)}</td>
                                <td className="px-12 text-right">&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="w-1/2 bg-gray-800 rounded-xl p-6 text-white shadow-lg">
                    <div className="font-medium text-lg p-2 flex items-center justify-center mb-8">
                        <IconLicense className="mr-2" size={25} stroke={1.5} strokeLinejoin="miter" /> Fuel
                    </div>
                    <table className="text-lg table-auto font-mono font-medium mx-8 my-6">
                        <thead className="text-xl">
                            <tr>
                                <th className="text-left">FUEL</th>
                                <th className="px-12 text-right">ARPT</th>
                                <th className="px-12 text-right">FUEL</th>
                                <th className="px-12 text-right">TIME</th>
                            </tr>
                        </thead>
                        <div className="h-6"></div>
                        <tbody>
                            <tr>
                                <td className="text-left">TRIP</td>
                                <td className="px-12 text-right">{props.arrivingIata}</td>
                                <td className="px-12 text-right">{props.fuels.enrouteBurn}</td>
                                <td className="px-12 text-right">{(props.tripTime / 60).toFixed(0).padStart(4, "0")}</td>
                            </tr>
                            <tr>
                                <td className="text-left">CONT</td>
                                <td className="px-12 text-right">&nbsp;</td>
                                <td className="px-12 text-right">{props.fuels.contingency}</td>
                                <td className="px-12 text-right">{(props.contFuelTime / 60).toFixed(0).padStart(4, "0")}</td>
                            </tr>
                            <tr>
                                <td className="text-left">ALTN</td>
                                <td className="px-12 text-right">{props.altIata}</td>
                                <td className="px-12 text-right">{props.altBurn}</td>
                                <td className="px-12 text-right">????</td>
                            </tr>
                            <tr>
                                <td className="text-left">FINRES</td>
                                <td className="px-12 text-right">&nbsp;</td>
                                <td className="px-12 text-right">{props.fuels.reserve}</td>
                                <td className="px-12 text-right">????</td>
                            </tr>
                            <tr>
                                <td className="text-left">MIN T/OFF FUEL</td>
                                <td className="px-12 text-right">&nbsp;</td>
                                <td className="px-12 text-right">{props.fuels.minTakeOff}</td>
                                <td className="px-12 text-right">????</td>
                            </tr>
                            <tr>
                                <td className="text-left">EXTRA</td>
                                <td className="px-12 text-right">&nbsp;</td>
                                <td className="px-12 text-right">{props.fuels.extra}</td>
                                <td className="px-12 text-right">????</td>
                            </tr>
                            <tr>
                                <td className="text-left">T/OFF FUEL</td>
                                <td className="px-12 text-right">&nbsp;</td>
                                <td className="px-12 text-right">{props.fuels.planTakeOff}</td>
                                <td className="px-12 text-right">????</td>
                            </tr>
                            <tr>
                                <td className="text-left">TAXI</td>
                                <td className="px-12 text-right">{props.departingIata}</td>
                                <td className="px-12 text-right">{props.fuels.taxi}</td>
                                <td className="px-12 text-right">{(props.taxiOutTime / 60).toFixed(0).padStart(4, "0")}</td>
                            </tr>
                            <tr>
                                <td className="text-left">BLOCK FUEL</td>
                                <td className="px-12 text-right">{props.departingIata}</td>
                                <td className="px-12 text-right">{props.fuels.planRamp}</td>
                                <td className="px-12 text-right">&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OverviewPage;