import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  HEvent,
  MappedSubject,
  Subject,
  VNode,
  ClockEvents,
  NodeReference,
} from '@microsoft/msfs-sdk';
import { getDisplayIndex } from './HUD';
import { Arinc429Word, Arinc429WordData } from '@flybywiresim/fbw-sdk';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { HudElems, LagFilter } from './HUDUtils';
import { FIVE_DEG } from './HUDUtils';
import { calculateHorizonOffsetFromPitch } from './HUDUtils';

export class LandingSystem extends DisplayComponent<{ bus: EventBus; instrument: BaseInstrument }> {
  private lsButtonPressedVisibility = false;

  private xtkValid = Subject.create(false);

  private isDecluttered = Subject.create(false);

  private ldevRequest = false;

  private lsGroupRef = FSComponent.createRef<SVGGElement>();

  private deviationGroup = FSComponent.createRef<SVGGElement>();

  private ldevRef = FSComponent.createRef<SVGGElement>();

  private groupVis = false;
  private hudFlightPhaseMode = 0;
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & HEvent & Arinc429Values & ClockEvents & HudElems>();

  private readonly declutterModeL = ConsumerSubject.create(this.sub.on('declutterModeL'), 0);
  private readonly declutterModeR = ConsumerSubject.create(this.sub.on('declutterModeR'), 0);
  private readonly ls1Button = ConsumerSubject.create(this.sub.on('ls1Button'), false);
  private readonly ls2Button = ConsumerSubject.create(this.sub.on('ls2Button'), false);
  private gsVis = '';
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const isCaptainSide = getDisplayIndex() === 1;
    this.sub
      .on('IlsGS')
      .whenChanged()
      .handle((value) => {
        this.gsVis = value;
        value === 'block' ? (this.groupVis = true) : (this.groupVis = false);
      });
    this.sub.on(isCaptainSide ? 'ls1Button' : 'ls2Button').handle((value) => {
      value && this.groupVis
        ? (this.lsGroupRef.instance.style.display = 'inline')
        : (this.lsGroupRef.instance.style.display = 'none');
    });

    this.sub
      .on(getDisplayIndex() === 1 ? 'ldevRequestLeft' : 'ldevRequestRight')
      .whenChanged()
      .handle((ldevRequest) => {
        this.ldevRequest = ldevRequest;
        this.updateLdevVisibility();
      });

    this.sub
      .on('xtk')
      .whenChanged()
      .handle((xtk) => {
        this.xtkValid.set(Math.abs(xtk) > 0);
      });

    this.xtkValid.sub(() => {
      this.updateLdevVisibility();
    });
  }

  updateLdevVisibility() {
    this.ldevRef.instance.style.display = this.ldevRequest && this.xtkValid ? 'inline' : 'none';
  }

  render(): VNode {
    return (
      <>
        <g id="LSGroup" ref={this.lsGroupRef} transform=" translate(0 0)">
          <LandingSystemInfo bus={this.props.bus} />

          <g id="LSGroup">
            <LocalizerIndicator bus={this.props.bus} instrument={this.props.instrument} />
            <GlideSlopeIndicator bus={this.props.bus} instrument={this.props.instrument} />
            <MarkerBeaconIndicator bus={this.props.bus} />
            <LsTitle bus={this.props.bus} />
          </g>
        </g>

        <g>
          <LsReminderIndicator bus={this.props.bus} />
        </g>
        <g id="DeviationGroup" ref={this.deviationGroup} style="display: none">
          <g id="LateralDeviationGroup" ref={this.ldevRef} style="display: none">
            {/* ////TODO rnav use 3.0 scaling */}
            <LDevIndicator bus={this.props.bus} />
          </g>
          <g id="VerticalDeviationGroup" style="display: none">
            <VDevIndicator bus={this.props.bus} />
          </g>
        </g>
        {/* <path ref={this.gsReferenceLine} class="Green Fill" d="m404.32 280.234v5.292h-31.397v-5.292z" /> */}
      </>
    );
  }
}

class LandingSystemInfo extends DisplayComponent<{ bus: EventBus }> {
  private hasDme = false;

  private identText = Subject.create('');

  private freqTextLeading = Subject.create('');

  private freqTextTrailing = Subject.create('');

  private navFreq = 0;

  private dme = 0;

  private dmeVisibilitySub = Subject.create('hidden');

  private destRef = FSComponent.createRef<SVGTextElement>();

  private lsInfoGroup = FSComponent.createRef<SVGGElement>();
  private elemVis = false;
  private hasLoc = false;
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();

    // normally the ident and freq should be always displayed when an ILS freq is set, but currently it only show when we have a signal
    sub
      .on('hasLoc')
      .whenChanged()
      .handle((hasLoc) => {
        if (hasLoc) {
          this.lsInfoGroup.instance.style.display = 'inline';
        } else {
          this.lsInfoGroup.instance.style.display = 'none';
        }
      });

    sub
      .on('hasDme')
      .whenChanged()
      .handle((hasDme) => {
        this.hasDme = hasDme;
        this.updateContents();
      });

    sub
      .on('navIdent')
      .whenChanged()
      .handle((navIdent) => {
        this.identText.set(navIdent);
        this.updateContents();
      });

    sub
      .on('navFreq')
      .whenChanged()
      .handle((navFreq) => {
        this.navFreq = navFreq;
        this.updateContents();
      });

    sub
      .on('dme')
      .whenChanged()
      .handle((dme) => {
        this.dme = dme;
        this.updateContents();
      });
  }

  private updateContents() {
    const freqTextSplit = (Math.round(this.navFreq * 1000) / 1000).toString().split('.');
    this.freqTextLeading.set(freqTextSplit[0] === '0' ? '' : freqTextSplit[0]);
    if (freqTextSplit[1]) {
      this.freqTextTrailing.set(`.${freqTextSplit[1].padEnd(2, '0')}`);
    } else {
      this.freqTextTrailing.set('');
    }

    let distLeading = '';
    let distTrailing = '';
    if (this.hasDme) {
      this.dmeVisibilitySub.set('display: inline');
      const dist = Math.round(this.dme * 10) / 10;

      if (dist < 20) {
        const distSplit = dist.toString().split('.');

        distLeading = distSplit[0];
        distTrailing = `.${distSplit.length > 1 ? distSplit[1] : '0'}`;
      } else {
        distLeading = Math.round(dist).toString();
        distTrailing = '';
      }
      // eslint-disable-next-line max-len
      this.destRef.instance.innerHTML = `<tspan id="ILSDistLeading" class="FontSmallest  StartAlign">${distLeading}</tspan><tspan id="ILSDistTrailing" class="FontSmallest StartAlign">${distTrailing}</tspan>`;
    } else {
      this.dmeVisibilitySub.set('display: none');
    }
  }

  render(): VNode {
    return (
      <g id="LSInfoGroup" ref={this.lsInfoGroup} transform=" translate(115 300)">
        <text id="ILSIdent" class="Green FontSmallest  AlignLeft" x="15" y="490">
          {this.identText}
        </text>
        <text id="ILSFreqLeading" class="Green FontSmallest  AlignLeft" x="15" y="511.9">
          {this.freqTextLeading}
        </text>
        <text id="ILSFreqTrailing" class="Green FontSmallest  AlignLeft" x="60" y="512">
          {this.freqTextTrailing}
        </text>

        <g id="ILSDistGroup" style={this.dmeVisibilitySub}>
          <text ref={this.destRef} class="Green AlignLeft" x="15" y="535" />
          <text class="Green FontTiny AlignLeft" x="65" y="535">
            NM
          </text>
        </g>
      </g>
    );
  }
}

class LocalizerIndicator extends DisplayComponent<{ bus: EventBus; instrument: BaseInstrument }> {
  private flightPhase = -1;
  private fmgcFlightPhase = -1;
  private declutterMode = 0;
  private onGround = true;
  private LsState = false;
  private LSLocRef = FSComponent.createRef<SVGGElement>();
  private LSLocGroupVerticalOffset = 0;
  private pitch = 0;
  private locVis = '';
  private locVisBool = false;
  private lsBtnState = false;
  private lagFilter = new LagFilter(1.5);

  private rightDiamond = FSComponent.createRef<SVGPathElement>();

  private leftDiamond = FSComponent.createRef<SVGPathElement>();

  private locDiamond = FSComponent.createRef<SVGPathElement>();

  private diamondGroup = FSComponent.createRef<SVGGElement>();

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
      this.locDiamond.instance.style.transform = `translate3d(${(dots * 90.6) / 2}px, 0px, 0px)`;
    }
  }
  private setLocGroupPos() {
    this.LSLocRef.instance.style.transform = `translate3d(433.5px, 400px, 0px)`;
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents & HudElems>();

    const isCaptainSide = getDisplayIndex() === 1;
    sub.on(isCaptainSide ? 'ls1Button' : 'ls2Button').handle((value) => {
      this.lsBtnState = value;
    });
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
      .on('IlsLoc')
      .whenChanged()
      .handle((value) => {
        this.locVis = value;
        this.LSLocRef.instance.style.display = `${this.locVis}`;
      });
    sub
      .on('decMode')
      .whenChanged()
      .handle((value) => {
        this.declutterMode = value;
        this.setLocGroupPos();
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
    sub.on(getDisplayIndex() === 1 ? 'ls1Button' : 'ls2Button').handle((value) => {
      this.LsState = value;
      this.setLocGroupPos();
    });
    sub.on('pitchAr').handle((p) => {
      this.pitch = p.value;
    });
  }

  render(): VNode {
    return (
      <g ref={this.LSLocRef} id="LocalizerSymbolsGroup">
        <path class="NormalStroke Green" d="m164.412 391.53a3.022 3.024 0 1 0 -6.044 0 3.022 3.024 0 1 0 6.044 0z" />
        <path class="NormalStroke Green" d="m119.079 391.53a3.022 3.024 0 1 0 -6.044 0 3.022 3.024 0 1 0 6.044 0z" />
        <path class="NormalStroke Green" d="m255.072 391.53a3.022 3.024 0 1 0 -6.044 0 3.022 3.024 0 1 0 6.044 0z" />
        <path class="NormalStroke Green" d="m300.39 391.53a3.022 3.024 0 1 0 -6.044 0 3.022 3.024 0 1 0 6.044 0z" />
        <g class="HiddenElement" ref={this.diamondGroup}>
          <path
            id="LocDiamondRight"
            ref={this.rightDiamond}
            class="NormalStroke Green HiddenElement"
            d="m297.381 399.09 11.333 -7.559 -11.333 -7.559"
          />
          <path
            id="LocDiamondLeft"
            ref={this.leftDiamond}
            class="NormalStroke Green HiddenElement"
            d="m116.058 399.09 -11.333 -7.559 11.333 -7.559"
          />
          <path
            id="LocDiamond"
            ref={this.locDiamond}
            class="NormalStroke Green HiddenElement"
            d="m195.387 391.53 11.333 7.559 11.333 -7.559 -11.333 -7.559z"
          />
        </g>
        <path id="LocalizerNeutralLine" class="Green Fill" d="m 204 406.5v -30 h 5 v 30" />
      </g>
    );
  }
}
interface LSPath {
  roll: Arinc429WordData;
  pitch: Arinc429WordData;
  fpa: Arinc429WordData;
  da: Arinc429WordData;
}
class GlideSlopeIndicator extends DisplayComponent<{ bus: EventBus; instrument: BaseInstrument }> {
  private data: LSPath = {
    roll: new Arinc429Word(0),
    pitch: new Arinc429Word(0),
    fpa: new Arinc429Word(0),
    da: new Arinc429Word(0),
  };

  private LSGsRef = new NodeReference<SVGGElement>();

  private needsUpdate = false;

  private crosswindMode = false;

  private gsReferenceLine = FSComponent.createRef<SVGPathElement>();

  private deviationGroup = FSComponent.createRef<SVGGElement>();

  private altitude = Arinc429Word.empty();

  private lsButtonPressedVisibility = false;

  private lagFilter = new LagFilter(1.5);

  private upperDiamond = FSComponent.createRef<SVGPathElement>();

  private lowerDiamond = FSComponent.createRef<SVGPathElement>();

  private glideSlopeDiamond = FSComponent.createRef<SVGPathElement>();

  private diamondGroup = FSComponent.createRef<SVGGElement>();

  private hasGlideSlope = false;
  private GsVis = '';

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
      this.glideSlopeDiamond.instance.style.transform = `translate3d(0px, ${(dots * 90.6) / 2}px, 0px)`;
    }
  }
  private handleGsReferenceLine() {
    if (this.lsButtonPressedVisibility || this.altitude.isNormalOperation()) {
      this.gsReferenceLine.instance.style.display = 'inline';
    } else if (!this.lsButtonPressedVisibility) {
      this.gsReferenceLine.instance.style.display = 'none';
    }
  }
  private MoveGlideSlopeGroup() {
    if (this.crosswindMode == false) {
      this.LSGsRef.instance.style.transform = `translate3d(665px, ${FIVE_DEG + 13 + calculateHorizonOffsetFromPitch(this.data.pitch.value)}px, 0px)`;
    } else {
      this.LSGsRef.instance.style.transform = `translate3d(665px, 84px, 0px)`;
    }
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HEvent & Arinc429Values & ClockEvents & HudElems>();

    sub
      .on('IlsGS')
      .whenChanged()
      .handle((value) => {
        this.GsVis = value;
        this.LSGsRef.instance.style.display = `${this.GsVis}`;
      });
    sub
      .on('cWndMode')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value;
      });
    sub
      .on('fpa')
      .whenChanged()
      .handle((fpa) => {
        this.data.fpa = fpa;
        this.needsUpdate = true;
      });
    sub
      .on('da')
      .whenChanged()
      .handle((da) => {
        this.data.da = da;
        this.needsUpdate = true;
      });
    sub
      .on('rollAr')
      .whenChanged()
      .handle((r) => {
        this.data.roll = r;
        this.needsUpdate = true;
      });
    sub
      .on('pitchAr')
      .whenChanged()
      .handle((p) => {
        this.data.pitch = p;
        this.needsUpdate = true;
      });
    sub.on('realTime').handle((_t) => {
      if (this.needsUpdate) {
        this.needsUpdate = false;
        const daAndFpaValid = this.data.fpa.isNormalOperation() && this.data.da.isNormalOperation();
        if (daAndFpaValid) {
          // this.threeDegRef.instance.classList.remove('HiddenElement');
          this.MoveGlideSlopeGroup();
        } else {
          // this.threeDegRef.instance.classList.add('HiddenElement');
        }
      }
    });
    sub
      .on(getDisplayIndex() === 1 ? 'ls1Button' : 'ls2Button')
      .whenChanged()
      .handle((lsButton) => {
        this.lsButtonPressedVisibility = lsButton;
        this.handleGsReferenceLine();
      });

    sub.on('altitudeAr').handle((altitude) => {
      this.altitude = altitude;
      this.handleGsReferenceLine();
    });

    sub
      .on('hasGlideslope')
      .whenChanged()
      .handle((hasGlideSlope) => {
        this.hasGlideSlope = hasGlideSlope;
        if (hasGlideSlope) {
          this.diamondGroup.instance.classList.remove('HiddenElement');
        } else {
          this.diamondGroup.instance.classList.add('HiddenElement');
          this.lagFilter.reset();
        }
      });

    sub.on('glideSlopeError').handle((gs) => {
      if (this.hasGlideSlope) {
        this.handleGlideSlopeError(gs);
      }
    });
  }

  render(): VNode {
    return (
      <g id="GlideSlopeSymbolsGroup" ref={this.LSGsRef}>
        <path id="GsGroupMask" d="m 314 149 h 30 v 184 h-30 z" class="BlackkFill" />
        <path class="NormalStroke Green" d="m332.13 151.755a3.022 3.024 0 1 0 -6.044 0 3.022 3.024 0 1 0 6.044 0z" />
        <path class="NormalStroke Green" d="m332.13 197.112a3.022 3.024 0 1 0 -6.044 0 3.022 3.024 0 1 0 6.044 0z" />
        <path class="NormalStroke Green" d="m332.13 287.826a3.022 3.024 0 1 0 -6.044 0 3.022 3.024 0 1 0 6.044 0z" />
        <path class="NormalStroke Green" d="m332.13 333.18a3.022 3.024 0 1 0 -6.044 0 3.022 3.024 0 1 0 6.044 0z" />
        <g class="HideGSDiamond" ref={this.diamondGroup}>
          <path
            id="GlideSlopeDiamondLower"
            ref={this.upperDiamond}
            class="NormalStroke Green HiddenElement"
            d="m321.57 333.18 7.555 11.339 7.555 -11.339"
          />
          <path
            id="GlideSlopeDiamondUpper"
            ref={this.lowerDiamond}
            class="NormalStroke Green HiddenElement"
            d="m321.57 151.755 7.555 -11.339 7.555 11.339"
          />
          <path
            id="GlideSlopeDiamond"
            ref={this.glideSlopeDiamond}
            class="NormalStroke Green HiddenElement"
            d="m329.1 231.129 -7.555 11.339 7.555 11.339 7.555 -11.339z"
          />
        </g>
        <path ref={this.gsReferenceLine} class="Green Fill" d="m 314 243 h 30 v 5 h -30 z" />
      </g>
    );
  }
}

class VDevIndicator extends DisplayComponent<{ bus: EventBus }> {
  private VDevSymbolLower = FSComponent.createRef<SVGPathElement>();

  private VDevSymbolUpper = FSComponent.createRef<SVGPathElement>();

  private VDevSymbol = FSComponent.createRef<SVGPathElement>();
  private VdevRef = FSComponent.createRef<SVGGElement>();
  private pitch = 0;
  private needsUpdate = false;
  private crosswindMode = false;
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const sub = this.props.bus.getSubscriber<Arinc429Values & HudElems & ClockEvents>();
    sub
      .on('pitchAr')
      .whenChanged()
      .handle((p) => {
        this.pitch = p.value;
        this.needsUpdate = true;
      });
    sub
      .on('cWndMode')
      .whenChanged()
      .handle((p) => {
        this.crosswindMode = p;
        this.needsUpdate = true;
      });

    sub.on('realTime').handle((_t) => {
      if (this.needsUpdate) {
        this.needsUpdate = false;
        this.MoveGlideSlopeGroup();
      }
    });

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
  }

  private MoveGlideSlopeGroup() {
    if (this.crosswindMode == false) {
      this.VdevRef.instance.style.transform = `translate3d(665px, ${FIVE_DEG + 13 + calculateHorizonOffsetFromPitch(this.pitch)}px, 0px)`;
    } else {
      this.VdevRef.instance.style.transform = `translate3d(665px, 84px, 0px)`;
    }
    //DistanceSpacing
  }

  render(): VNode {
    return (
      <g id="VertDevSymbolsGroup" ref={this.VdevRef} style="display: none">
        <text class="FontSmall AlignRight Green" x="285.06600000000003" y="129.378">
          V/DEV
        </text>
        <path id="vDevGroupMask" d="m 314 149 h 30 v 184 h-30 z" class="BlackkFill" />
        <path class="NormalStroke Green" d="m326.1 197.112h6.044" />
        <path class="NormalStroke Green" d="m326.1 151.755h6.044" />
        <path class="NormalStroke Green" d="m326.1 333.18h6.044" />
        <path class="NormalStroke Green" d="m326.1 287.826h6.044" />
        <path
          id="VDevSymbolLower"
          ref={this.VDevSymbolLower}
          class="NormalStroke Green"
          d="m321.57 333.18v6.048h15.11v-6.048"
        />
        <path
          id="VDevSymbolUpper"
          ref={this.VDevSymbolUpper}
          class="NormalStroke Green"
          d="m321.57 151.755v-6.048h15.11v6.048"
        />
        <path
          id="VDevSymbol"
          ref={this.VDevSymbol}
          class="NormalStroke Green"
          d="m336.66 236.421h-15.11v12.095h15.11v-6.048z"
        />
        <path class="Green Fill" d="m 314 243 h 30 v 5 h -30 z" />
      </g>
    );
  }
}

class LDevIndicator extends DisplayComponent<{ bus: EventBus }> {
  private LDevSymbolLeft = FSComponent.createRef<SVGPathElement>();

  private LDevSymbolRight = FSComponent.createRef<SVGPathElement>();

  private LDevSymbol = FSComponent.createRef<SVGPathElement>();

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
      <g id="LatDeviationSymbolsGroup" transform="translate(433.5 400)">
        <text class="FontSmall AlignRight Green" x="92.664" y="367.917">
          L/DEV
        </text>
        <path class="NormalStroke Green" d="m116.058 388.53v6.047" />
        <path class="NormalStroke Green" d="m161.388 388.53v6.047" />
        <path class="NormalStroke Green" d="m252.051 388.53v6.047" />
        <path class="NormalStroke Green" d="m297.381 388.53v6.047" />
        <path
          id="LDevSymbolLeft"
          ref={this.LDevSymbolLeft}
          class="NormalStroke Green"
          d="m116.058 383.97h-6.044v15.119h6.044"
        />
        <path
          id="LDevSymbolRight"
          ref={this.LDevSymbolRight}
          class="NormalStroke Green"
          d="m297.381 383.97h6.044v15.119h-6.044"
        />
        <path
          id="LDevSymbol"
          ref={this.LDevSymbol}
          class="NormalStroke Green"
          d="m200.676 383.97v15.119h12.088v-15.119h-6.044z"
        />
        <path id="LDevNeutralLine" class="Green Fill" d="m 204 406.5v -30 h 5 v 30" />
      </g>
    );
  }
}

class MarkerBeaconIndicator extends DisplayComponent<{ bus: EventBus }> {
  private classNames = Subject.create('HiddenElement');

  private markerText = Subject.create('');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars>();

    const baseClass = 'FontMedium  StartAlign';

    sub
      .on('markerBeacon')
      .whenChanged()
      .handle((markerState) => {
        if (markerState === 0) {
          this.classNames.set(`${baseClass} HiddenElement`);
        } else if (markerState === 1) {
          this.classNames.set(`${baseClass} Green OuterMarkerBlink`);
          this.markerText.set('OM');
        } else if (markerState === 2) {
          this.classNames.set(`${baseClass} Green MiddleMarkerBlink`);
          this.markerText.set('MM');
        } else {
          this.classNames.set(`${baseClass} Green InnerMarkerBlink`);
          this.markerText.set('IM');
        }
      });
  }

  render(): VNode {
    return (
      <text id="ILSMarkerText" class={this.classNames} x="760" y="800">
        {this.markerText}
      </text>
    );
  }
}

class LsTitle extends DisplayComponent<{ bus: EventBus }> {
  private readonly lsTitle = FSComponent.createRef<SVGTextElement>();

  private readonly hasLoc = ConsumerSubject.create(null, false);

  private readonly lsButton = ConsumerSubject.create(null, false);

  private readonly ilsTitleShown = MappedSubject.create(
    ([hasLoc, lsButton]) => hasLoc && lsButton,
    this.hasLoc,
    this.lsButton,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars>();

    this.hasLoc.setConsumer(sub.on('hasLoc').whenChanged());
    this.lsButton.setConsumer(sub.on(getDisplayIndex() === 2 ? 'ls2Button' : 'ls1Button').whenChanged());

    // normally the ident and freq should be always displayed when an ILS freq is set, but currently it only show when we have a signal
    this.ilsTitleShown.sub((it) => {
      if (it) {
        this.lsTitle.instance.style.display = 'inline';
      } else {
        this.lsTitle.instance.style.display = 'none';
      }
    });
  }

  render(): VNode {
    return (
      <text class="FontSmallest Green StartAlign" ref={this.lsTitle} x="130" y="768">
        ILS
      </text>
    );
  }
}

class LsReminderIndicator extends DisplayComponent<{ bus: EventBus }> {
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();

  private readonly lsReminder = FSComponent.createRef<SVGTextElement>();

  // TODO replace with proper FG signals once implemented
  private readonly locPushed = ConsumerSubject.create(this.sub.on('fcuLocModeActive'), false);

  private readonly approachModePushed = ConsumerSubject.create(this.sub.on('fcuApproachModeActive'), false);

  private readonly lsButton = ConsumerSubject.create(null, false);

  private readonly lsReminderVisible = MappedSubject.create(
    ([locPushed, approachModePushed, lsPushed]) => {
      return (locPushed || approachModePushed) && !lsPushed; // TODO Check if LOC or G/S scales are invalid (MMR words)
    },
    this.locPushed,
    this.approachModePushed,
    this.lsButton,
  );

  private readonly decMode = ConsumerSubject.create(this.sub.on('decMode'), 0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.lsButton.setConsumer(this.sub.on(getDisplayIndex() === 2 ? 'ls2Button' : 'ls1Button'));
    this.lsReminderVisible.sub((v) => {
      if (v) {
        this.lsReminder.instance.style.display = 'inline';
      } else {
        this.lsReminder.instance.style.display = 'none';
      }
    }, true);
  }

  render(): VNode {
    return (
      <text
        visibility={this.decMode.map((v) => (v == 2 ? 'hidden' : 'visible'))}
        class="FontLargest Green Blink9Seconds"
        x="905"
        y="800"
        ref={this.lsReminder}
      >
        LS
      </text>
    );
  }
}
