import { DisplayComponent, EventBus, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { getDisplayIndex } from 'instruments/src/HUD/HUD';
import { Arinc429ConsumerSubject, Arinc429Word, ArincEventBus } from '@flybywiresim/fbw-sdk';
import { FlightPathDirector } from './FlightPathDirector';
import { FlightPathVector } from './FlightPathVector';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { FIVE_DEG, HudElemsValues } from './HUDUtils';
import { LateralMode } from '@shared/autopilot';
interface AttitudeIndicatorFixedUpperProps {
  bus: EventBus;
}

export class AttitudeIndicatorFixedUpper extends DisplayComponent<AttitudeIndicatorFixedUpperProps> {
  private readonly sub = this.props.bus.getSubscriber<Arinc429Values & HudElemsValues>();

  private pitchScaleVisRef = FSComponent.createRef<SVGGElement>();
  private alternateLawRef = FSComponent.createRef<SVGGElement>();
  private pitchScale = '';
  private roll = new Arinc429Word(0);

  private pitch = new Arinc429Word(0);

  private visibilitySub = Subject.create('hidden');

  private readonly fcdcDiscreteWord1 = Arinc429ConsumerSubject.create(this.sub.on('fcdcDiscreteWord1'));

  private readonly isNormalLawActive = this.fcdcDiscreteWord1.map((dw) => dw.bitValue(11) && !dw.isFailureWarning());

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub
      .on('pitchScale')
      .whenChanged()
      .handle((v) => {
        this.pitchScale = v.get().toString();
        this.pitchScaleVisRef.instance.style.display = `${this.pitchScale}`;
      });

    this.sub
      .on('rollAr')
      .whenChanged()
      .handle((roll) => {
        this.roll = roll;
        if (!this.roll.isNormalOperation()) {
          this.pitchScaleVisRef.instance.style.display = 'none';
          this.alternateLawRef.instance.style.display = 'none';
        } else {
          this.pitchScaleVisRef.instance.style.display = 'block';
          Math.abs(roll.value) > 35 && Math.abs(roll.value) <= 71
            ? (this.alternateLawRef.instance.style.display = 'block')
            : (this.alternateLawRef.instance.style.display = 'none');
        }
        if (Math.abs(roll.value) > 71) {
          this.pitchScaleVisRef.instance.style.display = 'none';
          this.alternateLawRef.instance.style.display = 'none';
        }
      });

    this.sub
      .on('pitchAr')
      .whenChanged()
      .handle((pitch) => {
        this.pitch = pitch;
        if (!this.pitch.isNormalOperation()) {
          this.pitchScaleVisRef.instance.style.display = 'none';
        } else {
          if (pitch.value > 39 || pitch.value < -25) {
            this.pitchScaleVisRef.instance.style.display = 'none';
            this.alternateLawRef.instance.style.display = 'none';
          } else {
            this.pitchScaleVisRef.instance.style.display = 'block';
          }
        }
      });
  }

  render(): VNode {
    return (
      <g id="AttitudeUpperInfoGroup" ref={this.pitchScaleVisRef}>
        <g id="RollIndicatorFixed" class="NormalStroke Green">
          <path d="m 640,138.44282 12.21523,-20.20611 h -24.43047 zz" />
          <path d="m 735.2  164 14.1,-24.5" />
          <path d="m 705.1 150 7.7,-20.7" />
          <path d="m 673 141.5 4,-22.2" />
          <path d="m 544.8  164 -14.1,-24.5" />
          <path d="m 574.9 150 -7.7,-20.7" />
          <path d="m 607 141.5 -4,-22.2" />

          <g id="alternateLawRollRef" ref={this.alternateLawRef}>
            <path d="m 774.5 194.5 20,-20" />
            <path d="m 813 249 19,-9" />
            <path d="m 505.5 194.5 -20,-20" />
            <path d="m 467 249 -19,-9" />
            <path d="M 467.5 249.3 A 190 190 263 0 1  812.5 249.3 " />
          </g>
        </g>
      </g>
    );
  }
}

interface AttitudeIndicatorFixedCenterProps {
  bus: ArincEventBus;
  isAttExcessive: Subscribable<boolean>;
  filteredRadioAlt: Subscribable<number>;
}

export class AttitudeIndicatorFixedCenter extends DisplayComponent<AttitudeIndicatorFixedCenterProps> {
  private roll = new Arinc429Word(0);

  private pitch = new Arinc429Word(0);

  private visibilitySub = Subject.create('hidden');

  private failureVis = Subject.create('hidden');

  private fdVisibilitySub = Subject.create('hidden');

  private declutterMode = 0;
  private onGround = true;
  private visibilityAirSub = Subject.create('none');
  private visibilityGroundSub = Subject.create('none');
  private lateralMode = 0;

  private fdActive = false;
  private isActive(): boolean {
    if (!this.fdActive || !(this.lateralMode === LateralMode.ROLL_OUT || this.lateralMode === LateralMode.RWY)) {
      return false;
    }
    return true;
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isCaptainSide = getDisplayIndex() === 1;
    const sub = this.props.bus.getSubscriber<Arinc429Values & HUDSimvars>();

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((value) => {
        this.onGround = value;
      });

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
    sub
      .on(isCaptainSide ? 'declutterModeL' : 'declutterModeR')
      .whenChanged()
      .handle((value) => {
        this.declutterMode = value;
        if (this.onGround) {
          if (this.isActive()) {
            this.visibilityGroundSub.set('block');
            this.visibilityAirSub.set('none');
          } else {
            this.visibilityGroundSub.set('none');
            this.visibilityAirSub.set('none');
          }
        } else {
          this.visibilityGroundSub.set('none');
          this.declutterMode == 2 ? this.visibilityAirSub.set('none') : this.visibilityAirSub.set('block');
        }
      });
  }

  render(): VNode {
    return (
      <>
        <text
          style={this.failureVis}
          id="AttFailText"
          class="Blink9Seconds FontLargest Green MiddleAlign"
          x="640"
          y="532"
        >
          ATT / HDG
        </text>
        <g id="AttitudeSymbolsGroup" style={this.visibilitySub}>
          <FlightPathVector
            bus={this.props.bus}
            isAttExcessive={this.props.isAttExcessive}
            filteredRadioAlt={this.props.filteredRadioAlt}
          />
          <FlightPathDirector bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} />

          <g style={this.fdVisibilitySub}>
            <FDYawBar bus={this.props.bus} />
          </g>

          <g id="AircraftReferences">
            <g id="AircraftReferenceInAir" class="SmallStroke Green" display={this.visibilityAirSub}>
              <path d="m 625,335  v -6 h -30" />
              <path d="m 637,332 h 6 v -6 h -6 z" />
              <path d="m 655, 335 v -6 h 30" />
            </g>
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

    const sub = this.props.bus.getSubscriber<HUDSimvars>();

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

interface DeclutterIndicatorProps {
  bus: ArincEventBus;
}

export class DeclutterIndicator extends DisplayComponent<DeclutterIndicatorProps> {
  private declutterMode;

  private textSub = Subject.create('');

  private declutterModeRef = FSComponent.createRef<SVGPathElement>();

  private handleFdState() {
    let text: string;
    if (this.declutterMode == 0) {
      text = 'N';
      this.declutterModeRef.instance.style.visibility = 'visible';
    } else if (this.declutterMode == 1) {
      text = 'D';
      this.declutterModeRef.instance.style.visibility = 'visible';
    } else if (this.declutterMode == 2) {
      this.declutterModeRef.instance.style.visibility = 'hidden';

      text = '';
    }
    this.textSub.set(text);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isCaptainSide = getDisplayIndex() === 1;
    const sub = this.props.bus.getSubscriber<HUDSimvars>();
    sub.on(isCaptainSide ? 'declutterModeL' : 'declutterModeR').handle((m) => {
      this.declutterMode = m;
      this.handleFdState();
    });
  }

  render(): VNode {
    return (
      <g ref={this.declutterModeRef} id="DeclutterModeIndicator">
        <text class="FontMedium  MiddleAlign Green" x="1000" y="900">
          {this.textSub}
        </text>
      </g>
    );
  }
}
