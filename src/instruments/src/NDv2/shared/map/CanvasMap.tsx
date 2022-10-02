/* eslint-disable max-len */
import { ClockEvents, DisplayComponent, EventBus, FSComponent, MappedSubject, Subject, Subscribable, VNode } from 'msfssdk';
import { EfisNdMode, EfisVectorsGroup, NdSymbol, NdSymbolTypeFlags, NdTraffic } from '@shared/NavigationDisplay';
import type { PathVector } from '@fmgc/guidance/lnav/PathVector';
import { Coordinates, distanceTo } from 'msfs-geo';
import { TaRaIntrusion } from '@tcas/lib/TcasConstants';
import { MathUtils } from '@shared/MathUtils';
import { FmsSymbolsData } from '../../FmsSymbolsPublisher';
import { MapParameters } from '../../../ND/utils/MapParameters';
import { NDSimvars } from '../../NDSimvarPublisher';
import { WaypointLayer } from './WaypointLayer';
import { ConstraintsLayer } from './ConstraintsLayer';
import { RunwayLayer } from './RunwayLayer';
import { TrafficLayer } from './TrafficLayer';
import { FixInfoLayer } from './FixInfoLayer';
import { NDControlEvents } from '../../NDControlEvents';

const DASHES = [15, 12];
const NO_DASHES = [];

export interface CanvasMapProps {
    bus: EventBus,
    x: Subscribable<number>,
    y: Subscribable<number>,
    width: number,
    height: number,
}

export class CanvasMap extends DisplayComponent<CanvasMapProps> {
    private readonly canvasRef = FSComponent.createRef<HTMLCanvasElement>();

    private readonly touchContainerRef = FSComponent.createRef<HTMLDivElement>();

    private readonly mapCenterLat = Subject.create<number>(-1);

    private readonly mapCenterLong = Subject.create<number>(-1);

    private readonly mapRotation = Subject.create<number>(-1);

    private readonly mapRangeRadius = Subject.create<number>(-1);

    private readonly mapMode = Subject.create<EfisNdMode | -1>(-1);

    private readonly mapVisible = Subject.create<boolean>(false);

    private readonly mapRecomputing = Subject.create<boolean>(false);

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

    private readonly traffic: NdTraffic[] = [];

    private readonly mapParams = new MapParameters();

    public pointerX = 0;

    public pointerY = 0;

    private readonly waypointLayer = new WaypointLayer(this);

    private readonly fixInfoLayer = new FixInfoLayer();

    private readonly constraintsLayer = new ConstraintsLayer();

    private readonly runwayLayer = new RunwayLayer();

    private readonly trafficLayer = new TrafficLayer(this);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<NDControlEvents>();

        sub.on('set_show_map').handle((show) => this.mapVisible.set(show));
        sub.on('set_map_recomputing').handle((show) => this.mapRecomputing.set(show));
        sub.on('set_map_center_lat').handle((v) => this.mapCenterLat.set(v));
        sub.on('set_map_center_lon').handle((v) => this.mapCenterLong.set(v));
        sub.on('set_map_up_course').handle((v) => this.mapRotation.set(v));
        sub.on('set_map_range_radius').handle((v) => this.mapRangeRadius.set(v));
        sub.on('set_map_efis_mode').handle((v) => this.mapMode.set(v));

        this.setupCallbacks();
        this.setupEvents();
    }

    private setupCallbacks() {
        const sub = this.props.bus.getSubscriber<NDSimvars & FmsSymbolsData & ClockEvents>();

        this.mapCenterLat.sub(() => {
            this.handleRecomputeMapParameters();
        });

        this.mapCenterLong.sub(() => {
            this.handleRecomputeMapParameters();
        });

        this.mapRotation.sub(() => {
            this.handleRecomputeMapParameters();
        });

        this.mapRangeRadius.sub(() => {
            this.handleRecomputeMapParameters();
        });

        MappedSubject.create(([mapVisible, recomputing]) => {
            const visible = mapVisible && !recomputing;

            this.canvasRef.instance.style.visibility = visible ? 'visible' : 'hidden';
        }, this.mapVisible, this.mapRecomputing);

        sub.on('symbols').handle((data: NdSymbol[]) => {
            this.handleNewSymbols(data);
        });

        sub.on('vectorsActive').handle((data: PathVector[]) => {
            this.vectors[EfisVectorsGroup.ACTIVE].length = 0;
            this.vectors[EfisVectorsGroup.ACTIVE].push(...data);
        });

        sub.on('traffic').handle((data: NdTraffic[]) => {
            this.handleNewTraffic(data);
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
            { lat: this.mapCenterLat.get(), long: this.mapCenterLong.get() },
            this.mapRangeRadius.get() * 2,
            this.props.width,
            this.mapRotation.get(),
        );
    }

    private handleNewSymbols(symbols: NdSymbol[]) {
        this.symbols.length = 0;
        this.symbols.push(...symbols);

        const waypoints = this.symbols.filter((it) => it.type & (NdSymbolTypeFlags.Waypoint | NdSymbolTypeFlags.FlightPlan | NdSymbolTypeFlags.Vor | NdSymbolTypeFlags.VorDme | NdSymbolTypeFlags.Dme) && !(it.type & NdSymbolTypeFlags.Runway));

        this.waypointLayer.data = waypoints;

        const fixInfoSymbols = this.symbols.filter((it) => it.type & NdSymbolTypeFlags.FixInfo);

        this.fixInfoLayer.data = fixInfoSymbols;

        const constraints = this.symbols.filter((it) => it.type & NdSymbolTypeFlags.ConstraintUnknown | NdSymbolTypeFlags.ConstraintMet | NdSymbolTypeFlags.ConstraintMissed);

        this.constraintsLayer.data = constraints;

        const runways = this.symbols.filter((it) => it.type & NdSymbolTypeFlags.Runway);

        this.runwayLayer.data = runways;
    }

    private handleNewTraffic(newTraffic: NdTraffic[]) {
        this.traffic.length = 0; // Reset traffic display
        if (this.mapMode.get() !== EfisNdMode.PLAN) {
            newTraffic.forEach((intruder: NdTraffic) => {
                const latLong: Coordinates = { lat: intruder.lat, long: intruder.lon };
                let [x, y] = this.mapParams.coordinatesToXYy(latLong);

                let tcasMask;
                switch (this.mapMode.get()) {
                case EfisNdMode.ARC:
                    tcasMask = [
                        [-384, -310], [-384, 0], [-264, 0], [-210, 59], [-210, 143],
                        [210, 143], [210, 0], [267, -61], [384, -61],
                        [384, -310], [340, -355], [300, -390], [240, -431.5],
                        [180, -460], [100, -482], [0, -492], [-100, -482],
                        [-180, -460], [-240, -431.5], [-300, -390], [-340, -355],
                        [-384, -310],
                    ];
                    break;
                case EfisNdMode.ROSE_NAV:
                case EfisNdMode.ROSE_ILS:
                case EfisNdMode.ROSE_VOR:
                    tcasMask = [
                        [-340, -227], [-103, -227], [-50, -244],
                        [0, -250], [50, -244], [103, -227], [340, -227],
                        [340, 180], [267, 180], [210, 241], [210, 383],
                        [-210, 383], [-210, 300], [-264, 241], [-340, 241], [-340, -227],
                    ];
                    break;
                default:
                    break;
                }

                // Full time option installed: For all ranges except in ZOOM ranges NDRange > 9NM
                if (!MathUtils.pointInPolygon(x, y, tcasMask)) {
                    if (Math.abs(intruder.bitfield % 10) < TaRaIntrusion.TA) {
                        // Remove if beyond viewable range
                        return;
                    }
                    const ret: [number, number] | null = MathUtils.intersectWithPolygon(x, y, 0, 0, tcasMask);
                    if (ret) [x, y] = ret;
                }
                intruder.posX = x;
                intruder.posY = y;
                this.traffic.push(intruder);
            });
        }
        this.trafficLayer.data = this.traffic; // Populate with new traffic
    }

    private handleFrame() {
        // console.log(`center: lat=${this.props.mapCenterLat.get()}, long=${this.props.mapCenterLong.get()}`);

        const canvas = this.canvasRef.instance;
        const context = canvas.getContext('2d');

        context.clearRect(0, 0, this.props.width, this.props.height);

        context.translate(236, -6);
        switch (this.mapMode.get()) {
        case EfisNdMode.ARC:
            context.clip(new Path2D('M0,312 a492,492 0 0 1 768,0 L768,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L0,625 L0,312'));
            break;
        case EfisNdMode.ROSE_NAV:
        case EfisNdMode.ROSE_ILS:
        case EfisNdMode.ROSE_VOR:
            context.clip(new Path2D('M45,155 L282,155 a250,250 0 0 1 204,0 L723,155 L723,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L45,625 L45,155'));
            break;
        case EfisNdMode.PLAN:
            context.clip(new Path2D('M45,112 L140 112 280 56 488 56 628 112 723 112 723 720 114 720 114 633 45 633z'));
            break;
        default:
            context.clip(new Path2D('M0,312 a492,492 0 0 1 768,0 L768,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L0,625 L0,312'));
            break;
        }
        context.resetTransform();

        this.constraintsLayer.paintShadowLayer(context, this.props.width, this.props.height, this.mapParams);
        this.constraintsLayer.paintColorLayer(context, this.props.width, this.props.height, this.mapParams);

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

        this.runwayLayer.paintShadowLayer(context, this.props.width, this.props.height, this.mapParams);
        this.runwayLayer.paintColorLayer(context, this.props.width, this.props.height, this.mapParams);

        this.trafficLayer.paintShadowLayer(context, this.props.width, this.props.height);
        this.trafficLayer.paintColorLayer(context, this.props.width, this.props.height);
    }

    private drawVector(context: CanvasRenderingContext2D, vector: PathVector, group: EfisVectorsGroup) {
        switch (group) {
        case EfisVectorsGroup.ACTIVE:
            context.strokeStyle = '#0f0';
            context.setLineDash(NO_DASHES);
            break;
        case EfisVectorsGroup.TEMPORARY:
            context.strokeStyle = '#ffff00';
            context.setLineDash(DASHES);
            break;
        default:
            context.strokeStyle = '#f00';
            context.setLineDash(NO_DASHES);
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
