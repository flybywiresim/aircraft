//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Consumer, MutableSubscribable, Subscription } from '@microsoft/msfs-sdk';
import { EfisSide } from '@flybywiresim/fbw-sdk';

/**
 * Lets the KCCU or OIT keyboard move through an open dropdown list: UP and DOWN move a highlight, ENT picks the
 * highlighted option and ESC closes the list. Also picks options on click and closes the list on a press outside it.
 */
export class DropdownListNavigation {
  private static readonly OPEN_CLASS = 'mfd-dropdown-open';

  /** Whether a dropdown list is open within this element. */
  public static isOpenWithin(element: Element): boolean {
    return element.getElementsByClassName(DropdownListNavigation.OPEN_CLASS).length > 0;
  }

  private readonly openSub: Subscription;

  private keySub?: Subscription;

  private readonly optionElements: HTMLCollectionOf<HTMLElement>;

  private readonly highlightedElements: HTMLCollectionOf<Element>;

  /**
   * @param container the whole dropdown, outside which a press closes the list
   * @param config.keys key events, for a list that takes focus while it's open, as an input field does. Without them,
   * the owner passes keys to `handleKey` itself.
   * @param config.close closes the list keeping any typed entry: on ENT with nothing highlighted, or when focus or a
   * press goes elsewhere
   * @param config.highlightOnOpen the index of the option to highlight when the list opens
   */
  constructor(
    private readonly isOpen: MutableSubscribable<boolean>,
    private readonly container: HTMLElement,
    private readonly list: HTMLElement,
    private readonly select: (index: number) => void,
    private readonly config: {
      keys?: Consumer<[EfisSide, string]>;
      close?: () => void;
      highlightOnOpen?: () => number;
    } = {},
  ) {
    this.optionElements = list.getElementsByClassName('mfd-dropdown-menu-element') as HTMLCollectionOf<HTMLElement>;
    this.highlightedElements = list.getElementsByClassName('highlighted');
    container.addEventListener('mousedown', this.onContainerMouseDown);
    this.openSub = isOpen.sub((open) => (open ? this.onOpened() : this.onClosed()));
  }

  /** @returns whether the open list used the key */
  public handleKey(key: string): boolean {
    if (!this.isOpen.get()) {
      return false;
    }

    // Widgets aren't destroyed with their page, so a list still open when its page went must stop taking keys
    if (!document.body.contains(this.container)) {
      this.isOpen.set(false);
      return false;
    }

    switch (key) {
      case 'UP':
        this.move(-1);
        return true;
      case 'DOWN':
        this.move(1);
        return true;
      case 'ENT': {
        const highlighted = this.highlightedIndex();
        if (highlighted !== -1) {
          this.select(highlighted);
        } else {
          this.close();
        }
        return true;
      }
      case 'ESC':
      case 'ESC2':
        this.isOpen.set(false);
        return true;
      default:
        return false;
    }
  }

  public destroy(): void {
    this.openSub.destroy();
    this.onClosed();
    this.container.removeEventListener('mousedown', this.onContainerMouseDown);
  }

  private onOpened(): void {
    this.container.classList.add(DropdownListNavigation.OPEN_CLASS);
    if (this.config.keys) {
      // Resumed without replay, as the bus would otherwise hand a new subscription the last key pressed
      this.keySub = this.config.keys.handle((key) => this.handleKey(key[1]), true).resume();
      this.container.tabIndex = -1;
      this.container.focus();
      this.container.addEventListener('blur', this.onBlur);
    }
    document.addEventListener('mousedown', this.onDocumentMouseDown);
    this.list.addEventListener('click', this.onListClick);
    this.highlight(this.optionElements.item(this.config.highlightOnOpen?.() ?? -1));
  }

  private onClosed(): void {
    this.container.classList.remove(DropdownListNavigation.OPEN_CLASS);
    this.keySub?.destroy();
    this.keySub = undefined;
    if (this.config.keys) {
      this.container.removeEventListener('blur', this.onBlur);
      this.container.blur();
      this.container.removeAttribute('tabindex');
    }
    document.removeEventListener('mousedown', this.onDocumentMouseDown);
    this.list.removeEventListener('click', this.onListClick);
    this.highlight(null);
  }

  private close(): void {
    if (this.config.close) {
      this.config.close();
    } else {
      this.isOpen.set(false);
    }
  }

  private readonly onBlur = (): void => this.close();

  // Keeps focus where it is, so pressing an option or the list's own button doesn't close the list before the click
  private readonly onContainerMouseDown = (e: MouseEvent): void => e.preventDefault();

  // A press that something has already handled, such as an on-screen keyboard key, leaves the list open
  private readonly onDocumentMouseDown = (e: MouseEvent): void => {
    if (!e.defaultPrevented && !this.container.contains(e.target as Node)) {
      this.close();
    }
  };

  private readonly onListClick = (e: MouseEvent): void => {
    const option = Array.prototype.indexOf.call(this.optionElements, e.target);
    if (option !== -1) {
      this.select(option);
    }
  };

  private highlightedIndex(): number {
    return Array.prototype.indexOf.call(this.optionElements, this.highlightedElements.item(0));
  }

  private move(step: -1 | 1): void {
    const highlighted = this.highlightedIndex();
    const start = highlighted !== -1 ? highlighted + step : this.edgeOfView(step);

    for (let i = start; i >= 0 && i < this.optionElements.length; i += step) {
      if (!this.optionElements[i].classList.contains('disabled')) {
        this.highlight(this.optionElements[i]);
        return;
      }
    }
  }

  // With nothing highlighted, start from what's in view, so a list opened scrolled down doesn't jump back to the top.
  private edgeOfView(step: -1 | 1): number {
    const top = Math.floor(this.list.scrollTop);
    const bottom = Math.ceil(this.list.scrollTop) + this.list.clientHeight;
    const count = this.optionElements.length;

    for (let i = step > 0 ? 0 : count - 1; i >= 0 && i < count; i += step) {
      const option = this.optionElements[i];
      if (option.offsetTop >= top && option.offsetTop + option.offsetHeight <= bottom) {
        return i;
      }
    }
    return 0;
  }

  private highlight(option: HTMLElement | null): void {
    this.highlightedElements.item(0)?.classList.remove('highlighted');
    if (!option) {
      return;
    }

    option.classList.add('highlighted');
    if (option.offsetTop < this.list.scrollTop) {
      this.list.scrollTop = option.offsetTop;
    } else if (option.offsetTop + option.offsetHeight > this.list.scrollTop + this.list.clientHeight) {
      this.list.scrollTop = option.offsetTop + option.offsetHeight - this.list.clientHeight;
    }
  }
}
