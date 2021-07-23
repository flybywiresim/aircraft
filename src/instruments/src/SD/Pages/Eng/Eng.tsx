import React, { FC, useState, useEffect } from 'react';
import { render } from '@instruments/common/index';
import { setIsEcamPage } from '@instruments/common/defaults';
import { Arc, Needle } from '@instruments/common/gauges';
import { usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';

import './Eng.scss';
import { SvgGroup } from '../../Common/SvgGroup';

setIsEcamPage('eng_page');

export const EngPage: FC = () => {
    const [weightUnit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');

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
            <text x={300} y={370} className="FillWhite FontSmall TextCenter">N2</text>
            <line className="Indicator" x1={350} y1={370} x2={375} y2={372} />

            <line className="Indicator" x1={250} y1={488} x2={225} y2={490} />
            <text x={300} y={485} className="FillCyan FontSmall TextCenter">PSI</text>
            <line className="Indicator" x1={350} y1={488} x2={375} y2={490} />

            <EngineColumn x={210} y={40} engineNumber={2} />
        </EcamPage>
    );
};

interface EngineColumnProps {
    x: number,
    y: number,
    engineNumber: number
    // TODO: add simvars for engine parameters
}

const EngineColumn = ({ x, y, engineNumber }: EngineColumnProps) => {
    const [weightUnit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');

    const [flightPhase] = useSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'number', 2000);
    const [pressureClassName, setPressureClassName] = useState('');

    const [fuelUsed] = useSimVar(`L:A32NX_FUEL_USED:${engineNumber}`, 'number', 500);
    // Fuel used has a step of 10 when in Kilograms and 20 when in imperial pounds
    const displayedFuelUsed = parseInt(weightUnit) === 1 ? Math.round(fuelUsed / 10) * 10 : Math.round(fuelUsed / 20) * 20;

    const [engineOilQuantity] = useSimVar(`ENG OIL QUANTITY:${engineNumber}`, 'percent', 150); //* 0.01
    const OIL_QTY_MAX = 17.1;
    const displayedEngineOilQuantity = (Math.round((engineOilQuantity / 100) * OIL_QTY_MAX / 0.5) * 0.5).toFixed(1); // Engine oil quantity has a step of 0.2

    const [engineOilPressure] = useSimVar(`ENG OIL PRESSURE:${engineNumber}`, 'psi', 200);
    const displayedEngineOilPressure = Math.round(engineOilPressure / 2) * 2; // Engine oil pressure has a step of 2
    const OIL_PSI_MAX = 130;
    const OIL_PSI_VLOW_LIMIT = 17;

    const [engineOilTemperature] = useSimVar(`GENERAL ENG OIL TEMPERATURE:${engineNumber}`, 'celsius', 200);
    const displayedEngineOilTemperature = Math.round(engineOilTemperature / 5) * 5; // Engine oil temperature has a step of 5

    const [n1Vibration] = useSimVar(`TURB ENG VIBRATION:${engineNumber}`, 'Number');

    const [n2Vibration] = useSimVar(`TURB ENG VIBRATION:${engineNumber}`, 'Number'); // FIXME: should have a different value than N1, currently API limited

    const [isValveOpen, setIsValveOpen] = useState(false);

    useEffect(() => {
        if (flightPhase === 2 || flightPhase === 6 || engineOilPressure <= OIL_PSI_VLOW_LIMIT) {
            if (engineOilPressure >= OIL_PSI_MAX - 1) {
                setPressureClassName('animate-pulse');
            }
            if (engineOilPressure <= OIL_PSI_VLOW_LIMIT) {
                setPressureClassName('animate-pulse RedLine');
            }
            if (pressureClassName.length > 0) {
                if (engineOilPressure <= OIL_PSI_MAX - 4 || engineOilPressure >= OIL_PSI_VLOW_LIMIT + 0.5) {
                    setPressureClassName('');
                }
            }
        } else {
            setPressureClassName('');
        }
    }, [flightPhase, engineOilPressure]);

    function getNeedleValue(value: any, max: number): number {
        const numberValue = (Number)(value);
        if (numberValue < max) {
            return (numberValue / max) * 100;
        }
        return 100;
    }

    return (
        <SvgGroup x={x} y={y}>
            <text x={x} y={y} className="FillGreen FontLarge TextCenter">{displayedFuelUsed}</text>

            <line className="GaugeMarking" x1={x - 51} y1={y + 85} x2={x - 45} y2={y + 85} />
            <line className="GaugeMarking" x1={x} y1={y + 35} x2={x} y2={y + 40} />
            <line className="GaugeMarking" x1={x + 45} y1={y + 85} x2={x + 51} y2={y + 85} />
            <Arc x={x} y={y + 85} radius={50} toValue={100} scaleMax={100} className="WhiteLine NoFill" />
            <Needle x={x} y={y + 85} length={60} scaleMax={100} value={getNeedleValue(engineOilQuantity, OIL_QTY_MAX)} className="GreenLine NoFill" dashOffset={-40} />
            <text x={x + 5} y={y + 85} className="FillGreen FontLarge TextCenter">
                <tspan className="FontLarge">{displayedEngineOilQuantity.toString().split('.')[0]}</tspan>
                <tspan className="FontSmall">.</tspan>
                <tspan className="FontSmall">{displayedEngineOilQuantity.toString().split('.')[1]}</tspan>
            </text>

            <line className="GaugeMarking" x1={x} y1={y + 110} x2={x} y2={y + 115} />
            <line className="GaugeMarking" x1={x + 45} y1={y + 160} x2={x + 51} y2={y + 160} />
            <Arc x={x} y={y + 160} radius={50} toValue={100} scaleMax={100} className="WhiteLine NoFill" />
            <Arc x={x} y={y + 160} radius={50} toValue={13} scaleMax={100} className="RedLine NoFill" />
            <Needle x={x} y={y + 160} length={60} scaleMax={100} value={getNeedleValue(engineOilPressure, OIL_PSI_MAX)} className={`GreenLine NoFill ${pressureClassName}`} dashOffset={-40} />
            <text x={x} y={y + 155} className={`FillGreen FontLarge TextCenter ${pressureClassName}`}>{displayedEngineOilPressure}</text>

            <text x={x} y={y + 220} className="FillGreen FontLarge TextCenter">{displayedEngineOilTemperature}</text>
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

            <g>
                <circle r={12} cx={420} cy={456} />
                <line id="StartValveRight_CLOSED" x1={408} y1={456} x2={432} y2={456} className={`${isValveOpen && 'hidden'}`} />
                <line id="StartValveRight_OPEN" x1={420} y1={436} x2={420} y2={468} className={`${!isValveOpen && 'hidden'}`} />
                <line id="ValveRightBleed" x1={420} y1={468} x2={420} y2={476} />
            </g>
        </SvgGroup>
    );
};

render(<EngPage />);
