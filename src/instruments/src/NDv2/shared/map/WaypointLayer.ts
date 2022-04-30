import { NdSymbol, NdSymbolTypeFlags } from '@shared/NavigationDisplay';
import { MathUtils } from '@shared/MathUtils';
import { MapLayer } from './MapLayer';
import { MapParameters } from '../../../ND/utils/MapParameters';
import { PaintUtils } from './PaintUtils';

export class WaypointLayer implements MapLayer<NdSymbol> {
    data: NdSymbol[] = [];

    paintShadowLayer(context: CanvasRenderingContext2D, mapWidth: number, mapHeight: number, mapParameters: MapParameters) {
        for (const symbol of this.data) {
            const [x, y] = mapParameters.coordinatesToXYy(symbol.location);
            const rx = x + mapWidth / 2;
            const ry = y + mapHeight / 2;

            if (symbol.type & NdSymbolTypeFlags.FlightPlan) {
                this.paintFlightPlanWaypoint(false, context, rx, ry, symbol);
            } else if (symbol.type & NdSymbolTypeFlags.Airport || symbol.type & NdSymbolTypeFlags.Runway) {
                this.paintAirport(false, context, rx, ry, symbol);
            } else {
                this.paintWaypoint(false, context, rx, ry, symbol);
            }
        }
    }

    paintColorLayer(context: CanvasRenderingContext2D, mapWidth: number, mapHeight: number, mapParameters: MapParameters) {
        for (const symbol of this.data) {
            const [x, y] = mapParameters.coordinatesToXYy(symbol.location);
            const rx = x + mapWidth / 2;
            const ry = y + mapHeight / 2;

            if (symbol.type & NdSymbolTypeFlags.FlightPlan) {
                this.paintFlightPlanWaypoint(true, context, rx, ry, symbol);
            } else if (symbol.type & NdSymbolTypeFlags.Airport || symbol.type & NdSymbolTypeFlags.Runway) {
                this.paintAirport(true, context, rx, ry, symbol);
            } else {
                this.paintWaypoint(true, context, rx, ry, symbol);
            }
        }
    }

    private paintAirport(isColorLayer: boolean, context: CanvasRenderingContext2D, x: number, y: number, symbol: NdSymbol) {
        const mainColor = symbol.type & NdSymbolTypeFlags.FlightPlan ? '#fff' : '#ff94ff';

        this.paintAirportShape(context, x, y, isColorLayer ? mainColor : '#000', isColorLayer ? 1.75 : 3.25);

        context.font = '21px Ecam';

        PaintUtils.paintText(isColorLayer, context, x + 13, y + 18, symbol.ident, mainColor);
    }

    private paintWaypoint(isColorLayer: boolean, context: CanvasRenderingContext2D, x: number, y: number, symbol: NdSymbol) {
        this.paintWaypointShape(context, x, y, isColorLayer ? '#ff94ff' : '#000', isColorLayer ? 1.75 : 3.25);

        context.font = '21px Ecam';

        PaintUtils.paintText(isColorLayer, context, x + 13, y + 18, symbol.ident, '#ff94ff');
    }

    private paintFlightPlanWaypoint(isColorLayer: boolean, context: CanvasRenderingContext2D, x: number, y: number, symbol: NdSymbol) {
        const mainColor = symbol.type & NdSymbolTypeFlags.ActiveLegTermination ? '#fff' : '#0f0';

        this.paintWaypointShape(context, x, y, isColorLayer ? mainColor : '#000', isColorLayer ? 1.75 : 3.25);

        context.font = '21px Ecam';

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
        }

        PaintUtils.paintText(isColorLayer, context, x + 13, y + 18, symbol.ident, mainColor);
    }

    private paintAirportShape(context: CanvasRenderingContext2D, x: number, y: number, color: string, lineWidth: number) {
        context.strokeStyle = color;
        context.lineWidth = lineWidth;

        context.translate(x, y);
        context.beginPath();
        context.moveTo(-13, 0);
        context.lineTo(13, 0);
        context.moveTo(0, -13);
        context.lineTo(0, 13);
        context.rotate(45 * MathUtils.DEGREES_TO_RADIANS);
        context.moveTo(0, -13);
        context.lineTo(0, 13);
        context.rotate(90 * MathUtils.DEGREES_TO_RADIANS);
        context.moveTo(0, -13);
        context.lineTo(0, 13);
        context.closePath();
        context.stroke();
        context.resetTransform();
    }

    private paintWaypointShape(context: CanvasRenderingContext2D, x: number, y: number, color: string, lineWidth: number) {
        context.strokeStyle = color;
        context.lineWidth = lineWidth;

        context.translate(x, y);
        context.rotate(45 * MathUtils.DEGREES_TO_RADIANS);
        context.strokeRect(-4.5, -4.5, 9, 9);
        context.resetTransform();
    }
}
