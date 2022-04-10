import React, { useEffect, useState } from 'react';
import { render } from '@instruments/common/index';
import { SimVarProvider, useSimVar } from '@instruments/common/simVars';
import { setIsEcamPage } from '@instruments/common/defaults';
import { Triangle } from '../../Common/Shapes';
import HydSys from './elements/HydSys';
import RAT from './elements/RAT';
import PTU from './elements/PTU';

import './Hyd.scss';

setIsEcamPage('hyd_page');

export const HydPage = () => {
    // The FADEC SimVars include a test for the fire button.
    const [Eng1N2] = useSimVar('TURB ENG N2:1', 'Percent', 1000);
    const [Eng2N2] = useSimVar('TURB ENG N2:2', 'Percent', 1000);

    const [greenPressure] = useSimVar('L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE', 'psi', 500);
    const [yellowPressure] = useSimVar('L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE', 'psi', 500);
    const [bluePressure] = useSimVar('L:A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE', 'psi', 500);

    const [greenPumpPBStatus] = useSimVar('L:A32NX_OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO', 'boolean', 500);
    const [yellowPumpPBStatus] = useSimVar('L:A32NX_OVHD_HYD_ENG_2_PUMP_PB_IS_AUTO', 'boolean', 500);
    const [bluePumpPBStatus] = useSimVar('L:A32NX_OVHD_HYD_EPUMPB_PB_IS_AUTO', 'boolean', 500);

    const [yellowElectricPumpStatus] = useSimVar('L:A32NX_HYD_YELLOW_EPUMP_ACTIVE', 'boolean', 500);

    const [greenHydLevel] = useSimVar('L:A32NX_HYD_GREEN_RESERVOIR_LEVEL', 'gallon', 1000);
    const [yellowHydLevel] = useSimVar('L:A32NX_HYD_YELLOW_RESERVOIR_LEVEL', 'gallon', 1000);
    const [blueHydLevel] = useSimVar('L:A32NX_HYD_BLUE_RESERVOIR_LEVEL', 'gallon', 1000);

    const [greenFireValve] = useSimVar('L:A32NX_HYD_GREEN_PUMP_1_FIRE_VALVE_OPENED', 'boolean', 500);
    const [yellowFireValve] = useSimVar('L:A32NX_HYD_YELLOW_PUMP_1_FIRE_VALVE_OPENED', 'boolean', 500);

    const [ACBus1IsPowered] = useSimVar('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'bool', 1000);
    const [ACBus2IsPowered] = useSimVar('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'bool', 1000);

    const [engine1Running, setEngine1Running] = useState(0);
    const [engine2Running, setEngine2Running] = useState(0);

    const [elecRightFormat, setElecRightFormat] = useState('hide');
    const [elecTriangleFill, setElecTriangleFill] = useState(0);
    const [elecTriangleColour, setElecTriangleColour] = useState('white');

    useEffect(() => {
        if (yellowElectricPumpStatus) {
            setElecTriangleFill(1);
            setElecTriangleColour(yellowPressure <= 1450 ? 'Amber' : 'Green');
            setElecRightFormat(yellowPressure <= 1450 ? 'AmberLine' : 'GreenLine');
        } else {
            setElecTriangleFill(0);
            setElecTriangleColour('White');
            setElecRightFormat('Hide');
        }
    }, [greenPressure, yellowPressure, yellowElectricPumpStatus]);

    useEffect(() => {
        setEngine1Running(Eng1N2 > 15 && greenFireValve);
        setEngine2Running(Eng2N2 > 15 && yellowFireValve);
    }, [Eng1N2, Eng2N2]);

    const y = 45;

    return (
        <>
            {/* This is already in an svg so we should remove the containing one - TODO remove style once we are not in the Asobo ECAM */}
            <svg id="hyd-page" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" style={{ marginTop: '-60px' }}>
                <text id="PageTitle" className="PageTitle" x="300" y="16" alignmentBaseline="central">HYD</text>
                <text className={`EngineNumber ${engine1Running ? 'FillWhite' : 'FillAmber'}`} x="160" y={y + 260} alignmentBaseline="central">1</text>
                <text className={`EngineNumber ${engine2Running ? 'FillWhite' : 'FillAmber'}`} x="440" y={y + 260} alignmentBaseline="central">2</text>

                <HydSys
                    title="GREEN"
                    pressure={greenPressure}
                    hydLevel={greenHydLevel}
                    x={110}
                    y={y}
                    fireValve={greenFireValve}
                    pumpPBStatus={greenPumpPBStatus}
                    yellowElectricPumpStatus={yellowElectricPumpStatus}
                />
                <HydSys
                    title="BLUE"
                    pressure={bluePressure}
                    hydLevel={blueHydLevel}
                    x={300}
                    y={y}
                    fireValve={0}
                    pumpPBStatus={bluePumpPBStatus}
                    yellowElectricPumpStatus={yellowElectricPumpStatus}
                />
                <HydSys
                    title="YELLOW"
                    pressure={yellowPressure}
                    hydLevel={yellowHydLevel}
                    x={490}
                    y={y}
                    fireValve={yellowFireValve}
                    pumpPBStatus={yellowPumpPBStatus}
                    yellowElectricPumpStatus={yellowElectricPumpStatus}
                />

                {/* <PTU x={300} y={y + 126} /> */}

                <RAT x={290} y={y} />

                <text
                    id="ELEC-centre"
                    className={!ACBus1IsPowered ? 'RatPtuElec FillAmber' : 'RatPtuElec FillWhite'}
                    x={350}
                    y={y + 245}
                    alignmentBaseline="central"
                >
                    ELEC

                </text>

                <text
                    id="ELEC-right"
                    className={!ACBus2IsPowered ? 'RatPtuElec FillAmber' : 'RatPtuElec FillWhite'}
                    x={548}
                    y={y + 180}
                    alignmentBaseline="central"
                >
                    ELEC

                </text>
                <Triangle x={500} y={y + 180} colour={elecTriangleColour} fill={elecTriangleFill} orientation={-90} />
                <line className={elecRightFormat} x1={490} y1={y + 180} x2={500} y2={y + 180} />

                <text className="Psi" x={205} y={y + 70} alignmentBaseline="central">PSI</text>
                <text className="Psi" x={395} y={y + 70} alignmentBaseline="central">PSI</text>

            </svg>
        </>
    );
};

render(<SimVarProvider><HydPage /></SimVarProvider>);
