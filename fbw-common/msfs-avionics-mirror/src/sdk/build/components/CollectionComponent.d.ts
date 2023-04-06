import { DisplayComponent, ComponentProps, VNode } from './FSComponent';
/** The value retured when we add a item to the collection. */
export declare type CollectionComponentItemRef = string;
/**
 * The props for a CollectionComponent.
 */
export interface CollectionComponentProps extends ComponentProps {
    /** The element ID to use. */
    id: string;
}
/**
 * A component that lets you add and remove children.
 */
export declare class CollectionComponent<P extends CollectionComponentProps> extends DisplayComponent<P> {
    private items;
    private itemCounter;
    /**
     * Add a new child element.
     * @param node A VNode to add to the container.
     * @returns An identifier for the added element.
     */
    addItem(node: VNode): CollectionComponentItemRef;
    /**
     * Remove a child element.
     * @param id The ID of the child to remove.
     */
    removeItem(id: CollectionComponentItemRef): void;
    /**
     * Insert a child before an element.
     * @param node The node to insert
     * @param before The element to insert before.
     * @returns An identifier for the added element.
     */
    insertBefore(node: VNode, before: CollectionComponentItemRef): CollectionComponentItemRef;
    /**
     * Insert a child after an element.
     * @param node The node to insert
     * @param after The element to insert after.
     * @returns An identifier for the added element.
     */
    insertAfter(node: VNode, after: CollectionComponentItemRef): CollectionComponentItemRef;
    /**
     * Render the element.
     * @returns A VNode.
     */
    render(): VNode;
}
//# sourceMappingURL=CollectionComponent.d.ts.map