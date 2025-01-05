// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import classNames from 'classnames';
import { useSimVar } from '@flybywiresim/fbw-sdk';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';
import { SvgGroup } from '../../Common/SvgGroup';

import './Elec.scss';

const maxStaleness = 300;

export const ElecPage = () => {
  const [dc1IsPowered] = useSimVar('L:A32NX_ELEC_DC_1_BUS_IS_POWERED', 'Bool', maxStaleness);
  const [dc2IsPowered] = useSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'Bool', maxStaleness);
  const [dcEssIsPowered] = useSimVar('L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED', 'Bool', maxStaleness);
  const [dcEssShedBusIsPowered] = useSimVar('L:A32NX_ELEC_DC_ESS_SHED_BUS_IS_POWERED', 'Bool', maxStaleness);
  const [ac1IsPowered] = useSimVar('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'Bool', maxStaleness);
  const [ac2IsPowered] = useSimVar('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'Bool', maxStaleness);
  const [acEssIsPowered] = useSimVar('L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED', 'Bool', maxStaleness);
  const [acEssShedBusIsPowered] = useSimVar('L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED', 'Bool', maxStaleness);
  const [externalPowerAvailable] = useSimVar('L:A32NX_EXT_PWR_AVAIL:1', 'Bool', maxStaleness);
  const [staticInverterInUse] = useSimVar('L:A32NX_ELEC_CONTACTOR_15XE2_IS_CLOSED', 'Bool', maxStaleness);
  const [galleyIsShed] = useSimVar('L:A32NX_ELEC_GALLEY_IS_SHED', 'Bool', maxStaleness);
  const [tr1SuppliesDc1] = useSimVar('L:A32NX_ELEC_CONTACTOR_5PU1_IS_CLOSED', 'Bool', maxStaleness);
  const [tr2SuppliesDc2] = useSimVar('L:A32NX_ELEC_CONTACTOR_5PU2_IS_CLOSED', 'Bool', maxStaleness);
  const [ac1SuppliesAcEss] = useSimVar('L:A32NX_ELEC_CONTACTOR_3XC1_IS_CLOSED', 'Bool', maxStaleness);
  const [ac2SuppliesAcEss] = useSimVar('L:A32NX_ELEC_CONTACTOR_3XC2_IS_CLOSED', 'Bool', maxStaleness);
  const [dc1AndDcBatConnected] = useSimVar('L:A32NX_ELEC_CONTACTOR_1PC1_IS_CLOSED', 'Bool', maxStaleness);
  const [dcBatAndDcEssConnected] = useSimVar('L:A32NX_ELEC_CONTACTOR_4PC_IS_CLOSED', 'Bool', maxStaleness);
  const [dc2AndDcBatConnected] = useSimVar('L:A32NX_ELEC_CONTACTOR_1PC2_IS_CLOSED', 'Bool', maxStaleness);

  const [emergencyGeneratorSupplies] = useSimVar('L:A32NX_ELEC_CONTACTOR_2XE_IS_CLOSED', 'Bool', maxStaleness);
  const [acEssBusContactorClosed] = useSimVar('L:A32NX_ELEC_CONTACTOR_15XE1_IS_CLOSED', 'Bool', maxStaleness);
  const [trEssSuppliesDcEss] = useSimVar('L:A32NX_ELEC_CONTACTOR_3PE_IS_CLOSED', 'Bool', maxStaleness);

  const [externalPowerContactorClosed] = useSimVar('L:A32NX_ELEC_CONTACTOR_3XG_IS_CLOSED', 'Bool', maxStaleness);
  const [apuGeneratorContactorClosed] = useSimVar('L:A32NX_ELEC_CONTACTOR_3XS_IS_CLOSED', 'Bool', maxStaleness);
  const [generatorLineContactor1Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_9XU1_IS_CLOSED', 'Bool', maxStaleness);
  const [generatorLineContactor2Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_9XU2_IS_CLOSED', 'Bool', maxStaleness);
  const [busTieContactor1Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_11XU1_IS_CLOSED', 'Bool', maxStaleness);
  const [busTieContactor2Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_11XU2_IS_CLOSED', 'Bool', maxStaleness);

  const [idg1Connected] = useSimVar('L:A32NX_ELEC_ENG_GEN_1_IDG_IS_CONNECTED', 'Bool', maxStaleness);
  const [idg2Connected] = useSimVar('L:A32NX_ELEC_ENG_GEN_2_IDG_IS_CONNECTED', 'Bool', maxStaleness);

  return (
    <EcamPage name="main-elec">
      <PageTitle x={6} y={18} text="ELEC" />

      <BatteryToBatBusWire x={196.611875} y={50.77125} number={1} />
      <BatteryToBatBusWire x={367.724375} y={50.77125} number={2} />

      {tr1SuppliesDc1 ? <Wire description="TR1 to DC1" d="M56.25 117 v44.1 v-44.1" /> : null}
      <Wire description="AC1 to TR1" amber={!ac1IsPowered} d="M56.25 238.35 v29 v-29" />

      {tr2SuppliesDc2 ? <Wire description="TR2 to DC2" d="M536.25 117 v44.1 v-44.1" /> : null}
      <Wire description="AC2 to TR2" d="M536.25 238.35 v29 v-29" amber={!ac2IsPowered} />

      {ac1SuppliesAcEss ? <Wire description="AC1 to AC ESS" d="M138.57 279.32 h94.63 h-94.63" /> : null}
      {ac2SuppliesAcEss ? <Wire description="AC2 to AC ESS" d="M367.5 279.32 h94.63 h-94.63" /> : null}

      {dc1AndDcBatConnected && !dcBatAndDcEssConnected ? (
        <Wire description="DC1 to DC BAT" d="M90.15 103.125 h168.69 v-41" />
      ) : null}
      {dc1AndDcBatConnected && dcBatAndDcEssConnected ? (
        <Wire description="DC 1 to DC BAT and DC ESS" d="M90.15 103.125 h168.69 v-44 v58.40 v-14.4" />
      ) : null}
      {dc2AndDcBatConnected ? (
        <Wire description="DC2 to DC BAT" d="M 341.16 103.125 h 166.66 h -166.66 v -42.52 v42.52" />
      ) : null}

      {acEssBusContactorClosed && !emergencyGeneratorSupplies ? (
        <Wire description="AC ESS to ESS TR" d="M258.84 237.65 v 28.52 v -28.52" />
      ) : null}
      {trEssSuppliesDcEss ? <Wire description="ESS TR to DC ESS" d="M258.84 143.63 v 7.11 v -7.11" /> : null}
      <Arrow
        x={258.84 - arrowSize / 2}
        y={157.58}
        description="ESS TR to DC ESS"
        green={trEssSuppliesDcEss}
        direction="up"
      />

      {emergencyGeneratorSupplies ? (
        <Wire description="EMER GEN to ESS TR" d="M 319.02 207.90 h -20.04 h 20.04" />
      ) : null}
      <Arrow
        x={326.25}
        y={214.77}
        description="EMER GEN to ESS TR"
        green={emergencyGeneratorSupplies}
        direction="left"
      />
      {acEssBusContactorClosed && emergencyGeneratorSupplies ? (
        <>
          <Wire description="EMER GEN to AC ESS" d="M 343.55 237.62 v 14.25 v -14.25" />
          <Arrow x={350.42} y={252.87} description="EMER GEN to AC ESS" green direction="down" />
        </>
      ) : null}

      {externalPowerContactorClosed && busTieContactor1Closed && !busTieContactor2Closed ? (
        <Wire description="EXT PWR to AC1" d="M56.44 302.81 v18.75 h305.10 v57.94" />
      ) : null}
      {externalPowerContactorClosed && !busTieContactor1Closed && busTieContactor2Closed ? (
        <Wire description="EXT PWR to AC2" d="M536.25 302.81 v18.75 h-174.68 v57.94" />
      ) : null}
      {externalPowerContactorClosed && busTieContactor1Closed && busTieContactor2Closed ? (
        <Wire description="EXT PWR to AC1 and AC2" d="M536.25 302.81 v18.75 h-174.68 v57.94 v-57.94 h-305.10 v-18.75" />
      ) : null}

      {apuGeneratorContactorClosed && busTieContactor1Closed && !busTieContactor2Closed ? (
        <Wire description="APU GEN to AC1" d="M56.44 302.81 v18.75 h159.60 v35.67" />
      ) : null}
      {apuGeneratorContactorClosed && !busTieContactor1Closed && busTieContactor2Closed ? (
        <Wire description="APU GEN to AC2" d="M536.25 302.81 v18.75 h-320.2 v35.67" />
      ) : null}
      {apuGeneratorContactorClosed && busTieContactor1Closed && busTieContactor2Closed ? (
        <Wire description="APU GEN to AC1 and AC2" d="M536.25 302.81 v18.75 h-320.2 v35.67 v-35.67 h-159.60 v-18.75" />
      ) : null}

      {generatorLineContactor1Closed && !busTieContactor1Closed ? (
        <Wire description="GEN1 to AC1" d="M56.44 302.81 v42.5 v-42.5" />
      ) : null}
      {generatorLineContactor1Closed && busTieContactor1Closed && busTieContactor2Closed ? (
        <Wire description="GEN1 to AC1 and AC2" d="M56.44 302.81 v42.5 v-23.75 h479.81 v-20.75" />
      ) : null}

      {generatorLineContactor2Closed && !busTieContactor2Closed ? (
        <Wire description="GEN2 to AC2" d="M536.25 302.81 v42.5 v-42.5" />
      ) : null}
      {generatorLineContactor2Closed && busTieContactor1Closed && busTieContactor2Closed ? (
        <Wire description="GEN2 to AC1 and AC2" d="M536.25 302.81 v42.5 v-23.75 h-479.81 v-20.75" />
      ) : null}

      {generatorLineContactor1Closed || busTieContactor1Closed ? (
        <Arrow x={56.25 - arrowSize / 2} y={303.77} description="AC1" green direction="up" />
      ) : null}
      {generatorLineContactor2Closed || busTieContactor2Closed ? (
        <Arrow x={536.25 - arrowSize / 2} y={303.77} description="AC2" green direction="up" />
      ) : null}
      {externalPowerContactorClosed && (busTieContactor1Closed || busTieContactor2Closed) ? (
        <Arrow x={354.77} y={385.88} description="EXT PWR" green direction="up" />
      ) : null}
      {apuGeneratorContactorClosed && (busTieContactor1Closed || busTieContactor2Closed) ? (
        <Arrow x={209.09} y={363.75} description="APU GEN" green direction="up" />
      ) : null}

      <Battery x={108.75} y={10} number={1} />
      <Battery x={405} y={10} number={2} />
      <BatteryBus x={232.5} y={35} width={135} />
      <Bus x={6} y={90} width={86.25} name="DC" number={1} isNormal={dc1IsPowered} />
      <Bus x={507.75} y={90} width={86.25} name="DC" number={2} isNormal={dc2IsPowered} />
      <Bus x={232.5} y={116.25} width={135} name="DC ESS" isNormal={dcEssIsPowered} isShed={!dcEssShedBusIsPowered} />
      <Bus x={6} y={266.25} width={135} name="AC" number={1} isNormal={ac1IsPowered} />
      <Bus x={459} y={266.25} width={135} name="AC" number={2} isNormal={ac2IsPowered} />
      <Bus x={232.5} y={266.25} width={135} name="AC ESS" isNormal={acEssIsPowered} isShed={!acEssShedBusIsPowered} />
      <EngineGenerator x={13.125} y={345} number={1} />
      <EngineGenerator x={493.125} y={345} number={2} />
      <ApuGenerator x={168.75} y={367.5} />
      {staticInverterInUse ? <StaticInverter x={315} y={390} /> : null}
      {!staticInverterInUse && externalPowerAvailable ? <ExternalPower x={315} y={390} /> : null}
      <TransformerRectifier x={13.125} y={161.25} number={1} />
      <TransformerRectifier x={493.125} y={161.25} number={2} />
      <TransformerRectifier
        x={213.75}
        y={161.25}
        number={3}
        titleOnly={!trEssSuppliesDcEss && !acEssBusContactorClosed && !emergencyGeneratorSupplies}
      />
      <EmergencyGenerator x={330} y={161.25} titleOnly={!emergencyGeneratorSupplies} />

      {galleyIsShed ? <GalleyShed x={300} y={483.75} /> : null}

      <IntegratedDriveGeneratorTitle x={28.13} y={476.25} number={1} />
      <IntegratedDriveGeneratorTemperature x={135} y={476.25} number={1} />
      {!idg1Connected ? <IntegratedDriveGeneratorDisconnected x={29.13} y={495} /> : null}
      <IntegratedDriveGeneratorTitle x={513.75} y={476.25} number={2} />
      <IntegratedDriveGeneratorTemperature x={480} y={476.25} number={2} />
      {!idg2Connected ? <IntegratedDriveGeneratorDisconnected x={518.75} y={495} /> : null}
    </EcamPage>
  );
};

const Battery = ({ x, y, number }) => {
  const [isAuto] = useSimVar(`L:A32NX_OVHD_ELEC_BAT_${number}_PB_IS_AUTO`, 'Bool', maxStaleness);

  const [potential] = useSimVar(`L:A32NX_ELEC_BAT_${number}_POTENTIAL`, 'Volts', maxStaleness);
  const [potentialWithinNormalRange] = useSimVar(`L:A32NX_ELEC_BAT_${number}_POTENTIAL_NORMAL`, 'Bool', maxStaleness);

  const [current] = useSimVar(`L:A32NX_ELEC_BAT_${number}_CURRENT`, 'Ampere', maxStaleness);
  const [currentWithinNormalRange] = useSimVar(`L:A32NX_ELEC_BAT_${number}_CURRENT_NORMAL`, 'Bool', maxStaleness);

  const allParametersWithinNormalRange = potentialWithinNormalRange && currentWithinNormalRange;

  const [staticInverterInUse] = useSimVar('L:A32NX_ELEC_CONTACTOR_15XE2_IS_CLOSED', 'Bool', maxStaleness);

  return (
    <SvgGroup x={x} y={y}>
      <Box width={86.25} height={71.25} />
      <text x={52.5} y={21.625} className={`Right ${!allParametersWithinNormalRange && isAuto ? 'Amber' : ''}`}>
        BAT
      </text>
      <text x={56.25} y={21.625} className={`Large ${!allParametersWithinNormalRange && isAuto ? 'Amber' : ''}`}>
        {number}
      </text>
      {isAuto ? (
        <>
          <ElectricalProperty
            x={52.5}
            y={43.125}
            value={potential}
            unit="V"
            isWithinNormalRange={potentialWithinNormalRange}
          />
          <ElectricalProperty
            x={52.5}
            y={65.625}
            value={Math.abs(current)}
            unit="A"
            isWithinNormalRange={currentWithinNormalRange}
          />
        </>
      ) : (
        <text x={43.125} y={41.25} className="Middle" dominantBaseline="middle">
          OFF
        </text>
      )}
      {number === 1 && staticInverterInUse ? (
        <>
          <Arrow x={92.57625} y={1.875} direction="right" />
          <text x={108.75} y={15} className="Medium">
            STAT INV
          </text>
        </>
      ) : null}
    </SvgGroup>
  );
};

const BatteryToBatBusWire = ({ x, y, number }) => {
  const [contactorClosed] = useSimVar(`L:A32NX_ELEC_CONTACTOR_6PB${number}_IS_CLOSED`, 'Bool', maxStaleness);
  const [current] = useSimVar(`L:A32NX_ELEC_BAT_${number}_CURRENT`, 'Ampere', maxStaleness);
  const [showArrowWhenContactorClosed] = useSimVar(
    `L:A32NX_ELEC_CONTACTOR_6PB${number}_SHOW_ARROW_WHEN_CLOSED`,
    'Bool',
    maxStaleness,
  );

  const showArrow = contactorClosed && showArrowWhenContactorClosed;
  const isCharging = current > 0;
  const isDischarging = current < 0;

  const pointingRight = (number === 2 && isCharging) || (number === 1 && isDischarging);

  if (!contactorClosed) {
    return <></>;
  }

  return (
    <SvgGroup x={x} y={y}>
      {showArrow ? (
        <>
          {pointingRight ? (
            <>
              <Wire d="M0.3 0 h24.53 h-24.53" amber={isDischarging} />
              <Arrow x={25.525625} y={-(arrowSize / 2)} direction="right" green={isCharging} amber={isDischarging} />
            </>
          ) : (
            <>
              <Wire d="M11.5 0 h24.52 h-24.53" amber={isDischarging} />
              <Arrow x={10} y={arrowSize / 2} direction="left" green={isCharging} amber={isDischarging} />
            </>
          )}
        </>
      ) : (
        <Wire d="M0.3 0 h36.15 h-36.15" />
      )}
    </SvgGroup>
  );
};

const ElectricalProperty = ({ x, y, value, unit, isWithinNormalRange }) => (
  <SvgGroup x={x} y={y}>
    <text className={`Right ${isWithinNormalRange ? 'Green' : 'Amber'}`}>{Math.round(value)}</text>
    <text x={3.75} className="Cyan">
      {unit}
    </text>
  </SvgGroup>
);

const Box = ({ width, height }) => <rect className="Box" width={width} height={height} />;

interface BusProps {
  x: number;
  y: number;
  width: number;
  name: string;
  number?: number;
  isNormal: boolean;
  isShed?: boolean;
}

const Bus = ({ x, y, width, name, number, isNormal, isShed }: BusProps) => {
  const busHeight = 26.25;
  return (
    <SvgGroup x={x} y={y}>
      <rect width={width} height={busHeight} className="Bus" />
      <text
        x={width / 2}
        y={21}
        className={`QuiteLarge ${number ? 'Right' : 'Middle'} ${isNormal ? 'Green' : 'Amber'}`}
      >
        {name}
      </text>
      {number ? (
        <text x={width / 2 + 3.75} y={22} className={`ExtraLarge ${isNormal ? 'Green' : 'Amber'}`}>
          {number}
        </text>
      ) : null}
      {isShed ? (
        <text x={width / 2} y={busHeight + 8.25} className="Middle ExtraSmall Amber" dominantBaseline="middle">
          SHED
        </text>
      ) : null}
    </SvgGroup>
  );
};

const BatteryBus = ({ x, y, width }) => {
  const [isPowered] = useSimVar('L:A32NX_ELEC_DC_BAT_BUS_IS_POWERED', 'Bool', maxStaleness);

  const [bat1IsAuto] = useSimVar('L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO', 'Bool', maxStaleness);
  const [bat2IsAuto] = useSimVar('L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO', 'Bool', maxStaleness);
  const atLeastOneBatteryIsAuto = bat1IsAuto || bat2IsAuto;

  const potentialIsWithinNormalRange = useSimVar('L:A32NX_ELEC_DC_BAT_BUS_POTENTIAL_NORMAL', 'Bool', maxStaleness);

  const name = atLeastOneBatteryIsAuto ? 'DC BAT' : 'XX';
  return (
    <Bus
      x={x}
      y={y}
      width={width}
      name={name}
      isNormal={isPowered && potentialIsWithinNormalRange && atLeastOneBatteryIsAuto}
    />
  );
};

const EngineGenerator = ({ x, y, number }) => {
  const [isOn] = useSimVar(`GENERAL ENG MASTER ALTERNATOR:${number}`, 'Bool', maxStaleness);

  const [load] = useSimVar(`L:A32NX_ELEC_ENG_GEN_${number}_LOAD`, 'Percent', maxStaleness);
  const [loadWithinNormalRange] = useSimVar(`L:A32NX_ELEC_ENG_GEN_${number}_LOAD_NORMAL`, 'Bool', maxStaleness);

  const [potential] = useSimVar(`L:A32NX_ELEC_ENG_GEN_${number}_POTENTIAL`, 'Volts', maxStaleness);
  const [potentialWithinNormalRange] = useSimVar(
    `L:A32NX_ELEC_ENG_GEN_${number}_POTENTIAL_NORMAL`,
    'Bool',
    maxStaleness,
  );

  const [frequency] = useSimVar(`L:A32NX_ELEC_ENG_GEN_${number}_FREQUENCY`, 'Hertz', maxStaleness);
  const [frequencyWithinNormalRange] = useSimVar(
    `L:A32NX_ELEC_ENG_GEN_${number}_FREQUENCY_NORMAL`,
    'Bool',
    maxStaleness,
  );

  const allParametersWithinNormalRange =
    loadWithinNormalRange && potentialWithinNormalRange && frequencyWithinNormalRange;
  return (
    <SvgGroup x={x} y={y}>
      <Box width={86.25} height={93.75} />

      <text x={54.375} y={22.5} className={`Right ${!isOn || !allParametersWithinNormalRange ? 'Amber' : ''}`}>
        GEN
      </text>
      <text x={54.375 + 3.75} y={22.5} className={`Large ${!isOn || !allParametersWithinNormalRange ? 'Amber' : ''}`}>
        {number}
      </text>
      {isOn ? (
        <>
          <ElectricalProperty x={54.375} y={45} value={load} unit="%" isWithinNormalRange={loadWithinNormalRange} />
          <ElectricalProperty
            x={54.375}
            y={67.5}
            value={potential}
            unit="V"
            isWithinNormalRange={potentialWithinNormalRange}
          />
          <ElectricalProperty
            x={54.375}
            y={90}
            value={frequency}
            unit="HZ"
            isWithinNormalRange={frequencyWithinNormalRange}
          />
        </>
      ) : (
        <text x={43.125} y={54.375} className="Middle" dominantBaseline="middle">
          OFF
        </text>
      )}
    </SvgGroup>
  );
};

const ApuGenerator = ({ x, y }) => {
  const [masterSwPbOn] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', maxStaleness);
  const [genSwitchOn] = useSimVar('APU GENERATOR SWITCH:1', 'Bool', maxStaleness);

  const [load] = useSimVar('L:A32NX_ELEC_APU_GEN_1_LOAD', 'Percent', maxStaleness);
  const [loadWithinNormalRange] = useSimVar('L:A32NX_ELEC_APU_GEN_1_LOAD_NORMAL', 'Bool', maxStaleness);

  const [potential] = useSimVar('L:A32NX_ELEC_APU_GEN_1_POTENTIAL', 'Volts', maxStaleness);
  const [potentialWithinNormalRange] = useSimVar('L:A32NX_ELEC_APU_GEN_1_POTENTIAL_NORMAL', 'Bool', maxStaleness);

  const [frequency] = useSimVar('L:A32NX_ELEC_APU_GEN_1_FREQUENCY', 'Hertz', maxStaleness);
  const [frequencyWithinNormalRange] = useSimVar('L:A32NX_ELEC_APU_GEN_1_FREQUENCY_NORMAL', 'Bool', maxStaleness);

  const allParametersWithinNormalRange =
    loadWithinNormalRange && potentialWithinNormalRange && frequencyWithinNormalRange;

  const apuGenTitle = (
    <text
      x={46.875}
      y={18.75}
      className={`Middle ${!masterSwPbOn || (genSwitchOn && allParametersWithinNormalRange) ? '' : 'Amber'}`}
    >
      APU GEN
    </text>
  );

  return (
    <SvgGroup x={x} y={y}>
      {masterSwPbOn ? (
        <>
          <Box width={93.75} height={90} />
          {apuGenTitle}
          {genSwitchOn ? (
            <>
              <ElectricalProperty
                x={58.125}
                y={41.25}
                value={load}
                unit="%"
                isWithinNormalRange={loadWithinNormalRange}
              />
              <ElectricalProperty
                x={58.125}
                y={63.75}
                value={potential}
                unit="V"
                isWithinNormalRange={potentialWithinNormalRange}
              />
              <ElectricalProperty
                x={58.125}
                y={86.25}
                value={frequency}
                unit="HZ"
                isWithinNormalRange={frequencyWithinNormalRange}
              />
            </>
          ) : (
            <text x={46.875} y={48.75} className="Middle" dominantBaseline="middle">
              OFF
            </text>
          )}
        </>
      ) : (
        apuGenTitle
      )}
    </SvgGroup>
  );
};

const ExternalPower = ({ x, y }) => {
  const [potential] = useSimVar('L:A32NX_ELEC_EXT_PWR_POTENTIAL', 'Volts', maxStaleness);
  const [potentialWithinNormalRange] = useSimVar('L:A32NX_ELEC_EXT_PWR_POTENTIAL_NORMAL', 'Bool', maxStaleness);

  const [frequency] = useSimVar('L:A32NX_ELEC_EXT_PWR_FREQUENCY', 'Hertz', maxStaleness);
  const [frequencyWithinNormalRange] = useSimVar('L:A32NX_ELEC_EXT_PWR_FREQUENCY_NORMAL', 'Bool', maxStaleness);

  return (
    <PotentialFrequencyBox
      x={x}
      y={y}
      text="EXT PWR"
      potential={potential}
      potentialWithinNormalRange={potentialWithinNormalRange}
      frequency={frequency}
      frequencyWithinNormalRange={frequencyWithinNormalRange}
    />
  );
};

const StaticInverter = ({ x, y }) => {
  const [potential] = useSimVar('L:A32NX_ELEC_STAT_INV_POTENTIAL', 'Volts', maxStaleness);
  const [potentialWithinNormalRange] = useSimVar('L:A32NX_ELEC_STAT_INV_POTENTIAL_NORMAL', 'Bool', maxStaleness);

  const [frequency] = useSimVar('L:A32NX_ELEC_STAT_INV_FREQUENCY', 'Hertz', maxStaleness);
  const [frequencyWithinNormalRange] = useSimVar('L:A32NX_ELEC_STAT_INV_FREQUENCY_NORMAL', 'Bool', maxStaleness);

  return (
    <PotentialFrequencyBox
      x={x}
      y={y}
      text="STAT INV"
      potential={potential}
      potentialWithinNormalRange={potentialWithinNormalRange}
      frequency={frequency}
      frequencyWithinNormalRange={frequencyWithinNormalRange}
    />
  );
};

const PotentialFrequencyBox = ({
  x,
  y,
  text,
  potential,
  potentialWithinNormalRange,
  frequency,
  frequencyWithinNormalRange,
}) => {
  const allParametersWithinNormalRange = potentialWithinNormalRange && frequencyWithinNormalRange;

  return (
    <SvgGroup x={x} y={y}>
      <Box width={93.75} height={67.5} />
      <text
        x={46.875}
        y={18.75}
        className={`Middle ${text.length > 7 ? 'Small' : ''} ${!allParametersWithinNormalRange ? 'Amber' : ''}`}
      >
        {text}
      </text>
      <ElectricalProperty
        x={52.5}
        y={41.25}
        value={potential}
        unit="V"
        isWithinNormalRange={potentialWithinNormalRange}
      />
      <ElectricalProperty
        x={52.5}
        y={63.75}
        value={frequency}
        unit="HZ"
        isWithinNormalRange={frequencyWithinNormalRange}
      />
    </SvgGroup>
  );
};

interface TransformerRectifierProps {
  x: number;
  y: number;
  number: number;
  titleOnly?: boolean;
}

const TransformerRectifier = ({ x, y, number, titleOnly }: TransformerRectifierProps) => {
  const [potential] = useSimVar(`L:A32NX_ELEC_TR_${number}_POTENTIAL`, 'Volts', maxStaleness);
  const [potentialWithinNormalRange] = useSimVar(`L:A32NX_ELEC_TR_${number}_POTENTIAL_NORMAL`, 'Bool', maxStaleness);

  const [current] = useSimVar(`L:A32NX_ELEC_TR_${number}_CURRENT`, 'Ampere', maxStaleness);
  const [currentWithinNormalRange] = useSimVar(`L:A32NX_ELEC_TR_${number}_CURRENT_NORMAL`, 'Bool', maxStaleness);

  const allParametersWithinNormalRange = potentialWithinNormalRange && currentWithinNormalRange;

  const title = (
    <text
      x={number === 3 ? 80 : 50}
      y={24.375}
      className={`Right ${!allParametersWithinNormalRange && !titleOnly ? 'Amber' : ''}`}
    >
      {number === 3 ? 'ESS TR' : 'TR'}
    </text>
  );

  return (
    <SvgGroup x={x} y={y}>
      {titleOnly ? (
        title
      ) : (
        <>
          <Box width={86.25} height={75} />
          {title}
          {number !== 3 ? (
            <text x={53.75} y={24.375} className={`Large ${!allParametersWithinNormalRange ? 'Amber' : ''}`}>
              {number}
            </text>
          ) : null}
          <ElectricalProperty
            x={54.375}
            y={46.875}
            value={potential}
            unit="V"
            isWithinNormalRange={potentialWithinNormalRange}
          />
          <ElectricalProperty
            x={54.375}
            y={69.375}
            value={current}
            unit="A"
            isWithinNormalRange={currentWithinNormalRange}
          />
        </>
      )}
    </SvgGroup>
  );
};

const EmergencyGenerator = ({ x, y, titleOnly }) => {
  const [potential] = useSimVar('L:A32NX_ELEC_EMER_GEN_POTENTIAL', 'Volts', maxStaleness);
  const [potentialWithinNormalRange] = useSimVar('L:A32NX_ELEC_EMER_GEN_POTENTIAL_NORMAL', 'Bool', maxStaleness);

  const [frequency] = useSimVar('L:A32NX_ELEC_EMER_GEN_FREQUENCY', 'Hertz', maxStaleness);
  const [frequencyWithinNormalRange] = useSimVar('L:A32NX_ELEC_EMER_GEN_FREQUENCY_NORMAL', 'Bool', maxStaleness);

  const allParametersWithinNormalRange = potentialWithinNormalRange && frequencyWithinNormalRange;

  return (
    <SvgGroup x={x} y={y}>
      {titleOnly ? (
        <text className="Medium" dominantBaseline="middle" x={0.9375} y={45}>
          EMER GEN
        </text>
      ) : (
        <>
          <Box width={103.125} height={75} />

          <text x={51.5625} y={24.375} className={`Middle ${!allParametersWithinNormalRange ? 'Amber' : ''}`}>
            EMER GEN
          </text>
          <ElectricalProperty
            x={63.75}
            y={46.875}
            value={potential}
            unit="V"
            isWithinNormalRange={potentialWithinNormalRange}
          />
          <ElectricalProperty
            x={63.75}
            y={69.375}
            value={frequency}
            unit="HZ"
            isWithinNormalRange={frequencyWithinNormalRange}
          />
        </>
      )}
    </SvgGroup>
  );
};

const GalleyShed = ({ x, y }) => (
  <SvgGroup x={x} y={y}>
    <text className="Middle">GALLEY</text>
    <text className="Middle" y={18.75}>
      SHED
    </text>
  </SvgGroup>
);

const IntegratedDriveGeneratorTitle = ({ x, y, number }) => {
  const [connected] = useSimVar(`L:A32NX_ELEC_ENG_GEN_${number}_IDG_IS_CONNECTED`, 'Bool', maxStaleness);
  return (
    <SvgGroup x={x} y={y}>
      <text className={!connected ? 'Amber' : ''}>IDG</text>
      <text x={39.38} className={`Large ${!connected ? 'Amber' : ''}`}>
        {number}
      </text>
    </SvgGroup>
  );
};

const IntegratedDriveGeneratorTemperature = ({ x, y, number }) => {
  const [temperature] = useSimVar(`L:A32NX_ELEC_ENG_GEN_${number}_IDG_OIL_OUTLET_TEMPERATURE`, 'Celsius', maxStaleness);
  return (
    <SvgGroup x={x} y={y}>
      <text className="Green Right">{Math.round(temperature)}</text>
      <text x={3.75} className="Cyan">
        °C
      </text>
    </SvgGroup>
  );
};

const IntegratedDriveGeneratorDisconnected = ({ x, y }) => (
  <text className="Amber" x={x} y={y}>
    DISC
  </text>
);

interface ArrowProps {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'right' | 'left';
  green?: boolean;
  amber?: boolean;
  description?: string;
}

const Arrow = ({ x, y, direction, green, amber }: ArrowProps) => {
  const classes = classNames({ Green: green }, { Amber: amber });
  switch (direction) {
    default:
    case 'up':
      return <path className={classes} d={`M${x} ${y}h${arrowSize} l-6.8685 -8.99325z`} />;
    case 'down':
      return <path className={classes} d={`M${x} ${y}h-${arrowSize} l6.8685 8.99325z`} />;
    case 'right':
      return <path className={classes} d={`M${x} ${y}v${arrowSize} l8.99325 -6.8685z`} />;
    case 'left':
      return <path className={classes} d={`M${x} ${y}v-${arrowSize} l-8.99325 6.8685z`} />;
  }
};

const arrowSize = 13.737375;

interface WireProps {
  d: string;
  amber?: boolean;
  description?: string;
}

const Wire = ({ d, amber }: WireProps) => {
  const classes = classNames({ Green: !amber }, { Amber: amber });
  return <path className={classes} d={d} />;
};
