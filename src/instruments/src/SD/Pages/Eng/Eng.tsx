/* eslint-disable no-nested-ternary */
import React, { FC, useState, useEffect } from 'react';
import { render } from '@instruments/common/index';
import { setIsEcamPage } from '@instruments/common/defaults';
import { Arc, Needle } from '@instruments/common/gauges';
import { usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';
import { SvgGroup } from '../../Common/SvgGroup';

import './Eng.scss';

setIsEcamPage('eng_page');

export const EngPage: FC = () => {
    const [weightUnit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');
    const [engSelectorPosition] = useSimVar('L:XMLVAR_ENG_MODE_SEL', 'Enum', 1000);

    return (
        <EcamPage name="main-eng">
            <PageTitle x={6} y={18} text="ENGINE" />

            <EngineColumn x={90} y={40} engineNumber={1} />

            <line className="Indicator" x1={250} y1={75} x2={225} y2={77} />
            <text x={300} y={75} className="FillWhite FontMedium TextCenter">F.USED</text>
            <text x={300} y={97} className="FillCyan FontSmall TextCenter">{parseInt(weightUnit) === 1 ? 'KG' : 'LBS'}</text>
            <line className="Indicator" x1={350} y1={75} x2={375} y2={77} />

            <text x={300} y={135} className="FillWhite FontMedium TextCenter">OIL</text>
            <text x={300} y={160} className="FillCyan FontSmall TextCenter">QT</text>
            <text x={300} y={235} className="FillCyan FontSmall TextCenter">PSI</text>

            <line className="Indicator" x1={250} y1={292} x2={225} y2={294} />
            <text x={300} y={290} className="FillCyan FontSmall TextCenter">&deg;C</text>
            <line className="Indicator" x1={350} y1={292} x2={375} y2={294} />

            <line className="Indicator" x1={250} y1={340} x2={225} y2={342} />
            <text x={300} y={340} className="FillWhite FontSmall TextCenter">VIB N1</text>
            <line className="Indicator" x1={350} y1={340} x2={375} y2={342} />

            <line className="Indicator" x1={250} y1={370} x2={225} y2={372} />
            <text x={300} y={370} className="FillWhite FontSmall TextCenter">&nbsp;&nbsp;&nbsp; N2</text>
            <line className="Indicator" x1={350} y1={370} x2={375} y2={372} />

            <text x={300} y={425} className={`FillWhite FontSmall TextCenter ${engSelectorPosition !== 2 && 'Hidden'}`}>IGN</text>

            <SvgGroup x={0} y={0} className={`${engSelectorPosition !== 2 && 'Hidden'}`}>
                <line className="Indicator" x1={250} y1={488} x2={225} y2={490} />
                <text x={300} y={490} className="FillCyan FontSmall TextCenter">PSI</text>
                <line className="Indicator" x1={350} y1={488} x2={375} y2={490} />
            </SvgGroup>

            <EngineColumn x={210} y={40} engineNumber={2} />
        </EcamPage>
    );
};

function getNeedleValue(value: any, max: number): number {
    const numberValue = (Number)(value);
    if (numberValue < max) {
        return (numberValue / max) * 100;
    }
    return 100;
}

interface ComponentPositionProps {
    x: number,
    y: number,
    engineNumber: number
}

const PressureGauge = ({ x, y, engineNumber }: ComponentPositionProps) => {
    const [engineOilPressure] = useSimVar(`ENG OIL PRESSURE:${engineNumber}`, 'psi', 100);
    const displayedEngineOilPressure = Math.round(engineOilPressure / 2) * 2; // Engine oil pressure has a step of 2
    const OIL_PSI_MAX = 130;
    const OIL_PSI_HIGH_LIMIT = 130;
    const OIL_PSI_LOW_LIMIT = 14; // TODO FIXME: standin value
    const OIL_PSI_VLOW_LIMIT = 12;
    const [psiNeedleRed, setPsiNeedleRed] = useState(true);
    const [pressureAboveHigh, setPressureAboveHigh] = useState(false);
    const [pressureBelowLow, setPressureBelowLow] = useState(false);
    const [shouldPressurePulse, setShouldPressurePulse] = useState(false);
    const [n2Percent] = useSimVar(`ENG N2 RPM:${engineNumber}`, 'percent', 50);

    /* Controls different styling of pressure needle and digital readout according to certain critical, or cautionary ranges.
    */
    useEffect(() => {
        if (displayedEngineOilPressure > OIL_PSI_HIGH_LIMIT - 1) {
            setPressureAboveHigh(true);
        }

        if (pressureAboveHigh && displayedEngineOilPressure < OIL_PSI_HIGH_LIMIT - 4) {
            setPressureAboveHigh(false);
        }

        if (displayedEngineOilPressure < OIL_PSI_LOW_LIMIT && n2Percent > 75) {
            setPressureBelowLow(true);
        }

        if (pressureBelowLow && displayedEngineOilPressure > OIL_PSI_LOW_LIMIT + 2) {
            setPressureBelowLow(true);
        }

        if (pressureAboveHigh || pressureBelowLow) {
            setShouldPressurePulse(true);
        } else {
            setShouldPressurePulse(false);
        }

        if (displayedEngineOilPressure <= OIL_PSI_VLOW_LIMIT) {
            setPsiNeedleRed(true);
        }
        if (psiNeedleRed && displayedEngineOilPressure >= OIL_PSI_VLOW_LIMIT + 0.5) {
            setPsiNeedleRed(false);
        }
    }, [engineOilPressure]);

    return (
        <SvgGroup x={0} y={0}>
            <line className="GaugeMarking" x1={x} y1={y} x2={x} y2={y + 5} />
            <line className="GaugeMarking" x1={x + 45} y1={y + 50} x2={x + 51} y2={y + 50} />
            <Arc x={x} y={y + 50} radius={50} toValue={100} scaleMax={100} className="WhiteLine NoFill" />
            <Arc x={x} y={y + 50} radius={50} toValue={OIL_PSI_VLOW_LIMIT} scaleMax={100} className="RedLine NoFill" />
            <Needle
                x={x}
                y={y + 50}
                length={60}
                scaleMax={100}
                value={getNeedleValue(engineOilPressure, OIL_PSI_MAX)}
                className={`NoFill ${shouldPressurePulse ? 'LinePulse' : psiNeedleRed ? 'RedLine' : 'GreenLine'}`}
                dashOffset={-40}
            />
            <text
                x={x}
                y={y + 45}
                className={`FontLarge TextCenter ${shouldPressurePulse ? 'FillPulse' : psiNeedleRed ? 'FillRed' : 'FillGreen'}`}
            >
                {displayedEngineOilPressure}
            </text>
        </SvgGroup>
    );
};

const QuantityGauge = ({ x, y, engineNumber }: ComponentPositionProps) => {
    const [engineOilQuantity] = useSimVar(`ENG OIL QUANTITY:${engineNumber}`, 'percent', 100);
    const OIL_QTY_MAX = 24.25;
    const OIL_QTY_LOW_ADVISORY = 1.35;
    const displayedEngineOilQuantity = engineOilQuantity === 100 ? OIL_QTY_MAX : Math.round((engineOilQuantity / 100) * OIL_QTY_MAX / 0.5) * 0.5; // Engine oil quantity has a step of 0.2
    const [quantityAtOrBelowLow, setQuantityAtOrBelowLow] = useState(false);
    const [shouldQuantityPulse, setShouldQuantityPulse] = useState(false);

    // Sets engine oil quantity's pulsation based on advisory value constant, this should be changed in the future as its calculated on the fly in NEOs
    useEffect(() => {
        if (displayedEngineOilQuantity <= OIL_QTY_LOW_ADVISORY) {
            setQuantityAtOrBelowLow(true);
        }

        if (quantityAtOrBelowLow && displayedEngineOilQuantity >= OIL_QTY_LOW_ADVISORY + 2) {
            setQuantityAtOrBelowLow(false);
        }

        if (quantityAtOrBelowLow) setShouldQuantityPulse(true);
    }, [engineOilQuantity]);

    return (
        <SvgGroup x={0} y={0}>
            <line className="GaugeMarking" x1={x - 51} y1={y} x2={x - 45} y2={y} />
            <line className="GaugeMarking" x1={x} y1={y - 50} x2={x} y2={y - 45} />
            <line className="GaugeMarking" x1={x + 45} y1={y} x2={x + 51} y2={y} />
            <Arc x={x} y={y} radius={50} toValue={100} scaleMax={100} className="WhiteLine NoFill" />
            <Needle
                x={x}
                y={y}
                length={60}
                scaleMax={100}
                value={getNeedleValue(engineOilQuantity, OIL_QTY_MAX)}
                className={`NoFill ${displayedEngineOilQuantity === 0 && 'Hidden'} ${shouldQuantityPulse ? 'LinePulse' : 'GreenLine '}`}
                dashOffset={-40}
            />
            <Needle
                x={x}
                y={y}
                length={60}
                scaleMax={100}
                value={getNeedleValue(OIL_QTY_LOW_ADVISORY, OIL_QTY_MAX) - 3}
                className="NoFill AmberHeavy"
                dashOffset={-50}
            />
            <Needle
                x={x}
                y={y}
                length={50}
                scaleMax={100}
                value={getNeedleValue(OIL_QTY_LOW_ADVISORY, OIL_QTY_MAX) - 2}
                className="NoFill AmberLine"
                dashOffset={-45}
            />
            <text x={x + 5} y={y} className={`FontLarge TextCenter ${shouldQuantityPulse ? 'FillPulse' : 'FillGreen'}`}>
                <tspan className="FontLarge">{displayedEngineOilQuantity.toFixed(1).split('.')[0]}</tspan>
                <tspan className="FontSmall">.</tspan>
                <tspan className="FontSmall">{displayedEngineOilQuantity.toFixed(1).split('.')[1]}</tspan>
            </text>
        </SvgGroup>
    );
};

const ValveGroup = ({ x, y, engineNumber }: ComponentPositionProps) => {
    const [isValveOpen, setIsValveOpen] = useState(false);
    const [n2Percent] = useSimVar(`ENG N2 RPM:${engineNumber}`, 'percent', 50);
    const [isEngineStarting] = useSimVar(`GENERAL ENG STARTER:${engineNumber}`, 'bool', 300);
    const [engSelectorPosition] = useSimVar('L:XMLVAR_ENG_MODE_SEL', 'Enum', 1000);
    const [showIgniter, setShowIgniter] = useState(false);
    const [n2Igniting] = useSimVar(`TURB ENG IS IGNITING:${engineNumber}`, 'bool', 300);
    const [apuBleedPressure] = useSimVar('L:APU_BLEED_PRESSURE', 'psi', 250);

    // This useEffect ensures that the igniter is only shown when the engine is starting, n2 is igniting, and n2 percent is in between 18 and 55
    useEffect(() => {
        if (isEngineStarting && n2Igniting && n2Percent > 18 && n2Percent < 55) {
            setShowIgniter(true);
        } else {
            setShowIgniter(false);
        }
    }, [isEngineStarting, n2Igniting, n2Percent]);

    // This useEffect ensures that the valve is only opened if the engine mode selector is set to IGN/START, the engine is starting, and n2% is below 50
    useEffect(() => {
        if (isEngineStarting && n2Percent < 50 && engSelectorPosition === 2) {
            setTimeout(() => setIsValveOpen(true), 1200);
        } else {
            setTimeout(() => setIsValveOpen(false), 1200);
        }

        return () => clearTimeout();
    }, [isEngineStarting, engSelectorPosition]);

    useEffect(() => {
        if (n2Percent >= 50) {
            setIsValveOpen(false);
        }
    }, [n2Percent]);

    return (
        <SvgGroup x={0} y={0} className={`${engSelectorPosition !== 2 && 'Hidden'}`}>
            <text x={x - 7} y={y} className={`FillGreen FontMedium TextCenter ${!(isValveOpen && showIgniter) && 'Hidden'}`}>A</text>
            <text x={x + 7} y={y} className={`FillGreen FontMedium TextCenter ${!(isValveOpen && showIgniter) && 'Hidden'}`}>B</text>
            <g className="StartValveDiagram">
                {/* 375 to 30 */}
                <circle r={14} cx={x} cy={y + 30} />
                <line x1={x} y1={y + 10} x2={x} y2={y + 43} className={`${!isValveOpen && 'Hidden'}`} />
                <line x1={x - 14} y1={y + 30} x2={x + 14} y2={y + 30} className={`${isValveOpen && 'Hidden'}`} />
                <line x1={x} y1={y + 43} x2={x} y2={y + 50} />
            </g>
            <text x={x} y={y + 65} className="FillGreen FontLarge TextCenter">{apuBleedPressure}</text>
        </SvgGroup>
    );
};

const EngineColumn = ({ x, y, engineNumber }: ComponentPositionProps) => {
    // Fuel used has a step of 10 when in Kilograms and 20 when in imperial pounds
    const [weightUnit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');
    const [fuelUsed] = useSimVar(`L:A32NX_FUEL_USED:${engineNumber}`, 'number', 500);
    const displayedFuelUsed = parseInt(weightUnit) === 1 ? Math.round(fuelUsed / 10) * 10 : Math.round(fuelUsed * 2.20462 / 20) * 20;

    const [engineOilTemperature] = useSimVar(`GENERAL ENG OIL TEMPERATURE:${engineNumber}`, 'celsius', 250);
    const OIL_TEMP_LOW_TAKEOFF = 38;
    const OIL_TEMP_HIGH_ADVISORY = 140;
    const OIL_TEMP_VHIGH_LIMIT = 155;
    const displayedEngineOilTemperature = Math.round(engineOilTemperature / 5) * 5; // Engine oil temperature has a step of 5
    const [tempAmber, setTempAmber] = useState(false);
    const [shouldTemperaturePulse, setShouldTemperaturePulse] = useState(false);
    const [tempBeenAboveAdvisory, setTempBeenAboveAdvisory] = useState(false);

    const [n1Vibration] = useSimVar(`TURB ENG VIBRATION:${engineNumber}`, 'Number');

    const [n2Vibration] = useSimVar(`TURB ENG VIBRATION:${engineNumber}`, 'Number'); // FIXME TODO: should have a different value than N1, currently API limited

    useEffect(() => {
        if (displayedEngineOilTemperature >= OIL_TEMP_HIGH_ADVISORY) {
            setShouldTemperaturePulse(true);
        } else if (!tempBeenAboveAdvisory) {
            setShouldTemperaturePulse(false);
        }

        if (displayedEngineOilTemperature >= OIL_TEMP_VHIGH_LIMIT || engineOilTemperature < OIL_TEMP_LOW_TAKEOFF) {
            setTempAmber(true);
        } else {
            setTempAmber(false);
        }

        if (engineOilTemperature > OIL_TEMP_HIGH_ADVISORY) {
            setTimeout(() => {
                if (engineOilTemperature > OIL_TEMP_HIGH_ADVISORY) {
                    setTempBeenAboveAdvisory(true);
                }
            }, 900_000);
        } else {
            clearTimeout();
            setTempBeenAboveAdvisory(false);
        }

        return () => clearTimeout();
    }, [engineOilTemperature]);

    useEffect(() => {
        if (tempBeenAboveAdvisory) {
            setTempAmber(true);
        }
    }, [tempBeenAboveAdvisory]);

    return (
        <SvgGroup x={x} y={y}>
            <text x={x} y={y} className="FillGreen FontLarge TextCenter">{displayedFuelUsed}</text>

            <QuantityGauge x={x} y={y + 85} engineNumber={engineNumber} />

            <PressureGauge x={x} y={y + 110} engineNumber={engineNumber} />

            <text x={x} y={y + 220} className={`FontLarge TextCenter ${tempAmber ? 'FillAmber' : shouldTemperaturePulse ? 'FillPulse' : 'FillGreen'}`}>{displayedEngineOilTemperature}</text>

            <text x={x} y={y + 270} className="FillGreen TextCenter">
                <tspan className="FontLarge">{n1Vibration.toFixed(1).toString().split('.')[0]}</tspan>
                <tspan className="FontSmall">.</tspan>
                <tspan className="FontSmall">{n1Vibration.toFixed(1).toString().split('.')[1]}</tspan>
            </text>

            <text x={x} y={y + 300} className="FillGreen TextCenter">
                <tspan className="FontLarge">{n2Vibration.toFixed(1).toString().split('.')[0]}</tspan>
                <tspan className="FontSmall">.</tspan>
                <tspan className="FontSmall">{n2Vibration.toFixed(1).toString().split('.')[1]}</tspan>
            </text>

            <ValveGroup x={x} y={y + 345} engineNumber={engineNumber} />
        </SvgGroup>
    );
};

render(<EngPage />);
