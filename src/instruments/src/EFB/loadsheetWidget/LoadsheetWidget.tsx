import React, {useState, useEffect} from 'react';

type LoadsheetWidgetProps = {
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
    taxiOutTime: number
};
type LoadsheetWidgetState = {
    unitConversion: number;
};

const LoadsheetWidget = (props: LoadsheetWidgetProps) => {

    const [unitConversion, setunitConversion] = useState(1000);

    useEffect(() => {
        const unitConv = (props.units === "kgs") ? 1000 : 2240;
        console.log("Units changed to " + unitConv);
        setunitConversion(unitConv);
    }, [props.units]);

    return (
        <div className="loadsheet-div">
            <div>
                <span id='title-loadsheet' className="WidgetTitle">Loadsheet</span>
            </div>
            <div className='loadsheet-card' id="loadsheet-payload-card">
                <div className='loadsheet-card-body'>
                    <div className="loadsheet-table">
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col" className="ls-col col-desc col-left">&nbsp;</th>
                                    <th scope="col" className="ls-col col-value col-right">EST</th>
                                    <th scope="col" className="ls-col col-value col-right">MAX</th>
                                    <th scope="col" className="ls-col col-notes col-left">NOTES</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="ls-col col-desc col-left">PAX</td>
                                    <td className="col-right">{props.weights.passengerCount}</td>
                                    <td>&nbsp;</td>
                                    <td className="ls-col col-notes col-left">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td className="ls-col col-desc col-left">CARGO</td>
                                    <td className="col-right">{(props.weights.cargo / unitConversion).toFixed(1)}</td>
                                    <td>&nbsp;</td>
                                    <td className="ls-col col-notes col-left">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td className="ls-col col-desc col-left">PAYLOAD</td>
                                    <td className="ls-col col-value col-right">{(props.weights.payload / unitConversion).toFixed(1)}</td>
                                    <td>&nbsp;</td>
                                    <td className="ls-col col-notes col-left">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td>ZFW</td>
                                    <td className="ls-col col-value col-right">{(props.weights.estZeroFuelWeight / unitConversion).toFixed(1)}</td>
                                    <td className="ls-col col-value col-right">{(props.weights.maxZeroFuelWeight / unitConversion).toFixed(1)}</td>
                                    <td className="ls-col col-notes col-left">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td className="ls-col col-desc col-left">FUEL</td>
                                    <td className="ls-col col-value col-right">{(props.fuels.planRamp / unitConversion).toFixed(1)}</td>
                                    <td className="ls-col col-value col-right">????</td>
                                    <td className="ls-col col-notes col-left"></td>
                                </tr>
                                <tr>
                                    <td className="ls-col col-desc col-left">TOW</td>
                                    <td className="ls-col col-value col-right">{(props.weights.estTakeOffWeight / unitConversion).toFixed(1)}</td>
                                    <td className="ls-col col-value col-right">{(props.weights.maxTakeOffWeight / unitConversion).toFixed(1)}</td>
                                    <td className="ls-col col-notes col-left">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td className="ls-col col-desc col-left">LAW</td>
                                    <td className="col-right">{(props.weights.estLandingWeight / unitConversion).toFixed(1)}</td>
                                    <td className="col-right">{(props.weights.maxLandingWeight / unitConversion).toFixed(1)}</td>
                                    <td className="ls-col col-notes col-left">&nbsp;</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="loadsheet-card-footer">
                    <p className="footer-title">LOADSHEET</p>
                    <p>Payload</p>
                </div>
            </div>
            <div className='loadsheet-card' id="loadsheet-fuel-card">
                <div className='loadsheet-card-body'>
                    <div className="loadsheet-table">
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col" className="ls-col col-fuel-desc col-left">FUEL</th>
                                    <th scope="col" className="ls-col col-fuel-value col-right">ARPT</th>
                                    <th scope="col" className="ls-col col-fuel-value col-right">FUEL</th>
                                    <th scope="col" className="ls-col col-fuel-value col-right">TIME</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="ls-col-fuel col-fuel-desc col-left">TRIP</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">{props.arrivingIata}</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">{props.fuels.enrouteBurn}</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">{(props.tripTime / 60).toFixed(0).padStart(4, "0")}</td>
                                </tr>
                                <tr>
                                    <td className="ls-col-fuel col-fuel-desc col-left">CONT</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">&nbsp;</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">{props.fuels.contingency}</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">{(props.contFuelTime / 60).toFixed(0).padStart(4, "0")}</td>
                                </tr>
                                <tr>
                                    <td className="ls-col-fuel col-fuel-desc col-left">ALTN</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">{props.altIata}</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">{props.altBurn}</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">????</td>
                                </tr>
                                <tr>
                                    <td className="ls-col-fuel col-fuel-desc col-left">FINRES</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">&nbsp;</td>
                                    <td className="ls-col-fuel col-value col-right">{props.fuels.reserve}</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">????</td>
                                </tr>
                                <tr>
                                    <td className="ls-col-fuel col-fuel-desc col-left">MIN T/OFF FUEL</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">&nbsp;</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">{props.fuels.minTakeOff}</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">????</td>
                                </tr>
                                <tr>
                                    <td className="ls-col-fuel col-fuel-desc col-left">EXTRA</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">&nbsp;</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">{props.fuels.extra}</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">????</td>
                                </tr>
                                <tr>
                                    <td className="ls-col-fuel col-fuel-desc col-left">T/OFF FUEL</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">&nbsp;</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">{props.fuels.planTakeOff}</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">????</td>
                                </tr>
                                <tr>
                                    <td className="ls-col-fuel col-fuel-desc col-left">TAXI</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">{props.departingIata}</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">{props.fuels.taxi}</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">{(props.taxiOutTime / 60).toFixed(0).padStart(4, "0")}</td>
                                </tr>
                                <tr>
                                    <td className="ls-col-fuel ls-col col-fuel-desc col-left">BLOCK FUEL</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">{props.departingIata}</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">{props.fuels.planRamp}</td>
                                    <td className="ls-col-fuel col-fuel-value col-right">&nbsp;</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className='loadsheet-card-footer'>
                    <p className="footer-title">LOADSHEET</p>
                    <p>Fuel Loading</p>
                </div>
            </div>
        </div>
    );
};

export default LoadsheetWidget;