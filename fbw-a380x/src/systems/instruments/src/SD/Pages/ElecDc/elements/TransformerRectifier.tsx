import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';
import { Triangle } from '@instruments/common/Shapes';
import { DcElecBus } from './BusBar';

const TR_VOLTAGE_NORMAL_RANGE_LOWER = 27;
const TR_VOLTAGE_NORMAL_RANGE_UPPER = 32;
const TR_CURRENT_NORMAL_RANGE_LOWER = 2;

interface TransformerRectifierProps {
  x: number;
  y: number;
  bus: DcElecBus;
}

export const TransformerRectifier: FC<TransformerRectifierProps> = ({ x, y, bus }) => {
  const [potential] = useSimVar(`L:A32NX_ELEC_TR_${bus}_POTENTIAL`, 'volts', 500);
  const [current] = useSimVar(`L:A32NX_ELEC_TR_${bus}_CURRENT`, 'volts', 500);

  let title: string;
  let skipCurrentCheck: boolean = false;
  if (bus <= 2) {
    title = `TR ${bus}`;
  } else if (bus === DcElecBus.DcEssBus) {
    title = 'ESS TR';
  } else {
    title = 'APU TR';
    skipCurrentCheck = true;
  }

  let acBusTitle: string;
  let acBusLvar: string;
  if (bus === DcElecBus.Dc1Bus) {
    acBusTitle = 'AC 2';
    acBusLvar = '2';
  } else if (bus === DcElecBus.DcEssBus) {
    // TODO Should be ESS
    acBusLvar = 'ESS_SHED';

    const [cntrAcEssSwtg1Clsd] = useSimVar('L:A32NX_ELEC_CONTACTOR_3XC1_IS_CLOSED', 'bool', 500);
    const [cntrAcEssSwtg2Clsd] = useSimVar('L:A32NX_ELEC_CONTACTOR_3XC2_IS_CLOSED', 'bool', 500);
    const [cntrElecRatClsd] = useSimVar('L:A32NX_ELEC_CONTACTOR_5XE_IS_CLOSED', 'bool', 500);

    if (cntrAcEssSwtg1Clsd) {
      acBusTitle = 'AC 1';
    } else if (cntrAcEssSwtg2Clsd) {
      acBusTitle = 'AC 4';
    } else if (cntrElecRatClsd) {
      acBusTitle = 'EMER GEN';
    } else {
      acBusTitle = 'AC 1';
    }
  } else if (bus === DcElecBus.Dc2Bus) {
    acBusTitle = 'AC 3';
    acBusLvar = '3';
  } else {
    acBusTitle = 'AC 4';
    acBusLvar = '4';
  }

  const [acBusPowered] = useSimVar(`L:A32NX_ELEC_AC_${acBusLvar}_BUS_IS_POWERED`, 'bool', 500);

  const trCurrentNormal = skipCurrentCheck || current > TR_CURRENT_NORMAL_RANGE_LOWER;
  const trVoltageNormal = potential > TR_VOLTAGE_NORMAL_RANGE_LOWER && potential < TR_VOLTAGE_NORMAL_RANGE_UPPER;
  const trNormal = bus == DcElecBus.DcApu || (trCurrentNormal && trVoltageNormal);

  return (
    <g id={`tr-${bus}-indication`} transform={`translate(${x} ${y})`}>
      <path className="LightGrey SW3 NoFill" d="M 0,0 l 0,106 l 112,0 l 0,-106 z" />
      <text x={57} y={22} className={`F25 MiddleAlign ${trNormal ? 'White' : 'Amber'} LS1 WS-8`}>
        {title}
      </text>
      <g>
        <text className="Cyan F22" x={70} y={63}>
          V
        </text>
        <text className="Cyan F22" x={70} y={97}>
          A
        </text>
      </g>
      {/* Voltage */}
      <text x={65} y={62} className={`F28 EndAlign ${trVoltageNormal ? 'Green' : 'Amber'} LS1`}>
        {Math.round(potential)}
      </text>
      {/* Current */}
      <text x={65} y={97} className={`F28 EndAlign ${trCurrentNormal ? 'Green' : 'Amber'} LS1`}>
        {Math.round(current)}
      </text>
      <g>
        <Triangle x={56} y={112} colour={acBusPowered ? 'White' : 'Amber'} fill={0} orientation={0} scale={1} />
        <text className={`F25 ${acBusPowered ? 'White' : 'Amber'} MiddleAlign LS1 WS-8`} x={58} y={144}>
          {acBusTitle}
        </text>
      </g>
    </g>
  );
};
