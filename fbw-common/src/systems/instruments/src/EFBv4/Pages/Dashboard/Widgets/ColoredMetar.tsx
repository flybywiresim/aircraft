import { DisplayComponent, FSComponent, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';
import { ColorCode, MetarParserType } from '@flybywiresim/fbw-sdk';

export interface ColoredMetarProps {
    metar: Subscribable<MetarParserType | null>;
}

export class ColoredMetar extends DisplayComponent<ColoredMetarProps> {
    private readonly contentRoot = FSComponent.createRef<HTMLDivElement>();

    private readonly subscriptions: Subscription[] = [];

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.subscriptions.push(
            this.props.metar.sub(() => this.renderMetar()),
        );
    }

    private renderMetar(): void {
        if (!this.contentRoot.getOrDefault()) {
            return;
        }

        this.contentRoot.instance.innerHTML = '';

        const metar = this.props.metar.get();

        if (!metar) {
            return;
        }

        const parts: HTMLSpanElement[] = [];

        for (let i = 0; i < metar.raw_parts.length; i++) {
            const part = metar.raw_parts[i];
            const colorCode = metar.color_codes[i];

            const span = document.createElement('span');

            span.classList.add('mr-3', 'text-2xl');

            switch (colorCode) {
            case ColorCode.Highlight: span.classList.add('text-theme-highlight'); break;
            case ColorCode.Caution: span.classList.add('text-yellow-500'); break;
            case ColorCode.Warning: span.classList.add('text-red-400'); break;
            case ColorCode.Info: span.classList.add('text-utility-grey'); break;
            case ColorCode.TrendMarker: span.classList.add('font-bold', 'text-gray-500'); break;
            default: break;
            }

            span.textContent = part;

            parts.push(span);
        }

        for (const spanElement of parts) {
            this.contentRoot.instance.appendChild(spanElement);
        }
    }

    destroy() {
        super.destroy();

        for (const sub of this.subscriptions) {
            sub.destroy();
        }
    }

    render(): VNode {
        return (
            <div ref={this.contentRoot} class="flex flex-wrap" />
        );
    }
}
