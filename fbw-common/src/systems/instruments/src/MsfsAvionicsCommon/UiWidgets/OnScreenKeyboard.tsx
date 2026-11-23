//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

// Also used by React instruments, so set the JSX factory for this file
/** @jsx FSComponent.buildComponent */

import {
  ComponentProps,
  FSComponent,
  LifecycleComponent,
  NodeReference,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';

type OnScreenKeyboardRows = readonly { readonly offset?: number; readonly keys: string }[];
export interface OnScreenKeyboardLayout {
  readonly rows: OnScreenKeyboardRows;
  readonly layers?: Readonly<Record<string, OnScreenKeyboardRows>>;
  readonly layerKeys?: Readonly<Record<string, { readonly layer: string; readonly oneShot?: boolean }>>;
  readonly widths?: Readonly<Record<string, number>>;
  readonly text?: Readonly<Record<string, string>>;
  readonly labels?: Readonly<Record<string, string | (() => VNode)>>;
}

const icon = (path: string) => (
  <svg viewBox="0 0 24 24" style={{ 'pointer-events': 'none' }}>
    <path d={path} />
  </svg>
);

export const OSK_OIT_LAYOUT: OnScreenKeyboardLayout = {
  rows: [
    { keys: '1 2 3 4 5 6 7 8 9 0 BACKSPACE' },
    { offset: 0.5, keys: 'Q W E R T Y U I O P' },
    { offset: 0.75, keys: 'A S D F G H J K L ENT' },
    { offset: 1.25, keys: 'Z X C V B N M DOT SLASH DISMISS' },
  ],
  widths: { BACKSPACE: 1.5, ENT: 1.75, DISMISS: 1.25 },
  text: { DOT: '.', SLASH: '/' },
  labels: { BACKSPACE: 'BKSP', ENT: 'ENTER', DISMISS: () => icon('M4 8l8 8 8-8') },
};

export const OSK_EFB_LAYOUT: OnScreenKeyboardLayout = {
  rows: [
    { keys: '` 1 2 3 4 5 6 7 8 9 0 - = BACKSPACE' },
    { keys: 'TAB q w e r t y u i o p [ ] \\' },
    { keys: "CAPS a s d f g h j k l ; ' ENT" },
    { keys: 'SHIFT z x c v b n m , . / SHIFT' },
    { keys: '@ SP DISMISS' },
  ],
  layers: {
    shift: [
      { keys: '~ ! @ # $ % ^ & * ( ) _ + BACKSPACE' },
      { keys: 'TAB Q W E R T Y U I O P { } |' },
      { keys: 'CAPS A S D F G H J K L : " ENT' },
      { keys: 'SHIFT Z X C V B N M < > ? SHIFT' },
      { keys: '@ SP DISMISS' },
    ],
    caps: [
      { keys: '` 1 2 3 4 5 6 7 8 9 0 - = BACKSPACE' },
      { keys: 'TAB Q W E R T Y U I O P [ ] \\' },
      { keys: "CAPS A S D F G H J K L ; ' ENT" },
      { keys: 'SHIFT Z X C V B N M , . / SHIFT' },
      { keys: '@ SP DISMISS' },
    ],
  },
  layerKeys: { SHIFT: { layer: 'shift', oneShot: true }, CAPS: { layer: 'caps' } },
  widths: { BACKSPACE: 2, TAB: 1.5, '\\': 1.5, CAPS: 1.75, ENT: 2.25, SHIFT: 2.5, SP: 12.5, DISMISS: 1.5 },
  text: { SP: ' ', TAB: '' },
  // Tabler Icons (MIT)
  labels: {
    BACKSPACE: () =>
      icon('M20 6a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-11l-5 -5a1.5 1.5 0 0 1 0 -2l5 -5zM12 10l4 4m0 -4l-4 4'),
    TAB: () => icon('M14 12h-10M14 12l-4 4M14 12l-4 -4M20 4v16'),
    CAPS: () =>
      icon(
        'M9 12h-3.586a1 1 0 0 1 -.707 -1.707l6.586 -6.586a1 1 0 0 1 1.414 0l6.586 6.586a1 1 0 0 1 -.707 1.707h-3.586v6h-6v-6zM9 21h6',
      ),
    ENT: () => icon('M18 6v6a3 3 0 0 1 -3 3h-10l4 -4m0 8l-4 -4'),
    SHIFT: () =>
      icon(
        'M9 20v-8h-3.586a1 1 0 0 1 -.707 -1.707l6.586 -6.586a1 1 0 0 1 1.414 0l6.586 6.586a1 1 0 0 1 -.707 1.707h-3.586v8a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z',
      ),
    DISMISS: () => icon('M6 9l6 6l6 -6'),
  },
};

const BASE_LAYER = '';

const KEY_GAP = 'var(--osk-key-gap, 0px)';

export interface OnScreenKeyboardProps extends ComponentProps {
  visible: Subscribable<boolean>;
  onKey: (key: string, text: string) => void;
  layout: OnScreenKeyboardLayout;
}

export class OnScreenKeyboard extends LifecycleComponent<OnScreenKeyboardProps> {
  private static readonly FIELD_CLEARANCE = 10;

  private readonly rootRef = FSComponent.createRef<HTMLDivElement>();

  private readonly keyRefs: NodeReference<HTMLDivElement>[] = [];

  private keyNames: readonly string[] = [];

  private layer = BASE_LAYER;

  private oneShotReturn: string | null = null;

  private readonly display = this.props.visible
    .map((visible) => (visible ? '' : 'none'))
    .withLifecycle(this.defaultLifecycle);

  private readonly onMouseDown = (e: MouseEvent) => {
    e.preventDefault();

    const index = (e.target as Element).getAttribute('data-index');
    if (index === null) {
      return;
    }

    const key = this.keyNames[Number(index)];
    const layerKey = this.props.layout.layerKeys?.[key];
    if (layerKey) {
      if (this.layer === layerKey.layer) {
        this.showLayer(this.oneShotReturn ?? BASE_LAYER);
        this.oneShotReturn = null;
      } else {
        this.oneShotReturn = layerKey.oneShot ? this.layer : null;
        this.showLayer(layerKey.layer);
      }
      return;
    }

    this.props.onKey(key, this.props.layout.text?.[key] ?? key);
    if (this.oneShotReturn !== null) {
      this.showLayer(this.oneShotReturn);
      this.oneShotReturn = null;
    }
  };

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.showLayer(BASE_LAYER);
    this.rootRef.instance.addEventListener('mousedown', this.onMouseDown);
    this.props.visible
      .sub((visible) => {
        if (!visible) {
          this.oneShotReturn = null;
          this.showLayer(BASE_LAYER);
        }
      })
      .withLifecycle(this.defaultLifecycle);
  }

  public destroy(): void {
    this.rootRef.getOrDefault()?.removeEventListener('mousedown', this.onMouseDown);

    super.destroy();
  }

  public coveredHeight(field: Element): number {
    if (!this.props.visible.get()) {
      return 0;
    }

    const keyboardTop = this.rootRef.instance.getBoundingClientRect().top;
    return Math.max(0, field.getBoundingClientRect().bottom + OnScreenKeyboard.FIELD_CLEARANCE - keyboardTop);
  }

  private showLayer(name: string): void {
    const { rows, layers, labels, text, layerKeys } = this.props.layout;
    const names = (layers?.[name] ?? rows)
      .map(({ keys }) => keys)
      .join(' ')
      .split(' ');
    names.forEach((key, i) => {
      const element = this.keyRefs[i].instance;
      if (key !== this.keyNames[i]) {
        const label = labels?.[key] ?? text?.[key] ?? key;
        element.textContent = typeof label === 'string' ? label : '';
        if (typeof label === 'function') {
          FSComponent.render(label(), element);
        }
      }
      element.classList.toggle('osk-key-active', layerKeys?.[key]?.layer === name);
    });
    this.layer = name;
    this.keyNames = names;
  }

  render(): VNode {
    const { rows, widths } = this.props.layout;
    const widthOf = (key: string) => widths?.[key] ?? 1;
    const parsedRows = rows.map(({ offset = 0, keys }) => ({ offset, keys: keys.split(' ') }));
    const totalWidth = Math.max(
      ...parsedRows.map(({ offset, keys }) => keys.reduce((sum, key) => sum + widthOf(key), offset)),
    );
    const percent = (units: number) => `${(units / totalWidth) * 100}%`;

    return (
      <div ref={this.rootRef} class="osk-container" style={{ display: this.display }}>
        {parsedRows.map(({ offset, keys }, row) => (
          <div class="osk-row" style={{ display: 'flex', 'margin-top': row ? KEY_GAP : undefined }}>
            {offset ? <div style={{ width: percent(offset) }} /> : null}
            {keys.map((key) => {
              const ref = FSComponent.createRef<HTMLDivElement>();
              this.keyRefs.push(ref);

              return (
                <div
                  ref={ref}
                  data-index={this.keyRefs.length - 1}
                  class="osk-key"
                  style={{
                    width: `calc(${percent(widthOf(key))} - ${KEY_GAP})`,
                    margin: `0 calc(${KEY_GAP} / 2)`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  }
}
