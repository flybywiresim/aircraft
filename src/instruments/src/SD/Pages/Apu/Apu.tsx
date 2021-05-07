import React from 'react';
import ReactDOM from 'react-dom';
import { getRenderTarget, setIsEcamPage } from '../../../Common/defaults';
import { SimVarProvider, useSimVar } from '../../../Common/simVars';
import { PageTitle } from '../../Common/PageTitle';

import './Apu.scss';

setIsEcamPage('apu_page');

export const ApuPage = () => {
    // const gaugeOffset = -210;

    const [apuAvail] = useSimVar('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'Bool', 1000);

    const [apuGenLoad] = useSimVar('L:A32NX_ELEC_APU_GEN_1_LOAD', 'Percent', 1000);
    const [apuGenVoltage] = useSimVar('L:A32NX_ELEC_APU_GEN_1_POTENTIAL', 'Volts', 1000);
    const [apuGenFreq] = useSimVar('L:A32NX_ELEC_APU_GEN_1_FREQUENCY', 'Hertz', 1000);

    const [apuBleedOn] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'Bool', 1000);
    const [apuBleedPressure] = useSimVar('L:APU_BLEED_PRESSURE', 'PSI', 1000);

    // const [apuNValue] = useSimVar('L:A32NX_APU_N', 'Percent', 1000);
    // const [apuEgtValue] = useSimVar('L:A32NX_APU_EGT', 'Celsius', 1000);

    return (
        <EcamPage name="main-apu">
            <PageTitle x={283} y={33} text="APU" />

            <ApuGenBox x={105} y={109} load={apuGenLoad} voltage={apuGenVoltage} freq={apuGenFreq} />
            <AvailSig x={283} y={115} apuAvail={apuAvail} />
            <BleedBox x={420} y={163} pressure={apuBleedPressure} apuBleedOn={apuBleedOn} />
        </EcamPage>
    );
};

const SvgGroup = ({ x, y, children }) => <g transform={`translate(${x},${y})`}>{children}</g>;

const EcamPage = ({ name, children }) => (
    <svg id={name} version="1.1" viewBox="0 0 600 600" style={{ marginTop: '-60px' }} xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
);

const ApuGenBox = ({ x, y, load, voltage, freq }) => (
    <SvgGroup x={x} y={y}>
        <Box width={100} height={111} />
        <text x={11} y={18}>APU GEN</text>
        <text x={55} y={45} className="Cyan">%</text>
        <text x={55} y={75} className="Cyan">V</text>
        <text x={55} y={105} className="Cyan">HZ</text>

        <text x={50} y={45} className={`Right ${load === 0 ? 'Amber' : 'Green'}`}>{load.toFixed()}</text>
        <text x={50} y={75} className={`Right ${voltage === 0 ? 'Amber' : 'Green'}`}>{voltage.toFixed()}</text>
        <text x={50} y={105} className={`Right ${freq === 0 ? 'Amber' : 'Green'}`}>{freq.toFixed()}</text>
    </SvgGroup>
);

const BleedBox = ({ x, y, pressure, apuBleedOn }) => (
    <SvgGroup x={x} y={y}>
        <Box width={100} height={57} />
        <text x={22} y={19}>BLEED</text>
        <text x={53} y={44} className="Cyan">PSI</text>

        <text x={51} y={44} className="Right Green">{pressure.toFixed()}</text>

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
    </SvgGroup>
);

const AvailSig = ({ x, y, apuAvail }) => (
    <SvgGroup x={x} y={y}>
        {
            apuAvail && (
                <>
                    <text x="0" y="0" className="Green">AVAIL</text>
                </>
            )
        }
    </SvgGroup>
);

// const NGauge = ({ x, y, value }) => {

// }

// const EgtGauge = ({ x, y, value }) => {

// }

const Box = ({ width, height }) => (
    <rect className="Box" width={width} height={height} />
);

ReactDOM.render(<SimVarProvider><ApuPage /></SimVarProvider>, getRenderTarget());
