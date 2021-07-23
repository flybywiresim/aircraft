import React, { FC } from 'react';
import { render } from '@instruments/common/index';
import { setIsEcamPage } from '@instruments/common/defaults';
import { Arc, Needle } from '@instruments/common/gauges';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';

import './Eng.scss';
import { SvgGroup } from '../../Common/SvgGroup';

setIsEcamPage('eng_page');

export const EngPage: FC = () => (
    <EcamPage name="main-eng">
        <PageTitle x={0} y={18} text="ENGINE" />

        <EngineColumn x={50} y={50} engineNumber={1} />
        {/* TODO: attach this to simvar */}

        <line className="Indicator" x1={250} y1={75} x2={220} y2={77} />
        <text x={300} y={70} className="FillWhite FontSmall">F.USED</text>
        <text x={300} y={92} className="FillCyan FontSmall">KG</text>
        <line className="Indicator" x1={350} y1={75} x2={380} y2={77} />

        <text x={300} y={135} className="FillWhite FontSmall">OIL</text>
        <text x={300} y={165} className="FillCyan FontSmall">QT</text>
        <text x={300} y={265} className="FillCyan FontSmall">PSI</text>

        <line className="Indicator" x1={250} y1={312} x2={220} y2={314} />
        <text x={300} y={310} className="FillCyan FontSmall">&deg;C</text>
        <line className="Indicator" x1={350} y1={312} x2={380} y2={314} />

        <line className="Indicator" x1={250} y1={360} x2={220} y2={362} />
        <text x={300} y={360} className="FillCyan FontSmall">VIB N1</text>
        <line className="Indicator" x1={350} y1={360} x2={380} y2={362} />

        <line className="Indicator" x1={250} y1={390} x2={220} y2={392} />
        <text x={300} y={390} className="FillCyan FontSmall">N2</text>
        <line className="Indicator" x1={350} y1={390} x2={380} y2={392} />

        <line className="Indicator" x1={250} y1={488} x2={220} y2={490} />
        <text x={300} y={490} className="FillCyan FontSmall">PSI</text>
        <line className="Indicator" x1={350} y1={488} x2={380} y2={490} />
    </EcamPage>
);

interface EngineColumnProps {
    x: number,
    y: number,
    engineNumber: number
    // TODO: add simvars for engine parameters
}

const EngineColumn = ({ x, y, engineNumber }: EngineColumnProps) => (
    <SvgGroup x={x} y={y}>
        <text x={x} y={y} className="FillGreen">81</text>
        {/* use a variable here for fuel used */}

        <Arc x={x} y={y + 20} toValue={100} scaleMax={100} className="WhiteLine NoFill" />
        <text x={x - 40} y={y + 20} className="FillWhite FontLarge">0</text>
        <text x={x + 40} y={y + 20} className="FillWhite FontLarge">25</text>
        <Needle x={x} y={y + 20} scaleMax={100} value={0} className="GreenLine NoFill" />
        <text x={x + (x / 2)} className="FillGreen">25</text>
        {/* use a variable value for both the text and the needle */}

        <Arc x={x} y={y + 120} toValue={100} scaleMax={100} className="WhiteLine NoFill" />
        <Needle x={x} y={y + 120} scaleMax={100} value={0} className="GreenLine NoFill" />
        <text x={x} y={y + 120} className="FillGreen FontLarge">285</text>
        <text x={x} y={y + 135} className="FillGreen FontLarge">108</text>
        <text x={x} y={y + 150} className="FillGreen FontLarge">2.1</text>
        <text x={x} y={y + 165} className="FillGreen FontLarge">2.1</text>
        {/* use a variable value for both the text and the needle */}
    </SvgGroup>
);

render(<EngPage />);
