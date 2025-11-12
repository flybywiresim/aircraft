//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { ClockEvents, FSComponent, SimVarValueType, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractOitAvncsPageProps } from '../../../OIT';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { Arinc429Register, RegisteredSimVar } from '@flybywiresim/fbw-sdk';

interface OitAvncsFbwSystemsAppLdgCapProps extends AbstractOitAvncsPageProps {
  /** Title which should be displayed at the top of the page */
  title: string;
}

export class OitAvncsFbwSystemsAppLdgCap extends DestroyableComponent<OitAvncsFbwSystemsAppLdgCapProps> {
  private readonly sci = this.props.container.ansu.sci;

  private readonly sub = this.props.bus.getSubscriber<ClockEvents>();

  private readonly ap1Engaged = RegisteredSimVar.create<boolean>('L:A32NX_AUTOPILOT_1_ACTIVE', SimVarValueType.Bool);
  private readonly ap2Engaged = RegisteredSimVar.create<boolean>('L:A32NX_AUTOPILOT_2_ACTIVE', SimVarValueType.Bool);
  private readonly oneApEngaged = Subject.create(false);
  private readonly twoApEngaged = Subject.create(false);

  private readonly autoThrustStatus = RegisteredSimVar.create<number>(
    'L:A32NX_AUTOTHRUST_STATUS',
    SimVarValueType.Enum,
  );
  private readonly autoThrustMode = RegisteredSimVar.create<number>('L:A32NX_AUTOTHRUST_MODE', SimVarValueType.Enum);
  private readonly athrEngaged = Subject.create(false);

  private readonly prim1Healthy = RegisteredSimVar.create<boolean>('L:A32NX_PRIM_1_HEALTHY', SimVarValueType.Bool);
  private readonly prim2Healthy = RegisteredSimVar.create<boolean>('L:A32NX_PRIM_2_HEALTHY', SimVarValueType.Bool);
  private readonly prim3Healthy = RegisteredSimVar.create<boolean>('L:A32NX_PRIM_3_HEALTHY', SimVarValueType.Bool);
  private readonly onePrimHealthy = Subject.create(false);
  private readonly twoPrimHealthy = Subject.create(false);

  private readonly sec1Healthy = RegisteredSimVar.create<boolean>('L:A32NX_SEC_1_HEALTHY', SimVarValueType.Bool);
  private readonly sec2Healthy = RegisteredSimVar.create<boolean>('L:A32NX_SEC_2_HEALTHY', SimVarValueType.Bool);
  private readonly sec3Healthy = RegisteredSimVar.create<boolean>('L:A32NX_SEC_3_HEALTHY', SimVarValueType.Bool);
  private readonly oneSecHealthy = Subject.create(false);

  private readonly sfcc1StatusWord = RegisteredSimVar.create<number>(
    'L:A32NX_SFCC_1_SLAT_FLAP_SYSTEM_STATUS_WORD',
    SimVarValueType.Number,
  );
  private readonly sfcc1StatusWordRegister = Arinc429Register.empty();
  private readonly sfcc2StatusWord = RegisteredSimVar.create<number>(
    'L:A32NX_SFCC_2_SLAT_FLAP_SYSTEM_STATUS_WORD',
    SimVarValueType.Number,
  );
  private readonly sfcc2StatusWordRegister = Arinc429Register.empty();
  private readonly oneSfccHealthy = Subject.create(false);
  private readonly twoSfccHealthy = Subject.create(false);

  private readonly sec1RudderStatusWord = RegisteredSimVar.create<number>(
    'L:A32NX_SEC_1_RUDDER_STATUS_WORD',
    SimVarValueType.Number,
  );
  private readonly sec1RudderStatusWordRegister = Arinc429Register.empty();
  private readonly sec3RudderStatusWord = RegisteredSimVar.create<number>(
    'L:A32NX_SEC_3_RUDDER_STATUS_WORD',
    SimVarValueType.Number,
  );
  private readonly sec3RudderStatusWordRegister = Arinc429Register.empty();
  private readonly rudderTrimAvailable = Subject.create(true);

  private readonly oneHydAvailable = Subject.create(true);
  private readonly twoHydAvailable = Subject.create(true);

  private readonly fws1DiscreteWord126Register = Arinc429Register.empty();
  private readonly fws1DiscreteWord126 = RegisteredSimVar.create<number>(
    'L:A32NX_FWC_1_DISCRETE_WORD_126',
    SimVarValueType.Number,
  );
  private readonly fws2DiscreteWord126Register = Arinc429Register.empty();
  private readonly fws2DiscreteWord126 = RegisteredSimVar.create<number>(
    'L:A32NX_FWC_2_DISCRETE_WORD_126',
    SimVarValueType.Number,
  );
  private readonly oneFwsWithAudio = Subject.create(true);
  private readonly twoFwsWithAudio = Subject.create(true);

  private readonly fcdc1Healthy = RegisteredSimVar.create<boolean>('L:A32NX_FCDC_1_HEALTHY', SimVarValueType.Bool);
  private readonly fcdc2Healthy = RegisteredSimVar.create<boolean>('L:A32NX_FCDC_2_HEALTHY', SimVarValueType.Bool);
  private readonly oneFcdcHealthy = Subject.create(false);
  private readonly twoFcdcHealthy = Subject.create(false);

  private readonly antiskidAvailableSimVar = RegisteredSimVar.create<boolean>(
    'A:ANTISKID BRAKES ACTIVE',
    SimVarValueType.Bool,
  );
  private readonly antiskidAvailable = Subject.create(true);

  private readonly fcdc1FgDiscreteWord4 = RegisteredSimVar.create<number>(
    'L:A32NX_FCDC_1_FG_DISCRETE_WORD_4',
    SimVarValueType.Number,
  );
  private readonly fcdc1FgDiscreteWord4Register = Arinc429Register.empty();
  private readonly fcdc2FgDiscreteWord4 = RegisteredSimVar.create<number>(
    'L:A32NX_FCDC_2_FG_DISCRETE_WORD_4',
    SimVarValueType.Number,
  );
  private readonly fcdc2FgDiscreteWord4Register = Arinc429Register.empty();
  private readonly fcdcCapabilityText = Subject.create('');

  private readonly fcdc1FgDiscreteWord8 = RegisteredSimVar.create<number>(
    'L:A32NX_FCDC_1_FG_DISCRETE_WORD_8',
    SimVarValueType.Number,
  );
  private readonly fcdc1FgDiscreteWord8Register = Arinc429Register.empty();
  private readonly fcdc2FgDiscreteWord8 = RegisteredSimVar.create<number>(
    'L:A32NX_FCDC_2_FG_DISCRETE_WORD_8',
    SimVarValueType.Number,
  );
  private readonly fcdc2FgDiscreteWord8Register = Arinc429Register.empty();
  private readonly nwsAvailable = Subject.create(true);

  private readonly adr1Aoa = RegisteredSimVar.create<number>(
    'L:A32NX_ADIRS_ADR_1_ANGLE_OF_ATTACK',
    SimVarValueType.Number,
  );
  private readonly adr1AoaRegister = Arinc429Register.empty();
  private readonly adr2Aoa = RegisteredSimVar.create<number>(
    'L:A32NX_ADIRS_ADR_2_ANGLE_OF_ATTACK',
    SimVarValueType.Number,
  );
  private readonly adr2AoaRegister = Arinc429Register.empty();
  private readonly adr3Aoa = RegisteredSimVar.create<number>(
    'L:A32NX_ADIRS_ADR_3_ANGLE_OF_ATTACK',
    SimVarValueType.Number,
  );
  private readonly adr3AoaRegister = Arinc429Register.empty();
  private readonly twoAdrAvailable = Subject.create(false);
  private readonly threeAdrAvailable = Subject.create(false);

  private readonly engine1Combustion = RegisteredSimVar.create<boolean>('A:ENG COMBUSTION:1', SimVarValueType.Bool);
  private readonly engine2Combustion = RegisteredSimVar.create<boolean>('A:ENG COMBUSTION:2', SimVarValueType.Bool);
  private readonly engine3Combustion = RegisteredSimVar.create<boolean>('A:ENG COMBUSTION:3', SimVarValueType.Bool);
  private readonly engine4Combustion = RegisteredSimVar.create<boolean>('A:ENG COMBUSTION:4', SimVarValueType.Bool);
  private readonly apuGen1ContactorClosed = RegisteredSimVar.create<boolean>(
    'L:A32NX_ELEC_CONTACTOR_990XS1_IS_CLOSED',
    SimVarValueType.Bool,
  );
  private readonly apuGen2ContactorClosed = RegisteredSimVar.create<boolean>(
    'L:A32NX_ELEC_CONTACTOR_990XS2_IS_CLOSED',
    SimVarValueType.Bool,
  );
  private readonly oneEngOnEitherSideAvailable = Subject.create(true);
  private readonly threeEnginesAvailable = Subject.create(true);
  private readonly fourEnginesAvailable = Subject.create(true);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.sub
        .on('simTime')
        .atFrequency(4)
        .handle(() => {
          this.update();
        }),
    );
  }

  private update(): void {
    this.oneApEngaged.set(this.ap1Engaged.get() || this.ap2Engaged.get());
    this.twoApEngaged.set(this.ap1Engaged.get() && this.ap2Engaged.get());

    this.athrEngaged.set(this.autoThrustStatus.get() === 2 || this.autoThrustMode.get() !== 0);

    this.onePrimHealthy.set(this.prim1Healthy.get() || this.prim2Healthy.get() || this.prim3Healthy.get());
    this.twoPrimHealthy.set(
      (this.prim1Healthy.get() && this.prim2Healthy.get()) || (this.prim1Healthy.get() && this.prim3Healthy.get()),
    );

    this.oneSecHealthy.set(this.sec1Healthy.get() || this.sec2Healthy.get() || this.sec3Healthy.get());

    this.sfcc1StatusWordRegister.set(this.sfcc1StatusWord.get());
    this.sfcc2StatusWordRegister.set(this.sfcc2StatusWord.get());
    this.oneSfccHealthy.set(
      !this.sfcc1StatusWordRegister.isFailureWarning() && !this.sfcc2StatusWordRegister.isFailureWarning(),
    );
    this.twoSfccHealthy.set(
      !this.sfcc1StatusWordRegister.isFailureWarning() && !this.sfcc2StatusWordRegister.isFailureWarning(),
    );

    this.sec1RudderStatusWordRegister.set(this.sec1RudderStatusWord.get());
    this.sec3RudderStatusWordRegister.set(this.sec3RudderStatusWord.get());
    this.rudderTrimAvailable.set(
      this.sec1RudderStatusWordRegister.bitValueOr(27, false) ||
        this.sec3RudderStatusWordRegister.bitValueOr(27, false),
    );

    this.oneHydAvailable.set(this.sci.hydGreenPressurized.get() || this.sci.hydYellowPressurized.get());
    this.twoHydAvailable.set(this.sci.hydGreenPressurized.get() && this.sci.hydYellowPressurized.get());

    this.fws1DiscreteWord126Register.set(this.fws1DiscreteWord126.get());
    this.fws2DiscreteWord126Register.set(this.fws2DiscreteWord126.get());
    this.oneFwsWithAudio.set(
      this.fws1DiscreteWord126Register.bitValueOr(16, false) || this.fws2DiscreteWord126Register.bitValueOr(16, false),
    );
    this.twoFwsWithAudio.set(
      this.fws1DiscreteWord126Register.bitValueOr(16, false) && this.fws2DiscreteWord126Register.bitValueOr(16, false),
    );

    this.oneFcdcHealthy.set(this.fcdc1Healthy.get() || this.fcdc2Healthy.get());
    this.twoFcdcHealthy.set(this.fcdc1Healthy.get() && this.fcdc2Healthy.get());

    this.antiskidAvailable.set(this.antiskidAvailableSimVar.get());

    this.fcdc1FgDiscreteWord4Register.set(this.fcdc1FgDiscreteWord4.get());
    this.fcdc2FgDiscreteWord4Register.set(this.fcdc2FgDiscreteWord4.get());
    this.nwsAvailable.set(
      !this.fcdc1FgDiscreteWord8Register.bitValueOr(18, false) &&
        !this.fcdc2FgDiscreteWord8Register.bitValueOr(18, false),
    );

    this.fcdc1FgDiscreteWord8Register.set(this.fcdc1FgDiscreteWord8.get());
    this.fcdc2FgDiscreteWord8Register.set(this.fcdc2FgDiscreteWord8.get());

    this.adr1AoaRegister.set(this.adr1Aoa.get());
    this.adr2AoaRegister.set(this.adr2Aoa.get());
    this.adr3AoaRegister.set(this.adr3Aoa.get());
    const numAdrsAvailable =
      (!this.adr1AoaRegister.isFailureWarning() ? 1 : 0) +
      (!this.adr2AoaRegister.isFailureWarning() ? 1 : 0) +
      (!this.adr3AoaRegister.isFailureWarning() ? 1 : 0);

    this.twoAdrAvailable.set(numAdrsAvailable >= 2);
    this.threeAdrAvailable.set(numAdrsAvailable === 3);

    const numEnginesAvailable =
      (this.engine1Combustion.get() ? 1 : 0) +
      (this.engine2Combustion.get() ? 1 : 0) +
      (this.engine3Combustion.get() ? 1 : 0) +
      (this.engine4Combustion.get() ? 1 : 0);

    this.oneEngOnEitherSideAvailable.set(
      (this.engine1Combustion.get() || this.engine2Combustion.get()) &&
        (this.engine3Combustion.get() || this.engine4Combustion.get()),
    );
    this.threeEnginesAvailable.set(numEnginesAvailable >= 3);
    this.fourEnginesAvailable.set(
      numEnginesAvailable === 4 ||
        (numEnginesAvailable === 3 && (this.apuGen1ContactorClosed.get() || this.apuGen2ContactorClosed.get())),
    );

    const dw1 = this.fcdc1FgDiscreteWord4Register;
    const dw2 = this.fcdc2FgDiscreteWord4Register;
    const fcdc1Cap = dw1.bitValueOr(23, false) ? 3 : dw1.bitValueOr(24, false) ? 4 : dw1.bitValueOr(25, false) ? 5 : 0;
    const fcdc2Cap = dw2.bitValueOr(23, false) ? 3 : dw2.bitValueOr(24, false) ? 4 : dw2.bitValueOr(25, false) ? 5 : 0;
    const capability = dw1.isNormalOperation() ? fcdc1Cap : fcdc2Cap;

    let capabilityText = 'APPR1';
    switch (capability) {
      case 5:
        capabilityText = 'LAND3 DUAL';
        break;
      case 4:
        capabilityText = 'LAND3 SINGLE';
        break;
      case 3:
        capabilityText = 'LAND2';
        break;
    }
    this.fcdcCapabilityText.set(capabilityText);
  }

  destroy(): void {
    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <div class="oit-ccom-headline">{this.props.title}</div>
        <div class="fr ass">
          <div class="fc aic">
            <div class="oit-a380x-systems-app-ldg-cap">
              <span style="text-align: center; font-size: 22px;">Capability from FCDC:</span>
              <span style="text-align: center; font-size: 36px; font-weight: bold; margin-top: 5px;">
                {this.fcdcCapabilityText}
              </span>
            </div>
          </div>
          <div class="fc aic" style="flex-grow: 1; ">
            <div class="oit-a380x-systems-app-ldg-cap-table">
              <div
                class="oit-a380x-systems-app-ldg-cap-td transparentbg"
                style="font-weight: bold; width: 200px; height: 75px;"
              >
                Monitored
                <br />
                Equipment
              </div>
              <div
                class="oit-a380x-systems-app-ldg-cap-td transparentbg"
                style="font-weight: bold; height: 75px; text-align: center;"
              >
                LAND2
              </div>
              <div
                class="oit-a380x-systems-app-ldg-cap-td transparentbg"
                style="font-weight: bold; height: 75px; text-align: center;"
              >
                LAND3
                <br />
                SGL
              </div>
              <div
                class="oit-a380x-systems-app-ldg-cap-td transparentbg"
                style="font-weight: bold; height: 75px; text-align: center;"
              >
                LAND3
                <br />
                DUAL
              </div>
              <div class="oit-a380x-systems-app-ldg-cap-td transparentbg">AP engaged</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.oneApEngaged }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.oneApEngaged }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.twoApEngaged }}>2</div>
              <div class="oit-a380x-systems-app-ldg-cap-td transparentbg">A/THR</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>Not reqrd.</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.athrEngaged }}>Active</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.athrEngaged }}>Active</div>
              <div class="oit-a380x-systems-app-ldg-cap-td transparentbg">PRIM</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.onePrimHealthy }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.onePrimHealthy }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.twoPrimHealthy }}>2</div>
              <div class="oit-a380x-systems-app-ldg-cap-td transparentbg">SEC</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.oneSecHealthy }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.oneSecHealthy }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.oneSecHealthy }}>1</div>
              <div class="oit-a380x-systems-app-ldg-cap-td transparentbg">Slats/Flaps Ctl</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.oneSfccHealthy }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.oneSfccHealthy }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.twoSfccHealthy }}>2</div>
              <div class="oit-a380x-systems-app-ldg-cap-td transparentbg">Rud. Trim</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.rudderTrimAvailable }}>Avail.</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.rudderTrimAvailable }}>Avail.</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.rudderTrimAvailable }}>Avail.</div>
              <div class="oit-a380x-systems-app-ldg-cap-td transparentbg">Hydraulics</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.oneHydAvailable }}>G/Y</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.oneHydAvailable }}>G/Y</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.twoHydAvailable }}>G+Y</div>
              <div class="oit-a380x-systems-app-ldg-cap-td transparentbg">FWS w/ audio</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.oneFwsWithAudio }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.oneFwsWithAudio }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.twoFwsWithAudio }}>2</div>
              <div class="oit-a380x-systems-app-ldg-cap-td transparentbg">FCDC</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.oneFcdcHealthy }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.oneFcdcHealthy }}>1</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.twoFcdcHealthy }}>2</div>
              <div class="oit-a380x-systems-app-ldg-cap-td transparentbg">Antiskid</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>Not reqrd.</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>Not reqrd.</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.antiskidAvailable }}>Avail.</div>
              <div class="oit-a380x-systems-app-ldg-cap-td transparentbg">NWS</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>Not reqrd.</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: true }}>Not reqrd.</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.nwsAvailable }}>Avail.</div>
              <div class="oit-a380x-systems-app-ldg-cap-td transparentbg">ADR</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.twoAdrAvailable }}>2</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.twoAdrAvailable }}>2</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.threeAdrAvailable }}>3</div>
              <div class="oit-a380x-systems-app-ldg-cap-td transparentbg">Engines</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.oneEngOnEitherSideAvailable }}>2</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.threeEnginesAvailable }}>3</div>
              <div class={{ 'oit-a380x-systems-app-ldg-cap-td': true, green: this.fourEnginesAvailable }}>4</div>
            </div>
          </div>
        </div>
        <div style="flex-grow: 1" />
      </>
    );
  }
}
