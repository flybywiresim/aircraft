import { NdSymbol, NdSymbolTypeFlags } from '@shared/NavigationDisplay';
import { EventBus } from '@microsoft/msfs-sdk';
import { NDSimvars } from 'instruments/src/NDv2/NDSimvarPublisher';
import { Arinc429ConsumerSubject } from 'instruments/src/MsfsAvionicsCommon/Arinc429ConsumerSubject';
import { Arinc429Register } from '@shared/arinc429';
import { DmcEvents } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';
import { MathUtils } from '@shared/MathUtils';
import { MapLayer } from './MapLayer';
import { MapParameters } from '../../../ND/utils/MapParameters';
import { PaintUtils } from './PaintUtils';

// eslint-disable-next-line max-len
const DECEL_PATH = new Path2D('m 14.5125 0 c 0 8.015 -6.4975 14.5125 -14.5125 14.5125 c -8.015 0 -14.5125 -6.4975 -14.5125 -14.5125 c 0 -8.015 6.4975 -14.5125 14.5125 -14.5125 c 8.015 0 14.5125 6.4975 14.5125 14.5125 z m -12.15 -9.7875 h -7.7625 v 18.225 h 7.7625 l 2.7 -3.375 v -11.475 l -2.7 -3.375 z');
const START_OF_CLIMB_PATH = new Path2D('M 0 0 h 22.2 l 19.8 -16.2 m -6 0 h 6 v 6');
const LEVEL_OFF_CLIMB_PATH = new Path2D('M -42 16.2 l 19.8 -16.2 h 22.2 m -4.2 -4.2 l 4.2 4.2 l -4.2 4.2');
const START_OF_DESCENT_PATH = new Path2D('M 0 0 h 22.2 l 19.8 16.2 m -6 0 h 6 v -6');
const LEVEL_OFF_DESCENT_PATH = new Path2D('M -42 -16.2 l 19.8 16.2 h 22.2 m -4.2 -4.2 l 4.2 4.2 l -4.2 4.2');
const INTERCEPT_PROFILE_PATH = new Path2D('M -38, 0 l 14, -17 v 34 l 14 -17 h10 m -5 -5 l 5 5 l -5 5');
const COURSE_REVERSAL_ARC_PATH_LEFT = new Path2D('M 0, 0 a 21, 21 0 0 0 -42, 0');
const COURSE_REVERSAL_ARC_PATH_RIGHT = new Path2D('M 0, 0 a 21, 21 0 0  1 42, 0');

export class PseudoWaypointLayer implements MapLayer<NdSymbol> {
    data: NdSymbol[] = [];

    private lastUpdateTime = Date.now();

    private groundSpeed= Arinc429Register.empty();

    private headingWord = Arinc429ConsumerSubject.create(null);

    private trackWord = Arinc429ConsumerSubject.create(null);

    constructor(readonly bus: EventBus) {
        const sub = this.bus.getSubscriber<NDSimvars & DmcEvents>();

        sub.on('groundSpeed').handle((s) => this.groundSpeed.set(s));

        this.headingWord.setConsumer(sub.on('heading'));

        this.trackWord.setConsumer(sub.on('track'));
    }

    paintShadowLayer(context: CanvasRenderingContext2D, mapWidth: number, mapHeight: number, mapParameters: MapParameters) {
        for (const symbol of this.data) {
            // We only want to place the symbol on the track line if it does not have a location on the flight plan.
            if (symbol.distanceFromAirplane && !symbol.location) {
                const dy = (symbol.distanceFromAirplane - this.groundSpeed.value * (Date.now() - this.lastUpdateTime) / 1000 / 60 / 60) * mapParameters.nmToPx;
                const rotate = MathUtils.diffAngle(this.headingWord.get().value, this.trackWord.get().value);
                context.translate(384, 620);
                context.rotate(rotate * Math.PI / 180);

                this.paintPseudoWaypoint(false, context, 0, -dy, symbol, mapParameters);
            } else {
                const [x, y] = mapParameters.coordinatesToXYy(symbol.location);
                const rx = x + mapWidth / 2;
                const ry = y + mapHeight / 2;

                this.paintPseudoWaypoint(false, context, rx, ry, symbol, mapParameters);
            }
            this.lastUpdateTime = Date.now();
        }
    }

    paintColorLayer(context: CanvasRenderingContext2D, mapWidth: number, mapHeight: number, mapParameters: MapParameters) {
        for (const symbol of this.data) {
            // We only want to place the symbol on the track line if it does not have a location on the flight plan.
            if (symbol.distanceFromAirplane && !symbol.location) {
                const dy = (symbol.distanceFromAirplane - this.groundSpeed.value * (Date.now() - this.lastUpdateTime) / 1000 / 60 / 60) * mapParameters.nmToPx;
                const rotate = MathUtils.diffAngle(this.headingWord.get().value, this.trackWord.get().value);
                context.translate(384, 620);
                context.rotate(rotate * Math.PI / 180);

                this.paintPseudoWaypoint(true, context, 0, -dy, symbol, mapParameters);
            } else {
                const [x, y] = mapParameters.coordinatesToXYy(symbol.location);
                const rx = x + mapWidth / 2;
                const ry = y + mapHeight / 2;

                this.paintPseudoWaypoint(true, context, rx, ry, symbol, mapParameters);
            }
        }
        this.lastUpdateTime = Date.now();
    }

    private paintPseudoWaypoint(isColorLayer: boolean, context: CanvasRenderingContext2D, x: number, y: number, symbol: NdSymbol, mapParameters: MapParameters) {
        const color = isColorLayer ? typeFlagToColor(symbol.type) : '#000';
        context.strokeStyle = color;

        if (symbol.type & (NdSymbolTypeFlags.PwpStartOfClimb)) {
            this.paintPath(context, x, y, START_OF_CLIMB_PATH);
        } else if (symbol.type & (NdSymbolTypeFlags.PwpClimbLevelOff)) {
            this.paintPath(context, x, y, LEVEL_OFF_CLIMB_PATH);
        } else if (symbol.type & (NdSymbolTypeFlags.PwpTopOfDescent)) {
            this.paintPath(context, x, y, START_OF_DESCENT_PATH);
        } else if (symbol.type & (NdSymbolTypeFlags.PwpDescentLevelOff)) {
            this.paintPath(context, x, y, LEVEL_OFF_DESCENT_PATH);
        } else if (symbol.type & (NdSymbolTypeFlags.PwpInterceptProfile)) {
            this.paintPath(context, x, y, INTERCEPT_PROFILE_PATH);
        } else if (symbol.type & (NdSymbolTypeFlags.PwpCdaFlap1)) {
            this.paintCdaPoint(context, x, y, '1', color);
        } else if (symbol.type & (NdSymbolTypeFlags.PwpCdaFlap2)) {
            this.paintCdaPoint(context, x, y, '2', color);
        } else if (symbol.type & (NdSymbolTypeFlags.PwpDecel)) {
            this.paintPath(context, x, y, DECEL_PATH);
        } else if (symbol.type & (NdSymbolTypeFlags.PwpTimeMarker)) {
            this.paintCdaPoint(context, x, y, '', '#0f0');
        } else if (symbol.type & (NdSymbolTypeFlags.PwpSpeedChange)) {
            context.fillStyle = color;
            context.strokeStyle = 'none';
            this.paintSpeedChange(context, x, y);
        } else if (symbol.type & (NdSymbolTypeFlags.CourseReversalLeft | NdSymbolTypeFlags.CourseReversalRight)) {
            this.paintCourseReversal(context, x, y, mapParameters, symbol);
        }
    }

    private paintCourseReversal(context: CanvasRenderingContext2D, x: number, y: number, mapParams: MapParameters, symbol: NdSymbol) {
        const left = symbol.type & (NdSymbolTypeFlags.CourseReversalLeft);
        const arcEnd = left ? -42 : 42;
        context.translate(x, y);
        context.beginPath();
        context.moveTo(arcEnd, 0);
        context.lineTo(arcEnd - 4, -4);
        context.moveTo(arcEnd, 0);
        context.lineTo(arcEnd + 4, -4);
        context.stroke();
        context.stroke(left ? COURSE_REVERSAL_ARC_PATH_LEFT : COURSE_REVERSAL_ARC_PATH_RIGHT);
        context.closePath();
        context.resetTransform();
    }

    private paintPath(context: CanvasRenderingContext2D, x: number, y: number, path: Path2D) {
        context.translate(x, y);
        context.beginPath();
        context.stroke(path);
        context.closePath();
        context.resetTransform();
    }

    // TODO those are not in the correct shape
    private paintCdaPoint(context: CanvasRenderingContext2D, x: number, y: number, centerSymbol: string, color: string) {
        context.beginPath();
        context.ellipse(x, y, 14, 14, 0, 0, Math.PI * 2);
        context.stroke();
        context.closePath();

        PaintUtils.paintText(true, context, x - 5.5, y + 6.5, centerSymbol, color);
    }

    private paintSpeedChange(context: CanvasRenderingContext2D, x: number, y: number) {
        context.beginPath();
        context.ellipse(x, y, 8, 8, 0, 0, Math.PI * 2);
        context.fill();
        context.closePath();
    }
}

const typeFlagToColor = (typeFlag: NdSymbolTypeFlags) => {
    if (typeFlag & NdSymbolTypeFlags.MagentaColor) {
        return '#ff94ff';
    } if (typeFlag & NdSymbolTypeFlags.AmberColor) {
        return '#e68000';
    } if (typeFlag & NdSymbolTypeFlags.CyanColor) {
        return '#00ffff';
    }

    return '#fff';
};
