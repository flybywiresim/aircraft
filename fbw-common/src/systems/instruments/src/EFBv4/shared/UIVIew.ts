import { DisplayComponent, EventBus, FSComponent, NodeReference, VNode } from '@microsoft/msfs-sdk';

import { busContext } from '../Contexts';

/**
 * EFB UI View
 */
export interface UIVIew {
    /** The root ref to the main element of the view */
    readonly rootRef: NodeReference<HTMLElement>;

    /** Whether the object is a UIVIew */
    readonly isUIVIew: true;

    /** Callback fired when the view is paused */
    pause(): void;

    /** Callback fired when the view is resumed */
    resume(): void;

    /** Callback fired when the view is destroyed */
    destroy(): void;
}

/**
 * Utils for {@link UIVIew}
 */
export class UIVIewUtils {
    /**
     * Returns whether a value is UIVIew
     */
    public static isUIVIew(thing: any): thing is UIVIew {
        return thing !== null && thing !== undefined && typeof thing === 'object' && 'isUIVIew' in thing && thing.isUIVIew === true;
    }
}

/**
 * Abstract implementation of {@link UIVIew}
 */
export abstract class AbstractUIView<T = any> extends DisplayComponent<T, [EventBus]> implements UIVIew {
    public readonly rootRef = FSComponent.createRef<HTMLElement>();

    public override contextType = [busContext] as const;

    isUIVIew = true as const;

    /**
     * Obtains the event bus via context
     */
    protected get bus(): EventBus {
        return this.getContext(busContext).get();
    }

    pause(): void {
        // noop
    }

    resume(): void {
        // noop
    }

    destroy(): void {
        // noop
    }

    abstract render(): VNode | null;
}
