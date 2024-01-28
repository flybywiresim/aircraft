/// <reference path="../../../../../../../../../fs-base-ui/html_ui/JS/common.d.ts" />

declare global {
    interface Document {
        createElement(tagName: 'a320-neo-ecam-gauge'): A320_Neo_ECAM_Common.Gauge;
    }

    namespace A320_Neo_ECAM_Common {
        class GaugeDefinition {
            startAngle: number;

            arcSize: number;

            minValue: number;

            maxValue: number;

            minRedValue: number;

            maxRedValue: number;

            warningRange: [number, number];

            dangerRange: [number, number];

            cursorLength: number;

            currentValuePos: Vec2;

            currentValueFunction: (() => void) | null;

            currentValuePrecision: number;

            currentValueBorderWidth: number;

            outerIndicatorFunction: (() => void) | null;

            outerDynamicArcFunction: (() => void) | null;

            extraMessageFunction: (() => void) | null;
        }

        class Gauge extends HTMLElement {
            viewBoxSize: Vec2;

            startAngle: number;

            warningRange: [number, number];

            dangerRange: [number, number];

            outerDynamicArcCurrentValues: [number, number];

            outerDynamicArcTargetValues: [number, number];

            extraMessageString: string;

            isActive: boolean;
            get mainArcRadius(): number;
            get graduationInnerLineEndOffset(): number;
            get graduationOuterLineEndOffset(): number;
            get graduationTextOffset(): number;
            get redArcInnerRadius(): number;
            get outerIndicatorOffset(): number;
            get outerIndicatorRadius(): number;
            get outerDynamicArcRadius(): number;
            get currentValueBorderHeight(): number;
            get extraMessagePosX(): number;
            get extraMessagePosY(): number;
            get extraMessageBorderPosX(): number;
            get extraMessageBorderPosY(): number;
            get extraMessageBorderWidth(): number;
            get extraMessageBorderHeight(): number;
            set active(isActive: boolean);
            get active(): boolean;
            polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number): Vec2;
            valueToAngle(value: number, radians: number): number;
            valueToDir(value: number): Vec2;
            init(gaugeDefinition: GaugeDefinition): void;
            addGraduation(value: number, showInnerMarker: boolean, text?: string, showOuterMarker?: boolean): void;
            refreshActiveState(): void;
            update(deltaTime: number): void;
            refreshMainValue(value: number, force?: boolean): void
            refreshOuterIndicator(value: number, force?: boolean): void
            refreshOuterDynamicArc(start: number, end: number, force?: boolean): void
        }
    }
}

export {};
