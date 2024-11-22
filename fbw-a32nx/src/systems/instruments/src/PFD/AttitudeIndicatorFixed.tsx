// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Register, Arinc429Word, Arinc429WordData } from '@flybywiresim/fbw-sdk';
import { FgBus } from 'instruments/src/PFD/shared/FgBusProvider';
import { FcuBus } from 'instruments/src/PFD/shared/FcuBusProvider';
import { FlashOneHertz } from 'instruments/src/MsfsAvionicsCommon/FlashingElementUtils';

import { FlightPathDirector } from './FlightPathDirector';
import { FlightPathVector } from './FlightPathVector';
import { Arinc429Values } from './shared/ArincValueProvider';
import { PFDSimvars } from './shared/PFDSimvarPublisher';

interface AttitudeIndicatorFixedUpperProps {
  bus: ArincEventBus;
}

export class AttitudeIndicatorFixedUpper extends DisplayComponent<AttitudeIndicatorFixedUpperProps> {
  private roll = new Arinc429Word(0);

  private pitch: Arinc429WordData = Arinc429Register.empty();

  private visibilitySub = Subject.create('hidden');

  private rollProtSymbol = FSComponent.createRef<SVGGElement>();

  private rollProtLostSymbol = FSComponent.createRef<SVGGElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values>();

    sub.on('rollAr').handle((roll) => {
      this.roll = roll;
      if (!this.roll.isNormalOperation()) {
        this.visibilitySub.set('hidden');
      } else {
        this.visibilitySub.set('visible');
      }
    });

    sub.on('pitchAr').handle((pitch) => {
      this.pitch = pitch;
      if (!this.pitch.isNormalOperation()) {
        this.visibilitySub.set('hidden');
      } else {
        this.visibilitySub.set('visible');
      }
    });

    sub.on('fcdcDiscreteWord1').handle((fcdcWord1) => {
      const isNormalLawActive = fcdcWord1.bitValue(11) && !fcdcWord1.isFailureWarning();

      this.rollProtSymbol.instance.style.display = isNormalLawActive ? 'block' : 'none';

      this.rollProtLostSymbol.instance.style.display = !isNormalLawActive ? 'block' : 'none';
    });
  }

  render(): VNode {
    return (
      <g id="AttitudeUpperInfoGroup" visibility={this.visibilitySub}>
        <g id="RollProtGroup" ref={this.rollProtSymbol} style="display: none" class="SmallStroke Green">
          <path id="RollProtRight" d="m105.64 62.887 1.5716-0.8008m-1.5716-0.78293 1.5716-0.8008" />
          <path id="RollProtLeft" d="m32.064 61.303-1.5716-0.8008m1.5716 2.3845-1.5716-0.8008" />
        </g>
        <g id="RollProtLost" ref={this.rollProtLostSymbol} style="display: none" class="NormalStroke Amber">
          <path id="RollProtLostRight" d="m107.77 60.696-1.7808 1.7818m1.7808 0-1.7808-1.7818" />
          <path id="RollProtLostLeft" d="m30.043 62.478 1.7808-1.7818m-1.7808 0 1.7808 1.7818" />
        </g>
        <g class="SmallStroke White">
          <path d="m98.645 51.067 2.8492-2.8509" />
          <path d="m39.168 51.067-2.8492-2.8509" />
          <path d="m90.858 44.839a42.133 42.158 0 0 0-43.904 0" />
          <path d="m89.095 43.819 1.8313-3.1738 1.7448 1.0079-1.8313 3.1738" />
          <path d="m84.259 41.563 0.90817-2.4967-1.8932-0.68946-0.90818 2.4966" />
          <path d="m75.229 39.142 0.46109-2.6165 1.9841 0.35005-0.46109 2.6165" />
          <path d="m60.6 39.492-0.46109-2.6165 1.9841-0.35005 0.46109 2.6165" />
          <path d="m53.553 41.563-0.90818-2.4967 0.9466-0.34474 0.9466-0.34472 0.90818 2.4966" />
          <path d="m46.973 44.827-1.8313-3.1738 1.7448-1.0079 1.8313 3.1738" />
        </g>
        <path class="NormalStroke Yellow CornerRound" d="m68.906 38.650-2.5184-3.7000h5.0367l-2.5184 3.7000" />
      </g>
    );
  }
}

interface AttitudeIndicatorFixedCenterProps {
  bus: ArincEventBus;
  isAttExcessive: Subscribable<boolean>;
}

export class AttitudeIndicatorFixedCenter extends DisplayComponent<AttitudeIndicatorFixedCenterProps> {
  private roll = new Arinc429Word(0);

  private pitch: Arinc429WordData = Arinc429Register.empty();

  private visibilitySub = Subject.create('hidden');

  private readonly attFlagVisible = Subject.create(false);

  private fdVisibilitySub = Subject.create('hidden');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values>();

    sub.on('rollAr').handle((r) => {
      this.roll = r;
      if (!this.roll.isNormalOperation()) {
        this.visibilitySub.set('display:none');
        this.attFlagVisible.set(true);
        this.fdVisibilitySub.set('display:none');
      } else {
        this.visibilitySub.set('display:inline');
        this.attFlagVisible.set(false);
        if (!this.props.isAttExcessive.get()) {
          this.fdVisibilitySub.set('display:inline');
        }
      }
    });

    sub.on('pitchAr').handle((p) => {
      this.pitch = p;

      if (!this.pitch.isNormalOperation()) {
        this.visibilitySub.set('display:none');
        this.attFlagVisible.set(true);
        this.fdVisibilitySub.set('display:none');
      } else {
        this.visibilitySub.set('display:inline');
        this.attFlagVisible.set(false);
        if (!this.props.isAttExcessive.get()) {
          this.fdVisibilitySub.set('display:inline');
        }
      }
    });

    this.props.isAttExcessive.sub((a) => {
      if (a) {
        this.fdVisibilitySub.set('display:none');
      } else if (this.roll.isNormalOperation() && this.pitch.isNormalOperation()) {
        this.fdVisibilitySub.set('display:inline');
      }
    });
  }

  render(): VNode {
    return (
      <>
        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.attFlagVisible}>
          <text id="AttFailText" class="FontLargest Red EndAlign" x="75.893127" y="83.136955">
            ATT
          </text>
        </FlashOneHertz>

        <g id="AttitudeSymbolsGroup" style={this.visibilitySub}>
          <SidestickIndicator bus={this.props.bus} />
          <path class="BlackFill" d="m67.647 82.083v-2.5198h2.5184v2.5198z" />

          <g style={this.fdVisibilitySub}>
            <FDYawBar bus={this.props.bus} />
            <FlightDirector bus={this.props.bus} />
          </g>

          <path class="NormalOutline" d="m67.647 82.083v-2.5198h2.5184v2.5198z" />
          <path class="NormalStroke Yellow" d="m67.647 82.083v-2.5198h2.5184v2.5198z" />
          <g class="NormalOutline">
            <path d="m88.55 86.114h2.5184v-4.0317h12.592v-2.5198h-15.11z" />
            <path d="m34.153 79.563h15.11v6.5516h-2.5184v-4.0317h-12.592z" />
          </g>
          <g id="FixedAircraftReference" class="NormalStroke Yellow BlackFill">
            <path d="m88.55 86.114h2.5184v-4.0317h12.592v-2.5198h-15.11z" />
            <path d="m34.153 79.563h15.11v6.5516h-2.5184v-4.0317h-12.592z" />
          </g>
          <FlightPathVector bus={this.props.bus} />
          <FlightPathDirector bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} />
        </g>
      </>
    );
  }
}

class FDYawBar extends DisplayComponent<{ bus: ArincEventBus }> {
  private fdEngaged = false;

  private fcuEisDiscreteWord2 = new Arinc429Word(0);

  private fdYawCommand = new Arinc429Word(0);

  private yawRef = FSComponent.createRef<SVGPathElement>();

  private handleFdState() {
    const fdOff = this.fcuEisDiscreteWord2.bitValueOr(23, false);
    const showFd = this.fdEngaged && !fdOff;

    const showYaw = showFd && !(this.fdYawCommand.isFailureWarning() || this.fdYawCommand.isNoComputedData());

    if (showYaw) {
      const offset = -Math.max(Math.min(this.fdYawCommand.value, 45), -45) * 0.44;

      this.yawRef.instance.style.visibility = 'visible';
      this.yawRef.instance.style.transform = `translate3d(${offset}px, 0px, 0px)`;
    } else {
      this.yawRef.instance.style.visibility = 'hidden';
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values & FgBus & FcuBus>();

    sub.on('yawFdCommand').handle((fy) => {
      this.fdYawCommand = fy;

      this.handleFdState();
    });

    sub
      .on('fdEngaged')
      .whenChanged()
      .handle((fd) => {
        this.fdEngaged = fd;

        this.handleFdState();
      });

    sub
      .on('fcuEisDiscreteWord2')
      .whenChanged()
      .handle((tr) => {
        this.fcuEisDiscreteWord2 = tr;

        this.handleFdState();
      });
  }

  render(): VNode {
    return (
      <path
        ref={this.yawRef}
        id="GroundYawSymbol"
        class="NormalStroke Green"
        d="m67.899 82.536v13.406h2.0147v-13.406l-1.0074-1.7135z"
      />
    );
  }
}

class FlightDirector extends DisplayComponent<{ bus: ArincEventBus }> {
  private fdEngaged = false;

  private fcuEisDiscreteWord2 = new Arinc429Word(0);

  private fcuDiscreteWord1 = new Arinc429Word(0);

  private fmgcDiscreteWord2 = new Arinc429Word(0);

  private fmgcDiscreteWord5 = new Arinc429Word(0);

  private fdRollCommand = new Arinc429Word(0);

  private fdPitchCommand = new Arinc429Word(0);

  private fdYawCommand = new Arinc429Word(0);

  private leftMainGearCompressed = false;

  private rightMainGearCompressed = false;

  private lateralRef1 = FSComponent.createRef<SVGPathElement>();

  private lateralRef2 = FSComponent.createRef<SVGPathElement>();

  private verticalRef1 = FSComponent.createRef<SVGPathElement>();

  private verticalRef2 = FSComponent.createRef<SVGPathElement>();

  private readonly fdFlagVisibleSub = Subject.create(false);

  private readonly lateralShouldFlash = Subject.create(false);

  private readonly longitudinalShouldFlash = Subject.create(false);

  private readonly lateralVisible = Subject.create(false);

  private readonly longitudinalVisible = Subject.create(false);

  private handleFdState() {
    const fdOff = this.fcuEisDiscreteWord2.bitValueOr(23, false);
    const showFd = this.fdEngaged && !fdOff;

    const trkFpaActive = this.fcuDiscreteWord1.bitValueOr(25, false);

    const showRoll =
      showFd && !trkFpaActive && !(this.fdRollCommand.isFailureWarning() || this.fdRollCommand.isNoComputedData());

    if (showRoll) {
      const FDRollOffset = Math.min(Math.max(this.fdRollCommand.value, -45), 45) * 0.44;

      this.lateralVisible.set(true);
      this.lateralRef1.instance.style.transform = `translate3d(${FDRollOffset}px, 0px, 0px)`;

      this.lateralRef2.instance.style.transform = `translate3d(${FDRollOffset}px, 0px, 0px)`;
    } else {
      this.lateralVisible.set(false);
    }

    const showPitch =
      showFd && !trkFpaActive && !(this.fdPitchCommand.isFailureWarning() || this.fdPitchCommand.isNoComputedData());

    if (showPitch) {
      const FDPitchOffset = Math.min(Math.max(this.fdPitchCommand.value, -22.5), 22.5) * 0.89;

      this.longitudinalVisible.set(true);
      this.verticalRef1.instance.style.transform = `translate3d(0px, ${FDPitchOffset}px, 0px)`;

      this.verticalRef2.instance.style.transform = `translate3d(0px, ${FDPitchOffset}px, 0px)`;
    } else {
      this.longitudinalVisible.set(false);
    }

    const onGround = this.leftMainGearCompressed || this.rightMainGearCompressed;
    if (
      !fdOff &&
      (!this.fdEngaged ||
        this.fdRollCommand.isFailureWarning() ||
        this.fdPitchCommand.isFailureWarning() ||
        (this.fdYawCommand.isFailureWarning() && onGround))
    ) {
      this.fdFlagVisibleSub.set(true);
    } else {
      this.fdFlagVisibleSub.set(false);
    }
  }

  private handleFdBarsFlashing() {
    const fdRollBarFlashing = this.fmgcDiscreteWord2.bitValueOr(28, false);
    const fdPitchBarFlashing = this.fmgcDiscreteWord5.bitValueOr(24, false);

    this.lateralShouldFlash.set(fdRollBarFlashing);
    this.longitudinalShouldFlash.set(fdPitchBarFlashing);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<Arinc429Values & PFDSimvars & FgBus & FcuBus>();

    sub
      .on('fdEngaged')
      .whenChanged()
      .handle((fd) => {
        this.fdEngaged = fd;

        this.handleFdState();
      });

    sub
      .on('fcuEisDiscreteWord2')
      .whenChanged()
      .handle((tr) => {
        this.fcuEisDiscreteWord2 = tr;

        this.handleFdState();
      });

    sub
      .on('fcuDiscreteWord1')
      .whenChanged()
      .handle((tr) => {
        this.fcuDiscreteWord1 = tr;

        this.handleFdState();
      });

    sub
      .on('fmgcDiscreteWord2')
      .whenChanged()
      .handle((tr) => {
        this.fmgcDiscreteWord2 = tr;

        this.handleFdBarsFlashing();
      });

    sub
      .on('fmgcDiscreteWord5')
      .whenChanged()
      .handle((tr) => {
        this.fmgcDiscreteWord5 = tr;

        this.handleFdBarsFlashing();
      });

    sub
      .on('rollFdCommand')
      .withArinc429Precision(2)
      .handle((fd) => {
        this.fdRollCommand = fd;

        this.handleFdState();
      });

    sub
      .on('pitchFdCommand')
      .withArinc429Precision(2)
      .handle((fd) => {
        this.fdPitchCommand = fd;

        this.handleFdState();
      });

    sub
      .on('yawFdCommand')
      .withArinc429Precision(2)
      .handle((fd) => {
        this.fdYawCommand = fd;

        this.handleFdState();
      });

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.leftMainGearCompressed = g;
        this.handleFdState();
      });

    sub
      .on('rightMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.rightMainGearCompressed = g;
        this.handleFdState();
      });
  }

  render(): VNode | null {
    return (
      <g>
        {/* These are split up in this order to prevent the shadow of one FD bar to go above the other green FD bar */}
        <FlashOneHertz
          bus={this.props.bus}
          flashDuration={Infinity}
          visible={this.lateralVisible}
          flashing={this.lateralShouldFlash}
        >
          <path ref={this.lateralRef1} class="ThickOutline" d="m68.903 61.672v38.302" />
        </FlashOneHertz>

        <FlashOneHertz
          bus={this.props.bus}
          flashDuration={Infinity}
          visible={this.longitudinalVisible}
          flashing={this.longitudinalShouldFlash}
        >
          <path ref={this.verticalRef1} class="ThickOutline" d="m49.263 80.823h39.287" />
        </FlashOneHertz>

        <FlashOneHertz
          bus={this.props.bus}
          flashDuration={Infinity}
          visible={this.lateralVisible}
          flashing={this.lateralShouldFlash}
        >
          <path ref={this.lateralRef2} class="ThickStroke Green" id="FlightDirectorRoll" d="m68.903 61.672v38.302" />
        </FlashOneHertz>

        <FlashOneHertz
          bus={this.props.bus}
          flashDuration={Infinity}
          visible={this.longitudinalVisible}
          flashing={this.longitudinalShouldFlash}
        >
          <path ref={this.verticalRef2} class="ThickStroke Green" id="FlightDirectorPitch" d="m49.263 80.823h39.287" />
        </FlashOneHertz>

        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.fdFlagVisibleSub}>
          <text id="FDFlag" x="52.702862" y="56.065434" class="FontLargest EndAlign Red">
            FD
          </text>
        </FlashOneHertz>
      </g>
    );
  }
}

class SidestickIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private captPitchCommand = new Arinc429Word(0);

  private foPitchCommand = new Arinc429Word(0);

  private captRollCommand = new Arinc429Word(0);

  private foRollCommand = new Arinc429Word(0);

  private fcdc1DiscreteWord2 = new Arinc429Word(0);

  private fcdc2DiscreteWord2 = new Arinc429Word(0);

  private onGround = true;

  private crossHairRef = FSComponent.createRef<SVGPathElement>();

  private onGroundForVisibility = Subject.create('visible');

  private engOneRunning = false;

  private engTwoRunning = false;

  private handleSideStickIndication() {
    const oneEngineRunning = this.engOneRunning || this.engTwoRunning;

    const showIndicator =
      this.onGround &&
      oneEngineRunning &&
      !this.captPitchCommand.isFailureWarning() &&
      !this.captRollCommand.isFailureWarning() &&
      !this.foPitchCommand.isFailureWarning() &&
      !this.foRollCommand.isFailureWarning();

    const foStickDisabledFcdc1 = this.fcdc1DiscreteWord2.bitValueOr(29, false);
    const foStickDisabledFcdc2 = this.fcdc2DiscreteWord2.bitValueOr(29, false);
    const captStickDisabledFcdc1 = this.fcdc1DiscreteWord2.bitValueOr(28, false);
    const captStickDisabledFcdc2 = this.fcdc2DiscreteWord2.bitValueOr(28, false);
    const foStickDisabled = foStickDisabledFcdc1 || foStickDisabledFcdc2;
    const captStickDisabled = captStickDisabledFcdc1 || captStickDisabledFcdc2;

    // TODO: Replace magic numbers with constants to make this more understandable
    const totalPitchCommand =
      Math.max(
        Math.min(
          (foStickDisabled ? 0 : this.foPitchCommand.value) + (captStickDisabled ? 0 : this.captPitchCommand.value),
          16,
        ),
        -16,
      ) * -1.43875;
    const totalRollCommand =
      Math.max(
        Math.min(
          (foStickDisabled ? 0 : this.foRollCommand.value) + (captStickDisabled ? 0 : this.captRollCommand.value),
          20,
        ),
        -20,
      ) * 1.478;

    if (!showIndicator) {
      this.onGroundForVisibility.set('hidden');
    } else {
      this.onGroundForVisibility.set('visible');
      this.crossHairRef.instance.style.transform = `translate3d(${totalRollCommand}px, ${totalPitchCommand}px, 0px)`;
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values>();

    sub
      .on('noseGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.onGround = g;
        this.handleSideStickIndication();
      });

    sub
      .on('engOneRunning')
      .whenChanged()
      .handle((e) => {
        this.engOneRunning = e;
        this.handleSideStickIndication();
      });

    sub
      .on('engTwoRunning')
      .whenChanged()
      .handle((e) => {
        this.engTwoRunning = e;
        this.handleSideStickIndication();
      });

    sub
      .on('fcdc1DiscreteWord2')
      .whenChanged()
      .handle((discreteWord2) => {
        this.fcdc1DiscreteWord2 = discreteWord2;
        this.handleSideStickIndication();
      });

    sub
      .on('fcdc2DiscreteWord2')
      .whenChanged()
      .handle((discreteWord2) => {
        this.fcdc2DiscreteWord2 = discreteWord2;
        this.handleSideStickIndication();
      });

    sub
      .on('fcdcCaptPitchCommand')
      .whenChanged()
      .handle((x) => {
        this.captPitchCommand = x;
        this.handleSideStickIndication();
      });

    sub
      .on('fcdcFoPitchCommand')
      .whenChanged()
      .handle((x) => {
        this.foPitchCommand = x;
        this.handleSideStickIndication();
      });

    sub
      .on('fcdcCaptRollCommand')
      .whenChanged()
      .handle((y) => {
        this.captRollCommand = y;
        this.handleSideStickIndication();
      });

    sub
      .on('fcdcFoRollCommand')
      .whenChanged()
      .handle((y) => {
        this.foRollCommand = y;
        this.handleSideStickIndication();
      });
  }

  render(): VNode {
    return (
      <g id="GroundCursorGroup" class="NormalStroke White" visibility={this.onGroundForVisibility}>
        <path
          id="GroundCursorBorders"
          d="m92.327 103.75h6.0441v-6.0476m-58.93 0v6.0476h6.0441m46.842-45.861h6.0441v6.0476m-58.93 0v-6.0476h6.0441"
        />
        <path
          ref={this.crossHairRef}
          id="GroundCursorCrosshair"
          d="m73.994 81.579h-4.3316v4.3341m-5.8426-4.3341h4.3316v4.3341m5.8426-5.846h-4.3316v-4.3341m-5.8426 4.3341h4.3316v-4.3341"
        />
      </g>
    );
  }
}
