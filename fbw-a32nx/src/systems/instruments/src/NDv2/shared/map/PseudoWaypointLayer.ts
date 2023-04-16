import { NdSymbol, NdSymbolTypeFlags } from '@shared/NavigationDisplay';
import { MapLayer } from './MapLayer';
import { MapParameters } from '../../../ND/utils/MapParameters';

// eslint-disable-next-line max-len
const DECEL_PATH = new Path2D('m 14.5125 0 c 0 8.015 -6.4975 14.5125 -14.5125 14.5125 c -8.015 0 -14.5125 -6.4975 -14.5125 -14.5125 c 0 -8.015 6.4975 -14.5125 14.5125 -14.5125 c 8.015 0 14.5125 6.4975 14.5125 14.5125 z m -12.15 -9.7875 h -7.7625 v 18.225 h 7.7625 l 2.7 -3.375 v -11.475 l -2.7 -3.375 z');

export class PseudoWaypointLayer implements MapLayer<NdSymbol> {
    data: NdSymbol[] = [];

    paintShadowLayer(context: CanvasRenderingContext2D, mapWidth: number, mapHeight: number, mapParameters: MapParameters) {
        for (const symbol of this.data) {
            const [x, y] = mapParameters.coordinatesToXYy(symbol.location);
            const rx = x + mapWidth / 2;
            const ry = y + mapHeight / 2;

            if (symbol.type & NdSymbolTypeFlags.PwpDecel) {
                this.paintDecelerationSymbol(false, context, rx, ry, symbol);
            }
        }
    }

    paintColorLayer(context: CanvasRenderingContext2D, mapWidth: number, mapHeight: number, mapParameters: MapParameters) {
        for (const symbol of this.data) {
            const [x, y] = mapParameters.coordinatesToXYy(symbol.location);
            const rx = x + mapWidth / 2;
            const ry = y + mapHeight / 2;

            if (symbol.type & NdSymbolTypeFlags.PwpDecel) {
                this.paintDecelerationSymbol(true, context, rx, ry, symbol);
            }
        }
    }

    private paintDecelerationSymbol(isColorLayer: boolean, context: CanvasRenderingContext2D, x: number, y: number, symbol: NdSymbol) {
        context.lineWidth = isColorLayer ? 1.75 : 3.25;

        if (isColorLayer) {
            context.strokeStyle = symbol.type & NdSymbolTypeFlags.MagentaColor ? '#ff94ff' : '#fff';
        } else {
            context.strokeStyle = '#000';
        }

        context.lineCap = 'round';

        context.translate(x, y);
        context.stroke(DECEL_PATH);
        context.resetTransform();
    }
}
