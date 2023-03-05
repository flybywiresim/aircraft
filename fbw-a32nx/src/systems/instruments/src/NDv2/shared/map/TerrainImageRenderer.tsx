import { ClockEvents, DisplayComponent, EventBus, FSComponent, Subject, Subscribable, VNode } from 'msfssdk';
import { MapVisualizationData } from './TerrainMap';

const MAP_TRANSITION_FRAMERATE = 24;

export class TerrainImageRenderer {
    private static framePointer = 0;

    private static lastVisualisationVersion = 0;

    private static lastFrameTimestamp = 0;

    private static imageElement = new Image();

    static paint(context: CanvasRenderingContext2D, visualisation: MapVisualizationData) {
        if (this.lastVisualisationVersion !== visualisation.Version.get()) {
            this.framePointer = 0;
            this.lastVisualisationVersion = visualisation.Version.get();
        }

        if (this.imageElement.complete) {
            context.drawImage(this.imageElement, 0, 0, this.imageElement.naturalWidth, this.imageElement.naturalHeight);
        }

        // Switch frames if necessary

        if (this.framePointer >= visualisation.MapTransitionData.length) {
            return;
        }

        const frameTime = (1000 / MAP_TRANSITION_FRAMERATE);

        const now = Date.now();
        if (now - this.lastFrameTimestamp >= frameTime) {
            this.framePointer++;

            if (this.framePointer >= visualisation.MapTransitionData.length) {
                return;
            }

            const currentFrame = visualisation.MapTransitionData[this.framePointer];
            this.imageElement.src = `data:image/png;base64,${currentFrame}`;

            this.lastFrameTimestamp = now;
        }
    }
}

export interface TerrainImageRendererComponentProps {
    bus: EventBus,
    visualisation: Subscribable<MapVisualizationData>,
    cx: number,
    cy: number,
    width: number,
    height: number,
    onTransitionDone: () => void,
}

export class TerrainImageRendererComponent extends DisplayComponent<TerrainImageRendererComponentProps> {
    private readonly imageRefs = [
        FSComponent.createRef<SVGImageElement>(),
        FSComponent.createRef<SVGImageElement>(),
        FSComponent.createRef<SVGImageElement>(),
    ];

    private readonly infoContainerVisible = Subject.create(false);

    private readonly upperBorderFill = Subject.create('transparent');

    private readonly upperBorderText = Subject.create('');

    private readonly lowerBorderFill = Subject.create('transparent');

    private readonly lowerBorderText = Subject.create('');

    private framePointer = 0;

    private imagePointer = 0;

    private lastVisualisationVersion = 0;

    private lastFrameTimestamp = 0;

    private latestVisualisation = Subject.create<MapVisualizationData | null>(null);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const subs = this.props.bus.getSubscriber<ClockEvents>();

        const frameTime = 1000 / MAP_TRANSITION_FRAMERATE;

        subs.on('realTime').whenChangedBy(frameTime).handle((now) => {
            const visualisation = this.props.visualisation.get();

            if (this.lastVisualisationVersion !== visualisation.Version.get()) {
                this.framePointer = 0;
                this.lastVisualisationVersion = visualisation.Version.get();
            }

            if (this.framePointer >= visualisation.MapTransitionData.length) {
                return;
            }

            if (now - this.lastFrameTimestamp >= frameTime) {
                this.framePointer++;

                if (this.framePointer >= visualisation.MapTransitionData.length) {
                    this.props.onTransitionDone();
                    return;
                }

                this.imagePointer++;

                if (this.imagePointer >= this.imageRefs.length) {
                    this.imagePointer = 0;
                }

                const currentFrame = visualisation.MapTransitionData[this.framePointer];
                this.imageRefs[this.imagePointer].instance.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `data:image/png;base64,${currentFrame}`);

                this.lastFrameTimestamp = now;
            }
        });

        this.props.visualisation.sub((visualisation) => {
            const currentVisualisation = this.latestVisualisation.get();

            if (currentVisualisation) {
                currentVisualisation.Version.unsub(this.handleNewVisualisationVersion.bind(this));
            }

            this.latestVisualisation.set(visualisation);

            visualisation.Version.sub(this.handleNewVisualisationVersion.bind(this), true);
        }, true);
    }

    private handleNewVisualisationVersion() {
        const visualisation = this.latestVisualisation.get();

        this.upperBorderFill.set(visualisation.MaximumElevation.color);
        this.lowerBorderFill.set(visualisation.MinimumElevation.color);

        let lowerBorder = '';
        if (Number.isFinite(visualisation.MinimumElevation.altitude) && visualisation.MinimumElevation.altitude >= 0) {
            lowerBorder = String(Math.floor(visualisation.MinimumElevation.altitude / 100)).padStart(3, '0');
        }

        let upperBorder = '';
        if (Number.isFinite(visualisation.MaximumElevation.altitude)) {
            if (visualisation.MaximumElevation.altitude !== 0) {
                upperBorder = String(Math.round(visualisation.MaximumElevation.altitude / 100 + 0.5)).padStart(3, '0');
            } else {
                upperBorder = '000';
            }
        }

        this.infoContainerVisible.set(upperBorder !== '');

        this.upperBorderText.set(upperBorder);
        this.lowerBorderText.set(lowerBorder);
    }

    render(): VNode | null {
        return (
            <svg class="nd-svg" viewBox="0 0 768 768">
                <g clip-path="url(#arc-mode-map-clip)">
                    <image
                        ref={this.imageRefs[0]}
                        width={this.props.width}
                        height={this.props.height}
                        x={this.props.cx - (this.props.width / 2)}
                        y={this.props.cy - (this.props.height)}
                    />
                    <image
                        ref={this.imageRefs[1]}
                        width={this.props.width}
                        height={this.props.height}
                        x={this.props.cx - (this.props.width / 2)}
                        y={this.props.cy - (this.props.height)}
                    />
                    <image
                        ref={this.imageRefs[2]}
                        width={this.props.width}
                        height={this.props.height}
                        x={this.props.cx - (this.props.width / 2)}
                        y={this.props.cy - (this.props.height)}
                    />
                </g>

                <g visibility={this.infoContainerVisible.map((it) => (it ? 'inherit' : 'hidden'))}>
                    <text x={688} y={612} font-size={23} fill="rgb(0,255,255)">
                        TERR
                    </text>

                    <text x={709} y={639} font-size={22} fill={this.upperBorderFill}>{this.upperBorderText}</text>

                    <rect x={700} y={619} width={54} height={24} stroke-width={3} stroke="rgb(255,255,0)" fill="transparent" />

                    <text x={709} y={663} font-size={23} fill={this.lowerBorderFill}>{this.lowerBorderText}</text>

                    <rect x={700} y={643} width={54} height={24} stroke-width={3} stroke="rgb(255,255,0)" fill="transparent" />
                </g>
            </svg>
        );
    }
}
