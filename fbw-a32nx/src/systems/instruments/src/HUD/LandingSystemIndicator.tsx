// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  HEvent,
  MappedSubject,
  NodeReference,
  Subject,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429RegisterSubject, MathUtils } from '@flybywiresim/fbw-sdk';

import { getDisplayIndex } from 'instruments/src/HUD/HUD';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { HudElems, LagFilter } from './HUDUtils';
import { calculateHorizonOffsetFromPitch, FIVE_DEG } from './HUDUtils';

const DistanceSpacing = FIVE_DEG; // (1024 /28) * 5 182.857
const ValueSpacing = 5;

// FIXME true ref
export class LandingSystem extends DisplayComponent<{ bus: ArincEventBus; instrument: BaseInstrument }> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & HEvent & Arinc429Values & ClockEvents & HudElems>();

  private xtkValid = Subject.create(false);

  private ldevRequest = false;

  private ldevRef = FSComponent.createRef<SVGGElement>();

  private groupVis = false;
  private hudFlightPhaseMode = 0;

  private readonly ls1Button = ConsumerSubject.create(this.sub.on('ls1Button'), false);
  private readonly ls2Button = ConsumerSubject.create(this.sub.on('ls2Button'), false);
  private readonly lsGrp = ConsumerSubject.create(this.sub.on('IlsLoc'), '');
  private readonly isLsGrpVisible = MappedSubject.create(
    ([ls1Btn, ls2Btn, lsGrp]) => {
      return lsGrp === 'block' ? (ls1Btn === true || ls2Btn === true ? 'block' : 'none') : 'none';
    },
    this.ls1Button,
    this.ls2Button,
    this.lsGrp,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.ls1Button, this.ls2Button, this.isLsGrpVisible);

    this.subscriptions.push(
      this.sub
        .on(getDisplayIndex() === 1 ? 'ldevRequestLeft' : 'ldevRequestRight')
        .whenChanged()
        .handle((ldevRequest) => {
          this.ldevRequest = ldevRequest;
          this.updateLdevVisibility();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('xtk')
        .whenChanged()
        .handle((xtk) => {
          this.xtkValid.set(Math.abs(xtk) > 0);
        }),
    );

    this.subscriptions.push(
      this.xtkValid.sub(() => {
        this.updateLdevVisibility();
      }),
    );
  }

  updateLdevVisibility() {
    this.ldevRef.instance.style.display = this.ldevRequest && this.xtkValid ? 'inline' : 'none';
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <g id="LSGroup" display={this.isLsGrpVisible} transform="translate(620 240) ">
          <LandingSystemInfo bus={this.props.bus} />
          <g id="LSGroup">
            <GlideSlopeIndicator bus={this.props.bus} instrument={this.props.instrument} />
            <LocalizerIndicator bus={this.props.bus} instrument={this.props.instrument} />
            <MarkerBeaconIndicator bus={this.props.bus} />
            <LocBcIndicator bus={this.props.bus} />
          </g>
        </g>
        <g id="DeviationGroup">
          <g id="LateralDeviationGroup" ref={this.ldevRef}>
            <LDevIndicator bus={this.props.bus} />
          </g>
          <g id="VerticalDeviationGroup">
            <VDevIndicator bus={this.props.bus} />
          </g>
        </g>
      </>
    );
  }
}

interface LandingSystemInfoProps {
  bus: ArincEventBus;
}

class LandingSystemInfo extends DisplayComponent<LandingSystemInfoProps> {
  private lsInfoGroup = FSComponent.createRef<SVGGElement>();
  // source data

  private readonly lsAlive = ConsumerSubject.create(null, false);

  private readonly lsFrequency = ConsumerSubject.create(null, 0);

  private readonly lsIdent = ConsumerSubject.create(null, '');

  private readonly dmeAlive = ConsumerSubject.create(null, false);

  private readonly dmeDistance = ConsumerSubject.create(null, 0);

  private readonly fm1NavDiscrete = Arinc429RegisterSubject.createEmpty();

  private readonly infoGrpVis = ConsumerSubject.create(null, '');
  // derived subjects

  private readonly lsIdentText = Subject.create('');

  private readonly lsIdentPipe = this.lsIdent.pipe(this.lsIdentText, true);

  private readonly freqTextLeading = this.lsFrequency.map((v) => Math.trunc(v).toString()).pause();

  private readonly freqTextTrailing = this.lsFrequency
    .map(
      (v) =>
        `.${Math.round((v - Math.trunc(v)) * 100)
          .toString()
          .padStart(2, '0')}`,
    )
    .pause();

  private readonly isLsIdentHidden = MappedSubject.create(
    ([ident, isAlive]) => ident.length === 0 || !isAlive,
    this.lsIdent,
    this.lsAlive,
  );

  private readonly isLsFreqHidden = this.lsFrequency.map((v) => v < 108 || v > 112);

  // FIXME major hack: when the FM is not tuning the VORs and MMRs, the DME receiver is not tuned (goes into standby)
  // Since we use the sim radios at the moment we can't tell that... instead we look at the FM tuning state
  private isDmeAvailable = MappedSubject.create(
    ([dmeAlive, fmNavDiscrete]) => dmeAlive && fmNavDiscrete.isNormalOperation(),
    this.dmeAlive,
    this.fm1NavDiscrete,
  );

  private readonly dmeDistanceRounded = this.dmeDistance.map((v) => MathUtils.round(v, 0.1));

  private readonly dmeTextLeading = this.dmeDistanceRounded
    .map((v) => (v < 20 ? Math.trunc(v).toString() : Math.round(v).toString()))
    .pause();

  private readonly dmeTextTrailing = this.dmeDistanceRounded
    .map((v) => (v < 20 ? `.${Math.round((v - Math.trunc(v)) * 10).toString()}` : ''))
    .pause();

  private readonly pausable: (ConsumerSubject<unknown> | Subscription)[] = [
    this.lsAlive,
    this.lsFrequency,
    this.lsIdent,
    this.dmeAlive,
    this.dmeDistance,
  ];

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();

    this.lsAlive.setConsumer(sub.on('hasLoc'));

    this.lsIdent.setConsumer(sub.on('navIdent'));

    this.lsFrequency.setConsumer(sub.on('navFreq'));

    this.dmeAlive.setConsumer(sub.on('hasDme'));

    this.dmeDistance.setConsumer(sub.on('dme'));

    this.infoGrpVis.setConsumer(sub.on('IlsGS'));

    this.pausable.push(
      sub
        .on('fm1NavDiscrete')
        .whenChanged()
        .handle((fm1NavDiscrete) => {
          this.fm1NavDiscrete.setWord(fm1NavDiscrete);
        }),
    );

    this.isLsFreqHidden.sub((hidden) => {
      if (hidden) {
        this.freqTextLeading.pause();
        this.freqTextTrailing.pause();
      } else {
        this.freqTextLeading.resume();
        this.freqTextTrailing.resume();
      }
    }, true);

    this.isLsIdentHidden.sub((hidden) => {
      if (hidden) {
        this.lsIdentPipe.pause();
      } else {
        this.lsIdentPipe.resume(true);
      }
    }, true);

    this.isDmeAvailable.sub((available) => {
      if (available) {
        this.dmeTextLeading.resume();
        this.dmeTextTrailing.resume();
      } else {
        this.dmeTextLeading.pause();
        this.dmeTextTrailing.pause();
      }
    }, true);
  }

  public pause(): void {
    for (const sub of this.pausable) {
      sub.pause();
    }
  }

  public resume(): void {
    for (const sub of this.pausable) {
      sub.resume(true);
    }
  }

  render(): VNode {
    return (
      <g id="LSInfoGroup" transform="  translate(-540 175)" ref={this.lsInfoGroup} display={this.infoGrpVis}>
        <text
          id="ILSIdent"
          class={{
            Green: true,
            FontMediumSmallest: true,
            AlignLeft: true,
            HiddenElement: this.isLsIdentHidden,
          }}
          x="2.96"
          y="360"
        >
          {this.lsIdentText}
        </text>
        <text
          id="ILSFreqLeading"
          class={{
            Green: true,
            FontMediumSmallest: true,
            AlignLeft: true,
            HiddenElement: this.isLsFreqHidden,
          }}
          x="3.4"
          y="378"
        >
          {this.freqTextLeading}
        </text>
        <text
          id="ILSFreqTrailing"
          class={{
            Green: true,
            FontSmall: true,
            AlignLeft: true,
            HiddenElement: this.isLsFreqHidden,
          }}
          x="40"
          y="378"
        >
          {this.freqTextTrailing}
        </text>

        <g id="ILSDistGroup" class={{ HiddenElement: this.isDmeAvailable.map((v) => !v) }}>
          <text class="Green AlignLeft" x="3.42147025" y="396">
            <tspan id="ILSDistLeading" class="FontMediumSmallest StartAlign">
              {this.dmeTextLeading}
            </tspan>
            <tspan id="ILSDistTrailing" class="FontSmall StartAlign">
              {this.dmeTextTrailing}
            </tspan>
          </text>
          <text class="Green FontSmall AlignLeft" x="55" y="396">
            NM
          </text>
        </g>
      </g>
    );
  }
}

class LocBcIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars>();

  private readonly backbeam = ConsumerSubject.create(this.sub.on('fm1Backbeam'), false);

  // FIXME hook up when MMR ready
  private readonly mixLocVnav = Subject.create(false);

  private readonly text = MappedSubject.create(
    ([backbeam, mixLocVnav]) => (backbeam ? 'B/C' : mixLocVnav ? 'LOC' : ''),
    this.backbeam,
    this.mixLocVnav,
  );

  /** @inheritdoc */
  render(): VNode {
    return (
      <g id="LocBcIndicator">
        <text class="FontMediumSmaller AlignLeft Magenta" x="96" y="316.125">
          {this.text}
        </text>
      </g>
    );
  }
}
class LocalizerIndicator extends DisplayComponent<{ bus: ArincEventBus; instrument: BaseInstrument }> {
  private flightPhase = -1;
  private fmgcFlightPhase = -1;
  private declutterMode = 0;
  private readonly lsVisible = ConsumerSubject.create(null, false);
  private LSLocRef = FSComponent.createRef<SVGGElement>();
  private onGround = true;
  private LsState = false;
  private lagFilter = new LagFilter(1.5);

  private rightDiamond = FSComponent.createRef<SVGPathElement>();

  private leftDiamond = FSComponent.createRef<SVGPathElement>();

  private locDiamond = FSComponent.createRef<SVGPathElement>();

  private diamondGroup = FSComponent.createRef<SVGGElement>();
  private LSLocGroupVerticalOffset = 0;
  private pitch = 0;
  private doOnce = 0;
  private handleNavRadialError(radialError: number): void {
    const deviation = this.lagFilter.step(radialError, this.props.instrument.deltaTime / 1000);
    const dots = deviation / 0.8;

    if (dots > 2) {
      this.rightDiamond.instance.classList.remove('HiddenElement');
      this.leftDiamond.instance.classList.add('HiddenElement');
      this.locDiamond.instance.classList.add('HiddenElement');
    } else if (dots < -2) {
      this.rightDiamond.instance.classList.add('HiddenElement');
      this.leftDiamond.instance.classList.remove('HiddenElement');
      this.locDiamond.instance.classList.add('HiddenElement');
    } else {
      this.locDiamond.instance.classList.remove('HiddenElement');
      this.rightDiamond.instance.classList.add('HiddenElement');
      this.leftDiamond.instance.classList.add('HiddenElement');
      this.locDiamond.instance.style.transform = `translate3d(${(dots * 75.221) / 2}px, 0px, 0px)`;
    }
  }

  private setLocGroupPos() {
    if (this.LsState) {
      if (this.onGround) {
        this.LSLocRef.instance.style.visibility = 'visible';
        this.LSLocRef.instance.style.transform = `translate3d(-152px, 60px, 0px)`;
      } else {
        if (this.declutterMode == 2) {
          this.LSLocRef.instance.style.visibility = 'hidden';
        } else {
          this.LSLocRef.instance.style.visibility = 'visible';
        }
        this.LSLocRef.instance.style.transform = `translate3d(-152px, 120px, 0px)`;
      }
    } else {
      if (this.onGround) {
        this.LSLocRef.instance.style.visibility = 'visible';
        this.LSLocRef.instance.style.transform = `translate3d(-152px, 60px, 0px)`;
      } else {
        this.LSLocRef.instance.style.visibility = 'hidden';
        this.LSLocRef.instance.style.transform = `translate3d(-152px, 120px, 0px)`;
      }
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & ClockEvents & Arinc429Values & HudElems>();

    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.flightPhase = fp;
      });
    sub
      .on('fmgcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.fmgcFlightPhase = fp;
      });

    sub
      .on('decMode')
      .whenChanged()
      .handle((value) => {
        this.declutterMode = value;
        this.setLocGroupPos();
      });

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((value) => {
        this.onGround = value;
        if (value) {
          this.LSLocRef.instance.style.transform = `translate3d(-152px, 60px, 0px)`;
          this.LSLocRef.instance.style.visibility = 'visible';
        } else {
          this.LSLocRef.instance.style.transform = `translate3d(-152px, 120px, 0px)`;
          this.LSLocRef.instance.style.visibility = 'hidden';
        }
      });

    sub
      .on('hasLoc')
      .whenChanged()
      .handle((hasLoc) => {
        if (hasLoc) {
          this.diamondGroup.instance.classList.remove('HiddenElement');
          this.props.bus.on('navRadialError', this.handleNavRadialError.bind(this));
        } else {
          this.diamondGroup.instance.classList.add('HiddenElement');
          this.lagFilter.reset();
          this.props.bus.off('navRadialError', this.handleNavRadialError.bind(this));
        }
      });
    sub
      .on('ls1Button')
      .whenChanged()
      .handle((value) => {
        this.LsState = value;
        this.setLocGroupPos();
      });
    sub.on('pitchAr').handle((p) => {
      this.pitch = p.value;
    });

    sub.on('realTime').handle(() => {
      if (this.fmgcFlightPhase == 1) {
        this.doOnce = 0;
        this.LSLocRef.instance.style.visibility = 'visible';
        this.LSLocGroupVerticalOffset = 60 + ((DistanceSpacing / ValueSpacing) * this.pitch) / 2.5;
        this.LSLocRef.instance.style.transform = `translate3d(0px, ${this.LSLocGroupVerticalOffset}px, 0px)`;
      } else {
        if (this.doOnce == 0) {
          this.doOnce = 1;
          this.LSLocRef.instance.style.visibility = 'hidden';
        }
      }
    });
  }

  render(): VNode {
    return (
      <g ref={this.LSLocRef} id="LocalizerSymbolsGroup">
        <path class="NormalStroke Green" d="m137.01 326.275a2.518 2.52 0 1 0 -5.037 0 2.518 2.52 0 1 0 5.037 0z" />
        <path class="NormalStroke Green" d="m99.232 326.275a2.519 2.52 0 1 0 -5.037 0 2.519 2.52 0 1 0 5.037 0z" />
        <path class="NormalStroke Green" d="m212.56 326.275a2.518 2.52 0 1 0 -5.037 0 2.518 2.52 0 1 0 5.037 0z" />
        <path class="NormalStroke Green" d="m250.325 326.275a2.519 2.52 0 1 0 -5.037 0 2.519 2.52 0 1 0 5.037 0z" />
        <g class="HiddenElement" ref={this.diamondGroup}>
          <path
            id="LocDiamondRight"
            ref={this.rightDiamond}
            class="NormalStroke Green HiddenElement"
            d="m247.817 332.575 9.444 -6.3 -9.444 -6.3"
          />
          <path
            id="LocDiamondLeft"
            ref={this.leftDiamond}
            class="NormalStroke Green HiddenElement"
            d="m96.715 332.575 -9.444 -6.3 9.444 -6.3"
          />
          <path
            id="LocDiamond"
            ref={this.locDiamond}
            class="NormalStroke Green HiddenElement"
            d="m162.823 326.275 9.444 6.3 9.444 -6.3 -9.444 -6.3z"
          />
        </g>
        <path id="LocalizerNeutralLine" class="Green Fill" d="m170.351 334.228v-15.886h3.829v15.886z" />
      </g>
    );
  }
}

interface LSPath {
  roll: Arinc429RegisterSubject;
  pitch: Arinc429RegisterSubject;
  fpa: Arinc429RegisterSubject;
  da: Arinc429RegisterSubject;
}

class GlideSlopeIndicator extends DisplayComponent<{ bus: ArincEventBus; instrument: BaseInstrument }> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<Arinc429Values & HUDSimvars & ClockEvents & HEvent & HudElems>();
  private readonly backbeam = ConsumerSubject.create(this.sub.on('fm1Backbeam'), false);

  // FIXME hook up when MMR ready
  private readonly mixLocVnav = Subject.create(false);

  private readonly isHidden = MappedSubject.create(
    ([backbeam, mixLocVnav]) => backbeam && !mixLocVnav,
    this.backbeam,
    this.mixLocVnav,
  );

  private readonly hasGlideSlope = ConsumerSubject.create(this.sub.on('hasGlideslope'), false);
  private readonly crosswindMode = ConsumerSubject.create(this.sub.on('cWndMode').whenChanged(), false);

  private readonly noGlideSlope = MappedSubject.create(
    ([isHidden, hasGlideSlope]) => isHidden || !hasGlideSlope,
    this.isHidden,
    this.hasGlideSlope,
  );

  private LSGsRef = new NodeReference<SVGGElement>();

  private needsUpdate = false;

  private data: LSPath = {
    roll: Arinc429RegisterSubject.createEmpty(),
    pitch: Arinc429RegisterSubject.createEmpty(),
    fpa: Arinc429RegisterSubject.createEmpty(),
    da: Arinc429RegisterSubject.createEmpty(),
  };

  private lagFilter = new LagFilter(1.5);

  private upperDiamond = FSComponent.createRef<SVGPathElement>();

  private lowerDiamond = FSComponent.createRef<SVGPathElement>();

  private glideSlopeDiamond = FSComponent.createRef<SVGPathElement>();

  private diamondGroup = FSComponent.createRef<SVGGElement>();

  private handleGlideSlopeError(glideSlopeError: number): void {
    const deviation = this.lagFilter.step(glideSlopeError, this.props.instrument.deltaTime / 1000);
    const dots = deviation / 0.4;

    if (dots > 2) {
      this.upperDiamond.instance.classList.remove('HiddenElement');
      this.lowerDiamond.instance.classList.add('HiddenElement');
      this.glideSlopeDiamond.instance.classList.add('HiddenElement');
    } else if (dots < -2) {
      this.upperDiamond.instance.classList.add('HiddenElement');
      this.lowerDiamond.instance.classList.remove('HiddenElement');
      this.glideSlopeDiamond.instance.classList.add('HiddenElement');
    } else {
      this.upperDiamond.instance.classList.add('HiddenElement');
      this.lowerDiamond.instance.classList.add('HiddenElement');
      this.glideSlopeDiamond.instance.classList.remove('HiddenElement');
      this.glideSlopeDiamond.instance.style.transform = `translate3d(0px, ${(dots * 75.238) / 2}px, 0px)`;
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.hasGlideSlope, this.crosswindMode);

    this.subscriptions.push(
      this.sub
        .on('hasGlideslope')
        .whenChanged()
        .handle((hasGlideSlope) => {
          if (hasGlideSlope) {
            this.diamondGroup.instance.classList.remove('HiddenElement');
          } else {
            this.diamondGroup.instance.classList.add('HiddenElement');
            this.lagFilter.reset();
          }
        }),
    );

    this.subscriptions.push(
      this.noGlideSlope.sub((noGlideSlope) => {
        if (noGlideSlope) {
          this.lagFilter.reset();
        }
      }),
    );

    this.subscriptions.push(
      this.sub.on('glideSlopeError').handle((gs) => {
        if (!this.noGlideSlope.get()) {
          this.handleGlideSlopeError(gs);
        }
      }),
    );

    this.subscriptions.push(
      this.sub.on('fpa').handle((fpa) => {
        this.data.fpa.setWord(fpa.rawWord);
        this.needsUpdate = true;
      }),
    );

    this.subscriptions.push(
      this.sub.on('da').handle((da) => {
        this.data.da.setWord(da.rawWord);
        this.needsUpdate = true;
      }),
    );

    this.subscriptions.push(
      this.sub.on('rollAr').handle((r) => {
        this.data.roll.setWord(r.rawWord);
        this.needsUpdate = true;
      }),
    );

    this.subscriptions.push(
      this.sub.on('pitchAr').handle((p) => {
        this.data.pitch.setWord(p.rawWord);
        this.needsUpdate = true;
      }),
    );

    this.subscriptions.push(
      this.sub.on('realTime').handle((_t) => {
        if (this.needsUpdate) {
          this.needsUpdate = false;
          const daAndFpaValid = this.data.fpa.get().isNormalOperation() && this.data.da.get().isNormalOperation();
          if (daAndFpaValid) {
            // this.threeDegRef.instance.classList.remove('HiddenElement');
            this.MoveGlideSlopeGroup();
          } else {
            // this.threeDegRef.instance.classList.add('HiddenElement');
          }
        }
      }),
    );

    this.subscriptions.push(
      this.sub
        .on('ls1Button')
        .whenChanged()
        .handle((value) => {
          if (value) {
            this.LSGsRef.instance.style.visibility = 'visible';
          } else {
            this.LSGsRef.instance.style.visibility = 'hidden';
          }
        }),
    );
  }
  private MoveGlideSlopeGroup() {
    if (this.crosswindMode.get() == false) {
      this.LSGsRef.instance.style.transform = `translate3d(110px, ${calculateHorizonOffsetFromPitch(this.data.pitch.get().value)}px, 0px)`;
    } else {
      this.LSGsRef.instance.style.transform = `translate3d(110px, -110px, 0px)`;
    }
    //DistanceSpacing
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <g id="GlideSlopeSymbolsGroup" ref={this.LSGsRef}>
        <path class={{ Green: true, Fill: true }} d="m287.122 200.167v3.78h-21.082v-3.78z" />
        <path class="NormalStroke Green" d="m276.775 126.463a2.519 2.52 0 1 0 -5.037 0 2.519 2.52 0 1 0 5.037 0z" />
        <path class="NormalStroke Green" d="m276.775 164.26a2.519 2.52 0 1 0 -5.037 0 2.519 2.52 0 1 0 5.037 0z" />
        <path class="NormalStroke Green" d="m276.775 239.855a2.519 2.52 0 1 0 -5.037 0 2.519 2.52 0 1 0 5.037 0z" />
        <path class="NormalStroke Green" d="m276.775 277.65a2.519 2.52 0 1 0 -5.037 0 2.519 2.52 0 1 0 5.037 0z" />
        <g class="HideGSDiamond" ref={this.diamondGroup}>
          <path
            id="GlideSlopeDiamondLower"
            ref={this.upperDiamond}
            class="NormalStroke Green HiddenElement"
            d="m267.975 277.65 6.296 9.45 6.296 -9.45"
          />
          <path
            id="GlideSlopeDiamondUpper"
            ref={this.lowerDiamond}
            class="NormalStroke Green HiddenElement"
            d="m267.975 126.463 6.296 -9.45 6.296 9.45"
          />
          <path
            id="GlideSlopeDiamond"
            ref={this.glideSlopeDiamond}
            class="NormalStroke Green HiddenElement"
            d="m274.25 192.608 -6.296 9.45 6.296 9.45 6.296 -9.45z"
          />
        </g>
      </g>
    );
  }
}

interface LDevPath {
  roll: Arinc429RegisterSubject;
  pitch: Arinc429RegisterSubject;
  fpa: Arinc429RegisterSubject;
  da: Arinc429RegisterSubject;
}

class VDevIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<Arinc429Values & HUDSimvars & ClockEvents & HEvent>();
  private VDevSymbolLower = FSComponent.createRef<SVGPathElement>();

  private VDevSymbolUpper = FSComponent.createRef<SVGPathElement>();

  private VDevSymbol = FSComponent.createRef<SVGPathElement>();
  private needsUpdate = false;
  private VDevRef = new NodeReference<SVGGElement>();

  private data: LDevPath = {
    roll: Arinc429RegisterSubject.createEmpty(),
    pitch: Arinc429RegisterSubject.createEmpty(),
    fpa: Arinc429RegisterSubject.createEmpty(),
    da: Arinc429RegisterSubject.createEmpty(),
  };
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    // TODO use correct simvar once RNAV is implemented
    const deviation = 0;
    const dots = deviation / 100;

    if (dots > 2) {
      this.VDevSymbolLower.instance.style.visibility = 'visible';
      this.VDevSymbolUpper.instance.style.visibility = 'hidden';
      this.VDevSymbol.instance.style.visibility = 'hidden';
    } else if (dots < -2) {
      this.VDevSymbolLower.instance.style.visibility = 'hidden';
      this.VDevSymbolUpper.instance.style.visibility = 'visible';
      this.VDevSymbol.instance.style.visibility = 'hidden';
    } else {
      this.VDevSymbolLower.instance.style.visibility = 'hidden';
      this.VDevSymbolUpper.instance.style.visibility = 'hidden';
      this.VDevSymbol.instance.style.visibility = 'visible';
      this.VDevSymbol.instance.style.transform = `translate3d(0px, ${(dots * 30.238) / 2}px, 0px)`;
    }

    this.subscriptions.push(
      this.sub.on('fpa').handle((fpa) => {
        this.data.fpa.setWord(fpa.rawWord);
        this.needsUpdate = true;
      }),
    );

    this.subscriptions.push(
      this.sub.on('pitchAr').handle((fpa) => {
        this.data.fpa.setWord(fpa.rawWord);
        this.needsUpdate = true;
      }),
    );
    this.subscriptions.push(
      this.sub.on('realTime').handle((_t) => {
        if (this.needsUpdate) {
          this.needsUpdate = false;
          const daAndFpaValid = this.data.fpa.get().isNormalOperation() && this.data.da.get().isNormalOperation();
          if (daAndFpaValid) {
            // this.threeDegRef.instance.classList.remove('HiddenElement');
            this.MoveGlideSlopeGroup();
          } else {
            // this.threeDegRef.instance.classList.add('HiddenElement');
          }
        }
      }),
    );
  }

  private MoveGlideSlopeGroup() {
    this.VDevRef.instance.style.transform = `translate3d(110px, ${(calculateHorizonOffsetFromPitch(this.data.pitch.get().value) + (3 * DistanceSpacing) / ValueSpacing) / 2.5}px, 0px)`;
    //DistanceSpacing
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <g id="VertDevSymbolsGroup" ref={this.VDevRef} display="none">
        <path
          transform="translate(-1 0)"
          class={{ Green: true, Fill: true }}
          d="m 114.84887,80.06669 v 1.51188 h -8.43284 v -1.51188 z"
        />
        <text class="FontMediumSmaller AlignRight Green" x="96.410" y="46.145">
          V/DEV
        </text>
        <path class="NormalStroke Green" d="m108.7 65.704h2.0147" />
        <path class="NormalStroke Green" d="m108.7 50.585h2.0147" />
        <path class="NormalStroke Green" d="m108.7 111.06h2.0147" />
        <path class="NormalStroke Green" d="m108.7 95.942h2.0147" />
        <path
          id="VDevSymbolLower"
          ref={this.VDevSymbolLower}
          class="NormalStroke Green"
          d="m 106.58482,111.06072 v 2.00569 h 6.2384 v -2.00569"
        />
        <path
          id="VDevSymbolUpper"
          ref={this.VDevSymbolUpper}
          class="NormalStroke Green"
          d="m 106.58482,50.584541 v -2.005689 h 6.2384 v 2.005689"
        />
        <path
          id="VDevSymbol"
          ref={this.VDevSymbol}
          class="NormalStroke Green"
          d="m 112.83172,78.62553 h -6.25541 v 2.197103 2.197106 h 6.25541 v -2.197106 z"
        />
      </g>
    );
  }
}

class LDevIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private LDevSymbolLeft = FSComponent.createRef<SVGPathElement>();

  private LDevSymbolRight = FSComponent.createRef<SVGPathElement>();

  private LDevSymbol = FSComponent.createRef<SVGPathElement>();
  private flightPhase = -1;
  private LDevRef = new NodeReference<SVGGElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars>();

    sub
      .on('xtk')
      .whenChanged()
      .withPrecision(3)
      .handle((xtk) => {
        const dots = xtk / 0.1;

        if (dots > 2) {
          this.LDevSymbolRight.instance.style.visibility = 'visible';
          this.LDevSymbolLeft.instance.style.visibility = 'hidden';
          this.LDevSymbol.instance.style.visibility = 'hidden';
        } else if (dots < -2) {
          this.LDevSymbolRight.instance.style.visibility = 'hidden';
          this.LDevSymbolLeft.instance.style.visibility = 'visible';
          this.LDevSymbol.instance.style.visibility = 'hidden';
        } else {
          this.LDevSymbolRight.instance.style.visibility = 'hidden';
          this.LDevSymbolLeft.instance.style.visibility = 'hidden';
          this.LDevSymbol.instance.style.visibility = 'visible';
          this.LDevSymbol.instance.style.transform = `translate3d(${(dots * 30.238) / 2}px, 0px, 0px)`;
        }
      });
  }

  render(): VNode {
    return (
      <g id="LatDeviationSymbolsGroup" transform="translate(0 120)" display="none">
        <text class="FontMediumSmaller  AlignRight Green" x="31.578" y="125.392">
          L/DEV
        </text>
        <path class="NormalStroke Green" d="m38.686 129.51v2.0158" />
        <path class="NormalStroke Green" d="m53.796 129.51v2.0158" />
        <path class="NormalStroke Green" d="m84.017 129.51v2.0158" />
        <path class="NormalStroke Green" d="m99.127 129.51v2.0158" />
        <path
          id="LDevSymbolLeft"
          ref={this.LDevSymbolLeft}
          class="NormalStroke Green"
          d="m 38.68595,127.35727 h -2.003935 v 6.31326 h 2.003935"
        />
        <path
          id="LDevSymbolRight"
          ref={this.LDevSymbolRight}
          class="NormalStroke Green"
          d="m 99.126865,127.35727 h 2.003925 v 6.31326 h -2.003925"
        />
        <path
          id="LDevSymbol"
          ref={this.LDevSymbol}
          class="NormalStroke Green"
          d="m 66.693251,127.36221 v 6.30339 h 2.213153 2.213153 v -6.30339 h -2.213153 z"
        />
        <path id="LDevNeutralLine" class="Green Fill" d="m 68.14059,133.69116 v -6.35451 h 1.531629 v 6.35451 z" />
      </g>
    );
  }
}

class MarkerBeaconIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private classNames = Subject.create('HiddenElement');

  private markerText = Subject.create('');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars>();

    const baseClass = 'FontLarge StartAlign';

    sub
      .on('markerBeacon')
      .whenChanged()
      .handle((markerState) => {
        if (markerState === 0) {
          this.classNames.set(`${baseClass} HiddenElement`);
        } else if (markerState === 1) {
          this.classNames.set(`${baseClass} Cyan OuterMarkerBlink`);
          this.markerText.set('OM');
        } else if (markerState === 2) {
          this.classNames.set(`${baseClass} Amber MiddleMarkerBlink`);
          this.markerText.set('MM');
        } else {
          this.classNames.set(`${baseClass} White InnerMarkerBlink`);
          this.markerText.set('IM');
        }
      });
  }

  render(): VNode {
    return (
      <text id="ILSMarkerText" class={this.classNames} x="125" y="457">
        {this.markerText}
      </text>
    );
  }
}
