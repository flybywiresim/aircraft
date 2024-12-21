import { DisplayComponent, EventBus, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { getDisplayIndex } from 'instruments/src/PFD/PFD';
import { Arinc429Word } from '@flybywiresim/fbw-sdk';
import { FlightPathDirector } from './FlightPathDirector';
import { FlightPathVector } from './FlightPathVector';
import { Arinc429Values } from './shared/ArincValueProvider';
import { PFDSimvars } from './shared/PFDSimvarPublisher';

interface AttitudeIndicatorFixedUpperProps {
  bus: EventBus;
}

export class AttitudeIndicatorFixedUpper extends DisplayComponent<AttitudeIndicatorFixedUpperProps> {
  private roll = new Arinc429Word(0);

  private pitch = new Arinc429Word(0);

  private visibilitySub = Subject.create('hidden');

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
  }

  render(): VNode {
    return (
      <g id="AttitudeUpperInfoGroup" visibility={this.visibilitySub}>
        <g id="RollProtGroup" class="SmallStroke Green">
          <path id="RollProtRight" d="m105.64 62.887 1.5716-0.8008m-1.5716-0.78293 1.5716-0.8008" />
          <path id="RollProtLeft" d="m32.064 61.303-1.5716-0.8008m1.5716 2.3845-1.5716-0.8008" />
        </g>
        <g id="RollProtLost" style="display: none" class="NormalStroke Amber">
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
  bus: EventBus;
  isAttExcessive: Subscribable<boolean>;
}

export class AttitudeIndicatorFixedCenter extends DisplayComponent<AttitudeIndicatorFixedCenterProps> {
  private roll = new Arinc429Word(0);

  private pitch = new Arinc429Word(0);

  private visibilitySub = Subject.create('hidden');

  private failureVis = Subject.create('hidden');

  private fdVisibilitySub = Subject.create('hidden');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values>();

    sub.on('rollAr').handle((r) => {
      this.roll = r;
      if (!this.roll.isNormalOperation()) {
        this.visibilitySub.set('display:none');
        this.failureVis.set('display:block');
        this.fdVisibilitySub.set('display:none');
      } else {
        this.visibilitySub.set('display:inline');
        this.failureVis.set('display:none');
        if (!this.props.isAttExcessive.get()) {
          this.fdVisibilitySub.set('display:inline');
        }
      }
    });

    sub.on('pitchAr').handle((p) => {
      this.pitch = p;

      if (!this.pitch.isNormalOperation()) {
        this.visibilitySub.set('display:none');
        this.failureVis.set('display:block');
        this.fdVisibilitySub.set('display:none');
      } else {
        this.visibilitySub.set('display:inline');
        this.failureVis.set('display:none');
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
        <text
          style={this.failureVis}
          id="AttFailText"
          class="Blink9Seconds FontLargest Red EndAlign"
          x="75.893127"
          y="83.136955"
        >
          ATT
        </text>
        <g id="AttitudeSymbolsGroup" style={this.visibilitySub}>
          <SidestickIndicator bus={this.props.bus} />
          <path class="BlackFill" d="m67.647 82.083v-2.5198h2.5184v2.5198z" />

          <FlightPathVector bus={this.props.bus} />
          <FlightPathDirector bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} />

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
        </g>
      </>
    );
  }
}

class FDYawBar extends DisplayComponent<{ bus: EventBus }> {
  private lateralMode = 0;

  private fdYawCommand = 0;

  private fdActive = false;

  private yawRef = FSComponent.createRef<SVGPathElement>();

  private isActive(): boolean {
    if (!this.fdActive || !(this.lateralMode === 40 || this.lateralMode === 33 || this.lateralMode === 34)) {
      return false;
    }
    return true;
  }

  private setOffset() {
    const offset = -Math.max(Math.min(this.fdYawCommand, 45), -45) * 0.44;
    if (this.isActive()) {
      this.yawRef.instance.style.visibility = 'visible';
      this.yawRef.instance.style.transform = `translate3d(${offset}px, 0px, 0px)`;
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub.on('fdYawCommand').handle((fy) => {
      this.fdYawCommand = fy;

      if (this.isActive()) {
        this.setOffset();
      } else {
        this.yawRef.instance.style.visibility = 'hidden';
      }
    });

    sub
      .on('activeLateralMode')
      .whenChanged()
      .handle((lm) => {
        this.lateralMode = lm;

        if (this.isActive()) {
          this.setOffset();
        } else {
          this.yawRef.instance.style.visibility = 'hidden';
        }
      });

    // FIXME, differentiate properly (without duplication)
    sub
      .on('fd1Active')
      .whenChanged()
      .handle((fd) => {
        if (getDisplayIndex() === 1) {
          this.fdActive = fd;

          if (this.isActive()) {
            this.setOffset();
          } else {
            this.yawRef.instance.style.visibility = 'hidden';
          }
        }
      });

    sub
      .on('fd2Active')
      .whenChanged()
      .handle((fd) => {
        if (getDisplayIndex() === 2) {
          this.fdActive = fd;

          if (this.isActive()) {
            this.setOffset();
          } else {
            this.yawRef.instance.style.visibility = 'hidden';
          }
        }
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

class FlightDirector extends DisplayComponent<{ bus: EventBus }> {
  private lateralMode = 0;

  private verticalMode = 0;

  private fdActive = false;

  private trkFpaActive = false;

  private fdBank = 0;

  private fdPitch = 0;

  private fdRef = FSComponent.createRef<SVGGElement>();

  private lateralRef1 = FSComponent.createRef<SVGPathElement>();

  private lateralRef2 = FSComponent.createRef<SVGPathElement>();

  private verticalRef1 = FSComponent.createRef<SVGPathElement>();

  private verticalRef2 = FSComponent.createRef<SVGPathElement>();

  private handleFdState() {
    const [toggled, showLateral, showVertical] = this.isActive();

    let FDRollOffset = 0;
    let FDPitchOffset = 0;

    if (toggled && showLateral) {
      const FDRollOrder = this.fdBank;
      FDRollOffset = Math.min(Math.max(FDRollOrder, -45), 45) * 0.44;

      this.lateralRef1.instance.setAttribute('visibility', 'visible');
      this.lateralRef1.instance.style.transform = `translate3d(${FDRollOffset}px, 0px, 0px)`;

      this.lateralRef2.instance.setAttribute('visibility', 'visible');
      this.lateralRef2.instance.style.transform = `translate3d(${FDRollOffset}px, 0px, 0px)`;
    } else {
      this.lateralRef1.instance.setAttribute('visibility', 'hidden');
      this.lateralRef2.instance.setAttribute('visibility', 'hidden');
    }

    if (toggled && showVertical) {
      const FDPitchOrder = this.fdPitch;
      FDPitchOffset = Math.min(Math.max(FDPitchOrder, -22.5), 22.5) * 0.89;

      this.verticalRef1.instance.setAttribute('visibility', 'visible');
      this.verticalRef1.instance.style.transform = `translate3d(0px, ${FDPitchOffset}px, 0px)`;

      this.verticalRef2.instance.setAttribute('visibility', 'visible');
      this.verticalRef2.instance.style.transform = `translate3d(0px, ${FDPitchOffset}px, 0px)`;
    } else {
      this.verticalRef1.instance.setAttribute('visibility', 'hidden');
      this.verticalRef2.instance.setAttribute('visibility', 'hidden');
    }
  }

  private isActive(): [boolean, boolean, boolean] {
    const toggled = this.fdActive && !this.trkFpaActive;

    const showLateralFD = this.lateralMode !== 0 && this.lateralMode !== 34 && this.lateralMode !== 40;
    const showVerticalFD = this.verticalMode !== 0 && this.verticalMode !== 34;

    return [toggled, showLateralFD, showVerticalFD];
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('fd1Active')
      .whenChanged()
      .handle((fd) => {
        if (getDisplayIndex() === 1) {
          this.fdActive = fd;

          if (this.isActive()[0]) {
            this.fdRef.instance.style.display = 'inline';
          } else {
            this.fdRef.instance.style.display = 'none';
          }
        }
      });

    sub
      .on('fd2Active')
      .whenChanged()
      .handle((fd) => {
        if (getDisplayIndex() === 2) {
          this.fdActive = fd;

          if (this.isActive()[0]) {
            this.fdRef.instance.style.display = 'inline';
          } else {
            this.fdRef.instance.style.display = 'none';
          }
        }
      });

    sub
      .on('trkFpaActive')
      .whenChanged()
      .handle((tr) => {
        this.trkFpaActive = tr;

        if (this.isActive()[0]) {
          this.fdRef.instance.style.display = 'inline';
        } else {
          this.fdRef.instance.style.display = 'none';
        }
      });

    sub
      .on('fdBank')
      .withPrecision(2)
      .handle((fd) => {
        this.fdBank = fd;

        this.handleFdState();
      });
    sub
      .on('fdPitch')
      .withPrecision(2)
      .handle((fd) => {
        this.fdPitch = fd;

        this.handleFdState();
      });

    sub
      .on('activeLateralMode')
      .whenChanged()
      .handle((vm) => {
        this.lateralMode = vm;

        this.handleFdState();
      });

    sub
      .on('activeVerticalMode')
      .whenChanged()
      .handle((lm) => {
        this.verticalMode = lm;

        this.handleFdState();
      });
  }

  render(): VNode | null {
    return (
      <g ref={this.fdRef} style="display: none">
        <g class="ThickOutline">
          <path ref={this.lateralRef1} d="m68.903 61.672v38.302" />

          <path ref={this.verticalRef1} d="m49.263 80.823h39.287" />
        </g>
        <g class="ThickStroke Green">
          <path ref={this.lateralRef2} id="FlightDirectorRoll" d="m68.903 61.672v38.302" />

          <path ref={this.verticalRef2} id="FlightDirectorPitch" d="m49.263 80.823h39.287" />
        </g>
      </g>
    );
  }
}

class SidestickIndicator extends DisplayComponent<{ bus: EventBus }> {
  private sideStickX = 0;

  private sideStickY = 0;

  private leftGearcompressed = true;

  private rightGearCompressed = true;

  private crossHairRef = FSComponent.createRef<SVGPathElement>();

  private onGroundForVisibility = Subject.create('visible');

  private engOneRunning = false;

  private engTwoRunning = false;

  private engThreeRunning = false;

  private engFourRunning = false;

  private handleSideStickIndication() {
    const onGround = this.leftGearcompressed || this.rightGearCompressed;
    const oneEngineRunning = this.engOneRunning || this.engTwoRunning || this.engThreeRunning || this.engFourRunning;

    if (onGround && oneEngineRunning) {
      this.onGroundForVisibility.set('visible');
      this.crossHairRef.instance.style.transform = `translate3d(${this.sideStickX}px, ${this.sideStickY}px, 0px)`;
    } else {
      this.onGroundForVisibility.set('hidden');
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.leftGearcompressed = g;
        this.handleSideStickIndication();
      });

    sub
      .on('rightMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.rightGearCompressed = g;
        this.handleSideStickIndication();
      });

    sub
      .on('sideStickX')
      .whenChanged()
      .handle((x) => {
        this.sideStickX = x * 29.56;
        this.handleSideStickIndication();
      });

    sub
      .on('sideStickY')
      .whenChanged()
      .handle((y) => {
        this.sideStickY = -y * 23.02;
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
      .on('engThreeRunning')
      .whenChanged()
      .handle((e) => {
        this.engThreeRunning = e;
        this.handleSideStickIndication();
      });

    sub
      .on('engFourRunning')
      .whenChanged()
      .handle((e) => {
        this.engFourRunning = e;
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
