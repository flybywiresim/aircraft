import {
  ClockEvents,
  DisplayComponent,
  EventBus,
  FSComponent,
  Subscribable,
  VNode,
  Subject,
} from '@microsoft/msfs-sdk';
import { Arinc429Word } from '@flybywiresim/fbw-sdk';
import { getDisplayIndex } from './HUD';
import { calculateHorizonOffsetFromPitch, HudElems } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { ONE_DEG, FIVE_DEG } from './HUDUtils';
const DistanceSpacing = FIVE_DEG;
const ValueSpacing = 5;

interface FlightPathVectorData {
  roll: Arinc429Word;
  pitch: Arinc429Word;
  fpa: Arinc429Word;
  da: Arinc429Word;
  activeVerticalMode: number;
  activeLateralMode: number;
  fdRoll: number;
  fdPitch: number;
  fdActive: boolean;
}

export class FlightPathDirector extends DisplayComponent<{ bus: EventBus; isAttExcessive: Subscribable<boolean> }> {
  private data: FlightPathVectorData = {
    roll: new Arinc429Word(0),
    pitch: new Arinc429Word(0),
    fpa: new Arinc429Word(0),
    da: new Arinc429Word(0),
    fdPitch: 0,
    fdRoll: 0,
    fdActive: true,
    activeLateralMode: 0,
    activeVerticalMode: 0,
  };
  private flightPhase = -1;
  private declutterMode = 0;
  private crosswindMode;
  private fdCueOffRange;
  private sVisibility = Subject.create<String>('');

  private needsUpdate = false;

  private isVisible = false;

  private birdPath = FSComponent.createRef<SVGGElement>();

  private birdPathCircle = FSComponent.createRef<SVGPathElement>();
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isCaptainSide = getDisplayIndex() === 1;
    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents & HudElems>();
    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.flightPhase = fp;
        if (fp < 4 || fp >= 10) {
          this.sVisibility.set('none');
        }
        if (fp >= 4 && fp < 10) {
          this.sVisibility.set('block');
        }
      });
    sub
      .on('cWndMode')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value.get();
      });
    sub
      .on('decMode')
      .whenChanged()
      .handle((value) => {
        this.flightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Number');
        this.declutterMode = value.get();
      });

    sub
      .on(isCaptainSide ? 'fd1Active' : 'fd2Active')
      .whenChanged()
      .handle((fd) => {
        this.data.fdActive = fd;
        this.needsUpdate = true;
      });

    sub.on('fpa').handle((fpa) => {
      this.data.fpa = fpa;
      this.needsUpdate = true;
    });

    sub.on('da').handle((da) => {
      this.data.da = da;
      this.needsUpdate = true;
    });

    sub
      .on('activeVerticalMode')
      .whenChanged()
      .handle((vm) => {
        this.data.activeLateralMode = vm;
        this.needsUpdate = true;
      });

    sub
      .on('activeLateralMode')
      .whenChanged()
      .handle((lm) => {
        this.data.activeLateralMode = lm;
        this.needsUpdate = true;
      });

    sub.on('fdPitch').handle((fdp) => {
      this.data.fdPitch = fdp;
      this.needsUpdate = true;
    });

    sub.on('fdBank').handle((fdr) => {
      this.data.fdRoll = fdr;
      this.needsUpdate = true;
    });

    sub.on('rollAr').handle((r) => {
      this.data.roll = r;
      this.needsUpdate = true;
    });

    sub.on('pitchAr').handle((p) => {
      this.data.pitch = p;
      this.needsUpdate = true;
    });

    sub.on('realTime').handle((_t) => {
      this.handlePath();
      if (this.needsUpdate && this.isVisible) {
        this.moveBird();
      }
    });

    this.props.isAttExcessive.sub((_a) => {
      this.needsUpdate = true;
    }, true);
  }

  private handlePath() {
    const showLateralFD = this.data.activeLateralMode !== 0 && this.data.activeLateralMode !== 34;
    const showVerticalFD = this.data.activeVerticalMode !== 0 && this.data.activeVerticalMode !== 34;
    const daAndFpaValid = this.data.fpa.isNormalOperation() && this.data.da.isNormalOperation();

    if (
      (!showVerticalFD && !showLateralFD) ||
      !this.data.fdActive ||
      !daAndFpaValid ||
      this.props.isAttExcessive.get()
    ) {
      this.birdPath.instance.style.visibility = 'hidden';
      this.isVisible = false;
    } else {
      this.birdPath.instance.style.visibility = 'visible';
      this.isVisible = true;
    }
  }

  private moveBird() {
    // if (this.data.fdActive) {
    //   const FDRollOrder = this.data.fdRoll;
    //   const FDRollOrderLim = Math.max(Math.min(FDRollOrder, 45), -45);
    //   const FDPitchOrder = this.data.fdPitch;
    //   const FDPitchOrderLim = Math.max(Math.min(FDPitchOrder, 22.5), -22.5) * 1.9;

    //   const daLimConv = (Math.max(Math.min(this.data.da.value, 21), -21) * DistanceSpacing) / ValueSpacing;
    //   const pitchSubFpaConv =
    //     calculateHorizonOffsetFromPitch(this.data.pitch.value) - calculateHorizonOffsetFromPitch(this.data.fpa.value);
    //   const rollCos = Math.cos((this.data.roll.value * Math.PI) / 180);
    //   const rollSin = Math.sin((-this.data.roll.value * Math.PI) / 180);

    //   const FDRollOffset = FDRollOrderLim * 0.77;
    //   const xOffsetFpv = daLimConv * rollCos - pitchSubFpaConv * rollSin;
    //   const yOffsetFpv = pitchSubFpaConv * rollCos + daLimConv * rollSin;

    //   const xOffset = xOffsetFpv - FDPitchOrderLim * rollSin;
    //   const yOffset = yOffsetFpv + FDPitchOrderLim * rollCos;

    //   this.birdPath.instance.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0px)`;
    //   this.birdPathWings.instance.setAttribute('transform', `rotate(${FDRollOffset} 15.5 15.5)`);
    // }
    // this.needsUpdate = false;
    let xOffsetLim;

    if (this.isVisible) {
      const daLimConv = (this.data.da.value * DistanceSpacing) / ValueSpacing;
      const pitchSubFpaConv =
        calculateHorizonOffsetFromPitch(this.data.pitch.value) - calculateHorizonOffsetFromPitch(this.data.fpa.value);
      const rollCos = Math.cos((this.data.roll.value * Math.PI) / 180);
      const rollSin = Math.sin((-this.data.roll.value * Math.PI) / 180);

      // //FD Smoothing when close to FPV
      // //roll
      // const FDRollOrder = this.data.fdRoll;
      // let FDRollOrder2 = FDRollOrder;
      // let cx, cy, r;
      // cx = -30;
      // cy = 90;
      // r = 94.86835;
      // if (FDRollOrder >= 0) {
      //   FDRollOrder2 = cy - Math.sqrt(r ** 2 - (FDRollOrder - cx) ** 2);
      // } else {
      //   FDRollOrder2 = -cy + Math.sqrt(r ** 2 - (FDRollOrder + cx) ** 2);
      // }
      // const FDRollOrderLim = Math.max(Math.min(FDRollOrder2, 45), -45);

      // //pitch
      // const FDPitchOrder = this.data.fdPitch; //in degrees on pitch scale
      // let FDPitchOrder2 = FDRollOrder;

      // cx = -10;
      // cy = 18;
      // r = 20.5913;
      // if (FDPitchOrder >= 0) {
      //   FDPitchOrder2 = cy - Math.sqrt(r ** 2 - (FDPitchOrder - cx) ** 2);
      // } else {
      //   FDPitchOrder2 = -cy + Math.sqrt(r ** 2 - (FDPitchOrder + cx) ** 2);
      // }
      // const FDPitchOrderLim = Math.max(Math.min(FDPitchOrder2, 5), -5);

      const FDRollOrder = this.data.fdRoll;
      const FDRollOrderLim = Math.max(Math.min(FDRollOrder, 45), -45);
      const FDPitchOrder = this.data.fdPitch; //in degrees on pitch scale
      const FDPitchOrderLim = Math.max(Math.min(FDPitchOrder, 45), -45);

      const xOffsetFpv = daLimConv * rollCos - pitchSubFpaConv * rollSin;
      const yOffsetFpv = pitchSubFpaConv * rollCos + daLimConv * rollSin;

      const xOffset = xOffsetFpv + FDRollOrderLim * 13;
      const yOffset = yOffsetFpv + FDPitchOrderLim * 13 + rollSin * (xOffset - xOffsetFpv); // * rollCos;

      // console.log(
      //   'xOffsetFpv: ' +
      //     xOffsetFpv +
      //     '  yOffsetFpv:  ' +
      //     yOffsetFpv +
      //     '  xOffset: ' +
      //     xOffset +
      //     '  yOffset: ' +
      //     yOffset +
      //     '  rollCos: ' +
      //     rollCos +
      //     '  rollSin: ' +
      //     rollSin +
      //     '  FDRollOrder: ' +
      //     FDRollOrder,
      // );

      //set lateral limit for fdCue
      if (this.crosswindMode == 0) {
        if (xOffset < -428 || xOffset > 360) {
          this.fdCueOffRange = true;
        } else {
          this.fdCueOffRange = false;
        }

        xOffsetLim = Math.max(Math.min(xOffset, 360), -428);
      } else {
        if (xOffset < -540 || xOffset > 540) {
          this.fdCueOffRange = true;
        } else {
          this.fdCueOffRange = false;
        }
        xOffsetLim = Math.max(Math.min(xOffset, 540), -540);
      }

      this.birdPathCircle.instance.style.transform = `translate3d(${xOffsetLim}px, ${yOffset - FIVE_DEG}px, 0px)`;

      if (this.fdCueOffRange) {
        this.birdPathCircle.instance.setAttribute('stroke-dasharray', '3 6');
      } else {
        this.birdPathCircle.instance.setAttribute('stroke-dasharray', '');
      }

      // console.log(
      //   'FDPitchOrderLim ' +
      //     FDPitchOrderLim +
      //     'FDRollOrderLim ' +
      //     FDRollOrderLim +
      //     'xOffsetLim ' +
      //     xOffsetLim +
      //     'yOffset ' +
      //     yOffset,
      //   'xOffsetFpv ' + xOffsetFpv + 'yOffsetFpv ' + yOffsetFpv,
      // );
    }
    this.needsUpdate = false;
  }

  render(): VNode {
    return (
      <g ref={this.birdPath}>
        <svg>
          <g id="FlightPathDirector" display={this.sVisibility}>
            {/* <circle class="SmallStroke Green" cx="640" cy="512" r="10" /> */}
            <path
              ref={this.birdPathCircle}
              d="M 631 512 C 631 517,  635 521,      640 521
                S 649 517,      649 512
                S 645 503,      640 503
                S 631 507,      631 512 Z"
              class="NormalStroke Green"
              stroke-dasharray="3 6"
            />
          </g>
        </svg>
      </g>
    );
  }
}
