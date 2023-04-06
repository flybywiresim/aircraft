import { FSComponent, DisplayComponent } from './FSComponent';
/**
 * A component that lets you add and remove children.
 */
export class CollectionComponent extends DisplayComponent {
    constructor() {
        super(...arguments);
        this.items = new Array();
        this.itemCounter = 0;
    }
    /**
     * Add a new child element.
     * @param node A VNode to add to the container.
     * @returns An identifier for the added element.
     */
    addItem(node) {
        const id = `${this.props.id}_${this.itemCounter++}`;
        FSComponent.render(FSComponent.buildComponent("div", { id: id }, node), document.getElementById(this.props.id));
        return id;
    }
    /**
     * Remove a child element.
     * @param id The ID of the child to remove.
     */
    removeItem(id) {
        FSComponent.remove(document.getElementById(id));
    }
    /**
     * Insert a child before an element.
     * @param node The node to insert
     * @param before The element to insert before.
     * @returns An identifier for the added element.
     */
    insertBefore(node, before) {
        const id = `${this.props.id}_${this.itemCounter++}`;
        FSComponent.renderBefore(FSComponent.buildComponent("div", { id: id }, node), document.getElementById(before));
        return id;
    }
    /**
     * Insert a child after an element.
     * @param node The node to insert
     * @param after The element to insert after.
     * @returns An identifier for the added element.
     */
    insertAfter(node, after) {
        const id = `${this.props.id}_${this.itemCounter++}`;
        FSComponent.renderAfter(FSComponent.buildComponent("div", { id: id }, node), document.getElementById(after));
        return id;
    }
    /**
     * Render the element.
     * @returns A VNode.
     */
    render() {
        return (FSComponent.buildComponent("div", { id: this.props.id }));
    }
}
