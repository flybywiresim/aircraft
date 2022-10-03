declare namespace Avionics {
    class Utils {
        static DEG2RAD: number;
        static RAD2DEG: number;
        static DEGREE_SYMBOL: string;
        static METER2FEET: number;
        static FEET2METER: number;
        static make_bcd16(arg: number): number;
        static make_adf_bcd32(arg: number): number;
        static Vor2Tacan(freq: number): number;
        static Tacan2Vor(channel: number, yband: boolean): number;
        static make_xpndr_bcd16(arg: number): number;
        static computeETEinSeconds(distance: number): any;
        static computeThousandsAltitude(altitude: number): any;
        static bearingDistanceToCoordinates(bearing: number, distance: number, referentialLat: number, referentialLong: number): LatLongAlt;
        static computeDistance(from: LatLong | LatLongAlt, to: LatLong | LatLongAlt): number;
        static computeGreatCircleHeading(lla0: LatLong | LatLongAlt, lla1: LatLong | LatLongAlt): number;
        static computeGreatCircleDistance(lla0: LatLong | LatLongAlt, lla1: LatLong | LatLongAlt): number;
        static lerpAngle(from: number, to: number, d: number): number;
        static meanAngle(a: number, b: number): number;
        static diffAngle(a: number, b: number): number;
        static clampAngle(a: number): number;
        static fmod(a: any, b: any): number;
        private static runwayRegex;
        static formatRunway(_designation: string, _trimWhiteSpaces?: boolean): string;
        private static identRegex;
        static isIdent(_value: string): boolean;
    }
    class SVG {
        static NS: string;
        static InlineSvg(url: string, image: SVGSVGElement): void;
        static computeDashLine(_startX: number, _startY: number, _length: number, _steps: number, _width: number, _color: string): Element;
    }
    class SVGGraduation {
        IsPrimary: boolean;
        SVGLine: Element;
        SVGText1: Element;
        SVGText2: Element;
    }
    class Scroller {
        offsetY: number;
        protected _nbItems: number;
        protected _increment: number;
        protected _canBeNegative: boolean;
        protected _moduloValue: number;
        protected _notched: number;
        private _baseValue;
        private _curIndex;
        private OLDoffsetY;
        private OLD_baseValue;
        constructor(_nbItems: number, _increment: number, _canBeNegative?: boolean, _moduloValue?: number, _notched?: number);
        protected resetOldBaseValue(): void;
        scroll(_value: number): boolean;
        get increment(): number;
        get firstValue(): number;
        get nextValue(): number;
        private getCurrentValue;
    }
    class AirspeedScroller extends Scroller {
        protected allTexts: Array<Element>;
        protected posX: number;
        protected posY: number;
        protected spacing: number;
        constructor(_spacing: number, _notched?: number);
        construct(_parent: Element, _posX: number, _posY: number, _width: number, _fontFamily: string, _fontSize: number, _fontColor: string): void;
        clear(_value?: string): void;
        update(_value: number, _divider?: number, _hideIfLower?: number): void;
    }
    class AltitudeScroller extends Scroller {
        protected allTexts: Array<Element>;
        protected posX: number;
        protected posY: number;
        protected spacing: number;
        constructor(_nbItems: number, _spacing: number, _increment: number, _moduloValue: number, _notched?: number);
        construct(_parent: Element, _posX: number, _posY: number, _width: number, _fontFamily: string, _fontSize: number, _fontColor: string): void;
        clear(_value?: string): void;
        update(_value: number, _divider?: number, _hideIfLower?: number): void;
    }
    class SVGArc {
        private arc;
        private arcRadius;
        private arcSize;
        private arcColor;
        private percent;
        private angle;
        private gaugeCenterX;
        private gaugeCenterY;
        private gaugeCloseThreshold;
        private computedStartX;
        private computedStartY;
        private computedEndX;
        private computedEndY;
        private computedEndAngle;
        static readonly radiansPerPercent: number;
        init(_arcName: string, _radius: number, _size: number, _color: string): void;
        setPercent(_percent: any): void;
        translate(_x: any, _y: any): void;
        rotate(_angle: any): void;
        get svg(): Element;
        get centerX(): number;
        get centerY(): number;
        get radius(): number;
        get startX(): number;
        get startY(): number;
        get endX(): number;
        get endY(): number;
        get startAngle(): number;
        get endAngle(): number;
        get currentPercent(): number;
        private updateShape;
        private getArcPath;
    }
    class CurveTimeValuePair<T> {
        time: number;
        value: T;
        constructor(time: number, value: T);
    }
    class CurveTool {
        static NumberInterpolation(n1: number, n2: number, dt: number): number;
        static StringColorRGBInterpolation(c1: string, c2: string, dt: number): string;
    }
    class Curve<T> {
        private _values;
        interpolationFunction: (v1: T, v2: T, t: number) => T;
        add(time: number, value: T): void;
        evaluate(t: number): T;
        debugLog(): void;
    }
    class Dictionary {
        private items;
        changed: boolean;
        set(_key: any, _value: string): void;
        get(_key: any): string;
        remove(_key: any): void;
        exists(_key: any): boolean;
    }
    class Intersect {
        private rectIntersections;
        private rectTopLeft;
        private rectTopRight;
        private rectBottomRight;
        private rectBottomLeft;
        private rectWidth;
        private rectHeight;
        constructor();
        initRect(_width: number, _height: number): void;
        segmentVsRect(s1: IVec2, s2: IVec2, out1: IVec2, out2: IVec2): boolean;
        segmentVsSegment(a1: IVec2, a2: IVec2, b1: IVec2, b2: IVec2, out: IVec2): boolean;
    }
}
