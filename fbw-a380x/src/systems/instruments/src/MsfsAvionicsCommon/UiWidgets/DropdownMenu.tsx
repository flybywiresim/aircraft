//  Copyright (c) 2024-2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ArraySubject,
  ComponentProps,
  Consumer,
  DisplayComponent,
  FSComponent,
  Subject,
  Subscribable,
  SubscribableArray,
  SubscribableUtils,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { InputField, InteractionMode } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import { DropdownFieldFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';

interface DropdownMenuProps extends ComponentProps {
  values: SubscribableArray<string>;
  selectedIndex: Subject<number | null>;
  freeTextAllowed: boolean;
  idPrefix: string;
  /** If defined, this component does not update the selectedIndex prop by itself, but rather calls this method. */
  onModified?: (newSelectedIndex: number | null, freeTextEntry: string) => void;
  inactive?: Subscribable<boolean>;
  disabled?: Subscribable<boolean>;
  containerStyle?: string;
  alignLabels?: 'flex-start' | 'center' | 'flex-end' | Subscribable<'flex-start' | 'center' | 'flex-end'>;
  /** Defined by the width of the component */
  numberOfDigitsForInputField?: number;
  tmpyActive?: Subscribable<boolean>;
  /** Only handles KCCU input for respective side, receives key name only */
  hEventConsumer: Consumer<string>;
  /** Kccu uses the HW keys, and doesn't focus input fields */
  interactionMode: Subscribable<InteractionMode>;
}

/*
 * Dropdown menu with optional free text entry (with black background, and cyan font color)
 */
export class DropdownMenu extends DisplayComponent<DropdownMenuProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private readonly subs = [] as Subscription[];

  private readonly topRef = FSComponent.createRef<HTMLDivElement>();

  private readonly dropdownSelectorRef = FSComponent.createRef<HTMLDivElement>();

  private readonly dropdownInnerRef = FSComponent.createRef<HTMLDivElement>();

  private readonly dropdownArrowRef = FSComponent.createRef<HTMLDivElement>();

  private readonly dropdownMenuRef = FSComponent.createRef<HTMLDivElement>();

  private readonly dropdownIsOpened = Subject.create(false);

  private readonly inputFieldRef = FSComponent.createRef<InputField<string>>();

  private readonly inputFieldValue = Subject.create<string | null>('');

  private readonly dropdownArrowFill =
    this.props.disabled?.map((isDisabled) => (isDisabled ? 'gray' : 'white')) ?? Subject.create('white');

  private freeTextEntered = false;

  private readonly renderedDropdownOptions = ArraySubject.create<string>();

  private renderedDropdownOptionsIndices: number[] = [];

  private onDropdownOpenedCallback: (() => void | undefined) | undefined = undefined;

  private alignTextSub: Subscribable<'flex-start' | 'center' | 'flex-end'> = SubscribableUtils.toSubscribable(
    this.props.alignLabels ?? 'center',
    true,
  );

  private onClick(i: number) {
    if (!this.props.inactive?.get() && !this.props.disabled?.get()) {
      this.freeTextEntered = false;
      if (this.props.onModified) {
        this.props.onModified(this.renderedDropdownOptionsIndices[i], '');
      } else {
        this.props.selectedIndex.set(this.renderedDropdownOptionsIndices[i]);
      }
      this.dropdownIsOpened.set(false);
      this.filterList('');
    }
  }

  private onFieldSubmit(text: string) {
    if (this.props.onModified && !this.props.inactive?.get() && !this.props.disabled?.get()) {
      // selected index of -1 marks free text entry
      if (this.props.freeTextAllowed) {
        this.props.onModified(-1, text);
      }

      this.dropdownMenuRef.instance.style.display = 'none';
      this.freeTextEntered = true;
      this.inputFieldValue.set(text);
      this.dropdownIsOpened.set(false);
      this.freeTextEntered = false;
    }
    this.filterList('');
  }

  private filterList(text: string) {
    const arr = this.props.values.getArray();
    this.renderedDropdownOptionsIndices = arr.map((_, idx) => idx).filter((_, idx) => arr[idx].startsWith(text));
    this.renderedDropdownOptions.set(arr.filter((val) => val.startsWith(text)));
  }

  private onFieldChanged(text: string) {
    this.freeTextEntered = true;

    // Filter dropdown options based on input
    this.filterList(text);
  }

  public forceLabel(label: string) {
    this.inputFieldValue.set(label);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.props.inactive === undefined) {
      this.props.inactive = Subject.create(false);
    }
    if (this.props.tmpyActive === undefined) {
      this.props.tmpyActive = Subject.create(false);
    }

    this.subs.push(
      this.renderedDropdownOptions.sub((_, __, ___, array) => {
        // Remove click handlers
        array.forEach((_, i) => {
          if (document.getElementById(`${this.props.idPrefix}_${i}`)) {
            document
              .getElementById(`${this.props.idPrefix}_${i}`)
              ?.removeEventListener('click', this.onClick.bind(this, i));
          }
        });

        // Re-draw all options
        while (this.dropdownMenuRef.instance.firstChild) {
          this.dropdownMenuRef.instance.removeChild(this.dropdownMenuRef.instance.firstChild);
        }
        array.forEach((el, idx) => {
          const n: VNode = (
            <span
              id={`${this.props.idPrefix}_${idx}`}
              class="mfd-dropdown-menu-element"
              style={this.alignTextSub.map((it) => `text-align: ${it};`)}
            >
              {el}
            </span>
          );
          FSComponent.render(n, this.dropdownMenuRef.instance);
        }, this);

        // Add click handlers
        array.forEach((_, i) => {
          document.getElementById(`${this.props.idPrefix}_${i}`)?.addEventListener('click', this.onClick.bind(this, i));
        });
      }),
    );

    this.subs.push(
      this.props.values.sub((_, __, ___, array) => {
        const selIdx = this.props.selectedIndex.get();
        if (selIdx !== undefined && selIdx !== null) {
          this.inputFieldValue.set(array[selIdx]);
        } else {
          this.inputFieldValue.set('');
        }
        this.renderedDropdownOptionsIndices = array.map((_, idx) => idx);
        this.renderedDropdownOptions.set(array);
      }, true),
    );

    this.subs.push(
      this.props.selectedIndex.sub((value) => {
        this.inputFieldValue.set(value !== null && this.props.values.get(value) ? this.props.values.get(value) : null);
      }),
    );

    this.dropdownSelectorRef.instance.addEventListener('click', this.onOpenCloseClickHandler);

    // Close dropdown menu if clicked outside
    document.getElementById('MFD_CONTENT')?.addEventListener('click', this.onClickedOutsideHandler);

    this.subs.push(
      this.dropdownIsOpened.sub((opened) => {
        this.dropdownMenuRef.instance.style.display = opened ? 'block' : 'none';

        this.onDropdownOpenedCallback?.();
        this.onDropdownOpenedCallback = undefined;

        if (!this.freeTextEntered) {
          if (opened) {
            this.inputFieldRef.instance.textInputRef.instance.focus();
            this.inputFieldRef.instance.onFocus();
          } else {
            this.inputFieldRef.instance.textInputRef.instance.blur();
            this.inputFieldRef.instance.onBlur(false);
          }
        }
      }),
    );

    this.subs.push(
      this.props.inactive.sub((val) => {
        if (val) {
          this.dropdownSelectorRef.getOrDefault()?.classList.add('inactive');
          this.dropdownArrowRef.getOrDefault()?.classList.add('inactive');
        } else {
          this.dropdownSelectorRef.getOrDefault()?.classList.remove('inactive');
          this.dropdownArrowRef.getOrDefault()?.classList.remove('inactive');
        }
      }, true),

      this.props.disabled?.sub((val) => {
        if (!this.props.inactive?.get()) {
          if (val) {
            this.dropdownSelectorRef.getOrDefault()?.classList.add('disabled');
            this.dropdownArrowRef.getOrDefault()?.classList.add('disabled');
          } else {
            this.dropdownSelectorRef.getOrDefault()?.classList.remove('disabled');
            this.dropdownArrowRef.getOrDefault()?.classList.remove('disabled');
          }
        }
      }, true),

      this.dropdownArrowFill,
    );

    // TODO add KCCU events
  }

  private onOpenCloseClick() {
    if (!this.props.inactive?.get() && !this.props.disabled?.get()) {
      this.dropdownIsOpened.set(!this.dropdownIsOpened.get());
    }
  }

  private onOpenCloseClickHandler = this.onOpenCloseClick.bind(this);

  private onClickedOutside(e: MouseEvent) {
    if (!this.topRef.getOrDefault()?.contains(e.target as Node) && this.dropdownIsOpened.get()) {
      if (this.inputFieldValue.get() === '') {
        this.inputFieldValue.set(null);
      }
      this.inputFieldRef.instance.onBlur();
      this.dropdownIsOpened.set(false);
    }
  }

  private onClickedOutsideHandler = this.onClickedOutside.bind(this);

  /**
   * Scrolls the dropdown list to the given index
   *
   * @param index the index of the value to scroll to
   */
  public scrollToValue(index: number): void {
    this.onDropdownOpenedCallback = () => {
      const element = Array.from(this.dropdownMenuRef.instance.children).find(
        (it) => it.id === `${this.props.idPrefix}_${index}`,
      );

      this.dropdownMenuRef.instance.scrollTop = (element as unknown as { offsetTop: number }).offsetTop;
    };
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    this.dropdownSelectorRef.getOrDefault()?.removeEventListener('click', this.onOpenCloseClickHandler);
    document.getElementById('MFD_CONTENT')?.removeEventListener('click', this.onClickedOutsideHandler);

    this.renderedDropdownOptions.clear();

    super.destroy();
  }

  render(): VNode {
    return (
      <div class="mfd-dropdown-container" ref={this.topRef} style={this.props.containerStyle}>
        <div ref={this.dropdownSelectorRef} class="mfd-dropdown-outer">
          <div
            ref={this.dropdownInnerRef}
            class="mfd-dropdown-inner"
            style={`justify-content: ${this.props.alignLabels};`}
          >
            <InputField<string>
              ref={this.inputFieldRef}
              dataEntryFormat={new DropdownFieldFormat(this.props.numberOfDigitsForInputField ?? 6)}
              value={this.inputFieldValue}
              containerStyle="border: 2px inset transparent"
              alignText={this.props.alignLabels}
              canOverflow={this.props.freeTextAllowed}
              onModified={(text) => this.onFieldSubmit(text ?? '')}
              onInput={(text) => this.onFieldChanged(text)}
              inactive={this.props.inactive}
              disabled={this.props.disabled}
              handleFocusBlurExternally
              tmpyActive={this.props.tmpyActive}
              hEventConsumer={this.props.hEventConsumer}
              interactionMode={this.props.interactionMode}
              errorHandler={() => {}}
            />
          </div>
          <div ref={this.dropdownArrowRef} class="mfd-dropdown-arrow">
            <svg height="15" width="15">
              <polygon points="0,0 15,0 7.5,15" style={{ fill: this.dropdownArrowFill }} />
            </svg>
          </div>
        </div>
        <div
          ref={this.dropdownMenuRef}
          class="mfd-dropdown-menu"
          style={`display: ${this.dropdownIsOpened.get() ? 'block' : 'none'}`}
        />
      </div>
    );
  }
}
