import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { ComponentPositionProps } from '@instruments/common/ComponentPosition';
import { Layer } from '@instruments/common/utils';
import { useArinc429Var } from '@instruments/common/arinc429';
import { GaugeComponent, GaugeMarkerComponent } from '@instruments/common/gauges';
import { PageTitle } from '../Generic/PageTitle';
import { ApuGenerator } from 'instruments/src/SD/Pages/Apu/elements/ApuGenerator';
import Valve from '../../../Common/Valve';
import { NXUnits } from '@flybywiresim/fbw-sdk';

export const ApuPage = () => {
  const [apuAvail] = useSimVar('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'Bool', 1000);

  return (
    <>
      <PageTitle x={6} y={29}>
        APU
      </PageTitle>
      {/* APU Avail */}
      {apuAvail && (
        <text x={329} y={56} className="F34 Green LS2">
          AVAIL
        </text>
      )}

      <ApuGeneratorSet x={78} y={107} />

      <ApuBleed x={558} y={136} />

      {/* Separation Bar */}
      <path d="m 29 263 v -29 h 712 v 29" className="SW4 White LineRound NoFill" />

      <ApuFuelUsed />

      <NGauge x={165} y={346} />

      <EgtGauge x={165} y={553} />

      <ApuMemos x={484} y={392} />
    </>
  );
};

const ApuGeneratorSet = ({ x, y }: ComponentPositionProps) => {
  const [masterSwPbOn] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', 500);

  return (
    <Layer x={x} y={y}>
      <ApuGenerator x={0} y={0} position={1} />
      <g className={masterSwPbOn ? '' : 'Hide'}>
        <text x={92} y={43} className="F22 Cyan">
          %
        </text>
        <text x={92} y={67} className="F22 Cyan">
          V
        </text>
        <text x={86} y={92} className="F22 Cyan">
          HZ
        </text>
      </g>
      <ApuGenerator x={114} y={0} position={2} />
    </Layer>
  );
};

const ApuBleed = ({ x, y }: ComponentPositionProps) => {
  const [apuBleedPbOn] = useSimVar('L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON', 'Bool', 1000);
  const [apuBleedPbOnConfirmed, setApuBleedPbOnConfirmed] = useState(false);
  const [apuBleedOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'Bool', 1000);
  // FIXME This Lvar doesn't seem to work.
  const [apuBleedPressureAbsolute] = useSimVar('L:A32NX_PNEU_APU_BLEED_CONTAINER_PRESSURE', 'PSI', 1000);
  // FIXME Since APU pressure is constant right now we also subtract a 1 bar / 14.7 psi static pressure to arrive at the correct pressure
  // Should be ADIRU static pressure
  const apuBleedPressureGauge = apuBleedPressureAbsolute - 14.7;
  // APU bleed pressure is shown in steps of two.
  const displayedBleedPressure = apuBleedOpen ? Math.round(apuBleedPressureGauge / 2) * 2 : 0;
  // This assumes that the SD is displayed by DMC 1, which is the case during normal operation.
  const [attHdgPosition] = useSimVar('L:A32NX_ATT_HDG_SWITCHING_KNOB', 'Position', 100);
  const adrSource = attHdgPosition === 0 ? 3 : 1;
  const correctedAverageStaticPressure = useArinc429Var(
    `L:A32NX_ADIRS_ADR_${adrSource}_CORRECTED_AVERAGE_STATIC_PRESSURE`,
    100,
  );
  const apuN = useArinc429Var('L:A32NX_APU_N', 100);

  useEffect(() => {
    if (apuBleedPbOn) {
      const timeout = setTimeout(() => {
        setApuBleedPbOnConfirmed(true);
      }, 10_000);
      return () => clearTimeout(timeout);
    }
    setApuBleedPbOnConfirmed(false);

    return () => {};
  }, [apuBleedPbOn]);

  const color = !apuBleedOpen && apuBleedPbOnConfirmed ? 'Amber' : 'Green';

  // FIXME should be APU bleed absolute pressure label from SDAC
  const apuBleedPressAvailable = apuN.isNormalOperation() && correctedAverageStaticPressure.isNormalOperation();
  return (
    <>
      {/* FBW-31-08 */}
      <Layer x={x} y={y}>
        {apuBleedOpen && (
          <>
            <line className="SW2 Green" x1={60} y1={-56} x2={60} y2={-71} />
            <polygon className="SW2 Green NoFill" points="50,-71 60,-86 70,-71" />
          </>
        )}
        <Valve
          x={61}
          y={-37}
          radius={19.5}
          position={apuBleedOpen ? 'V' : 'H'}
          css={`SW2 ${color} NoFill`}
          sdacDatum={true}
        />

        <path className={`SW2 ${color}`} d="m 60 0 v -17" />

        <rect className="SW2 White NoFill" width={118} height={71} />

        <text x={25} y={27} className="F22 White LS1">
          BLEED
        </text>

        <text x={56} y={63} className={`F27 EndAlign ${apuBleedPressAvailable ? 'Green' : 'Amber'}`}>
          {apuBleedPressAvailable ? displayedBleedPressure : 'XX'}
        </text>
        <text x={62} y={62} className="F22 Cyan">
          PSI
        </text>
      </Layer>
    </>
  );
};

const ApuFuelUsed = () => {
  const apuFuelUsed = useArinc429Var('L:A32NX_APU_FUEL_USED', 100);
  // APU fuel used is shown in steps of 10. The value is visible even if the ECB is unpowered.
  // Todo: If the value is not being calculated by the ECB it should show a crossed out value.
  const displayedApuFuelUsed = Math.round(NXUnits.kgToUser(apuFuelUsed.value) / 10) * 10;

  return (
    <g>
      <text x={258} y={271} className="F26 White LS1">
        APU FU
      </text>
      <text x={416} y={263} className="F28 Green MiddleAlign">
        {displayedApuFuelUsed}
      </text>
      <text x={474} y={271} className="F23 Cyan LS2">
        {NXUnits.userWeightUnit()}
      </text>
    </g>
  );
};

const NGauge = ({ x, y }: ComponentPositionProps) => {
  const apuN = useArinc429Var('L:A32NX_APU_N', 100);
  const apuN2 = useArinc429Var('L:A32NX_APU_N2', 100);
  let apuN1IndicationColor: string;
  if (apuN.value < 105) {
    apuN1IndicationColor = 'Green';
  } else {
    apuN1IndicationColor = 'Red';
  }

  let apuN2IndicationColor: string;
  if (apuN2.value < 102) {
    apuN2IndicationColor = 'Green';
  } else {
    apuN2IndicationColor = 'Red';
  }

  const GAUGE_MIN = 0;
  const GAUGE_MAX = 120;
  const GAUGE_MARKING_MAX = GAUGE_MAX / 10;
  const GAUGE_RADIUS = 64;
  const GAUGE_START = 225;
  const GAUGE_END = 46;

  const gaugeMarkerClassName = 'SW3 White LineRound';
  const gaugeMarkerTextClassName = 'F22 LS1 White';

  return (
    <>
      <Layer x={x} y={y}>
        <Layer x={0} y={-1}>
          <GaugeComponent
            x={0}
            y={0}
            radius={GAUGE_RADIUS}
            startAngle={GAUGE_START}
            endAngle={GAUGE_END}
            visible
            className="SW3 White NoFill"
          >
            <GaugeComponent
              x={0}
              y={0}
              radius={GAUGE_RADIUS - 1}
              startAngle={GAUGE_END - 21}
              endAngle={GAUGE_END}
              visible
              className="SW6 Red NoFill"
            >
              {/* 0 */}
              <GaugeMarkerComponent
                x={0}
                y={0}
                min={GAUGE_MIN}
                max={GAUGE_MARKING_MAX}
                value={0}
                radius={GAUGE_RADIUS}
                startAngle={GAUGE_START}
                endAngle={GAUGE_END}
                className={gaugeMarkerClassName}
                textClassName={gaugeMarkerTextClassName}
                textNudgeX={12}
                textNudgeY={-10}
                showValue
                bold
              />
              {/* 50 */}
              <GaugeMarkerComponent
                x={0}
                y={0}
                min={GAUGE_MIN}
                max={GAUGE_MARKING_MAX}
                value={5}
                radius={GAUGE_RADIUS}
                startAngle={GAUGE_START}
                endAngle={GAUGE_END}
                className={gaugeMarkerClassName}
                bold
              />
              {/* 100 */}
              <GaugeMarkerComponent
                x={0}
                y={0}
                min={GAUGE_MIN}
                max={GAUGE_MARKING_MAX}
                value={10}
                radius={GAUGE_RADIUS}
                startAngle={GAUGE_START}
                endAngle={GAUGE_END}
                className={gaugeMarkerClassName}
                textClassName={gaugeMarkerTextClassName}
                showValue
                textNudgeX={-2}
                textNudgeY={17}
                bold
              />
              {apuN.isNormalOperation() && (
                <GaugeMarkerComponent
                  x={0}
                  y={0}
                  min={GAUGE_MIN}
                  radius={GAUGE_RADIUS}
                  max={GAUGE_MAX}
                  startAngle={GAUGE_START}
                  endAngle={GAUGE_END}
                  value={Number.parseFloat(apuN.value.toFixed())}
                  className={`SW4 LineRound ${apuN1IndicationColor}`}
                  indicator
                />
              )}
            </GaugeComponent>
          </GaugeComponent>
        </Layer>

        <text x={104} y={18} className="F26 LS1 White MiddleAlign">
          N1
        </text>
        <text x={101} y={57} className="F22 Cyan MiddleAlign">
          %
        </text>
        <text x={104} y={97} className="F26 LS1 White MiddleAlign">
          N2
        </text>

        <text x={72} y={24} className={`F35 LS1 EndAlign ${apuN.isNormalOperation() ? apuN1IndicationColor : 'Amber'}`}>
          {apuN.isNormalOperation() ? apuN.value.toFixed() : 'XX'}
        </text>
        <text
          x={72}
          y={103}
          className={`F35 LS1 EndAlign ${apuN2.isNormalOperation() ? apuN2IndicationColor : 'Amber'}`}
        >
          {apuN2.isNormalOperation() ? apuN2.value.toFixed() : 'XX'}
        </text>
      </Layer>
    </>
  );
};

const EgtGauge = ({ x, y }: ComponentPositionProps) => {
  const apuEgt = useArinc429Var('L:A32NX_APU_EGT', 100);
  const displayedEgtValue = Math.round(apuEgt.value / 5) * 5; // APU Exhaust Gas Temperature is shown in steps of five.

  const apuEgtWarning = useArinc429Var('L:A32NX_APU_EGT_WARNING', 500);

  const redLineShown = apuEgtWarning.isNormalOperation();

  // FBW-31-05
  let egtNeedleStyle: string;

  if (apuEgt.value > apuEgtWarning.value) {
    egtNeedleStyle = 'Red';
  } else {
    egtNeedleStyle = 'Green';
  }

  let egtNumericalStyle: string;

  if (!apuEgt.isNormalOperation()) {
    egtNumericalStyle = 'Amber';
  } else {
    egtNumericalStyle = egtNeedleStyle;
  }

  const GAUGE_MIN = 0;
  const GAUGE_MIDDLE = 400;
  const GAUGE_MAX = 950;
  const GAUGE_MARKING_MIDDLE = GAUGE_MIDDLE / 100;
  const GAUGE_MARKING_MAX = GAUGE_MAX / 100;

  const GAUGE_RADIUS = 64;

  const GAUGE_START = 221;
  const GAUGE_MIDDLE_ANGLE = 310;
  const GAUGE_END = 122;

  const GAUGE_MARKING_START = GAUGE_START;

  const gaugeMarkerClassName = 'SW3 White LineRound';
  const gaugeMarkerTextClassName = 'F22 LS1 White';

  return (
    <>
      <Layer x={x} y={y}>
        <Layer x={0} y={0}>
          <GaugeComponent
            x={0}
            y={0}
            radius={GAUGE_RADIUS}
            startAngle={GAUGE_START - 10}
            endAngle={GAUGE_END}
            visible
            className="Line White NoFill ThickLine"
          >
            {/* 000 */}
            <GaugeMarkerComponent
              x={0}
              y={0}
              min={GAUGE_MIN}
              max={GAUGE_MARKING_MAX}
              value={0}
              radius={GAUGE_RADIUS}
              startAngle={GAUGE_MARKING_START}
              endAngle={GAUGE_END}
              className={gaugeMarkerClassName}
              textClassName={gaugeMarkerTextClassName}
              textNudgeX={9}
              textNudgeY={-9}
              showValue
              bold
            />
            {/* 400 */}
            <GaugeMarkerComponent
              x={0}
              y={0}
              min={GAUGE_MARKING_MIDDLE}
              max={GAUGE_MARKING_MAX}
              value={4}
              radius={GAUGE_RADIUS}
              startAngle={GAUGE_MIDDLE_ANGLE}
              endAngle={GAUGE_END}
              className={gaugeMarkerClassName}
              bold
            />
            {/* 500 */}
            <GaugeMarkerComponent
              x={0}
              y={0}
              min={GAUGE_MARKING_MIDDLE}
              max={GAUGE_MARKING_MAX}
              value={5}
              radius={GAUGE_RADIUS}
              startAngle={GAUGE_MIDDLE_ANGLE}
              endAngle={GAUGE_END}
              className={gaugeMarkerClassName}
              textClassName={gaugeMarkerTextClassName}
              textNudgeX={9}
              textNudgeY={12}
              showValue
              bold
            />
            {/* 600 */}
            <GaugeMarkerComponent
              x={0}
              y={0}
              min={GAUGE_MARKING_MIDDLE}
              max={GAUGE_MARKING_MAX}
              value={6}
              radius={GAUGE_RADIUS}
              startAngle={GAUGE_MIDDLE_ANGLE}
              endAngle={GAUGE_END}
              className={gaugeMarkerClassName}
              bold
            />
            {/* 700 */}
            <GaugeMarkerComponent
              x={0}
              y={0}
              min={GAUGE_MARKING_MIDDLE}
              max={GAUGE_MARKING_MAX}
              value={7}
              radius={GAUGE_RADIUS}
              startAngle={GAUGE_MIDDLE_ANGLE}
              endAngle={GAUGE_END}
              className={gaugeMarkerClassName}
              textClassName={gaugeMarkerTextClassName}
              textNudgeX={-8}
              textNudgeY={10}
              showValue
              bold
            />
            {/* 800 */}
            <GaugeMarkerComponent
              x={0}
              y={0}
              min={GAUGE_MARKING_MIDDLE}
              max={GAUGE_MARKING_MAX}
              value={8}
              radius={GAUGE_RADIUS}
              startAngle={GAUGE_MIDDLE_ANGLE}
              endAngle={GAUGE_END}
              className={gaugeMarkerClassName}
              bold
            />
            {/* 900 */}
            <GaugeMarkerComponent
              x={0}
              y={0}
              min={GAUGE_MARKING_MIDDLE}
              max={GAUGE_MARKING_MAX}
              value={9}
              radius={GAUGE_RADIUS}
              startAngle={GAUGE_MIDDLE_ANGLE}
              endAngle={GAUGE_END}
              className={gaugeMarkerClassName}
              textClassName={gaugeMarkerTextClassName}
              textNudgeX={-9}
              textNudgeY={-7}
              showValue
              bold
            />

            <GaugeComponent
              x={0}
              y={0}
              radius={GAUGE_RADIUS - 1}
              startAngle={
                GAUGE_END +
                ((GAUGE_MAX - apuEgtWarning.value) / (GAUGE_MAX - GAUGE_MIDDLE)) * (GAUGE_END - GAUGE_MIDDLE_ANGLE)
              }
              endAngle={GAUGE_END}
              visible={redLineShown}
              className="SW6 Red NoFill"
            />

            {apuEgt.isNormalOperation() && (
              <GaugeMarkerComponent
                x={0}
                y={0}
                min={displayedEgtValue < GAUGE_MIDDLE ? GAUGE_MIN : GAUGE_MIDDLE}
                max={displayedEgtValue < GAUGE_MIDDLE ? GAUGE_MIDDLE : GAUGE_MAX}
                radius={GAUGE_RADIUS}
                startAngle={displayedEgtValue < GAUGE_MIDDLE ? GAUGE_MARKING_START : GAUGE_MIDDLE_ANGLE}
                endAngle={displayedEgtValue < GAUGE_MIDDLE ? GAUGE_MIDDLE_ANGLE : GAUGE_END}
                value={displayedEgtValue}
                className={`SW4 LineRound ${egtNeedleStyle === 'Pulse' ? 'LinePulse' : egtNeedleStyle}`}
                indicator
              />
            )}
          </GaugeComponent>
        </Layer>

        <text x={77} y={29} className="F26 White LS1">
          EGT
        </text>
        <text x={100} y={60} className="F22 Cyan MiddleAlign">
          &deg;C
        </text>
        <text x={83} y={67} className={`F35 LS1 EndAlign ${egtNumericalStyle}`}>
          {apuEgt.isNormalOperation() ? displayedEgtValue : 'XX'}
        </text>
      </Layer>
    </>
  );
};

const ApuMemos = ({ x, y }: ComponentPositionProps) => {
  const lowFuelPressure = useArinc429Var('L:A32NX_APU_LOW_FUEL_PRESSURE_FAULT', 1000);

  const [apuFlapOpenPercentage] = useSimVar('L:A32NX_APU_FLAP_OPEN_PERCENTAGE', 'Percent', 1000);
  const [isIntakeIndicationFlashing, setIsIntakeIndicationFlashing] = useState(false);

  const [apuMasterPbOn] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', 1000);

  const intakeApuMismatch = apuFlapOpenPercentage !== 0 && !apuMasterPbOn;

  useEffect(() => {
    if (intakeApuMismatch) {
      const timeout = setTimeout(() => {
        setIsIntakeIndicationFlashing(true);
      }, 180000);
      return () => clearTimeout(timeout);
    }
    if (isIntakeIndicationFlashing) {
      setIsIntakeIndicationFlashing(false);
    }
    return () => {};
  }, [intakeApuMismatch, isIntakeIndicationFlashing]);

  return (
    <>
      {/* Memos */}
      <Layer x={x} y={y}>
        {lowFuelPressure.value && (
          <text className="Amber F27 LS2" x={0} y={0}>
            FUEL PRESS LO
          </text>
        )}

        {apuFlapOpenPercentage >= 10 && (
          <text className={`Green F27 LS2 ${isIntakeIndicationFlashing ? 'FillPulse' : ''}`} x={0} y={70}>
            {apuFlapOpenPercentage <= 90 ? 'FLAP MOVING' : 'FLAP OPEN'}
          </text>
        )}
        {/* FBW-31-07 */}
      </Layer>
    </>
  );
};
