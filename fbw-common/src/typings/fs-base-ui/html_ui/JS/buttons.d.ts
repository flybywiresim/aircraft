/// <reference path="./common.d.ts" />

declare global {
    interface Document {
        createElement(tagName: 'ui-button'): ButtonElement;
        createElement(tagName: 'ui-navigation-bloc'): UINavigationBlocElement;
        createElement(tagName: 'external-link'): ExternalLink;
        createElement(tagName: 'internal-link'): InternalLink;
    }

    class ButtonElement extends TemplateElement {
        onClick: (e: Event) => void;

        onMouseEnter: () => void;

        onMouseLeave: () => void;

        onMouseDown: () => void;

        onMouseUp: () => void;

        privateOnKeysMode: () => void;

        keydownRouter: (e: Event) => void;

        keyupRouter: (e: Event) => void;

        OnNavigationModeChanged: () => void;

        OnLockButtonChanged: () => void;

        get childActiveClass(): string;
        get canFocusOnMouseOver(): boolean;
        get interactive(): boolean;
        get hasMouseOver(): boolean;
        set hasMouseOver(value: boolean);
        get focusedClassName(): string;
        get defaultClick(): boolean;
        get defaultSoundType(): string;
        get soundType(): string;
        set soundType(type: string);
        disconnectedCallback(): void;
        canPlaySound(): boolean;
        set playSoundOnValidate(value: boolean);
        canPlaySoundOnValidate(): boolean;
        onLeave(): void;
        mouseDown(): void;
        onKeysMode(): void;
        mouseUp(): void;
        hasSound(): boolean;
        onHover(): void;
        checkInputbar(): void;
        getInputBarButtonName(): string;
        get tooltip(): string | null;
        get tooltipFollowsMouse(): boolean;
        get tooltipPosition(): [number, number];
        get cuttableTextBoxes(): ArrayLike<NodeListOf<any>>;
        needsTooltip(): boolean;
        get maxTooltipWidth(): number;
        updateTooltip(): void;
        get canBeSelected(): boolean;
        get validateOnReturn(): boolean;
        onKeyUp(keycode): boolean;
        onKeyDown(keycode): boolean;
        CanRegisterButton(): boolean;
        IsActive(): boolean;
        set selected(value: boolean);
        get selected(): boolean;
        Validate(): void
        onValidate(): void;
        findChildButton(parent: Node): boolean;
    }

    class UINavigationBlocElement extends ButtonElement {
        onMouseMode: () => void;

        onActiveElementChanged: () => void;

        exitInside: () => void;

        focusByKeys(keycode: number): void;
        get needInputbar(): boolean;
        forceInsideMode(): void;
        setInsideMode(value: boolean): void;
        getKeyNavigationDirection(): KeyNavigationDirection;
    }

    class ExternalLink extends ButtonElement {
    }

    class InternalLink extends ButtonElement {
    }
}

export {};
