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
import './style.scss';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { DropdownFieldFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { InteractionMode } from 'instruments/src/MFD/MFD';

interface DropdownMenuProps extends ComponentProps {
  values: SubscribableArray<string>;
  selectedIndex: Subject<number | null>;
  freeTextAllowed: boolean;
  idPrefix: string;
  /** If defined, this component does not update the selectedIndex prop by itself, but rather calls this method. */
  onModified?: (newSelectedIndex: number | null, freeTextEntry: string) => void;
  inactive?: Subscribable<boolean>;
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
  private subs = [] as Subscription[];

  private topRef = FSComponent.createRef<HTMLDivElement>();

  private dropdownSelectorRef = FSComponent.createRef<HTMLDivElement>();

  private dropdownInnerRef = FSComponent.createRef<HTMLDivElement>();

  private dropdownArrowRef = FSComponent.createRef<HTMLDivElement>();

  private dropdownMenuRef = FSComponent.createRef<HTMLDivElement>();

  private dropdownIsOpened = Subject.create(false);

  private inputFieldRef = FSComponent.createRef<InputField<string>>();

  private inputFieldValue = Subject.create<string>('');

  private freeTextEntered = false;

  private renderedDropdownOptions = ArraySubject.create<string>();

  private renderedDropdownOptionsIndices: number[] = [];

  private onDropdownOpenedCallback: (() => void | undefined) | undefined = undefined;

  private alignTextSub: Subscribable<'flex-start' | 'center' | 'flex-end'> = SubscribableUtils.toSubscribable(
    this.props.alignLabels ?? 'center',
    true,
  );

  clickHandler(i: number, thisArg: DropdownMenu) {
    if (!this.props.inactive?.get()) {
      this.freeTextEntered = false;
      if (thisArg.props.onModified) {
        thisArg.props.onModified(this.renderedDropdownOptionsIndices[i], '');
      } else {
        thisArg.props.selectedIndex.set(this.renderedDropdownOptionsIndices[i]);
      }
      thisArg.dropdownIsOpened.set(false);
      this.filterList('');
    }
  }

  private onFieldSubmit(text: string) {
    if (this.props.onModified && !this.props.inactive?.get()) {
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
    this.renderedDropdownOptionsIndices = arr.map((val, idx) => idx).filter((val, idx) => arr[idx].startsWith(text));
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
      this.renderedDropdownOptions.sub((index, type, item, array) => {
        // Remove click handlers
        array.forEach((val, i) => {
          if (document.getElementById(`${this.props.idPrefix}_${i}`)) {
            document
              .getElementById(`${this.props.idPrefix}_${i}`)
              ?.removeEventListener('click', () => this.clickHandler(i, this));
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
        //

        // Add click handlers
        array.forEach((val, i) => {
          document
            .getElementById(`${this.props.idPrefix}_${i}`)
            ?.addEventListener('click', () => this.clickHandler(i, this));
        });
      }),
    );

    this.subs.push(
      this.props.values.sub((index, type, item, array) => {
        const selIdx = this.props.selectedIndex.get();
        if (selIdx !== undefined && selIdx !== null) {
          this.inputFieldValue.set(array[selIdx]);
        } else {
          this.inputFieldValue.set('');
        }
        this.renderedDropdownOptionsIndices = array.map((val, idx) => idx);
        this.renderedDropdownOptions.set(array);
      }, true),
    );

    this.subs.push(
      this.props.selectedIndex.sub((value) => {
        if (value !== null && this.props.values.get(value)) {
          this.inputFieldValue.set(this.props.values.get(value));
        }
      }),
    );

    this.dropdownSelectorRef.instance.addEventListener('click', () => {
      if (!this.props.inactive?.get()) {
        this.dropdownIsOpened.set(!this.dropdownIsOpened.get());
      }
    });

    // Close dropdown menu if clicked outside
    document.getElementById('MFD_CONTENT')?.addEventListener('click', (e) => {
      if (!this.topRef.getOrDefault()?.contains(e.target as Node) && this.dropdownIsOpened.get()) {
        this.dropdownIsOpened.set(false);
      }
    });

    this.subs.push(
      this.dropdownIsOpened.sub((val) => {
        this.dropdownMenuRef.instance.style.display = val ? 'block' : 'none';

        this.onDropdownOpenedCallback?.();
        this.onDropdownOpenedCallback = undefined;

        if (!this.freeTextEntered) {
          if (val) {
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
    );

    // TODO add KCCU events
  }

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
              handleFocusBlurExternally
              tmpyActive={this.props.tmpyActive}
              hEventConsumer={this.props.hEventConsumer}
              interactionMode={this.props.interactionMode}
            />
          </div>
          <div ref={this.dropdownArrowRef} class="mfd-dropdown-arrow">
            <svg height="15" width="15">
              <polygon points="0,0 15,0 7.5,15" style="fill: white" />
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
