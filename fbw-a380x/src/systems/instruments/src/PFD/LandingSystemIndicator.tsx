import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  HEvent,
  MappedSubject,
  Subject,
  VNode,
} from '@microsoft/msfs-sdk';
import { getDisplayIndex } from 'instruments/src/PFD/PFD';
import { Arinc429Word } from '@flybywiresim/fbw-sdk';
import { Arinc429Values } from './shared/ArincValueProvider';
import { PFDSimvars } from './shared/PFDSimvarPublisher';
import { LagFilter } from './PFDUtils';

export class LandingSystem extends DisplayComponent<{ bus: EventBus; instrument: BaseInstrument }> {
  private lsButtonPressedVisibility = false;

  private xtkValid = Subject.create(false);

  private ldevRequest = false;

  private lsGroupRef = FSComponent.createRef<SVGGElement>();

  private gsReferenceLine = FSComponent.createRef<SVGPathElement>();

  private deviationGroup = FSComponent.createRef<SVGGElement>();

  private ldevRef = FSComponent.createRef<SVGGElement>();

  private vdevRef = FSComponent.createRef<SVGGElement>();

  private altitude = Arinc429Word.empty();

  private handleGsReferenceLine() {
    if (this.lsButtonPressedVisibility || this.altitude.isNormalOperation()) {
      this.gsReferenceLine.instance.style.display = 'inline';
    } else if (!this.lsButtonPressedVisibility) {
      this.gsReferenceLine.instance.style.display = 'none';
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars & HEvent & Arinc429Values>();

    sub
      .on(getDisplayIndex() === 1 ? 'ls1Button' : 'ls2Button')
      .whenChanged()
      .handle((lsButton) => {
        this.lsButtonPressedVisibility = lsButton;
        this.lsGroupRef.instance.style.display = this.lsButtonPressedVisibility ? 'inline' : 'none';
        this.deviationGroup.instance.style.display = this.lsButtonPressedVisibility ? 'none' : 'inline';
        this.handleGsReferenceLine();
      });

    sub.on('altitudeAr').handle((altitude) => {
      this.altitude = altitude;
      this.handleGsReferenceLine();
    });

    sub
      .on(getDisplayIndex() === 1 ? 'ldevRequestLeft' : 'ldevRequestRight')
      .whenChanged()
      .handle((ldevRequest) => {
        this.ldevRequest = ldevRequest;
        this.updateLdevVisibility();
      });

    sub
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
        <g id="LSGroup" ref={this.lsGroupRef} style="display: none">
          <LandingSystemInfo bus={this.props.bus} />

          <g id="LSGroup">
            <LocalizerIndicator bus={this.props.bus} instrument={this.props.instrument} />
            <GlideSlopeIndicator bus={this.props.bus} instrument={this.props.instrument} />
            <MarkerBeaconIndicator bus={this.props.bus} />
            <LsReminder bus={this.props.bus} />
          </g>

          <path ref={this.gsReferenceLine} class="Yellow Fill" d="m115.52 80.067v1.5119h-8.9706v-1.5119z" />
        </g>
        <g id="DeviationGroup" ref={this.deviationGroup} style="display: none">
          <g id="LateralDeviationGroup" ref={this.ldevRef} style="display: none">
            <LDevIndicator bus={this.props.bus} />
          </g>
          <g id="VerticalDeviationGroup" ref={this.vdevRef} style="display: none">
            <VDevIndicator bus={this.props.bus} />
          </g>
        </g>
        <path ref={this.gsReferenceLine} class="Yellow Fill" d="m115.52 80.067v1.5119h-8.9706v-1.5119z" />
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

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

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
      this.destRef.instance.innerHTML = `<tspan id="ILSDistLeading" class="FontLarge StartAlign">${distLeading}</tspan><tspan id="ILSDistTrailing" class="FontSmallest StartAlign">${distTrailing}</tspan>`;
    } else {
      this.dmeVisibilitySub.set('display: none');
    }
  }

  render(): VNode {
    return (
      <g id="LSInfoGroup" ref={this.lsInfoGroup}>
        <text id="ILSIdent" class="Magenta FontLarge AlignLeft" x="1.184" y="143.11522">
          {this.identText}
        </text>
        <text id="ILSFreqLeading" class="Magenta FontLarge AlignLeft" x="1.3610243" y="149.11575">
          {this.freqTextLeading}
        </text>
        <text id="ILSFreqTrailing" class="Magenta FontLarge AlignLeft" x="12.964463" y="149.24084">
          {this.freqTextTrailing}
        </text>

        <g id="ILSDistGroup" style={this.dmeVisibilitySub}>
          <text ref={this.destRef} class="Magenta AlignLeft" x="1.3685881" y="155.26602" />
          <text class="Cyan FontSmallest AlignLeft" x="17.159119" y="155.22606">
            NM
          </text>
        </g>
      </g>
    );
  }
}

class LocalizerIndicator extends DisplayComponent<{ bus: EventBus; instrument: BaseInstrument }> {
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
      this.locDiamond.instance.style.transform = `translate3d(${(dots * 30.221) / 2}px, 0px, 0px)`;
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

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
  }

  render(): VNode {
    return (
      <g id="LocalizerSymbolsGroup">
        <path
          class="NormalStroke White"
          d="m54.804 130.51a1.0073 1.0079 0 1 0-2.0147 0 1.0073 1.0079 0 1 0 2.0147 0z"
        />
        <path
          class="NormalStroke White"
          d="m39.693 130.51a1.0074 1.0079 0 1 0-2.0147 0 1.0074 1.0079 0 1 0 2.0147 0z"
        />
        <path
          class="NormalStroke White"
          d="m85.024 130.51a1.0073 1.0079 0 1 0-2.0147 0 1.0073 1.0079 0 1 0 2.0147 0z"
        />
        <path
          class="NormalStroke White"
          d="m100.13 130.51a1.0074 1.0079 0 1 0-2.0147 0 1.0074 1.0079 0 1 0 2.0147 0z"
        />
        <g class="HiddenElement" ref={this.diamondGroup}>
          <path
            id="LocDiamondRight"
            ref={this.rightDiamond}
            class="NormalStroke Magenta HiddenElement"
            d="m99.127 133.03 3.7776-2.5198-3.7776-2.5198"
          />
          <path
            id="LocDiamondLeft"
            ref={this.leftDiamond}
            class="NormalStroke Magenta HiddenElement"
            d="m38.686 133.03-3.7776-2.5198 3.7776-2.5198"
          />
          <path
            id="LocDiamond"
            ref={this.locDiamond}
            class="NormalStroke Magenta HiddenElement"
            d="m65.129 130.51 3.7776 2.5198 3.7776-2.5198-3.7776-2.5198z"
          />
        </g>
        <path id="LocalizerNeutralLine" class="Yellow Fill" d="m68.098 134.5v-8.0635h1.5119v8.0635z" />
      </g>
    );
  }
}

class GlideSlopeIndicator extends DisplayComponent<{ bus: EventBus; instrument: BaseInstrument }> {
  private lagFilter = new LagFilter(1.5);

  private upperDiamond = FSComponent.createRef<SVGPathElement>();

  private lowerDiamond = FSComponent.createRef<SVGPathElement>();

  private glideSlopeDiamond = FSComponent.createRef<SVGPathElement>();

  private diamondGroup = FSComponent.createRef<SVGGElement>();

  private hasGlideSlope = false;

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
      this.glideSlopeDiamond.instance.style.transform = `translate3d(0px, ${(dots * 30.238) / 2}px, 0px)`;
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

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
      <g id="LocalizerSymbolsGroup">
        <path
          class="NormalStroke White"
          d="m110.71 50.585a1.0074 1.0079 0 1 0-2.0147 0 1.0074 1.0079 0 1 0 2.0147 0z"
        />
        <path
          class="NormalStroke White"
          d="m110.71 65.704a1.0074 1.0079 0 1 0-2.0147 0 1.0074 1.0079 0 1 0 2.0147 0z"
        />
        <path
          class="NormalStroke White"
          d="m110.71 95.942a1.0074 1.0079 0 1 0-2.0147 0 1.0074 1.0079 0 1 0 2.0147 0z"
        />
        <path
          class="NormalStroke White"
          d="m110.71 111.06a1.0074 1.0079 0 1 0-2.0147 0 1.0074 1.0079 0 1 0 2.0147 0z"
        />
        <g class="HideGSDiamond" ref={this.diamondGroup}>
          <path
            id="GlideSlopeDiamondLower"
            ref={this.upperDiamond}
            class="NormalStroke Magenta HiddenElement"
            d="m107.19 111.06 2.5184 3.7798 2.5184-3.7798"
          />
          <path
            id="GlideSlopeDiamondUpper"
            ref={this.lowerDiamond}
            class="NormalStroke Magenta HiddenElement"
            d="m107.19 50.585 2.5184-3.7798 2.5184 3.7798"
          />
          <path
            id="GlideSlopeDiamond"
            ref={this.glideSlopeDiamond}
            class="NormalStroke Magenta HiddenElement"
            d="m109.7 77.043-2.5184 3.7798 2.5184 3.7798 2.5184-3.7798z"
          />
        </g>
      </g>
    );
  }
}

class VDevIndicator extends DisplayComponent<{ bus: EventBus }> {
  private VDevSymbolLower = FSComponent.createRef<SVGPathElement>();

  private VDevSymbolUpper = FSComponent.createRef<SVGPathElement>();

  private VDevSymbol = FSComponent.createRef<SVGPathElement>();

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
  }

  render(): VNode {
    return (
      <g id="VertDevSymbolsGroup" style="display: none">
        <text class="FontSmall AlignRight Green" x="95.022" y="43.126">
          V/DEV
        </text>
        <path class="NormalStroke White" d="m108.7 65.704h2.0147" />
        <path class="NormalStroke White" d="m108.7 50.585h2.0147" />
        <path class="NormalStroke White" d="m108.7 111.06h2.0147" />
        <path class="NormalStroke White" d="m108.7 95.942h2.0147" />
        <path
          id="VDevSymbolLower"
          ref={this.VDevSymbolLower}
          class="NormalStroke Green"
          d="m107.19 111.06v2.0159h5.0368v-2.0159"
        />
        <path
          id="VDevSymbolUpper"
          ref={this.VDevSymbolUpper}
          class="NormalStroke Green"
          d="m107.19 50.585v-2.0159h5.0368v2.0159"
        />
        <path
          id="VDevSymbol"
          ref={this.VDevSymbol}
          class="NormalStroke Green"
          d="m112.22 78.807h-5.0368v4.0318h5.0368v-2.0159z"
        />
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

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

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
      <g id="LatDeviationSymbolsGroup">
        <text class="FontSmall AlignRight Green" x="30.888" y="122.639">
          L/DEV
        </text>
        <path class="NormalStroke White" d="m38.686 129.51v2.0158" />
        <path class="NormalStroke White" d="m53.796 129.51v2.0158" />
        <path class="NormalStroke White" d="m84.017 129.51v2.0158" />
        <path class="NormalStroke White" d="m99.127 129.51v2.0158" />
        <path
          id="LDevSymbolLeft"
          ref={this.LDevSymbolLeft}
          class="NormalStroke Green"
          d="m38.686 127.99h-2.0147v5.0397h2.0147"
        />
        <path
          id="LDevSymbolRight"
          ref={this.LDevSymbolRight}
          class="NormalStroke Green"
          d="m99.127 127.99h2.0147v5.0397h-2.0147"
        />
        <path
          id="LDevSymbol"
          ref={this.LDevSymbol}
          class="NormalStroke Green"
          d="m66.892 127.99v5.0397h4.0294v-5.0397h-2.0147z"
        />
        <path id="LDevNeutralLine" class="Yellow Fill" d="m68.098 134.5v-8.0635h1.5119v8.0635z" />
      </g>
    );
  }
}

class MarkerBeaconIndicator extends DisplayComponent<{ bus: EventBus }> {
  private classNames = Subject.create('HiddenElement');

  private markerText = Subject.create('');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

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
      <text id="ILSMarkerText" class={this.classNames} x="107" y="133">
        {this.markerText}
      </text>
    );
  }
}

class LsReminder extends DisplayComponent<{ bus: EventBus }> {
  private readonly lsReminderRef = FSComponent.createRef<SVGTextElement>();

  private readonly hasLoc = ConsumerSubject.create(null, false);

  private readonly lsButton = ConsumerSubject.create(null, false);

  private readonly ilsReminderShown = MappedSubject.create(
    ([hasLoc, lsButton]) => hasLoc && lsButton,
    this.hasLoc,
    this.lsButton,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    this.hasLoc.setConsumer(sub.on('hasLoc').whenChanged());
    this.lsButton.setConsumer(sub.on(getDisplayIndex() === 2 ? 'ls2Button' : 'ls1Button').whenChanged());

    // normally the ident and freq should be always displayed when an ILS freq is set, but currently it only show when we have a signal
    this.ilsReminderShown.sub((it) => {
      if (it) {
        this.lsReminderRef.instance.style.display = 'inline';
      } else {
        this.lsReminderRef.instance.style.display = 'none';
      }
    });
  }

  render(): VNode {
    return (
      <text class="FontLargest Magenta MiddleAlign Blink9Seconds" ref={this.lsReminderRef} x="104" y="126">
        ILS
      </text>
    );
  }
}
