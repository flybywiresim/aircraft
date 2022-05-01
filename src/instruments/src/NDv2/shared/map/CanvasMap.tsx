import { ClockEvents, DisplayComponent, EventBus, FSComponent, Subject, Subscribable, VNode } from 'msfssdk';
import { EfisVectorsGroup, NdSymbol, NdSymbolTypeFlags } from '@shared/NavigationDisplay';
import type { PathVector } from '@fmgc/guidance/lnav/PathVector';
import { distanceTo } from 'msfs-geo';
import { MathUtils } from '@shared/MathUtils';
import { FmsSymbolsData } from '../../FmsSymbolsPublisher';
import { MapParameters } from '../../../ND/utils/MapParameters';
import { NDSimvars } from '../../NDSimvarPublisher';
import { WaypointLayer } from './WaypointLayer';
import { ConstraintsLayer } from './ConstraintsLayer';

export interface CanvasMapProps {
    bus: EventBus,
    x: number,
    y: number,
    width: number,
    height: number,
    mapRotation: Subscribable<number>,
    mapRangeRadius: Subscribable<number>,
    mapVisible: Subscribable<boolean>,
}

export class CanvasMap extends DisplayComponent<CanvasMapProps> {
    private readonly canvasRef = FSComponent.createRef<HTMLCanvasElement>();

    private readonly touchContainerRef = FSComponent.createRef<HTMLDivElement>();

    private readonly activeVectors: PathVector[] = [];

    private readonly symbols: NdSymbol[] = [];

    private readonly mapParams = new MapParameters();

    private readonly latitude = Subject.create(0);

    private readonly longitude = Subject.create(0);

    public pointerX = 0;

    public pointerY = 0;

    private readonly waypointLayer = new WaypointLayer(this);

    private readonly constraintsLayer = new ConstraintsLayer();

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.setupCallbacks();
        this.setupEvents();
    }

    private setupCallbacks() {
        const sub = this.props.bus.getSubscriber<NDSimvars & FmsSymbolsData & ClockEvents>();

        sub.on('pposLat').whenChanged().handle((value) => {
            this.latitude.set(value);
            this.handleRecomputeMapParameters();
        });

        sub.on('pposLong').whenChanged().handle((value) => {
            this.longitude.set(value);
            this.handleRecomputeMapParameters();
        });

        this.props.mapRotation.sub(() => {
            this.handleRecomputeMapParameters();
        });

        this.props.mapRangeRadius.sub(() => {
            this.handleRecomputeMapParameters();
        });

        this.props.mapVisible.sub((visible) => {
            this.canvasRef.instance.style.visibility = visible ? 'visible' : 'hidden';
        }, true);

        sub.on('symbols').handle((data: NdSymbol[]) => {
            this.handleNewSymbols(data);
        });

        sub.on('vectorsActive').handle((data: PathVector[]) => {
            this.handleNewVectors(data);
        });

        sub.on('realTime').whenChangedBy(8).handle(() => {
            this.handleFrame();
        });
    }

    private setupEvents() {
        const touchContainer = this.touchContainerRef.instance;

        touchContainer.addEventListener('mousemove', (e) => {
            this.pointerX = e.offsetX;
            this.pointerY = e.offsetY;
        });
    }

    private handleRecomputeMapParameters() {
        this.mapParams.compute({ lat: this.latitude.get(), long: this.longitude.get() }, this.props.mapRangeRadius.get() * 2, this.props.width, this.props.mapRotation.get());
    }

    private handleNewSymbols(symbols: NdSymbol[]) {
        this.symbols.length = 0;
        this.symbols.push(...symbols);

        const waypoints = this.symbols.filter((it) => it.type & NdSymbolTypeFlags.Waypoint | NdSymbolTypeFlags.FlightPlan);

        this.waypointLayer.data = waypoints;

        const constraints = this.symbols.filter((it) => it.type & NdSymbolTypeFlags.ConstraintUnknown | NdSymbolTypeFlags.ConstraintMet | NdSymbolTypeFlags.ConstraintMissed);

        this.constraintsLayer.data = constraints;
    }

    private handleNewVectors(vectors: PathVector[]) {
        this.activeVectors.length = 0;
        this.activeVectors.push(...vectors);
    }

    private handleFrame() {
        const canvas = this.canvasRef.instance;
        const context = canvas.getContext('2d');

        context.clearRect(0, 0, this.props.width, this.props.height);

        for (const vector of this.activeVectors) {
            this.drawVector(context, vector, 0);
        }

        this.waypointLayer.paintShadowLayer(context, this.props.width, this.props.height, this.mapParams);
        this.waypointLayer.paintColorLayer(context, this.props.width, this.props.height, this.mapParams);

        this.constraintsLayer.paintShadowLayer(context, this.props.width, this.props.height, this.mapParams);
        this.constraintsLayer.paintColorLayer(context, this.props.width, this.props.height, this.mapParams);
    }

    private drawScaledRunway(context: CanvasRenderingContext2D, x: number, y: number, symbol: NdSymbol) {
        const identIcao = symbol.ident.substring(0, 4);
        const identRwy = symbol.ident.substring(4);

        // Runway shape
        const length = symbol.length * this.mapParams.nmToPx;
        const rotation = this.mapParams.rotation(symbol.direction);

        function drawShape(color: string, lineWidth: number) {
            context.lineWidth = lineWidth;
            context.strokeStyle = color;
            context.beginPath();
            context.moveTo(x - 5, y);
            context.lineTo(x - 5, y - length);
            context.moveTo(x + 5, y);
            context.lineTo(x + 5, y - length);
            context.stroke();
            context.closePath();
            context.rotate(0);
        }

        context.translate(x, y);
        context.rotate(rotation * MathUtils.DEGREES_TO_RADIANS);
        context.translate(-x, -y);

        drawShape('#000', 3.25);
        drawShape('#fff', 1.75);

        context.resetTransform();
    }

    private drawFixInfoRadius(context: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
        context.setLineDash([15, 12]);

        function drawShape(color: string, lineWidth: number) {
            context.strokeStyle = color;
            context.lineWidth = lineWidth;

            context.ellipse(cx, cy, r, r, 0, 0, Math.PI * 2);

            context.stroke();
        }

        drawShape('#000', 3.25);
        drawShape('#0ff', 1.75);

        context.setLineDash([]);
    }

    private drawFixInfoRadial(context: CanvasRenderingContext2D, cx: number, cy: number, bearing: number) {
        context.setLineDash([15, 12]);

        const rotation = this.mapParams.rotation(bearing) * Math.PI / 180;
        // TODO how long should a piece of string be?
        const x2 = Math.sin(rotation) * 300;
        const y2 = -Math.cos(rotation) * 300;

        function drawShape(color: string, lineWidth: number) {
            context.strokeStyle = color;
            context.lineWidth = lineWidth;

            context.beginPath();
            context.moveTo(cx, cy);
            context.lineTo(x2, y2);
            context.closePath();

            context.stroke();
        }

        drawShape('#000', 3.25);
        drawShape('#0ff', 1.75);

        context.setLineDash([]);
    }

    private drawVector(context: CanvasRenderingContext2D, vector: PathVector, group: EfisVectorsGroup) {
        switch (group) {
        case EfisVectorsGroup.ACTIVE:
            context.strokeStyle = '#0f0';
            break;
        default:
            context.strokeStyle = '#f00';
            break;
        }

        context.lineWidth = 1.75;

        switch (vector.type) {
        case 0: {
            const [sx, sy] = this.mapParams.coordinatesToXYy(vector.startPoint);
            const rsx = sx + this.props.width / 2;
            const rsy = sy + this.props.height / 2;

            const [ex, ey] = this.mapParams.coordinatesToXYy(vector.endPoint);
            const rex = ex + this.props.width / 2;
            const rey = ey + this.props.height / 2;

            context.beginPath();
            context.moveTo(rsx, rsy);
            context.lineTo(rex, rey);
            context.closePath();

            context.stroke();

            break;
        }
        case 1: {
            const [sx, sy] = this.mapParams.coordinatesToXYy(vector.startPoint);
            const rsx = sx + this.props.width / 2;
            const rsy = sy + this.props.height / 2;

            const [ex, ey] = this.mapParams.coordinatesToXYy(vector.endPoint);
            const rex = ex + this.props.width / 2;
            const rey = ey + this.props.height / 2;

            const pathRadius = distanceTo(vector.centrePoint, vector.endPoint) * this.mapParams.nmToPx;

            context.stroke(new Path2D(`M ${rsx} ${rsy} A ${pathRadius} ${pathRadius} 0 ${Math.abs(vector.sweepAngle) >= 180 ? 1 : 0} ${vector.sweepAngle > 0 ? 1 : 0} ${rex} ${rey}`));

            break;
        }
        default:
            throw new Error(`Unknown path vector type: ${vector.type}`);
        }
    }

    private drawText(context: CanvasRenderingContext2D, x: number, y: number, text: string, color: string, shadow = false) {
        context.translate(x, y);

        if (shadow) {
            context.strokeStyle = '#000';
            context.lineWidth = 2.25;
            context.strokeText(text, 0, 0);
        }

        context.fillStyle = color;
        context.fillText(text, 0, 0);

        context.resetTransform();
    }

    render(): VNode | null {
        return (
            <>
                <canvas
                    ref={this.canvasRef}
                    width={this.props.width}
                    height={this.props.height}
                    style={`width: ${this.props.width}px; height: ${this.props.height}px; position: absolute; top: 0; left: 0; transform: translate(${-(this.props.width / 2) + this.props.x}px, ${-(this.props.height / 2) + this.props.y}px)`}
                />
                <div
                    ref={this.touchContainerRef}
                    style={`z-index: 5000; width: ${this.props.width}px; height: ${this.props.height}px; position: absolute; top: 0; left: 0; transform: translate(${-(this.props.width / 2) + this.props.x}px, ${-(this.props.height / 2) + this.props.y}px)`}
                />
            </>
        );
    }
}
