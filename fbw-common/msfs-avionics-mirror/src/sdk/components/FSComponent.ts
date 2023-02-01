/* eslint-disable no-inner-declarations */
import { ComputedSubject } from '../utils/ComputedSubject';
import { MappedSubject, Subject } from '../utils/Subject';
import { Subscribable } from '../utils/Subscribable';
import { JSXDefinitions } from './JSXDefinitions';

/**
 * An interface that describes a virtual DOM node.
 */
export interface VNode {
  /** The created instance of the node. */
  instance: NodeInstance;

  /**
   * The root DOM node of this VNode
   * @type {Node}
   * @memberof VNode
   */
  root?: Node;

  /** Any properties to apply to the node. */
  props: any;

  /** The children of this node. */
  children: VNode[] | null;
}

/** A union of possible types of a VNode instance. */
export type NodeInstance = HTMLElement | SVGElement | DisplayComponent<any> | string | number | null;

/** A union of possible child element types. */
type DisplayChildren = VNode | string | number | (VNode | string | number)[] | null;

/** A releative render position. */
export enum RenderPosition {
  Before,
  After,
  In
}

/** Mapped length undefined tuple to a tuple of Contexts. */
export type ContextTypes<T extends unknown[]> = {
  [Index in keyof T]: Context<T[Index]>
}

/** Mapped length undefined tuple to a tuple of context subscriptions. */
export type ContextSubcriptions<T extends unknown[]> = {
  [Index in keyof T]: Subscribable<T[Index]>
}

/**
 * A display component in the component framework.
 * @typedef P The type of properties for this component.
 * @typedef C The type of context that this component might have.
 */
export abstract class DisplayComponent<P, Contexts extends unknown[] = []> {

  /** The properties of the component. */
  public props: P & ComponentProps;

  /** The context on this component, if any. */
  public context?: [...ContextSubcriptions<Contexts>] = undefined;

  /** The type of context for this component, if any. */
  public readonly contextType?: readonly [...ContextTypes<Contexts>] = undefined;

  /**
   * Creates an instance of a DisplayComponent.
   * @param props The propertis of the component.
   */
  constructor(props: P) {
    this.props = props;
  }

  /**
   * A callback that is called before the component is rendered.
   */
  public onBeforeRender(): void { return; }

  /**
   * A callback that is called after the component is rendered.
   * @param node The component's VNode.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onAfterRender(node: VNode): void { return; }

  /**
   * Renders the component.
   * @returns A JSX element to be rendered.
   */
  public abstract render(): VNode | null;

  /**
   * Destroys this component.
   */
  public destroy(): void { return; }

  /**
   * Gets a context data subscription from the context collection.
   * @param context The context to get the subscription for.
   * @returns The requested context.
   * @throws An error if no data for the specified context type could be found.
   */
  protected getContext(context: ContextTypes<Contexts>[number]): ContextSubcriptions<Contexts>[number] {
    if (this.context !== undefined && this.contextType !== undefined) {
      const index = this.contextType.indexOf(context);
      return this.context[index];
    }

    throw new Error('Could not find the provided context type.');
  }
}

/**
 * Base properties for display components.
 */
export class ComponentProps {

  /** The children of the display component. */
  public children?: DisplayChildren[];

  /** A reference to the display component. */
  public ref?: NodeReference<any>;
}

/**
 * A constructor signature for a DisplayComponent.
 */
export type DisplayComponentFactory<P extends ComponentProps, Contexts extends Context<unknown>[] = []> = new (props: P) => DisplayComponent<P, Contexts>;

/**
 * A type for the Fragment function.
 */
export type FragmentFactory = (props: ComponentProps) => DisplayChildren[] | undefined;

/**
 * A reference to a component or element node.
 */
export class NodeReference<T extends (DisplayComponent<any> | HTMLElement | SVGElement)> {

  /** The internal reference instance. */
  private _instance: T | null = null;

  /**
   * The instance of the element or component.
   * @returns The instance of the element or component.
   */
  public get instance(): T {
    if (this._instance !== null) {
      return this._instance;
    }

    throw new Error('Instance was null.');
  }

  /**
   * Sets the value of the instance.
   */
  public set instance(val: T) {
    this._instance = val;
  }

  /**
   * Gets the instance, or null if the instance is not populated.
   * @returns The component or element instance.
   */
  public getOrDefault(): T | null {
    return this._instance;
  }
}

/**
 * Provides a context of data that can be passed down to child components via a provider.
 */
class Context<T> {
  /**
   * The provider component that can be set to a specific context value.
   * @param props The props of the provider component.
   * @returns A new context provider.
   */
  public readonly Provider = (props: ContextProviderProps<T>): ContextProvider<T> => new ContextProvider<T>(props, this);

  /**
   * Creates an instance of a Context.
   * @param defaultValue The default value of this context.
   */
  constructor(public readonly defaultValue: T) { }
}

/**
 * Props on the ContextProvider component.
 */
interface ContextProviderProps<T> extends ComponentProps {

  /** The value of the context underneath this provider. */
  value: T;
}

/**
 * A provider component that can be set to a specific context value.
 */
class ContextProvider<T> extends DisplayComponent<ContextProviderProps<T>> {

  /**
   * Creates an instance of a ContextProvider.
   * @param props The props on the component.
   * @param parent The parent context instance for this provider.
   */
  constructor(props: ContextProviderProps<T>, public readonly parent: Context<T>) {
    super(props);
  }

  /** @inheritdoc */
  public render(): VNode | null {
    const children = this.props.children ?? [];
    return FSComponent.buildComponent(FSComponent.Fragment, this.props, ...children);
  }
}

/**
 * The FS component namespace.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace FSComponent {

  /**
   * Definitions for JSX transpilation.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export import JSX = JSXDefinitions;

  /**
   * Valid SVG element tags.
   */
  const svgTags = {
    'circle': true,
    'clipPath': true,
    'color-profile': true,
    'cursor': true,
    'defs': true,
    'desc': true,
    'ellipse': true,
    'g': true,
    'image': true,
    'line': true,
    'linearGradient': true,
    'marker': true,
    'mask': true,
    'path': true,
    'pattern': true,
    'polygon': true,
    'polyline': true,
    'radialGradient': true,
    'rect': true,
    'stop': true,
    'svg': true,
    'text': true
  };

  /**
   * A fragment of existing elements with no specific root.
   * @param props The fragment properties.
   * @returns The fragment children.
   */
  export function Fragment(props: ComponentProps): DisplayChildren[] | undefined {
    return props.children;
  }

  /**
   * Builds a JSX based FSComponent.
   * @param type The DOM element tag that will be built.
   * @param props The properties to apply to the DOM element.
   * @param children Any children of this DOM element.
   * @returns The JSX VNode for the component or element.
   */
  // eslint-disable-next-line no-inner-declarations
  export function buildComponent<T extends DisplayComponentFactory<P>
    | keyof HTMLElementTagNameMap
    | keyof SVGElementTagNameMap
    | FragmentFactory, P extends ComponentProps>(
      type: T,
      props: P | null,
      ...children: DisplayChildren[]): VNode | null {
    let vnode: VNode | null = null;

    if (typeof type === 'string') {

      let element: HTMLElement | SVGElement;
      if ((svgTags as any)[type] !== undefined) {
        element = document.createElementNS('http://www.w3.org/2000/svg', type as keyof SVGElementTagNameMap);
      } else {
        element = document.createElement(type as keyof HTMLElementTagNameMap);
      }

      if (props !== null) {
        for (const key in props) {
          if (key === 'ref' && props.ref !== undefined) {
            props.ref.instance = element;
          } else {
            const prop = (props as any)[key];
            if (prop instanceof Subject || prop instanceof MappedSubject || prop instanceof ComputedSubject) {
              element.setAttribute(key, prop.get());
              prop.sub((v) => {
                element.setAttribute(key, v);
              });
            } else {
              element.setAttribute(key, prop);
            }
          }
        }
      }

      vnode = {
        instance: element,
        props: props,
        children: null
      };

      vnode.children = createChildNodes(vnode, children);
    } else if (typeof type === 'function') {
      if (children !== null && props === null) {
        props = {
          children: children
        } as P;
      } else if (props !== null) {
        props.children = children;
      }

      if (typeof type === 'function' && type.name === 'Fragment') {
        let childNodes = (type as FragmentFactory)(props as any) as VNode[] | null;

        //Handle the case where the single fragment children is an array of nodes passsed down from above
        if (childNodes !== null && childNodes.length > 0 && Array.isArray(childNodes[0])) {
          childNodes = childNodes[0];
        }

        vnode = {
          instance: null,
          props,
          children: childNodes
        };
      } else {
        let instance: DisplayComponent<P>;
        try {
          instance = (type as any)(props as any);
        } catch {
          instance = new (type as DisplayComponentFactory<P>)(props as any);
        }

        if (props !== null && props.ref !== null && props.ref !== undefined) {
          props.ref.instance = instance;
        }

        if (instance.contextType !== undefined) {
          instance.context = (instance.contextType as readonly any[]).map(c => Subject.create<any>(c.defaultValue)) as any;
        }

        vnode = {
          instance,
          props,
          children: [instance.render() as VNode]
        };
      }
    }

    return vnode;
  }

  /**
   * Creates the collection of child VNodes.
   * @param parent The parent VNode.
   * @param children The JSX children to convert to nodes.
   * @returns A collection of child VNodes.
   */
  export function createChildNodes(parent: VNode, children: DisplayChildren[]): VNode[] | null {
    let vnodes: VNode[] | null = null;
    if (children !== null && children !== undefined && children.length > 0) {
      vnodes = [];

      for (const child of children) {
        if (child !== null) {
          if (child instanceof Subject || child instanceof MappedSubject || child instanceof ComputedSubject) {
            const subjectValue = child.get().toString();
            const node: VNode = {
              instance: subjectValue === '' ? ' ' : subjectValue,
              children: null,
              props: null,
              root: undefined,
            };
            child.sub((v) => {
              if (node.root !== undefined) {
                // TODO workaround. gotta find a solution for the text node vanishing when text is empty
                node.root.nodeValue = v === '' ? ' ' : v.toString();
              } else {
                // for debugging
                // console.warn('Subject has no node!');
              }
            });
            vnodes.push(node);
          } else if (child instanceof Array) {
            const arrayNodes = createChildNodes(parent, child);

            if (arrayNodes !== null) {
              vnodes.push(...arrayNodes);
            }
          } else if (typeof child === 'string' || typeof child === 'number') {
            vnodes.push(createStaticContentNode(child));
          } else if (typeof child === 'object') {
            vnodes.push(child);
          }
        }
      }
    }

    return vnodes;
  }

  /**
   * Creates a static content VNode.
   * @param content The content to create a node for.
   * @returns A static content VNode.
   */
  export function createStaticContentNode(content: string | number): VNode {
    return {
      instance: content,
      children: null,
      props: null
    };
  }

  /**
   * Renders a VNode to a DOM element.
   * @param node The node to render.
   * @param element The DOM element to render to.
   * @param position The RenderPosition to put the item in.
   */
  export function render(node: VNode, element: HTMLElement | SVGElement | null, position = RenderPosition.In): void {
    if (node.children && node.children.length > 0 && element !== null) {
      const componentInstance = node.instance as DisplayComponent<any> | null;

      if (componentInstance !== null && componentInstance.onBeforeRender !== undefined) {
        componentInstance.onBeforeRender();
      }

      if (node.instance instanceof HTMLElement || node.instance instanceof SVGElement) {
        insertNode(node, position, element);
      } else {
        for (const child of node.children) {
          insertNode(child, position, element);
        }
      }

      const instance = node.instance;
      if (instance instanceof ContextProvider) {
        visitNodes(node, (n: VNode): boolean => {
          const nodeInstance = n.instance as DisplayComponent<any> | null;

          if (nodeInstance !== null && nodeInstance.contextType !== undefined) {
            const contextSlot = (nodeInstance.contextType as readonly any[]).indexOf(instance.parent);

            if (contextSlot >= 0) {
              if (nodeInstance.context === undefined) {
                nodeInstance.context = [];
              }

              (nodeInstance.context as Subject<any>[])[contextSlot].set(instance.props.value);
            }

            if (nodeInstance instanceof ContextProvider && nodeInstance !== instance && nodeInstance.parent === instance.parent) {
              return true;
            }
          }

          return false;
        });
      }

      if (componentInstance !== null && componentInstance.onAfterRender !== undefined) {
        componentInstance.onAfterRender(node);
      }
    }
  }

  /**
   * Inserts a node into the DOM.
   * @param node The node to insert.
   * @param position The position to insert the node in.
   * @param element The element to insert relative to.
   */
  function insertNode(node: VNode, position: RenderPosition, element: HTMLElement | SVGElement): void {
    if (node.instance instanceof HTMLElement || node.instance instanceof SVGElement) {
      switch (position) {
        case RenderPosition.In:
          element.appendChild(node.instance);
          node.root = element.lastChild ?? undefined;
          break;
        case RenderPosition.Before:
          element.insertAdjacentElement('beforebegin', node.instance);
          node.root = element.previousSibling ?? undefined;
          break;
        case RenderPosition.After:
          element.insertAdjacentElement('afterend', node.instance);
          node.root = element.nextSibling ?? undefined;
          break;
      }
      if (node.children !== null) {
        for (const child of node.children) {
          insertNode(child, RenderPosition.In, node.instance);
        }
      }
    } else if (typeof node.instance === 'string') {
      switch (position) {
        case RenderPosition.In:
          element.insertAdjacentHTML('beforeend', node.instance);
          node.root = element.lastChild ?? undefined;
          break;
        case RenderPosition.Before:
          element.insertAdjacentHTML('beforebegin', node.instance);
          node.root = element.previousSibling ?? undefined;
          break;
        case RenderPosition.After:
          element.insertAdjacentHTML('afterend', node.instance);
          node.root = element.nextSibling ?? undefined;
          break;
      }
    } else if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        render(node[i], element);
      }
    } else {
      render(node, element);
    }
  }

  /**
   * Render a node before a DOM element.
   * @param node The node to render.
   * @param element The element to render boeore.
   */
  export function renderBefore(node: VNode, element: HTMLElement | SVGElement | null): void {
    render(node, element, RenderPosition.Before);
  }

  /**
   * Render a node after a DOM element.
   * @param node The node to render.
   * @param element The element to render after.
   */
  export function renderAfter(node: VNode, element: HTMLElement | SVGElement | null): void {
    render(node, element, RenderPosition.After);
  }

  /**
   * Remove a previously rendered element.  Currently, this is just a simple
   * wrapper so that all of our high-level "component maniuplation" state is kept
   * in the FSComponent API, but it's not doing anything other than a simple
   * remove() on the element.   This can probably be enhanced.
   * @param element The element to remove.
   */
  export function remove(element: HTMLElement | SVGElement | null): void {
    if (element !== null) {
      element.remove();
    }
  }

  /**
   * Creates a component or element node reference.
   * @returns A new component or element node reference.
   */
  export function createRef<T extends (DisplayComponent<any> | HTMLElement | SVGElement)>(): NodeReference<T> {
    return new NodeReference<T>();
  }

  /**
   * Creates a new context to hold data for passing to child components.
   * @param defaultValue The default value of this context.
   * @returns A new context.
   */
  export function createContext<T>(defaultValue: T): Context<T> {
    return new Context<T>(defaultValue);
  }

  /**
   * Visits VNodes with a supplied visitor function within the given children tree.
   * @param node The node to visit.
   * @param visitor The visitor function to inspect VNodes with. Return true if the search should stop at the visited
   * node and not proceed any further down the node's children.
   * @returns True if the visitation should break, or false otherwise.
   */
  export function visitNodes(node: VNode, visitor: (node: VNode) => boolean): boolean {
    const stopVisitation = visitor(node);
    if (!stopVisitation && node.children !== null) {
      for (let i = 0; i < node.children.length; i++) {
        visitNodes(node.children[i], visitor);
      }
    }

    return true;
  }

  /**
   * An empty callback handler.
   */
  export const EmptyHandler = (): void => { return; };
}

const Fragment = FSComponent.Fragment;
export { Fragment };