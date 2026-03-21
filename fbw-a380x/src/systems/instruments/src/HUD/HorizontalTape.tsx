import { EventBus, DisplayComponent, FSComponent, NodeReference, VNode, Subscribable } from '@microsoft/msfs-sdk';
import { Arinc429Values } from './shared/ArincValueProvider';
interface HorizontalTapeProps {
  displayRange: number;
  valueSpacing: number;
  distanceSpacing: number;
  type: 'horizon' | 'headingTape';
  bus: EventBus;
  yOffset?: Subscribable<number>;
}
export class HorizontalTape extends DisplayComponent<HorizontalTapeProps> {
  private refElement = FSComponent.createRef<SVGGElement>();

  private tapeOffset = 0;

  private tickNumberRefs: NodeReference<SVGTextElement>[] = [];

  private currentDrawnHeading = 0;

  private yOffset = 0;

  private buildHeadingTicks(): { ticks: SVGLineElement[]; labels: SVGTextElement[] } {
    const result = {
      ticks: [] as SVGLineElement[],
      labels: [] as SVGTextElement[],
    };

    const tickLength = 5;
    let textRef = FSComponent.createRef<SVGTextElement>();

    result.ticks.push(<path class="NormalStroke Green" d={`m640 512 v${tickLength}`} transform="translate(0 0)" />);

    result.labels.push(
      <text
        id="HeadingLabel"
        class="Green MiddleAlign FontTiny"
        ref={textRef}
        x="640"
        y="545"
        transform={`translate(${0} 0)`}
      >
        0
      </text>,
    );
    this.tickNumberRefs.push(textRef);

    for (let i = 0; i < 6; i++) {
      const headingOffset = (1 + i) * this.props.valueSpacing;
      const dX = (this.props.distanceSpacing / this.props.valueSpacing) * headingOffset;

      result.ticks.push(
        <path class="NormalStroke Green" d={`m640 512 v${tickLength}`} transform={`translate(${dX} 0)`} />,
      );
      result.ticks.unshift(
        <path class="NormalStroke Green" d={`m640 512 v${tickLength}`} transform={`translate(${-dX} 0)`} />,
      );

      if (headingOffset % 10 === 0) {
        textRef = FSComponent.createRef<SVGTextElement>();

        result.labels.unshift(
          <text
            id="HeadingLabel"
            class={`Green MiddleAlign FontTiny`}
            ref={textRef}
            x="640"
            y="545"
            transform={`translate(${-dX} 0)`}
          >
            {headingOffset}
          </text>,
        );
        this.tickNumberRefs.unshift(textRef);
        textRef = FSComponent.createRef<SVGTextElement>();
        result.labels.push(
          <text
            id="HeadingLabel"
            class={`Green MiddleAlign FontTiny`}
            ref={textRef}
            x="640"
            y="545"
            transform={`translate(${dX} 0)`}
          >
            {360 - headingOffset}
          </text>,
        );
        this.tickNumberRefs.push(textRef);
      }
    }

    return result;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const pf = this.props.bus.getSubscriber<Arinc429Values>();

    this.props.yOffset?.sub((yOffset) => {
      this.yOffset = yOffset;
      this.refElement.instance.style.transform = `translate3d(${this.tapeOffset}px, ${yOffset}px, 0px)`;
    });

    pf.on('headingAr').handle((newVal) => {
      const multiplier = 100;
      const currentValueAtPrecision = Math.round(newVal.value * multiplier) / multiplier;
      const tapeOffset = ((-currentValueAtPrecision % 10) * this.props.distanceSpacing) / this.props.valueSpacing;

      if (
        currentValueAtPrecision / 10 >= this.currentDrawnHeading + 1 ||
        currentValueAtPrecision / 10 <= this.currentDrawnHeading
      ) {
        this.currentDrawnHeading = Math.floor(currentValueAtPrecision / 10);

        const start = 330 + this.currentDrawnHeading * 10;

        this.tickNumberRefs.forEach((t, index) => {
          const scrollerValue = t.instance;
          if (scrollerValue !== null) {
            const hdg = (start + index * 10) % 360;
            if (hdg % 10 === 0) {
              const content = hdg !== 0 ? (hdg / 10).toFixed(0) : '0';
              if (scrollerValue.textContent !== content) {
                scrollerValue.textContent = content;
              }
            } else {
              scrollerValue.textContent = '';
            }
            // if (hdg % 30 === 0) {
            //   scrollerValue.classList.remove('FontSmallest');
            //   scrollerValue.classList.add('FontMedium');
            // } else {
            //   scrollerValue.classList.add('FontSmallest');
            //   scrollerValue.classList.remove('FontMedium');
            // }
          }
        });
      }
      this.tapeOffset = tapeOffset;

      this.refElement.instance.style.transform = `translate3d(${tapeOffset}px, ${this.yOffset}px, 0px)`;
    });
  }

  render(): VNode {
    const tapeContent = this.buildHeadingTicks();

    return (
      <g id="HeadingTick" ref={this.refElement}>
        {tapeContent.ticks}
        {this.props.type === 'headingTape' && tapeContent.labels}
      </g>
    );
  }
}
