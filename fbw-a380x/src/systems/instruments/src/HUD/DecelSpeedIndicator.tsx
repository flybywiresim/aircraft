import {
  ClockEvents,
  DisplayComponent,
  EventBus,
  FSComponent,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { Arinc429Word, ArincEventBus } from '@flybywiresim/fbw-sdk';
import { LagFilter, RateLimiter } from './HUDUtils';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { Arinc429Values } from './shared/ArincValueProvider';

const ValueSpacing = 10;
const DistanceSpacing = 25;
const neutralPos = 405;

export class DecelIndicator extends DisplayComponent<{
  bus: ArincEventBus;
  instrument: BaseInstrument;
}> {
  private speedSub = Subject.create<number>(0);
  private airSpeed = new Arinc429Word(0);
  private sDecelVis = Subject.create<String>('none');
  private decelRef = FSComponent.createRef<SVGPathElement>();
  private decelGroupRef = FSComponent.createRef<SVGGElement>();
  private yOffset = Subject.create(0);
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

    // | DISARM | 0      |
    // | BTV    | 1      |
    // | LOW    | 2      |
    // | L2     | 3      |
    // | L3     | 4      |
    // | HIGH   | 5      |
    // | RTO    | 6      |

    sub
      .on('autoBrakeMode')
      .whenChanged()
      .handle((am) => {
        switch (am) {
          case 0:
            //DISARM
            this.yOffset.set(0);

            break;
          case 1:
            //BTV
            this.yOffset.set(0);
            this.decelRef.instance.setAttribute('d', ``);
            break;
          case 2:
            //LO
            this.yOffset.set(0);
            this.decelRef.instance.setAttribute('d', `m95 ${508.5 + this.yOffset.get()} h 40 v -27 h -40z`);

            break;
          case 3:
            // 2
            this.yOffset.set(27);
            this.decelRef.instance.setAttribute('d', `m95 ${508.5 + this.yOffset.get()} h 25 v -27 h -25z`);
            break;
          case 4:
            // 3
            this.yOffset.set(54);
            this.decelRef.instance.setAttribute('d', `m95 ${508.5 + this.yOffset.get()} h 25 v -27 h -25z`);
            break;
          case 5:
            // HI
            this.yOffset.set(80);
            this.decelRef.instance.setAttribute('d', `m95 ${508.5 + this.yOffset.get()}  h 33 v -27 h -33z`);
            break;
          case 6:
            // RTO
            this.yOffset.set(160);
            this.decelRef.instance.setAttribute('d', ``);
            break;

          default:
            break;
        }
      });

    sub
      .on('autoBrakeDecel')
      .whenChanged()
      .handle((ad) => {
        ad ? this.sDecelVis.set('block') : this.sDecelVis.set('none');
        if (ad) {
          this.sDecelVis.set('visible');
          setTimeout(() => {
            this.decelRef.instance.style.visibility = 'hidden'; ////hidden
          }, 3000);
        }
      });
    sub
      .on('speedAr')
      .withArinc429Precision(3)
      .handle((airSpeed) => {
        this.speedSub.set(airSpeed.value);
      });
  }

  render(): VNode {
    return (
      <g id="decelSpeedIndicator" ref={this.decelGroupRef} transform="translate(150 137)" display={this.sDecelVis}>
        <DecelSpeedTrendArrow
          airspeed={this.speedSub}
          instrument={this.props.instrument}
          bus={this.props.bus}
          distanceSpacing={DistanceSpacing}
          valueSpacing={ValueSpacing}
        />
        <text class="ScaledStroke Green FontMediumSmaller" transform="translate(100 505)">
          LO
        </text>
        <text class="ScaledStroke Green FontMediumSmaller" transform="translate(100 532)">
          2
        </text>
        <text class="ScaledStroke Green FontMediumSmaller" transform="translate(100 559)">
          3
        </text>
        <text class="ScaledStroke Green FontMediumSmaller" transform="translate(100 585)">
          HI
        </text>
        <g id="decelModeChanged">
          <path ref={this.decelRef} class="NormalStroke Green" d="" />
        </g>
      </g>
    );
  }
}

class DecelSpeedTrendArrow extends DisplayComponent<{
  airspeed: Subscribable<number>;
  instrument: BaseInstrument;
  bus: EventBus;
  valueSpacing: number;
  distanceSpacing: number;
}> {
  private refElement = FSComponent.createRef<SVGGElement>();

  private arrowBaseRef = FSComponent.createRef<SVGPathElement>();

  private arrowHeadRef = FSComponent.createRef<SVGPathElement>();

  private arrowText = FSComponent.createRef<SVGTextElement>();

  private offset = Subject.create<string>('');

  private pathString = Subject.create<string>('');

  private lagFilter = new LagFilter(1.6);

  private airspeedAccRateLimiter = new RateLimiter(1.2, -1.2);

  private previousAirspeed = 0;

  private arrowTextY = Subject.create<string>('');

  private multiplier = 0;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<ClockEvents & HUDSimvars>();

    // | DISARM | 0      |
    // | BTV    | 1      |
    // | LOW    | 2      |
    // | L2     | 3      |
    // | L3     | 4      |
    // | HIGH   | 5      |
    // | RTO    | 6      |

    sub
      .on('autoBrakeMode')
      .whenChanged()
      .handle((am) => {
        am === 6 ? (this.multiplier = 1.25) : (this.multiplier = 1);

        if (am === 1 || am === 6) {
          am === 1 ? (this.arrowText.instance.textContent = 'BTV') : (this.arrowText.instance.textContent = 'RTO');
          this.arrowText.instance.style.display = 'block';
        } else {
          this.arrowText.instance.style.display = 'none';
          this.arrowText.instance.textContent = '';
        }
      });

    sub.on('realTime').handle((_t) => {
      const { deltaTime } = this.props.instrument;
      const clamped = Math.max(this.props.airspeed.get(), 30);
      const airspeedAcc = ((clamped - this.previousAirspeed) / deltaTime) * 1000;
      this.previousAirspeed = clamped;

      let filteredAirspeedAcc = this.lagFilter.step(airspeedAcc, deltaTime / 1000);
      filteredAirspeedAcc = this.airspeedAccRateLimiter.step(filteredAirspeedAcc, deltaTime / 1000);

      const targetSpeed = filteredAirspeedAcc * 10;

      if (Math.abs(targetSpeed) < 1) {
        this.refElement.instance.style.visibility = 'hidden';
      } else {
        this.refElement.instance.style.visibility = 'visible';
        let pathString;
        const sign = Math.sign(filteredAirspeedAcc);

        const offset = (-targetSpeed * DistanceSpacing * this.multiplier) / ValueSpacing;
        if (sign > 0) {
          pathString = `m 77.275 ${neutralPos + offset} l -6.25 15 M 77.275 ${neutralPos + offset} l 6.25 15`;
        } else {
          pathString = `m 77.275 ${neutralPos + offset} l 6.25 -15 M 77.275 ${neutralPos + offset} l -6.25 -15`;
        }

        this.offset.set(`m 77.275 ${neutralPos} v${offset.toFixed(10)}`);

        this.pathString.set(pathString);
        offset > 0
          ? this.arrowTextY.set((neutralPos + offset + 20).toFixed(3).toString())
          : this.arrowTextY.set((neutralPos + offset).toFixed(3).toString());
      }
    });
  }

  render(): VNode | null {
    return (
      <g id="DecelSpeedTrendArrow" ref={this.refElement}>
        <path id="SpeedTrendArrowBase" ref={this.arrowBaseRef} class="NormalStroke Green" d={this.offset} />
        <path id="SpeedTrendArrowHead" ref={this.arrowHeadRef} class="NormalStroke Green" d={this.pathString} />
        <text
          id="arrowText"
          ref={this.arrowText}
          class="NormalStroke FontMediumSmaller EndAlign Green"
          x="80"
          y={this.arrowTextY}
        >
          BTV
        </text>

        <path id="SpeedTrendArrowBase" class="NormalStroke Green" d="m67.275 404.115h20" />
      </g>
    );
  }
}
