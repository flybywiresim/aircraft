import './Crz.scss';
import ReactDOM from 'react-dom';
import React, { useEffect, useState } from 'react';
import { getRenderTarget, setIsEcamPage } from '../../../Common/defaults';
import { SimVarProvider, useSimVar } from '../../../Common/simVars';
import { NXDataStore } from '../../../Common/persistence';

setIsEcamPage('crz_page');

export const CrzPage = () => {
    // Disaply trim valve position for each zone

    const unitConversion = parseFloat(NXDataStore.get('CONFIG_USING_METRIC_UNIT', '1'));

    /* FUEL */

    const [leftConsumption] = useSimVar('GENERAL ENG FUEL USED SINCE START:1', 'kg', 1000);
    const [rightConsumption] = useSimVar('GENERAL ENG FUEL USED SINCE START:2', 'kg', 1000);

    const fuelConsumptionForDisplay = function (fuelConsumption, unitsC) {
        return parseInt(((fuelConsumption * unitsC) - (fuelConsumption % 10)).toFixed(0));
    };

    const [leftFuel, setLeftFuel] = useState(fuelConsumptionForDisplay(leftConsumption, unitConversion));
    const [rightFuel, setRightFuel] = useState(fuelConsumptionForDisplay(rightConsumption, unitConversion));
    const [totalFuel, setTotalFuel] = useState(leftFuel + rightFuel);

    useEffect(() => {
        setLeftFuel(fuelConsumptionForDisplay(leftConsumption, unitConversion));
        setRightFuel(fuelConsumptionForDisplay(rightConsumption, unitConversion));
        setTotalFuel(leftFuel + rightFuel);
    }, [leftConsumption, rightConsumption]);

    const splitDecimals = function (value, type) {
        if (type === 'oil') {
            value = value * 0.01 * 25;
        } else if (type === 'vib') {
            value = value < 0 ? 0.0 : value;
        }
        const decimalSplit = value.toFixed(1).split('.', 2);
        return (decimalSplit);
    };

    /* OIL */

    const [oilQuantLeft] = useSimVar('ENG OIL QUANTITY:1', 'percent', 1000);
    const [oilQuantRight] = useSimVar('ENG OIL QUANTITY:2', 'percent', 1000);

    const [oilLeft, setOilLeft] = useState(splitDecimals(oilQuantLeft, 'oil'));
    const [oilRight, setOilRight] = useState(splitDecimals(oilQuantRight, 'oil'));

    useEffect(() => {
        setOilLeft(splitDecimals(oilQuantLeft, 'oil'));
        setOilRight(splitDecimals(oilQuantRight, 'oil'));
    }, [oilQuantLeft, oilQuantRight]);

    /* VIB */

    const [leftVIBN1] = useSimVar('TURB ENG VIBRATION:1', 'Number', 1000);
    const [rightVIBN1] = useSimVar('TURB ENG VIBRATION:2', 'Number', 1000);

    // No VIB values for N2 currently
    const [leftVN1, setLeftVN1] = useState(splitDecimals(leftVIBN1, 'vib'));
    const [rightVN1, setRightVN1] = useState(splitDecimals(rightVIBN1, 'vib'));

    useEffect(() => {
        setLeftVN1(splitDecimals(leftVIBN1, 'vib'));
        setRightVN1(splitDecimals(rightVIBN1, 'vib'));
    }, [leftVIBN1, rightVIBN1]);

    /* PRESSURE and LANDING ELEVATION */

    const [cabinVs] = useSimVar('PRESSURIZATION CABIN ALTITUDE RATE', 'feet per second', 500);
    const [cabinAlt] = useSimVar('PRESSURIZATION CABIN ALTITUDE', 'feet', 500);
    const [ambPressure] = useSimVar('AMBIENT PRESSURE', 'inHg', 1000);
    const [deltaPsi] = useSimVar('DELTA_PRESSURE', 'PSI', 500);

    const deltaPSI = function (cabinVs, cabinAlt, ambPressure) {
        const feetToMeters = 0.3048;
        const seaLevelPressurePascal = 101325;
        const barometricPressureFactor = -0.00011857591;
        const pascalToPSI = 0.000145038;
        const inHgToPSI = 0.491154;

        const cabinAltMeters = cabinAlt * feetToMeters;
        const cabinPressurePascal = seaLevelPressurePascal * Math.exp(barometricPressureFactor * cabinAltMeters); // Barometric formula
        const cabinPressurePSI = cabinPressurePascal * pascalToPSI;
        const outsidePressurePSI = ambPressure * inHgToPSI;
        let pressureDiff = cabinPressurePSI - outsidePressurePSI;
        pressureDiff = (pressureDiff > -0.05) && (pressureDiff < 0.0) ? 0.0 : pressureDiff;
        pressureDiff = pressureDiff > 8.6 ? 8.6 : pressureDiff; // DeltaPSI will not go above 8.6psi normally
        return (pressureDiff);
    };

    const [deltaPress, setDeltaPress] = useState(splitDecimals(deltaPSI(cabinVs, cabinAlt, ambPressure), ''));

    useEffect(() => {
        console.log(`Delta PSI from SimVar is ${deltaPsi}`);
        const pressChange = splitDecimals(deltaPSI(cabinVs, cabinAlt, ambPressure), '');
        setDeltaPress(pressChange);
    }, [cabinVs, ambPressure]);

    const [landingElevDialPosition] = useSimVar('L:XMLVAR_KNOB_OVHD_CABINPRESS_LDGELEV', 'Number', 100);
    const [landingRunwayElevation] = useSimVar('L:A32NX_DCDU_APPROACH_RUNWAY_ELEVATION', 'Meters', 1000);
    const [manMode] = useSimVar('L:A32NX_CAB_PRESS_MODE_MAN', 'Bool', 1000);

    const [ldgElevMode, setLdgElevMode] = useState('AUTO');
    const [ldgElevValue, setLdgElevValue] = useState('XX');
    const [cssLdgElevName, setCssLdgElevName] = useState('green');
    const [landingElev] = useSimVar('L:A32NX_LANDING_ELEVATION', 'feet', 100);

    useEffect(() => {
        console.log('PING');
        setLdgElevMode(landingElevDialPosition === 0 ? 'AUTO' : 'MAN');
        if (landingElevDialPosition === 0) {
            // On Auto
            const nearestfifty = Math.round((landingRunwayElevation * 3.28) / 50) * 50;
            setLdgElevValue(landingRunwayElevation > -5000 ? nearestfifty.toString() : 'XX');
            setCssLdgElevName(landingRunwayElevation > -5000 ? 'green' : 'amber');
        } else {
            // On manual
            const nearestfifty = Math.round(landingElev / 50) * 50;
            setLdgElevValue(nearestfifty.toString());
            setCssLdgElevName('green');
        }
    }, [landingElevDialPosition, landingRunwayElevation]);

    /* COND */

    const [cockpitCabinTemp] = useSimVar('L:A32NX_CKPT_TEMP', 'celsius', 1000);
    const [fwdCabinTemp] = useSimVar('L:A32NX_FWD_TEMP', 'celsius', 1000);
    const [aftCabinTemp] = useSimVar('L:A32NX_AFT_TEMP', 'celsius', 1000);

    return (
        <>
            <svg id="crz-page" viewBox="0 0 600 600" style={{ marginTop: '-60px' }} xmlns="http://www.w3.org/2000/svg">
                <text className="Title" x="300" y="20">CRUISE</text>

                <text className="SubTitle" x="50" y="60">ENG</text>

                {/* FUEL */}
                <text className="standard center" x="300" y="70">F.USED</text>
                <text className="standard center" x="300" y="90">1+2</text>
                <text id="FuelUsedLeft" className="large green" x="210" y="95" textAnchor="end">{leftFuel}</text>
                <text id="FuelUsedRight" className="large green" x="455" y="95" textAnchor="end">{rightFuel}</text>
                <text id="FuelUsedTotal" className="large green center" x="300" y="112">{totalFuel}</text>
                <text id="FuelUsedUnit" className="standard cyan center" x="300" y="132">KG</text>
                <path className="WingPlaneSym" d="M230 80 l20 -2" />
                <path className="WingPlaneSym" d="M370 80 l-20 -2" />

                {/* OIL */}
                <text className="standard center" x="300" y="160">OIL</text>
                <text className="medium cyan center" x="300" y="180">QT</text>

                <path className="WingPlaneSym" d="M230 170 l20 -2" />
                <path className="WingPlaneSym" d="M370 170 l-20 -2" />

                <text className="standard center" x="300" y="220">VIB N1</text>
                <text className="standard" x="312" y="250">N2</text>

                <path className="WingPlaneSym" d="M230 220 l20 -2" />
                <path className="WingPlaneSym" d="M370 220 l-20 -2" />

                <path className="WingPlaneSym" d="M230 250 l20 -2" />
                <path className="WingPlaneSym" d="M370 250 l-20 -2" />

                <text id="OilQuantityLeft" className="large green" x="195" y="185" textAnchor="end">
                    {oilLeft[0]}
                    .
                </text>
                <text id="OilQuantityLeftDecimal" className="standard green" x="197" y="185" textAnchor="start">{oilLeft[1]}</text>
                <text id="OilQuantityRight" className="large green" x="440" y="185" textAnchor="end">
                    {oilRight[0]}
                    .
                </text>
                <text id="OilQuantityRightDecimal" className="standard green" x="440" y="185" textAnchor="start">{oilRight[1]}</text>

                <text id="VibN1Left" className="large green" x="195" y="235" textAnchor="end">
                    {leftVN1[0]}
                    .
                </text>
                <text id="VibN1LeftDecimal" className="standard green" x="197" y="235" textAnchor="start">{leftVN1[1]}</text>

                <text id="VibN2Left" className="large green" x="195" y="265" textAnchor="end">
                    {leftVN1[0]}
                    .
                </text>
                <text id="VibN2LeftDecimal" className="standard green" x="197" y="265" textAnchor="start">{leftVN1[1]}</text>

                <text id="VibN1Right" className="large green" x="440" y="235" textAnchor="end">
                    {rightVN1[0]}
                    .
                </text>
                <text id="VibN1RightDecimal" className="standard green" x="440" y="235" textAnchor="start">{rightVN1[1]}</text>

                <text id="VibN2Right" className="large green" x="440" y="265" textAnchor="end">
                    {rightVN1[0]}
                    .
                </text>
                <text id="VibN2RightDecimal" className="standard green" x="440" y="265" textAnchor="start">{rightVN1[1]}</text>

                <text className="SubTitle" x="50" y="330">AIR</text>

                <g id="LandingElevation" className={!manMode ? 'show' : 'hide'}>
                    <text className="standard center" x="330" y="335">LDG ELEV</text>
                    <text id="LandingElevationMode" className="standard green" x="385" y="335">{ldgElevMode}</text>

                    <text id="LandingElevation" className={`large ${cssLdgElevName}`} x="525" y="335" textAnchor="end">{ldgElevValue}</text>
                    <text className="standard cyan" x="530" y="335">FT</text>
                </g>
                <g id="ManualVSIndicator" className={manMode ? 'show' : 'hide'}>
                    <GaugeComponent x={460} y={380} radius={45} startAngle={-10} endAngle={190} className="Gauge" />
                </g>

                <text className="standard" x="218" y="370">@P</text>
                <text id="large green" className="large green" x="290" y="370" textAnchor="end">
                    {deltaPress[0]}
                    .
                </text>
                <text id="standard green" className="standard green" x="290" y="370">{deltaPress[1]}</text>
                <text className="standard cyan" x="320" y="370">PSI</text>

                <text className="standard" x="480" y="380">CAB V/S</text>
                <text id="CabinVerticalSpeed" className="large green" x="515" y="405" textAnchor="end">{Math.round((cabinVs * 60) / 50) * 50}</text>
                <text className="medium cyan" x="525" y="405">FT/MIN</text>

                <text className="standard" x="480" y="450">CAB ALT</text>
                <text id="CabinAltitude" className="large green" x="515" y="475" textAnchor="end">{Math.round(cabinAlt / 50) * 50 > 0 ? Math.round(cabinAlt / 50) * 50 : 0}</text>
                <text className="medium cyan" x="525" y="475">FT</text>

                <path className="WingPlaneSym" d="M 300 410 a 70 70 0 0 0 -30 -5 l -180 0 m 30 0 l 0 50 l 85 0 l 0 -10 m 0 10 l 85 0 l 0 -48 m -170 48 l -30 0 c -60 0 -60 -20 -45 -25" />

                <text className="standard" x="55" y="425">CKPT</text>
                <text id="CockpitTemp" className="standard green" x="75" y="448">{cockpitCabinTemp.toFixed(0)}</text>
                <text className="standard" x="145" y="425">FWD</text>
                <text id="ForwardTemp" className="standard green" x="150" y="448">{fwdCabinTemp.toFixed(0)}</text>
                <text className="standard" x="245" y="425">AFT</text>
                <text id="AftTemp" className="standard green" x="235" y="448">{aftCabinTemp.toFixed(0)}</text>
                <text className="medium cyan" x="310" y="455">°C</text>

            </svg>
        </>
    );
};

type GaugeComponentType = {
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    className: string
}

const GaugeComponent = ({ x, y, radius, startAngle, endAngle, className } : GaugeComponentType) => {
    const polarToCartesian = function (centerX, centerY, radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180.0);
        return ({
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians)),
        });
    };

    const startPos = polarToCartesian(x, y, radius, startAngle);
    const endPos = polarToCartesian(x, y, radius, endAngle);
    const largeArcFlag = ((endAngle - startAngle) <= 180) ? '0' : '1';
    const d = ['M', startPos.x, startPos.y, 'A', radius, radius, 0, largeArcFlag, 0, endPos.x, endPos.y].join(' ');

    return (
        <path d={d} className={className} />
    );
};

ReactDOM.render(<SimVarProvider><CrzPage /></SimVarProvider>, getRenderTarget());
