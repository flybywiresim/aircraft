import { ClockEvents, DisplayComponent, EventBus, FSComponent, Subject, Subscribable, VNode } from 'msfssdk';
import { EfisVectorsGroup, NdSymbol, NdSymbolTypeFlags } from '@shared/NavigationDisplay';
import type { PathVector } from '@fmgc/guidance/lnav/PathVector';
import { distanceTo } from 'msfs-geo';
import { FmsSymbolsData } from '../FmsSymbolsPublisher';
import { MapParameters } from '../../ND/utils/MapParameters';
import { NDSimvars } from '../NDSimvarPublisher';

export interface CanvasMapProps {
    bus: EventBus,
    x: number,
    y: number,
    width: number,
    height: number,
    mapRotation: Subscribable<number>,
}

export class CanvasMap extends DisplayComponent<CanvasMapProps> {
    private readonly canvasRef = FSComponent.createRef<HTMLCanvasElement>();

    private readonly activeVectors: PathVector[] = [];

    private readonly symbols: NdSymbol[] = [];

    private readonly mapParams = new MapParameters();

    private readonly latitude = Subject.create(0);

    private readonly longitude = Subject.create(0);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.setupCallbacks();
    }

    private setupCallbacks() {
        const sub = this.props.bus.getSubscriber<NDSimvars & FmsSymbolsData & ClockEvents>();

        sub.on('pposLat').whenChangedBy(0.00001).handle((value) => {
            this.latitude.set(value);
            this.handleRecomputeMapParameters();
        });

        sub.on('pposLong').whenChangedBy(0.00001).handle((value) => {
            this.longitude.set(value);
            this.handleRecomputeMapParameters();
        });

        this.props.mapRotation.sub(() => {
            this.handleRecomputeMapParameters();
        });

        sub.on('symbols').handle((data: NdSymbol[]) => {
            this.handleNewSymbols(data);
        });

        sub.on('vectorsActive').handle((data: PathVector[]) => {
            this.handleNewVectors(data);
        });

        sub.on('realTime').whenChangedBy(25).handle(() => {
            this.handleFrame();
        });
    }

    private handleRecomputeMapParameters() {
        this.mapParams.compute({ lat: this.latitude.get(), long: this.longitude.get() }, 20, 768, this.props.mapRotation.get());
    }

    private handleNewSymbols(symbols: NdSymbol[]) {
        this.symbols.length = 0;
        this.symbols.push(...symbols);
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

        for (const symbol of this.symbols) {
            this.drawSymbol(context, symbol);
        }
    }

    private drawSymbol(context: CanvasRenderingContext2D, symbol: NdSymbol) {
        const [x, y] = this.mapParams.coordinatesToXYy(symbol.location);
        const rx = x + this.props.width / 2;
        const ry = y + this.props.width / 2;

        if (symbol.type & NdSymbolTypeFlags.FlightPlan) {
            this.drawWaypoint(context, rx, ry, symbol);
        }
    }

    private drawWaypoint(context: CanvasRenderingContext2D, x: number, y: number, symbol: NdSymbol) {
        function drawShape(color: string, lineWidth: number) {
            context.strokeStyle = color;
            context.lineWidth = lineWidth;

            context.beginPath();
            context.moveTo(x - 7, y);
            context.lineTo(x, y - 7);
            context.lineTo(x + 7, y);
            context.lineTo(x, y + 7);
            context.lineTo(x - 7, y);
            context.stroke();
        }

        drawShape('#000', 3.25);
        drawShape('#0f0', 1.75);

        if (symbol.constraints) {
            // Circle

            if (symbol.type & NdSymbolTypeFlags.ConstraintMet) {
                context.strokeStyle = '#ff94ff';
            } else if (symbol.type & NdSymbolTypeFlags.ConstraintMissed) {
                context.strokeStyle = '#e68000';
            } else {
                context.strokeStyle = '#fff';
            }

            context.beginPath();
            context.ellipse(x, y, 14, 14, 0, 0, Math.PI * 2);
            context.stroke();
            context.closePath();

            // Text
            context.fillStyle = '#ff94ff';

            for (let i = 0; i < symbol.constraints.length; i++) {
                const line = symbol.constraints[i];

                this.drawText(context, x + 13, y + 36 + (19 * i), line, '#ff94ff');
            }
        }

        context.fillStyle = '#0f0';
        context.font = '23px Ecam';
        this.drawText(context, x + 13, y + 17, symbol.ident, '#0f0', true);
        context.fillText(symbol.ident, x + 13, y + 17);
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
        if (shadow) {
            context.strokeStyle = '#000';
            context.lineWidth = 2.25;
            context.strokeText(text, x, y);
        }

        context.fillStyle = color;
        context.fillText(text, x, y);
    }

    render(): VNode | null {
        return (
            <canvas
                ref={this.canvasRef}
                width={this.props.width}
                height={this.props.height}
                style={`position: absolute; transform: translate(${this.props.x}px, ${this.props.y - this.props.height / 2}px) rotateX(0deg)`}
            />
        );
    }
}
