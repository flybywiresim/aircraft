declare const MAPPINGS: {
    FLEX: {
        ALIGN: {
            VERTICAL: {
                PARALLEL: {
                    top: string;
                    middle: string;
                    bottom: string;
                    stretch: string;
                };
                ORTHOGONAL: {
                    top: string;
                    middle: string;
                    bottom: string;
                    stretch: string;
                };
            };
            HORIZONTAL: {
                PARALLEL: {
                    left: string;
                    center: string;
                    right: string;
                    stretch: string;
                };
                ORTHOGONAL: {
                    left: string;
                    center: string;
                    right: string;
                    stretch: string;
                };
            };
        };
    };
    SVG: {
        ASPECT_RATIO: {
            contain: string;
            cover: string;
            fill: string;
        };
        POSITION: {
            X: {
                left: string;
                center: string;
                right: string;
            };
            Y: {
                top: string;
                middle: string;
                bottom: string;
            };
        };
    };
};
interface ElementWithOverrides extends HTMLElement {
    overrides?: {
        [attributeKey: string]: boolean;
    };
    transformChain?: string;
}
interface ExposedAttributeData {
    value: any;
    appliedTo: string;
    property: string;
}
interface ComponentStateData {
    timeline: UITimeline;
    name: string;
    animationMapping: {
        [s: string]: AnimationOptions;
    };
}
interface AttributeChangesData {
    styleChanges: {
        [P in keyof CSSStyleDeclaration]?: string;
    };
    attributeChanges: {
        [s: string]: string;
    };
}
interface StateOptions {
    loops?: number;
    playAnimation?: boolean;
    startAnimationAt?: number;
}
declare class UIResourceElement<ExposedAttributesUnionType extends string = string, ExposedChildrenNameUnionType extends string = string, StateUnionType extends string = string> extends UIElement implements ElementWithOverrides {
    private static m_dummyXMLDocument;
    private xmlDefinition;
    private m_exposedChildren;
    private m_exposedAttributes;
    private m_states;
    private m_activeState;
    private m_activeStateOptions;
    useUnscaledSizes: boolean;
    private resourcesPath?;
    private xmlPath?;
    getResourcesPath(): string;
    setResourcesPath(path: string): void;
    isTransparent(): boolean;
    get created(): boolean;
    set created(created: boolean);
    overrides: {
        [attributeKey: string]: boolean;
    };
    get componentName(): string;
    get componentGroup(): string;
    get componentPath(): string;
    connectedCallback(): void;
    Load(): Promise<boolean>;
    private applyBaseStyles;
    private parseXMLTree;
    private parseStyleValue;
    private parseDataValue;
    private getBlockName;
    private parseAsHTMLElement;
    private parseXMLAttributeData;
    private mapAttributeToElement;
    private applyTransform;
    private applyAttributeToElement;
    private parseStateData;
    private resolveResourceUrl;
    private applyLayoutToElement;
    protected applyDimension(attribute: Attr, element: ElementWithOverrides, styleChanges: {}): void;
    getStateNames(): string[];
    getState(): ComponentStateData;
    setState(newState: StateUnionType, options?: StateOptions): void;
    private updatePaths;
    protected getExposedChild(id: ExposedChildrenNameUnionType): HTMLElement;
    hasExposedAttribute(id: ExposedAttributesUnionType): boolean;
    private findExposedAttribute;
    getExposedAttribute(id: ExposedAttributesUnionType): string;
    getExposedAttributeNames(): string[];
    setExposedAttribute(id: ExposedAttributesUnionType, value: string): void;
    static addElementTo(path: string, element: HTMLElement, jsPath?: string): Promise<UIResourceElement>;
    static loadComponent(path: string, jsPath?: string): Promise<UIResourceElement>;
    static call(obj: UIResourceElement, fnc: Function, ...args: any[]): void;
}
