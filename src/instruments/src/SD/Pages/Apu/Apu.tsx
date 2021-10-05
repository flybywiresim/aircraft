import React from 'react';
import { render } from '@instruments/common/index';
import { useSimVar } from '@instruments/common/simVars';
import { setIsEcamPage } from '@instruments/common/defaults';
import { PageTitle } from '../../Common/PageTitle';

import './Apu.scss';

setIsEcamPage('apu_page');

export const ApuPage = () => {
    const [apuAvail] = useSimVar('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'Bool', 1000);

    const [apuGenLoad] = useSimVar('L:A32NX_ELEC_APU_GEN_1_LOAD', 'Percent', 1000);
    const [apuGenVoltage] = useSimVar('L:A32NX_ELEC_APU_GEN_1_POTENTIAL', 'Volts', 1000);
    const [apuGenFreq] = useSimVar('L:A32NX_ELEC_APU_GEN_1_FREQUENCY', 'Hertz', 1000);

    const [apuBleedOn] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'Bool', 1000);
    const [apuBleedPressure] = useSimVar('L:APU_BLEED_PRESSURE', 'PSI', 1000);

    // const [apuNValue] = useSimVar('L:A32NX_APU_N', 'Percent', 1000);
    // const [apuEgtValue] = useSimVar('L:A32NX_APU_EGT', 'Celsius', 1000);

    const [apuFlapOpenPercentage] = useSimVar('L:A32NX_APU_FLAP_OPEN_PERCENTAGE', 'Percent', 1000);
    const [lowFuelPressure] = useSimVar('L:A32NX_APU_LOW_FUEL_PRESSURE_FAULT', 'Bool', 1000);

    return (
        <svg id="main-apu" version="1.1" viewBox="0 0 600 600" style={{ marginTop: '-60px' }} xmlns="http://www.w3.org/2000/svg">
            <PageTitle x={283} y={33} text="APU" />

            <g transform="translate(105,109)">
                <rect className="Box" width={100} height={111} />
                <text x={11} y={18}>APU GEN</text>
                <text x={55} y={45} className="Cyan">%</text>
                <text x={55} y={75} className="Cyan">V</text>
                <text x={55} y={105} className="Cyan">HZ</text>

                <text x={50} y={45} className={`Right ${apuGenLoad === 0 ? 'Amber' : 'Green'}`}>{apuGenLoad.toFixed()}</text>
                <text x={50} y={75} className={`Right ${apuGenVoltage === 0 ? 'Amber' : 'Green'}`}>{apuGenVoltage.toFixed()}</text>
                <text x={50} y={105} className={`Right ${apuGenFreq === 0 ? 'Amber' : 'Green'}`}>{apuGenFreq.toFixed()}</text>
            </g>
            <g transform="translate(283,115)">
                {
                    apuAvail && (
                        <>
                            <text x="0" y="0" className="Green">AVAIL</text>
                        </>
                    )
                }
            </g>
            <g transform="translate(420,163)">
                <rect className="Box" width={100} height={57} />
                <text x={22} y={19}>BLEED</text>
                <text x={53} y={44} className="Cyan">PSI</text>

                <text x={51} y={44} className="Right Green">{apuBleedPressure.toFixed()}</text>

                <line className="Line" x1="50" y1="-1" x2="50" y2="-22" />
                <circle className="Circle" cx="50" r="18px" cy="-40" />
                <line className="Line" x1={apuBleedOn ? 50 : 32} y1={apuBleedOn ? -58 : -40} x2={apuBleedOn ? 50 : 68} y2={apuBleedOn ? -22 : -40} />
                {
                    apuBleedOn && (
                        <>
                            <line className="Line" x1="50" y1="-57" x2="50" y2="-72" />
                            <polygon className="Circle" points="40,-72 50,-92 60,-72" />
                        </>
                    )
                }
            </g>
            <g transform="translate(83,227)">
                <line className="Line White" x1="0" y1="0" x2="0" y2="26" />
                <line className="Line White" x1="0" y1="0" x2="455" y2="0" />
                <line className="Line White" x1="455" y1="0" x2="455" y2="26" />
            </g>
            <g transform="translate(400,375)">
                { apuFlapOpenPercentage === 100 && <text className="Green" x="0" y="0">FLAP OPEN</text> }
            </g>
            <g transform="translate(409,315)">
                { lowFuelPressure && <text x="0" y="0" className="Green">FUEL LO PR</text> }
            </g>
            <g transform="translate(125,260)">
                <path className="Line White" d="M74 170 C2 98 98 2 170 74" />
            </g>
            <g transform="translate(125,390)">
                <path className="Line White" d="M74 170 C2 98 98 2 170 74" />
            </g>
        </svg>
    );
};

render(<ApuPage />);
