import { NdSymbol, NdSymbolTypeFlags } from '@shared/NavigationDisplay';
import { MapLayer } from './MapLayer';
import { MapParameters } from '../../../ND/utils/MapParameters';
import { PaintUtils } from './PaintUtils';

export class ConstraintsLayer implements MapLayer<NdSymbol> {
    data: NdSymbol[] = [];

    paintShadowLayer(context: CanvasRenderingContext2D, mapWidth: number, mapHeight: number, mapParameters: MapParameters) {
        for (const symbol of this.data) {
            if (!symbol.constraints) {
                continue;
            }

            const [x, y] = mapParameters.coordinatesToXYy(symbol.location);
            const rx = x + mapWidth / 2;
            const ry = y + mapHeight / 2;

            this.paintConstraintCircle(true, context, rx, ry, symbol);
        }
    }

    paintColorLayer(context: CanvasRenderingContext2D, mapWidth: number, mapHeight: number, mapParameters: MapParameters) {
        for (const symbol of this.data) {
            if (!symbol.constraints) {
                continue;
            }

            const [x, y] = mapParameters.coordinatesToXYy(symbol.location);
            const rx = x + mapWidth / 2;
            const ry = y + mapHeight / 2;

            this.paintConstraintCircle(true, context, rx, ry, symbol);
            this.paintSymbolConstraints(context, rx, ry, symbol);
        }
    }

    private paintConstraintCircle(isColorLayer: boolean, context: CanvasRenderingContext2D, x: number, y: number, symbol: NdSymbol) {
        if (isColorLayer) {
            if (symbol.type & NdSymbolTypeFlags.ConstraintMet) {
                context.strokeStyle = '#ff94ff';
            } else if (symbol.type & NdSymbolTypeFlags.ConstraintMissed) {
                context.strokeStyle = '#e68000';
            } else {
                context.strokeStyle = '#fff';
            }
        } else {
            context.strokeStyle = '#000';
        }

        context.beginPath();
        context.ellipse(x, y, 14, 14, 0, 0, Math.PI * 2);
        context.stroke();
        context.closePath();
    }

    private paintSymbolConstraints(context: CanvasRenderingContext2D, x: number, y: number, symbol: NdSymbol) {
        context.fillStyle = '#ff94ff';

        for (let i = 0; i < symbol.constraints.length; i++) {
            const line = symbol.constraints[i];

            PaintUtils.paintText(true, context, x + 13, y + 35 + (18 * i), line, '#ff94ff');
        }
    }
}
