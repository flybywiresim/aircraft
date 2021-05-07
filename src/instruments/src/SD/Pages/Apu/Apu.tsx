import classNames from 'classnames';
import React from 'react';
import ReactDOM from 'react-dom';
import { getRenderTarget, setIsEcamPage } from '../../../Common/defaults';
import { SimVarProvider, useSimVar } from '../../../Common/simVars';

import './Apu.scss';

setIsEcamPage('apu_page');

export const ApuPage = () => {
    const gaugeOffset = -210

    const [apuAvail] = useSimVar('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'Bool', 1000);

    const [apuGenLoad] = useSimVar('L:A32NX_ELEC_APU_GEN_1_LOAD', 'Percent', 1000);
    const [apuGenVoltage] = useSimVar('L:A32NX_ELEC_APU_GEN_1_POTENTIAL', 'Volts', 1000);
    const [apuGenFreq] = useSimVar('L:A32NX_ELEC_APU_GEN_1_FREQUENCY', 'Hertz', 1000);

    const [apuBleedOn] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'Bool', 1000);
    const [apuBleedPressure] = useSimVar('L:APU_BLEED_PRESSURE', 'PSI', 1000);

    const [apuNValue] = useSimVar('L:A32NX_APU_N', 'Percent', 1000);
    const [apuEgtValue] = useSimVar('L:A32NX_APU_EGT', 'Celsius', 1000);

    return (
        <EcamPage name="main-apu">
            <text x="283" y="33">APU</text>

            <ApuGenBox x={105} y={109} load={apuGenLoad} voltage={apuGenVoltage} freq={apuGenFreq} />
            <BleedBox x={120} y={163} pressure={apuBleedPressure} apuBleedOn={apuBleedOn} />
        </EcamPage>
    )
}

const SvgGroup = ({ x, y, children }) => <g transform={`translate(${x},${y})`}>{children}</g>;

const EcamPage = ({ name, children }) => {
    <svg id={name} version="1.1" viewBox="0 0 600 600" style={{ marginTop: '-60px' }} xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
}

const ApuGenBox = ({ x, y, load, voltage, freq }) => {
    return (
        <SvgGroup x={x} y={y}>
            <Box width={100} height={111} />
            <text x={116} y={127}>APU GEN</text>
            <text x={160} y={154} className={'Cyan'}>%</text>
            <text x={160} y={184} className={'Cyan'}>V</text>
            <text x={160} y={210} className={'Cyan'}>HZ</text>

            <text x={155} y={154} className={`End ${load === 0 ? 'Amber' : 'Green'}`}>{load}</text>
            <text x={155} y={154} className={`End ${voltage === 0 ? 'Amber' : 'Green'}`}>{voltage}</text>
            <text x={155} y={154} className={`End ${freq === 0 ? 'Amber' : 'Green'}`}>{freq}</text>
        </SvgGroup>
    )
}

const BleedBox = ({ x, y, pressure, apuBleedOn }) => {
    return (
        <SvgGroup x={x} y={y}>
            <Box width={100} height={57} />
            <text x={442} y={182}>BLEED</text>
            <text x={473} y={207} className={'Cyan'}>PSI</text>

            <text x={471} y={207} className={'End Green'}>{pressure}</text>

            <line className={'Line'} x1="470" y1="162" x2="470" y2="141" />
            <circle className={'Circle'} cx="470" r="18px" cy="123" />
            <line className={'Line'} x1={apuBleedOn ? 470 : 452} y1={apuBleedOn ? 105 : 123} x2={apuBleedOn ? 470 : 488} y2={apuBleedOn ? 141 : 123} />
            {
                apuBleedOn &&
                <>
                    <line className={'Line'} x1="470" y1="105" x2="470" y2="91"></line>
                    <polygon className={'Line'} points="460, 91 470, 71 480, 91"></polygon>
                </>
            }
        </SvgGroup>
    )
}

// const NGauge = ({ x, y, value }) => {

// }

// const EgtGauge = ({ x, y, value }) => {

// }

const Box = ({ width, height }) => {
    <rect className="Box" width={width} height={height} />
}
