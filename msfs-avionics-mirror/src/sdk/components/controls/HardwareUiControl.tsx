import { ComponentProps, DisplayComponent, FSComponent, VNode } from '../FSComponent';

/**
 * A handler for events emitted by UiControl2.
 * @template T The type of event sources.
 * @template Args A tuple type describing additional arguments for an event after the source control. Defaults to an
 * empty (zero-length) tuple.
 */
export type UiControlEventHandler<T extends HardwareUiControl<any, any>, Args extends any[] = []> = (source: T, ...args: Args) => boolean;

/** A requested scroll direction. */
export type ScrollDirection = 'forward' | 'backward';

/**
 * Maps an event definition type to an event handler interface. Each event in the definition type is mapped to a
 * handler with the name `on[Event]`.
 */
export type UiControlEventHandlers<Events> = {
  [Event in keyof Events as `on${Event & string}`]: Events[Event]
};

/**
 * Maps an event definition type to a prop event handler interface. Each event in the definition type is mapped to an
 * optional handler with the name `on[Event]`.
 */
export type UiControlPropEventHandlers<Events> = Partial<UiControlEventHandlers<Events>>;

/** Properties on the UiControl2 component. */
export interface HardwareUiControlProps extends ComponentProps {

  /** Whether or not the inner FMS knob scrolls also by default. */
  innerKnobScroll?: boolean;

  /**
   * When enabled, scroll commands will not propagate from this control to its parent while
   * the control is focused.
   */
  isolateScroll?: boolean;

  /** Whether the control requires one of its child controls to be focused for itself to be focused. */
  requireChildFocus?: boolean;

  /** An event called when the control is focused. */
  onFocused?: (source: HardwareUiControl) => void;

  /** An event called when the control loses focus. */
  onBlurred?: (source: HardwareUiControl) => void;

  /** An event called when the control is disabled. */
  onDisabled?: (source: HardwareUiControl) => void;

  /** An event called when the control is enabled. */
  onEnabled?: (source: HardwareUiControl) => void;

  /** A function which returns how the control should focus its children when it is focused from a scroll. */
  getFocusPositionOnScroll?: (direction: ScrollDirection) => FocusPosition;

  /** An event called when the control is scrolled. */
  onScroll?: (direction: ScrollDirection) => boolean;

  /** An event called when the scroll operation has completed. */
  onAfterScroll?: (control: HardwareUiControl, index: number) => void;

  /** An event called when a control is registered with this control. */
  onRegistered?: (source: HardwareUiControl) => void;

  /** An event called when a control is unregistered with this control. */
  onUnregistered?: (source: HardwareUiControl) => void;

  /** An event called when the control is destroyed. */
  onDestroyed?: (source: HardwareUiControl) => void;

  /**
   * A function which reconciles the focus state of the control's children when the control is focused with no focused
   * children after a child has been blurred.
   * @param index The index of the child control that was blurred.
   * @param child The child control that was blurred.
   * @returns The index of the child to focus, or a blur reconciliation strategy.
   */
  reconcileChildBlur?: (index: number, child: HardwareUiControl) => number | BlurReconciliation;
}

/**
 * The item position to focus a component's children when performing a focus operation.
 */
export enum FocusPosition {
  /** The component's most recently focused descendants will be focused. */
  MostRecent = 'MostRecent',

  /** The first focus-able child at each node in the descendant tree will be focused. */
  First = 'First',

  /** The last focus-able child at each node in the descendant tree will be focused. */
  Last = 'Last',

  /** No child components will be focused. */
  None = 'None'
}

/**
 * A strategy to focus a component's children as part of a blur reconciliation operation.
 */
export enum BlurReconciliation {
  /** The component's first focus-able child will be focused. */
  First = 'First',

  /** The component's last focus-able child will be focused. */
  Last = 'Last',

  /**
   * The component's next focus-able child after the child that was blurred will be focused. If no such child exists,
   * then the last focus-able child before the child that was blurred will be focused.
   */
  Next = 'Next',

  /**
   * The component's last focus-able child before the child that was blurred will be focused. If no such child exists,
   * then the next focus-able child after the child that was blurred will be focused.
   */
  Prev = 'Prev',

  /** No child components will be focused. */
  None = 'None',
}

/**
 * An abstract implementation of a component that forms the base of a Garmin-like UI control system. Subclasses should
 * implement an appropriate event handler interface (using the utility type `UiControlEventHandlers<Events>`) and have
 * their props implement the corresponding prop event handler interface (using the utility type
 * `UiControlPropEventHandlers<Events>`).
 * @template E An event definition type for events supported by this control.
 * @template P The component prop type for this control.
 */
export abstract class HardwareUiControl<E extends Record<string, any> = Record<string, any>,
  P extends HardwareUiControlProps = HardwareUiControlProps> extends DisplayComponent<P> {

  protected registeredControls: HardwareUiControl<E>[] | undefined;

  protected focusedIndex = -1;

  private parent: HardwareUiControl<E> | undefined;

  private _isDisabled = false;

  private _isFocused = false;

  private _isIsolated = false;

  private readonly _UICONTROL_ = true;

  /**
   * Creates an instance of a HardwareUiControl.
   * @param props The props for this component.
   */
  constructor(props: P) {
    super(props);

    this._isIsolated = this.props.isolateScroll !== undefined && this.props.isolateScroll;
  }

  /**
   * Gets the current number of registered child controls.
   * @returns The current number of registered child controls.
   */
  public get length(): number {
    if (this.registeredControls !== undefined) {
      return this.registeredControls.length;
    }

    return 0;
  }

  /**
   * Gets whether or not the control is currently disabled.
   * @returns True if disabled, false otherwise.
   */
  public get isDisabled(): boolean {
    return this._isDisabled;
  }

  /**
   * Gets whether or not the control is currently focused.
   * @returns True if disabled, false otherwise.
   */
  public get isFocused(): boolean {
    return this._isFocused;
  }

  /**
   * Gets whether or not the control is currently in scroll isolation.
   * @returns True if currently in scroll isolation, false otherwise.
   */
  public get isIsolated(): boolean {
    return this._isIsolated;
  }

  /**
   * An event called when the control receives focus.
   * @param source The control that emitted this event.
   */
  protected onFocused(source: HardwareUiControl<E>): void {
    this.props.onFocused && this.props.onFocused(source);
  }

  /**
   * An event called when the control is blurred.
   * @param source The control that emitted this event.
   */
  protected onBlurred(source: HardwareUiControl<E>): void {
    this.props.onBlurred && this.props.onBlurred(source);
  }

  /**
   * An event called when the control is enabled.
   * @param source The control that emitted this event.
   */
  protected onEnabled(source: HardwareUiControl<E>): void {
    this.props.onEnabled && this.props.onEnabled(source);
  }

  /**
   * An event called when the control is disabled.
   * @param source The control that emitted this event.
   */
  protected onDisabled(source: HardwareUiControl<E>): void {
    this.props.onDisabled && this.props.onDisabled(source);
  }

  /**
   * An event called when a control is registered with this control.
   * @param source The control that emitted this event.
   */
  protected onRegistered(source: HardwareUiControl<E>): void {
    this.props.onRegistered && this.props.onRegistered(source);
  }

  /**
   * An event called when a control is unregistered from this control.
   * @param source The control that emitted this event.
   */
  protected onUnregistered(source: HardwareUiControl<E>): void {
    this.props.onUnregistered && this.props.onUnregistered(source);
  }

  /**
   * Gets the focus position to apply when this control is focused from a scroll.
   * @param direction The direction of the scroll.
   * @returns The focus position to apply when this control is focused from a scroll.
   */
  protected getFocusPositionOnScroll(direction: ScrollDirection): FocusPosition {
    if (this.props.getFocusPositionOnScroll) {
      return this.props.getFocusPositionOnScroll(direction);
    }

    return direction === 'forward' ? FocusPosition.First : FocusPosition.Last;
  }

  /**
   * An event called when the control is scrolled.
   * @param direction The direction that is being requested to scroll.
   * @returns True if this control handled this event, false otherwise.
   */
  protected onScroll(direction: ScrollDirection): boolean {
    if (this.registeredControls !== undefined && this.registeredControls.length > 0) {
      const delta = direction === 'forward' ? 1 : -1;
      for (let i = this.focusedIndex + delta; direction === 'forward' ? i < this.registeredControls.length : i >= 0; i += delta) {
        const controlToFocus = this.registeredControls[i];

        if (controlToFocus.focus(controlToFocus.getFocusPositionOnScroll(direction))) {
          this.onAfterScroll(controlToFocus, i);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * An event called when a scroll operation has completed.
   * @param control The control that was scrolled to.
   * @param index The index of the control in the collection of registered controls.
   */
  protected onAfterScroll(control: HardwareUiControl<E>, index: number): void {
    this.props.onAfterScroll && this.props.onAfterScroll(control, index);
  }

  /**
   * Scrolls the currently focused control in the supplied direction.
   * @param direction The direction that is being requested to scroll.
   * @returns True if propagation should be stopped, false otherwise.
   */
  public scroll(direction: ScrollDirection): boolean {
    if (!this.isFocused) {
      return false;
    }

    const controlToScroll = this.getFocusedComponentPath()[0];
    if (controlToScroll !== undefined) {
      return controlToScroll.tryPerformScroll(direction);
    } else {
      return this.tryPerformScroll(direction);
    }
  }

  /**
   * Attempts to perform a scroll operation on the control, propagating the operation
   * upward in the tree if the control does not handle the operation.
   * @param direction The direction that is being requested to scroll.
   * @returns True if propagation should be stopped, false otherwise.
   */
  private tryPerformScroll(direction: ScrollDirection): boolean {
    let handled = false;
    if (this.props.onScroll !== undefined) {
      handled = this.props.onScroll(direction);
    } else {
      handled = this.onScroll(direction);
    }

    if (!handled) {
      const currentlyIsolated = this.isFocused && this.isIsolated;
      if (this.parent !== undefined && !currentlyIsolated) {
        return this.parent.tryPerformScroll(direction);
      } else if (currentlyIsolated) {
        return true;
      }
    }

    return handled;
  }

  /**
   * A method which is called when this control receives an interaction event.
   * @param event The event.
   * @returns True if the event was handled, false otherwise.
   */
  public abstract onInteractionEvent(event: keyof E): boolean;

  /**
   * Triggers an event on this control. The event will first be routed to the deepest focused descendent of this
   * control and will propagate up the control tree until it is handled or there are no more controls to which to
   * propagate.
   * @param event The event to trigger.
   * @param source The source of the event. Defaults to this if not supplied.
   * @param args Additional arguments to pass to the event handler.
   * @returns True if the event was handled, false otherwise.
   */
  public triggerEvent(event: keyof E, source: HardwareUiControl, ...args: any[]): boolean {
    const canListen = this.isFocused || this.parent === undefined;
    if (!canListen) {
      return false;
    }

    const focusedControl = this.getFocusedComponentPath()[0];
    if (focusedControl !== undefined) {
      return focusedControl.propagateEvent(event, focusedControl, args);
    }

    return false;
  }

  /**
   * Propagates an event up the control tree.
   * @param event The event to propagate.
   * @param source The source of the event.
   * @param args Additional arguments to pass to the event handler.
   * @returns True if the event was handled, false otherwise.
   */
  private propagateEvent(event: keyof E, source: HardwareUiControl<E>, args: any[]): boolean {
    const handler = this[`on${event}` as keyof this] as unknown as UiControlEventHandler<HardwareUiControl<E>, any> | undefined;
    const propHandler = this.props[`on${event}` as keyof P] as unknown as UiControlEventHandler<HardwareUiControl<E>, any> | undefined;

    // Class-defined handlers get priority over prop-defined handlers
    // Prop-defined handlers are not called if a class-defined handler exists -> this is to allow subclasses to
    // restrict which events get sent to prop-defined handlers if they choose.
    const stopPropagation = (!!handler && handler.call(this, source, ...args)) || (!!propHandler && propHandler(source, ...args));

    if (!stopPropagation && this.parent !== undefined) {
      return this.parent.propagateEvent(event, this.parent, args);
    }

    return stopPropagation;
  }

  /**
   * Validates that the control can be focused by checking if any ancestors in the
   * control tree are disabled.
   * @returns True if there are no disabled ancestors, false otherwise.
   */
  private canBeFocused(): boolean {
    let canFocus = true;

    if (!this._isDisabled) {
      if (this.parent !== undefined) {
        canFocus = this.parent.canBeFocused();
      }
    } else {
      canFocus = false;
    }

    return canFocus;
  }

  /**
   * Brings focus to the control. Focusing the control will also blur the currently
   * focused control, if any.
   * @param focusPosition The focus position to activate for descendents of this control.
   * @returns Whether this control was successfully focused.
   */
  public focus(focusPosition: FocusPosition): boolean {
    if (!this.canBeFocused()) {
      return false;
    }

    const focusStack = this.buildFocusPath(focusPosition);

    if (focusStack.length === 0) {
      return false;
    }

    // Top of the stack is always 'this', and will be repeated by getFocusRootPath() if we don't remove it
    focusStack.pop();
    this.getDeepestFocusedAncestorPath(focusStack);
    const focusRoot = focusStack[focusStack.length - 1];

    const blurStack = focusRoot.getFocusedComponentPath();
    if (blurStack.length > 0) {
      // Top of the blur stack is the deepest common ancestor of the old focused leaf and this control.
      // This ancestor will be focused after this operation, so we need to remove it from the blur stack.
      blurStack.pop();
      for (let i = 0; i < blurStack.length; i++) {
        blurStack[i]._isFocused = false;
      }
    }

    // Top of the focus stack is the deepest common ancestor of the old focused leaf and this control, OR the root of
    // the control tree if nothing in the tree is focused -> either way, the control will be focused after this
    // operation, so if the control is already focused, we need to remove it from the focus stack.
    if (focusRoot.isFocused) {
      focusStack.pop();
    }

    for (let i = 0; i < focusStack.length; i++) {
      const control = focusStack[i];
      const parent = control.parent;

      control._isFocused = true;
      if (parent !== undefined && parent.registeredControls !== undefined) {
        parent.focusedIndex = parent.registeredControls.indexOf(control);
      }
    }

    while (blurStack.length > 0) {
      const control = blurStack.pop();
      if (control !== undefined) {
        control.onBlurred(control);
      }
    }

    while (focusStack.length > 0) {
      const control = focusStack.pop();
      if (control !== undefined) {
        control.onFocused(control);
      }
    }

    return true;
  }

  /**
   * Gets the path from this control to the deepest descendent control that is focused. If this control is not focused,
   * then the path is empty.
   * @param path The stack of control nodes defining the path to the currently
   * focused descendent control.
   * @returns A stack of nodes that defines the path to the deepest focused descendent
   * node, in order of deepest descendent first.
   */
  private getFocusedComponentPath(path?: HardwareUiControl<E>[]): HardwareUiControl<E>[] {
    if (path === undefined) {
      path = [];
    }

    if (!this._isFocused) {
      return path;
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let currentControl: HardwareUiControl<E> | undefined = this;
    while (currentControl !== undefined) {
      path.splice(0, 0, currentControl);

      if (currentControl.registeredControls !== undefined) {
        currentControl = currentControl.registeredControls.find(c => c.isFocused);
      } else {
        currentControl = undefined;
      }
    }

    return path;
  }

  /**
   * Gets the path from this control to its deepest ancestor that is focused (including itself). If none of this
   * control's ancestors are focused, the path will contain this control and all of its ancestors up to and including
   * the root of its control tree.
   * @param path An array in which to store the path.
   * @returns A stack of controls that defines the path from this control to its deepest focused ancestor, ordered
   * from descendents to ancestors (the control at the shallowest tree depth is located at the top of the stack).
   */
  private getDeepestFocusedAncestorPath(path?: HardwareUiControl<E>[]): HardwareUiControl<E>[] {
    if (path === undefined) {
      path = [];
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let currentControl: HardwareUiControl<E> | undefined = this;
    while (currentControl !== undefined) {
      path.push(currentControl);

      if (currentControl !== this && currentControl.isFocused) {
        break;
      }

      currentControl = currentControl.parent;
    }

    return path;
  }

  /**
   * Builds the path of controls to focus from this control downward in children based on the provided default focus
   * position. If this control cannot be focused, the path will be empty.
   * @param focusPosition The focus position to use to build the path.
   * @param focusStack The stack in which to store the path.
   * @returns A stack of components that defines the path from the deepest descendent to focus to this control if this
   * control were to be focused with the specified focus position, ordered from descendents to ancestors (the control
   * at the shallowest tree depth is located at the top of the stack).
   */
  private buildFocusPath(focusPosition: FocusPosition, focusStack?: HardwareUiControl<E>[]): HardwareUiControl<E>[] {
    if (focusStack === undefined) {
      focusStack = [];
    }

    if (this._isDisabled) {
      return focusStack;
    }

    //focusStack.splice(0, 0, currentControl);

    const originalStackDepth = focusStack.length;
    const childControls: HardwareUiControl[] | undefined = this.registeredControls;

    if (childControls !== undefined) {
      switch (focusPosition) {
        case FocusPosition.MostRecent:
          // Attempt to focus the most recent focused child. If this fails, fall back to FocusPosition.First.

          childControls[this.focusedIndex]?.buildFocusPath(FocusPosition.MostRecent, focusStack);
          if (focusStack.length > originalStackDepth) {
            break;
          }
        // eslint-disable-next-line no-fallthrough
        case FocusPosition.First:
          for (let i = 0; i < childControls.length; i++) {
            childControls[i].buildFocusPath(FocusPosition.First, focusStack);
            if (focusStack.length > originalStackDepth) {
              break;
            }
          }
          break;
        case FocusPosition.Last:
          for (let i = childControls.length - 1; i >= 0; i--) {
            childControls[i].buildFocusPath(FocusPosition.Last, focusStack);
            if (focusStack.length > originalStackDepth) {
              break;
            }
          }
          break;
      }
    }

    // If this control requires child focus, make sure a child was able to be focused before adding this control to the stack.
    if (!this.props.requireChildFocus || focusStack.length > originalStackDepth) {
      focusStack.push(this);
    }

    return focusStack;
  }

  /**
   * Blurs, or removes focus, from the component.
   */
  public blur(): void {
    if (!this._isFocused) {
      return;
    }

    let indexInParent = -1;

    if (this.parent) {
      indexInParent = this.parent.registeredControls?.indexOf(this) ?? -1;
    }

    const blurStack = this.getFocusedComponentPath();
    for (let i = 0; i < blurStack.length; i++) {
      blurStack[i]._isFocused = false;
    }

    while (blurStack.length > 0) {
      const control = blurStack.pop();
      if (control !== undefined) {
        control.onBlurred(control);
      }
    }

    if (this.parent && indexInParent >= 0) {
      this.parent.handleNoFocusedChild(indexInParent, this);
    }
  }

  /**
   * Handles the case where this control is left focused with no focused child control after a child control is
   * blurred.
   * @param indexBlurred The index of the child control that was blurred. If the child is no longer registered, then
   * this is the index of the child prior to being unregistered.
   * @param childBlurred The child control that was blurred.
   */
  private handleNoFocusedChild(indexBlurred: number, childBlurred: HardwareUiControl<E>): void {
    if (!this._isFocused || this.getFocusedIndex() >= 0) {
      return;
    }

    const reconciliation = this.reconcileChildBlur(indexBlurred, childBlurred);

    if (this.registeredControls) {
      if (typeof reconciliation === 'number') {
        const controlToFocus = this.registeredControls?.[reconciliation];
        controlToFocus?.focus(FocusPosition.First);
      } else {
        switch (reconciliation) {
          case BlurReconciliation.First:
            this.focus(FocusPosition.First);
            break;
          case BlurReconciliation.Last:
            this.focus(FocusPosition.Last);
            break;
          case BlurReconciliation.Next:
            for (let i = Math.max(indexBlurred + (this.registeredControls[indexBlurred] === childBlurred ? 1 : 0), 0); i < this.registeredControls.length; i++) {
              if (this.registeredControls[i].focus(FocusPosition.First)) {
                break;
              }
            }
            for (let i = Math.min(indexBlurred - 1, this.registeredControls.length - 1); i >= 0; i--) {
              if (this.registeredControls[i].focus(FocusPosition.First)) {
                break;
              }
            }
            break;
          case BlurReconciliation.Prev:
            for (let i = Math.min(indexBlurred - 1, this.registeredControls.length - 1); i >= 0; i--) {
              if (this.registeredControls[i].focus(FocusPosition.Last)) {
                break;
              }
            }
            for (let i = Math.max(indexBlurred + (this.registeredControls[indexBlurred] === childBlurred ? 1 : 0), 0); i < this.registeredControls.length; i++) {
              if (this.registeredControls[i].focus(FocusPosition.Last)) {
                break;
              }
            }
            break;
        }
      }
    }

    if (this.props.requireChildFocus && this.getFocusedIndex() < 0) {
      this.blur();
    }
  }

  /**
   * Reconciles the focus state of this control's children when this control is focused with no focused children after
   * a child has been blurred.
   * @param index The index of the child control that was blurred. If the child is no longer registered, then this is
   * the index of the child prior to being unregistered.
   * @param child The child control that was blurred.
   * @returns The index of the child control to focus.
   */
  protected reconcileChildBlur(index: number, child: HardwareUiControl<E>): number | BlurReconciliation {
    if (this.props.reconcileChildBlur) {
      return this.props.reconcileChildBlur(index, child);
    }

    if (this.registeredControls?.[index] !== child) {
      return BlurReconciliation.Next;
    } else {
      return -1;
    }
  }

  /**
   * Sets the component to be disabled, removing the ability for the component to scroll. Setting
   * a component to disabled will also blur the component and its children, if necessary.
   * @param isDisabled Whether or not the component is disabled.
   */
  public setDisabled(isDisabled: boolean): void {
    this._isDisabled = isDisabled;

    if (isDisabled) {
      this.blur();
      this.onDisabled(this);
    } else {
      this.onEnabled(this);
    }
  }

  /**
   * Registers a child control with this control.
   * @param control The control to register.
   * @param index The index at which to register the control. If none is provided,
   * the control will be registered at the end of the collection of child controls.
   */
  public register(control: HardwareUiControl<E>, index?: number): void {
    if (this.registeredControls === undefined) {
      this.registeredControls = [];
    }

    if (index !== undefined) {
      this.registeredControls.splice(index, 0, control);

      if (this.focusedIndex >= index) {
        this.focusedIndex++;
      }
    } else {
      this.registeredControls.push(control);
    }

    control.setParent(this);
    control.onRegistered(control);
  }

  /**
   * Unregisters a child control with this control.
   * @param item The child control or index of a child control to unregister. If a
   * child control is provided, it will attempt to be located in the control's
   * child registry and then removed. If an index is provided, the child control
   * at that registered index will be removed.
   */
  public unregister(item: HardwareUiControl<E> | number): void {
    if (this.registeredControls !== undefined) {
      let index = -1;
      if (typeof item === 'number') {
        index = item;
      } else {
        index = this.registeredControls.indexOf(item);
      }

      if (index >= 0 && index < this.length) {
        const controlToRemove = this.registeredControls[index];
        const isRemovedControlFocused = controlToRemove._isFocused;

        this.registeredControls.splice(index, 1);
        controlToRemove.parent = undefined;

        if (isRemovedControlFocused) {
          controlToRemove.blur();
          this.handleNoFocusedChild(index, controlToRemove);
        } else {
          if (this.focusedIndex === index) {
            this.focusedIndex = -1;
          } else if (this.focusedIndex > index) {
            this.focusedIndex--;
          }
        }

        this.focusedIndex = Math.min(this.focusedIndex, this.registeredControls.length - 1);

        if (controlToRemove.length > 0) {
          controlToRemove.clearRegistered();
        }

        controlToRemove.onUnregistered(controlToRemove);

        if (this.length === 0) {
          this.registeredControls = undefined;
        }
      }
    }
  }

  /**
   * Clears the list of registered components.
   */
  public clearRegistered(): void {
    if (this.registeredControls !== undefined) {
      const registeredControls = this.registeredControls;
      this.registeredControls = undefined;
      this.focusedIndex = -1;


      for (let i = 0; i < registeredControls.length; i++) {
        const controlToRemove = registeredControls[i];
        controlToRemove.parent = undefined;

        if (controlToRemove._isFocused) {
          controlToRemove.blur();
        }

        if (controlToRemove.length > 0) {
          controlToRemove.clearRegistered();
        }

        registeredControls[i].onUnregistered(registeredControls[i]);
      }

      // Only call this once for the last child removed to prevent multiple sequential, redundant reconciliations.
      this.handleNoFocusedChild(0, registeredControls[registeredControls.length - 1]);
    }
  }

  /**
   * Gets the current focused index in the registered controls collection.
   * @returns The index of the focused control in the collection of registered controls.
   */
  public getFocusedIndex(): number {
    return this.registeredControls?.[this.focusedIndex]?._isFocused ? this.focusedIndex : -1;
  }

  /**
   * Gets the most recent focused index (including the current focused index, if one exists) in the registered controls
   * collection.
   * @returns The index of the most recently focused control in the collection of registered controls.
   */
  public getMostRecentFocusedIndex(): number {
    return this.focusedIndex;
  }

  /**
   * Sets the current most recently focused child control index. If this control is focused and has children
   * that have focus, this will also switch child focus to the new index.
   * @param index The index of the child control to set most recent focus for.
   * @param focusPosition The focus position to focus the child for, if required.
   */
  public setFocusedIndex(index: number, focusPosition: FocusPosition = FocusPosition.MostRecent): void {
    if (this.isFocused && this.length > 0 && this.registeredControls?.findIndex(c => c.isFocused) !== -1) {
      const child = this.getChild(index);
      if (child !== undefined) {
        child.focus(focusPosition);
      }
    } else if (this.length > 0 && index >= 0 && index < this.length) {
      this.focusedIndex = index;
    }
  }

  /**
   * Gets a child control at the specified index.
   * @param index The index of the child control to get.
   * @returns The specified child control.
   */
  public getChild(index: number): HardwareUiControl<E> | undefined {
    if (this.registeredControls !== undefined) {
      return this.registeredControls[index];
    }

    return undefined;
  }

  /**
   * Gets the index of a specified child control within the registered
   * child controls collection.
   * @param child The child to get the index of.
   * @returns The index of the child, or -1 if not found.
   */
  public indexOf(child: HardwareUiControl<E>): number {
    if (this.registeredControls !== undefined) {
      return this.registeredControls.indexOf(child);
    }

    return -1;
  }

  /**
   * Sets the parent of this control.
   * @param parent The parent to set.
   */
  public setParent(parent: HardwareUiControl<E>): void {
    this.parent = parent;
  }

  /**
   * Sets whether or not this control is in scroll isolation. While scroll isolation
   * is enabled, scroll events will not propagate to the control's parent when the
   * control has focus.
   * @param isolated Whether or not the control is isolated.
   */
  public setIsolated(isolated: boolean): void {
    this._isIsolated = isolated;
  }

  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    FSComponent.visitNodes(thisNode, (node: VNode) => {
      const instance = node.instance as any;
      if (instance !== this && instance?._UICONTROL_) {
        this.register(node.instance as unknown as HardwareUiControl<E, P>);
        return true;
      }

      return false;
    });
  }

  /**
   * Renders the control.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <>{this.props.children}</>
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();
    this.props.onDestroyed && this.props.onDestroyed(this);
  }
}