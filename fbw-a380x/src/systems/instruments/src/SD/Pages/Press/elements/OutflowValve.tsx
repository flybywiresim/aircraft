import React, { memo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { EngineNumber, Position, ValidRedundantSystem } from '@instruments/common/types';
import { GaugeComponent, GaugeMarkerComponent } from '@instruments/common/gauges';
import { useArinc429Var } from '@flybywiresim/fbw-sdk';

const OutflowValve: React.FC<Position & EngineNumber & ValidRedundantSystem> = memo(({ x, y, engine, system }) => {
  const ofradius = 52;

  const [flightPhase] = useSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'enum', 1000);

  const [manOutflowValueOpenPercentage] = useSimVar(
    `L:A32NX_PRESS_MAN_OUTFLOW_VALVE_${engine}_OPEN_PERCENTAGE`,
    'percent',
    500,
  );

  const outflowValueOpenPercentageArinc = useArinc429Var(
    `L:A32NX_PRESS_OUTFLOW_VALVE_${engine}_OPEN_PERCENTAGE_B${system}`,
    500,
  );
  const outflowValueOpenPercentage = outflowValueOpenPercentageArinc.isNormalOperation()
    ? outflowValueOpenPercentageArinc.value
    : manOutflowValueOpenPercentage;

  const cpiomBCpcsDiscreteWord = useArinc429Var(`L:A32NX_COND_CPIOM_B${engine}_CPCS_DISCRETE_WORD`);

  const [dualChannelFailure] =
    useSimVar(`L:A32NX_PRESS_OCSM_${engine}_CHANNEL_1_FAILURE`, 'bool', 500) &&
    useSimVar(`L:A32NX_PRESS_OCSM_${engine}_CHANNEL_2_FAILURE`, 'bool', 500);
  const [autoPartitionFailure] = useSimVar(`L:A32NX_PRESS_OCSM_${engine}_AUTO_PARTITION_FAILURE`, 'bool', 500);
  const sysFault = cpiomBCpcsDiscreteWord.bitValueOr(11, true) || autoPartitionFailure || dualChannelFailure;

  return (
    <>
      <text x={x - 32} y={y - 82} className={`F26 ${sysFault ? 'Amber' : 'Green'}`}>
        {engine}
      </text>
      <GaugeComponent
        x={x}
        y={y}
        radius={ofradius}
        startAngle={270 + (outflowValueOpenPercentage / 100) * 90}
        endAngle={360}
        visible
        className="Gauge"
      >
        <GaugeComponent
          x={x}
          y={y + 2}
          radius={ofradius - 3}
          startAngle={352}
          endAngle={360}
          visible
          className="Gauge Amber ThickAmberLine"
        />
        <GaugeMarkerComponent
          value={outflowValueOpenPercentage}
          x={x}
          y={y}
          min={0}
          max={100}
          radius={ofradius}
          startAngle={270}
          endAngle={360}
          className={
            flightPhase >= 6 && flightPhase <= 9 && outflowValueOpenPercentage > 95 ? 'Amber Line' : 'Green Line'
          }
          indicator
          multiplierOuter={1}
        />
        <GaugeMarkerComponent
          value={0}
          x={x}
          y={y}
          min={0}
          max={100}
          radius={ofradius}
          startAngle={270}
          endAngle={360}
          className="Gauge"
        />
        <GaugeMarkerComponent
          value={25}
          x={x}
          y={y}
          min={0}
          max={100}
          radius={ofradius}
          startAngle={270}
          endAngle={360}
          className="Gauge"
        />
        <GaugeMarkerComponent
          value={50}
          x={x}
          y={y}
          min={0}
          max={100}
          radius={ofradius}
          startAngle={270}
          endAngle={360}
          className="Gauge"
        />
        <GaugeMarkerComponent
          value={75}
          x={x}
          y={y}
          min={0}
          max={100}
          radius={ofradius}
          startAngle={270}
          endAngle={360}
          className="Gauge"
        />
        <GaugeMarkerComponent
          value={100}
          x={x}
          y={y}
          min={0}
          max={100}
          radius={ofradius}
          startAngle={270}
          endAngle={360}
          className="Gauge"
        />
      </GaugeComponent>
      <circle className="Green SW3 BackgroundFill" cx={x} cy={y} r={4} />
    </>
  );
});

export default OutflowValve;
