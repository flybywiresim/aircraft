import { NdSymbol, NdSymbolTypeFlags } from '@shared/NavigationDisplay';
import { MapLayer } from './MapLayer';
import { MapParameters } from '../../../ND/utils/MapParameters';
import { PaintUtils } from './PaintUtils';

export class ConstraintsLayer implements MapLayer<NdSymbol> {
    data: NdSymbol[] = [];

    paintShadowLayer(context: CanvasRenderingContext2D, mapWidth: number, mapHeight: number, mapParameters: MapParameters) {
        // TODO revise this logic, maybe efis constraints should be it's own thing?
        for (const symbol of this.data) {
            if (!symbol.constraints || !(symbol.type & NdSymbolTypeFlags.Constraint)) {
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
            const [x, y] = mapParameters.coordinatesToXYy(symbol.location);
            const rx = x + mapWidth / 2;
            const ry = y + mapHeight / 2;

            if (symbol.type & NdSymbolTypeFlags.Constraint) {
                this.paintConstraintCircle(true, context, rx, ry, symbol);
            }
        }
    }

    private paintConstraintCircle(isColorLayer: boolean, context: CanvasRenderingContext2D, x: number, y: number, symbol: NdSymbol) {
        if (isColorLayer) {
            if (symbol.type & NdSymbolTypeFlags.MagentaColor) {
                context.strokeStyle = '#ff94ff';
            } else if (symbol.type & NdSymbolTypeFlags.AmberColor) {
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
}
