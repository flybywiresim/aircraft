import { useArinc429Var } from '@flybywiresim/fbw-sdk';
import { GaugeComponent, GaugeMarkerComponent, splitDecimals } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import { Position, ValidRedundantSystem } from '@instruments/common/types';
import React from 'react';

export const DeltaP: React.FC<Position & ValidRedundantSystem> = ({ x, y, system }) => {
  const [manDeltaPsi] = useSimVar('L:A32NX_PRESS_MAN_CABIN_DELTA_PRESSURE', 'feet', 500);
  const deltaPsiArinc = useArinc429Var(`L:A32NX_PRESS_CABIN_DELTA_PRESSURE_B${system}`, 500);
  const deltaPsi = deltaPsiArinc.isNormalOperation() ? deltaPsiArinc.value : manDeltaPsi;

  const deltaPress = splitDecimals(deltaPsi);

  // Fixme: There is an edge case here where all CPIOM Bs have failed and the ADIRS are not sending data, that we would still have
  // delta pressure available from the manual partition. Unsure how the aircraft handles this situation so this is left for future work.
  const deltaPressNotAvail = deltaPsiArinc.isNoComputedData();

  let colour;
  if (deltaPsi < -0.72 || deltaPsi > 9.2) {
    colour = `Red`;
  } else if ((-0.72 <= deltaPsi && deltaPsi <= -0.2) || (8.92 <= deltaPsi && deltaPsi <= 9.2)) {
    colour = `Amber`;
  } else {
    colour = `Green`;
  }

  const radius = 86;
  const startAngle = 205;
  const endAngle = 55;

  return (
    <g id="DeltaPressure">
      <text className="F29 LS1 Center White" x={x - 51} y={y - 142}>
        DELTA P
      </text>
      <text className="F24 Center Cyan" x={x - 18} y={y - 105}>
        PSI
      </text>
      <text className={`F35 End ${colour} ${deltaPressNotAvail ? 'hide' : 'show'}`} x={x + 9} y={y + 48}>
        {deltaPress[0]}
      </text>
      <text className={`F35 End ${colour} ${deltaPressNotAvail ? 'hide' : 'show'}`} x={x + 29} y={y + 48}>
        .
      </text>
      <text className={`F35 End ${colour} ${deltaPressNotAvail ? 'hide' : 'show'}`} x={x + 56} y={y + 48}>
        {deltaPress[1]}
      </text>
      <text className={`F35 End Amber ${deltaPressNotAvail ? 'show' : 'hide'}`} x={x + 53} y={y + 35}>
        XX
      </text>
      <GaugeComponent x={x} y={y} radius={radius} startAngle={startAngle} endAngle={endAngle} visible className="Gauge">
        <GaugeComponent
          x={x}
          y={y}
          radius={radius - 2}
          startAngle={endAngle - 15}
          endAngle={endAngle}
          visible
          className="GaugeComponent Gauge ThickRedLine"
        />
        <GaugeComponent
          x={x}
          y={y}
          radius={radius - 2}
          startAngle={endAngle - 30}
          endAngle={endAngle - 15}
          visible
          className="GaugeComponent Gauge ThickAmberLine"
        />
        <GaugeComponent
          x={x}
          y={y}
          radius={radius - 2}
          startAngle={startAngle}
          endAngle={startAngle + 8}
          visible
          className="GaugeComponent Gauge ThickRedLine"
        />
        <GaugeComponent
          x={x}
          y={y}
          radius={radius - 2}
          startAngle={startAngle + 8}
          endAngle={startAngle + 16}
          visible
          className="GaugeComponent Gauge ThickAmberLine"
        />
        <GaugeMarkerComponent
          value={10}
          x={x}
          y={y}
          min={-1}
          max={10.5}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          className="Gauge"
          showValue
          textNudgeY={14}
          textNudgeX={-3}
        />
        <GaugeMarkerComponent
          value={7.5}
          x={x}
          y={y}
          min={-1}
          max={10.5}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          className="Gauge"
        />
        <GaugeMarkerComponent
          value={5}
          x={x}
          y={y}
          min={-1}
          max={10.5}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          className="Gauge"
        />
        <GaugeMarkerComponent
          value={2.5}
          x={x}
          y={y}
          min={-1}
          max={10.5}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          className="Gauge"
        />
        <GaugeMarkerComponent
          value={0}
          x={x}
          y={y}
          min={-1}
          max={10.5}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          className="GaugeText"
          showValue
          textNudgeY={-6}
          textNudgeX={10}
        />
        <GaugeMarkerComponent
          value={deltaPsi}
          x={x}
          y={y}
          min={-1}
          max={10.5}
          radius={radius}
          startAngle={startAngle}
          endAngle={endAngle}
          className={`GaugeIndicator SW4 ${colour} ${deltaPressNotAvail ? 'hide' : 'show'}`}
          indicator
          multiplierOuter={1.01}
        />
      </GaugeComponent>
    </g>
  );
};

export default DeltaP;
