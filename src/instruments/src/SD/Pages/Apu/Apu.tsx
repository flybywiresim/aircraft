import React from 'react';
import { render } from '@instruments/common/index';
import { setIsEcamPage } from '@instruments/common/defaults';
import { useSimVar } from '@instruments/common/simVars';
import { PageTitle } from '../../Common/PageTitle';

import './Apu.scss';
import { EcamPage } from '../../Common/EcamPage';
import { SvgGroup } from '../../Common/SvgGroup';

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
        <EcamPage name="main-apu">
            <PageTitle x={283} y={33} text="APU" />

            {/* APU Avail */}
            <SvgGroup x={305} y={85}>
                {
                    apuAvail && (
                        <>
                            <text x={0} y={0} className="Green FontTitle Center">AVAIL</text>
                        </>
                    )
                }
            </SvgGroup>

            {/* APU Gen */}
            {/* TODO: Use Bigger font for values */}
            <SvgGroup x={105} y={100}>
                <rect className="Box" width={100} height={111} />
                <text x={50} y={20} className="Center">APU GEN</text>
                <SvgGroup x={70} y={55}>
                    <text x={0} y={0} className="Cyan">%</text>
                    <text x={0} y={25} className="Cyan">V</text>
                    <text x={0} y={50} className="Cyan">HZ</text>
                </SvgGroup>
                <SvgGroup x={60} y={55}>
                    <text x={0} y={0} className={`Right ${apuGenLoad === 0 ? 'Amber' : 'Green'}`}>{apuGenLoad.toFixed()}</text>
                    <text x={0} y={25} className={`Right ${apuGenVoltage === 0 ? 'Amber' : 'Green'}`}>{apuGenVoltage.toFixed()}</text>
                    <text x={0} y={50} className={`Right ${apuGenFreq === 0 ? 'Amber' : 'Green'}`}>{apuGenFreq.toFixed()}</text>
                </SvgGroup>
            </SvgGroup>

            {/* Bleed */}
            {/* TODO: Use Bigger font for values */}
            <SvgGroup x={420} y={153}>
                <rect className="Box" width={100} height={57} />

                <text x={50} y={22} className="Center">BLEED</text>
                <text x={10} y={48} className="Green">{apuBleedPressure.toFixed()}</text>
                <text x={90} y={48} className="Cyan Right">PSI</text>

                <line className="Line" x1={50} y1={-1} x2={50} y2={-22} />
                <circle className="Circle" cx={50} r={18} cy={-40} />
                <line className="Line" x1={apuBleedOn ? 50 : 32} y1={apuBleedOn ? -58 : -40} x2={apuBleedOn ? 50 : 68} y2={apuBleedOn ? -22 : -40} />
                {
                    apuBleedOn && (
                        <>
                            <line className="Line" x1={50} y1={-57} x2={50} y2={-72} />
                            <polygon className="Circle" points="40,-72 50,-92 60,-72" />
                        </>
                    )
                }
            </SvgGroup>

            {/* Separation Bar */}
            <SvgGroup x={83} y={247}>
                <line className="Line White" x1={0} y1={0} x2={0} y2={26} />
                <line className="Line White" x1={-1} y1={0} x2={456} y2={0} />
                <line className="Line White" x1={455} y1={0} x2={455} y2={26} />
            </SvgGroup>

            {/* Memos */}
            <SvgGroup x={370} y={335}>
                { lowFuelPressure
                && <text className="Green" x={0} y={0}>FUEL LO PR</text> }

                { apuFlapOpenPercentage === 100
                 && <text className="Green" x={0} y={60}>FLAP OPEN</text> }

                {/* FIXME: REPLACE THIS CONDITION */}
                { apuFlapOpenPercentage === 100
                 && <text className="Green" x={0} y={120}>LOW OIL LEVEL</text> }
            </SvgGroup>

            {/* FIXME: Incorrect Gauges */}
            <SvgGroup x={125} y={260}>
                <path className="Line White" d="M74 170 C2 98 98 2 170 74" />
            </SvgGroup>
            <SvgGroup x={125} y={390}>
                <path className="Line White" d="M74 170 C2 98 98 2 170 74" />
            </SvgGroup>
        </EcamPage>
    );
};

render(<ApuPage />);
