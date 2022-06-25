import { ClockEvents, DisplayComponent, EventBus, FSComponent, MappedSubject, Subscribable, VNode } from 'msfssdk';
import { EfisVectorsGroup, NdSymbol, NdSymbolTypeFlags } from '@shared/NavigationDisplay';
import type { PathVector } from '@fmgc/guidance/lnav/PathVector';
import { distanceTo } from 'msfs-geo';
import { FmsSymbolsData } from '../../FmsSymbolsPublisher';
import { MapParameters } from '../../../ND/utils/MapParameters';
import { NDSimvars } from '../../NDSimvarPublisher';
import { WaypointLayer } from './WaypointLayer';
import { ConstraintsLayer } from './ConstraintsLayer';
import { RunwayLayer } from './RunwayLayer';
import { FixInfoLayer } from './FixInfoLayer';

export interface CanvasMapProps {
    bus: EventBus,
    x: Subscribable<number>,
    y: Subscribable<number>,
    width: number,
    height: number,
    mapCenterLat: Subscribable<number>,
    mapCenterLong: Subscribable<number>,
    mapRotation: Subscribable<number>,
    mapRangeRadius: Subscribable<number>,
    mapClip: Subscribable<Path2D>;
    mapVisible: Subscribable<boolean>,
}

export class CanvasMap extends DisplayComponent<CanvasMapProps> {
    private readonly canvasRef = FSComponent.createRef<HTMLCanvasElement>();

    private readonly touchContainerRef = FSComponent.createRef<HTMLDivElement>();

    private readonly vectors: { [k in EfisVectorsGroup]: PathVector[] } = {
        [EfisVectorsGroup.ACTIVE]: [],
        [EfisVectorsGroup.DASHED]: [],
        [EfisVectorsGroup.OFFSET]: [],
        [EfisVectorsGroup.TEMPORARY]: [],
        [EfisVectorsGroup.SECONDARY]: [],
        [EfisVectorsGroup.SECONDARY_DASHED]: [],
        [EfisVectorsGroup.MISSED]: [],
        [EfisVectorsGroup.ALTERNATE]: [],
        [EfisVectorsGroup.ACTIVE_EOSID]: [],
    };

    private readonly symbols: NdSymbol[] = [];

    private readonly mapParams = new MapParameters();

    public pointerX = 0;

    public pointerY = 0;

    private readonly waypointLayer = new WaypointLayer(this);

    private readonly fixInfoLayer = new FixInfoLayer();

    private readonly constraintsLayer = new ConstraintsLayer();

    private readonly runwayLayer = new RunwayLayer();

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.setupCallbacks();
        this.setupEvents();
    }

    private setupCallbacks() {
        const sub = this.props.bus.getSubscriber<NDSimvars & FmsSymbolsData & ClockEvents>();

        this.props.mapCenterLat.sub(() => {
            this.handleRecomputeMapParameters();
        });

        this.props.mapCenterLong.sub(() => {
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
            this.vectors[EfisVectorsGroup.ACTIVE].length = 0;
            this.vectors[EfisVectorsGroup.ACTIVE].push(...data);
        });

        sub.on('vectorsTemporary').handle((data: PathVector[]) => {
            this.vectors[EfisVectorsGroup.TEMPORARY].length = 0;
            this.vectors[EfisVectorsGroup.TEMPORARY].push(...data);
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
        this.mapParams.compute(
            { lat: this.props.mapCenterLat.get(), long: this.props.mapCenterLong.get() },
            this.props.mapRangeRadius.get() * 2,
            this.props.width,
            this.props.mapRotation.get(),
        );
    }

    private handleNewSymbols(symbols: NdSymbol[]) {
        this.symbols.length = 0;
        this.symbols.push(...symbols);

        const waypoints = this.symbols.filter((it) => it.type & NdSymbolTypeFlags.Waypoint | NdSymbolTypeFlags.FlightPlan && !(it.type & NdSymbolTypeFlags.Runway));

        this.waypointLayer.data = waypoints;

        const fixInfoSymbols = this.symbols.filter((it) => it.type & NdSymbolTypeFlags.FixInfo);

        this.fixInfoLayer.data = fixInfoSymbols;

        const constraints = this.symbols.filter((it) => it.type & NdSymbolTypeFlags.ConstraintUnknown | NdSymbolTypeFlags.ConstraintMet | NdSymbolTypeFlags.ConstraintMissed);

        this.constraintsLayer.data = constraints;

        const runways = this.symbols.filter((it) => it.type & NdSymbolTypeFlags.Runway);

        this.runwayLayer.data = runways;
    }

    private handleFrame() {
        // console.log(`center: lat=${this.props.mapCenterLat.get()}, long=${this.props.mapCenterLong.get()}`);

        const canvas = this.canvasRef.instance;
        const context = canvas.getContext('2d');

        context.clearRect(0, 0, this.props.width, this.props.height);

        context.translate(236, -6);
        context.clip(this.props.mapClip.get());
        context.resetTransform();

        for (const key in this.vectors) {
            if (this.vectors[key].length > 0) {
                context.beginPath();
                for (const vector of this.vectors[key]) {
                    this.drawVector(context, vector, parseInt(key));
                }
                context.stroke();
            }
        }

        this.waypointLayer.paintShadowLayer(context, this.props.width, this.props.height, this.mapParams);
        this.waypointLayer.paintColorLayer(context, this.props.width, this.props.height, this.mapParams);

        this.fixInfoLayer.paintShadowLayer(context, this.props.width, this.props.height, this.mapParams);
        this.fixInfoLayer.paintColorLayer(context, this.props.width, this.props.height, this.mapParams);

        this.constraintsLayer.paintShadowLayer(context, this.props.width, this.props.height, this.mapParams);
        this.constraintsLayer.paintColorLayer(context, this.props.width, this.props.height, this.mapParams);

        this.runwayLayer.paintShadowLayer(context, this.props.width, this.props.height, this.mapParams);
        this.runwayLayer.paintColorLayer(context, this.props.width, this.props.height, this.mapParams);
    }

    private drawVector(context: CanvasRenderingContext2D, vector: PathVector, group: EfisVectorsGroup) {
        switch (group) {
        case EfisVectorsGroup.ACTIVE:
            context.strokeStyle = '#0f0';
            context.setLineDash([]);
            break;
        case EfisVectorsGroup.TEMPORARY:
            context.strokeStyle = '#ffff00';
            context.setLineDash([15, 12]);
            break;
        default:
            context.strokeStyle = '#f00';
            context.setLineDash([]);
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

            context.moveTo(rsx, rsy);
            context.lineTo(rex, rey);
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

            // TODO find a way to batch that as well?
            // TODO beginPath needed here?
            context.stroke(new Path2D(`M ${rsx} ${rsy} A ${pathRadius} ${pathRadius} 0 ${Math.abs(vector.sweepAngle) >= 180 ? 1 : 0} ${vector.sweepAngle > 0 ? 1 : 0} ${rex} ${rey}`));

            break;
        }
        default:
            throw new Error(`Unknown path vector type: ${vector.type}`);
        }
    }

    render(): VNode | null {
        return (
            <>
                <canvas
                    ref={this.canvasRef}
                    width={this.props.width}
                    height={this.props.height}
                    style={MappedSubject.create(([x, y]) => `width: ${this.props.width}px; height: ${this.props.height}px; position: absolute; top: 0; left: 0; transform: translate(${-(this.props.width / 2) + x}px, ${-(this.props.height / 2) + y}px)`, this.props.x, this.props.y)}
                />
                <div
                    ref={this.touchContainerRef}
                    style={MappedSubject.create(([x, y]) => `width: ${this.props.width}px; height: ${this.props.height}px; position: absolute; top: 0; left: 0; transform: translate(${-(this.props.width / 2) + x}px, ${-(this.props.height / 2) + y}px)`, this.props.x, this.props.y)}
                />
            </>
        );
    }
}
