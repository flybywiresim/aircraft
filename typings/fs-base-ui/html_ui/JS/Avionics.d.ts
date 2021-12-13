/// <reference path="../../../types.d.ts" />
/// <reference path="./Types.d.ts" />

import {Heading, Latitude, NauticalMiles, Longitude} from "../../../types";

declare global {
    namespace Avionics {
        class Utils {
            static make_bcd16(arg: number): number;

            static make_adf_bcd32(arg: number): number;

            static make_xpndr_bcd16(arg: number): number;

            /**
             * Sets the element's innerHTML to newValue when different.
             */
            static diffAndSet(element: InnerHTML, newValue: string): void;

            /**
             * Sets the element's attribute with the given qualifiedName to newValue when different.
             */
            static diffAndSetAttribute(element: Element, qualifiedName: string, newValue: string): void;

            /**
             * Computes the coordinates at the given distance and bearing away from a latitude and longitude point.
             */
            static bearingDistanceToCoordinates(bearing: Heading, distance: NauticalMiles, referentialLat: Latitude,
                                                referentialLong: Longitude): LatLongAlt;

            /**
             * Computes the distance in nautical miles between two locations.
             */
            static computeDistance(x: LatLong | LatLongAlt, y: LatLong | LatLongAlt): NauticalMiles;

            /**
             * Computes the great circle heading between two locations.
             */
            static computeGreatCircleHeading(from: LatLong | LatLongAlt, to: LatLong | LatLongAlt): Heading;

            /**
             * Computes the great circle distance in nautical miles between two locations.
             */
            static computeGreatCircleDistance(x: LatLong | LatLongAlt, y: LatLong | LatLongAlt): NauticalMiles;

            static lerpAngle(from: number, to: number, d: number): number;

            static meanAngle(a: number, b: number): number;

            static diffAngle(a: number, b: number): number;

            static fmod(a: number, b: number): number;

            /**
             * Adds a "0" prefix to runway designators which have only one number.
             */
            static formatRunway(designation: string): string;

            static DEG2RAD: number;

            static RAD2DEG: number;

            static runwayRegex: RegExp;
        }

        class SVG {
            static NS: string;

            /**
             * Requests a SVG image from the given url and sets it on the imageElement.
             */
            static InlineSvg(url: string, imageElement: InnerHTML): void;

            static computeDashLine(startX: number, startY: number, length: number, steps: number, width: number, color: string): SVGElement;
        }

        class SVGGraduation {
        }

        class Scroller {
            constructor(nbItems: number, increment: number, canBeNegative?: boolean,
                        moduloValue?: number, notched?: number);

            offsetY: number;

            scroll(value: number): void;
            get increment(): number;
            /**
             * Getter with side-effects: Scroller's index is set to 0.
             */
            get firstValue(): number;
            /**
             * Getter with side-effects: Scroller's index is incremented by 1.
             */
            get nextValue(): number;
            getCurrentValue(): number;
        }

        class AirspeedScroller extends Scroller {
            constructor(spacing: number, notched?: number);

            allTexts: SVGTextElement[];
            posX: number;
            posY: number;
            spacing: number;

            construct(parent: Node, posX: number, posY: number, width: number, fontFamily: string,
                      fontSize: number, fontColor: string): void;
            clear(value?: string): void;
            update(value: number, divider?: number, hideIfLower?: number): void;
        }

        class AltitudeScroller extends Scroller {
            constructor(nbItems: number, spacing: number, increment: number, moduloValue: number, notched: number);

            allTexts: SVGTextElement[];
            posX: number;
            posY: number;
            spacing: number;

            construct(parent: Node, posX: number, posY: number, width: number, fontFamily: string,
                      fontSize: number, fontColor: string): void;
            clear(value?: string): void;
            update(value: number, divider?: number, hideIfLower?: number): void;
        }

        class SVGArc {
            static radiansPerPercent: number;

            percent: number;
            angle: number;
            gaugeCenterX: number;
            gaugeCenterY: number;
            gaugeCloseThreshold: number;
            computedStartX: number;
            computedStartY: number;
            computedEndX: number;
            computedEndY: number;
            computedEndAngle: number;

            arc?: SVGPathElement;
            arcRadius?: number;
            arcSize?: number;
            arcColor?: string;

            init(arcName: string, radius: number, size: number, color: string): void;
            setPercent(percent: number): void;
            translate(x: number, y: number): void;
            rotate(angle: number): void;
            get svg(): SVGPathElement | undefined;
            get centerX(): number;
            get centerY(): number;
            get radius(): number | undefined;
            get startX(): number;
            get startY(): number;
            get endX(): number;
            get endY(): number;
            get startAngle(): number;
            get endAngle(): number;
            get currentPercent(): number;
            updateShape(): void;
            getArcPath(percent: number, radius: number): string;
        }

        class CurveTimeValuePair {
            constructor(time: number, value: any);

            time: number;
            value: any;
        }

        class CurveTool {
            static NumberInterpolation(n1: number, n2: number, dt: number): number;
            static StringColorRGBInterpolation(c1: string, c2: string, dt: number): string;
        }

        class Curve {
            add(time: number, value: any): void;
            evaluate(time: number): number | string;
            debugLog(): void;
        }

        class DictionaryItem {
            key?: any;
            value?: any;
        }

        class Dictionary {
            items: DictionaryItem[];
            changed: boolean;

            set(key: any, value: any): void;
            get(key: any): any | undefined;
            remove(key: any): void;
            exists(key: any): boolean;
        }
    }
}

export {};
