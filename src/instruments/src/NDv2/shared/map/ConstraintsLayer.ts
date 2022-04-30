import { NdSymbol } from '@shared/NavigationDisplay';
import { MapLayer } from './MapLayer';
import { MapParameters } from '../../../ND/utils/MapParameters';
import { PaintUtils } from './PaintUtils';

export class ConstraintsLayer implements MapLayer<NdSymbol> {
    data: NdSymbol[] = [];

    paintShadowLayer(_context: CanvasRenderingContext2D, _mapWidth: number, _mapHeight: number, _mapParameters: MapParameters) {
        // noop
    }

    paintColorLayer(context: CanvasRenderingContext2D, mapWidth: number, mapHeight: number, mapParameters: MapParameters) {
        for (const symbol of this.data) {
            if (!symbol.constraints) {
                continue;
            }

            const [x, y] = mapParameters.coordinatesToXYy(symbol.location);
            const rx = x + mapWidth / 2;
            const ry = y + mapHeight / 2;

            this.paintSymbolConstraints(context, rx, ry, symbol);
        }
    }

    private paintSymbolConstraints(context: CanvasRenderingContext2D, x: number, y: number, symbol: NdSymbol) {
        context.fillStyle = '#ff94ff';

        for (let i = 0; i < symbol.constraints.length; i++) {
            const line = symbol.constraints[i];

            PaintUtils.paintText(true, context, x + 13, y + 37 + (19 * i), line, '#ff94ff');
        }
    }
}
