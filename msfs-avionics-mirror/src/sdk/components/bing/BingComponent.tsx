/// <reference types="msfstypes/JS/common" />
/// <reference types="msfstypes/JS/Types" />
/// <reference types="msfstypes/JS/NetBingMap" />

import { GameStateProvider } from '../../data/GameStateProvider';
import { ReadonlyFloat64Array } from '../../math/VecMath';
import { Vec2Subject } from '../../math/VectorSubject';
import { ArraySubject } from '../../sub/ArraySubject';
import { Subject } from '../../sub/Subject';
import { Subscribable } from '../../sub/Subscribable';
import { SubscribableArray, SubscribableArrayEventType } from '../../sub/SubscribableArray';
import { SubscribableSet } from '../../sub/SubscribableSet';
import { Subscription } from '../../sub/Subscription';
import { ComponentProps, DisplayComponent, FSComponent, VNode } from '../FSComponent';

/**
 * Weather radar mode data for the BingComponent.
 */
export interface WxrMode {
  /** The weather mode. */
  mode: EWeatherRadar;

  /** The size of the weather radar arc in front of the plane, in radians. */
  arcRadians: number;
}

/**
 * Component props for the MapComponent.
 */
export interface BingComponentProps extends ComponentProps {
  /** The unique ID to assign to this Bing component. */
  id: string;

  /** The mode of the Bing component. */
  mode: EBingMode;

  /** A callback to call when the Bing component is bound. */
  onBoundCallback?: (component: BingComponent) => void;

  /**
   * A subscribable which provides the internal resolution for the Bing component. If not defined, the resolution
   * defaults to 1024x1024 pixels.
   */
  resolution?: Subscribable<ReadonlyFloat64Array>;

  /**
   * A subscribable array which provides the earth colors for the Bing component. The array should have a length of
   * exactly 61, with index 0 defining the water color and indexes 1 through 60 defining terrain colors from 0 to
   * 60000 feet. If not defined, the earth colors default to black.
   */
  earthColors?: SubscribableArray<number>;

  /**
   * A subscribable which provides the sky color for the Bing component. The sky color is only visible in synthetic
   * vision (`EBingMode.HORIZON`) mode. If not defined, the sky color defaults to black.
   */
  skyColor?: Subscribable<number>;

  /**
   * A subscribable which provides the reference mode for the Bing component. If not defined, the reference mode
   * defaults to `EBingReference.SEA`.
   */
  reference?: Subscribable<EBingReference>;

  /**
   * A subscribable which provides the weather radar mode for the Bing component. If not defined, the weather radar
   * mode defaults to `EWeatherRadar.NONE`.
   */
  wxrMode?: Subscribable<WxrMode>;

  /**
   * A subscribable which provides whether the map isolines should be shown or not. If true, they are shown, if
   * false, they are not.
   */
  isoLines?: Subscribable<boolean>;

  /**
   * How long to delay binding the map in ms. Defaults to 3000.
   */
  delay?: number;

  /** CSS class(es) to add to the Bing component's image. */
  class?: string | SubscribableSet<string>;
}

/**
 * A FSComponent that displays the MSFS Bing Map, weather radar, and 3D terrain.
 */
export class BingComponent extends DisplayComponent<BingComponentProps> {
  public static readonly DEFAULT_RESOLUTION = 1024;

  private readonly modeFlags = this.props.mode === EBingMode.HORIZON ? 4 : 0;

  private mapListener!: ViewListener.ViewListener;
  private isListenerRegistered = false;
  private readonly imgRef = FSComponent.createRef<HTMLImageElement>();
  private binder?: BingMapsBinder;
  private uid = 0;

  private _isBound = false;
  private _isAwake = true;

  private isDestroyed = false;

  private pos: LatLong | null = null;
  private radius = 0;
  private readonly resolution = Vec2Subject.createFromVector(new Float64Array([BingComponent.DEFAULT_RESOLUTION, BingComponent.DEFAULT_RESOLUTION]));
  private readonly earthColors = ArraySubject.create(BingComponent.createEarthColorsArray('#000000', [{ elev: 0, color: '#000000' }, { elev: 60000, color: '#000000' }]));
  private readonly skyColor = Subject.create(BingComponent.hexaToRGBColor('#000000'));
  private readonly reference = Subject.create(EBingReference.SEA);
  private readonly wxrMode = Subject.create<WxrMode>({ mode: EWeatherRadar.OFF, arcRadians: 0.5 },
    (cur, prev) => cur.mode === prev.mode && cur.arcRadians === prev.arcRadians,
    (ref, val) => Object.assign(ref, val)
  );
  private readonly isoLines = Subject.create<boolean>(false);

  private gameStateSub?: Subscription;

  private resolutionPropSub?: Subscription;
  private earthColorsPropSub?: Subscription;
  private skyColorPropSub?: Subscription;
  private referencePropSub?: Subscription;
  private wxrModePropSub?: Subscription;
  private isoLinesPropSub?: Subscription;

  private resolutionSub?: Subscription;
  private earthColorsSub?: Subscription;
  private skyColorSub?: Subscription;
  private referenceSub?: Subscription;
  private wxrModeSub?: Subscription;
  private isoLinesSub?: Subscription;

  private readonly resolutionPropHandler = (resolution: ReadonlyFloat64Array): void => {
    this.resolution.set(resolution);
  };
  private readonly earthColorsPropHandler = (index: number, type: SubscribableArrayEventType, item: number | readonly number[] | undefined, array: readonly number[]): void => {
    if (array.length !== 61) {
      return;
    }

    this.earthColors.set(array);
  };
  private readonly skyColorPropHandler = (color: number): void => {
    this.skyColor.set(color);
  };
  private readonly referencePropHandler = (reference: EBingReference): void => {
    this.reference.set(reference);
  };
  private readonly wxrModePropHandler = (wxrMode: WxrMode): void => {
    this.wxrMode.set(wxrMode);
  };
  private readonly isoLinesPropHandler = (showIsolines: boolean): void => {
    this.isoLines.set(showIsolines);
  };

  private readonly resolutionHandler = (resolution: ReadonlyFloat64Array): void => {
    Coherent.call('SET_MAP_RESOLUTION', this.uid, resolution[0], resolution[1]);
  };
  private readonly earthColorsHandler = (index: number, type: SubscribableArrayEventType, item: number | readonly number[] | undefined, array: readonly number[]): void => {
    if (type !== SubscribableArrayEventType.Cleared) {
      if (array.length !== 61) {
        throw new Error(`Incorrect number of colors provided: was ${array.length} but should be 61`);
      }

      Coherent.call('SET_MAP_HEIGHT_COLORS', this.uid, array);
    }
  };
  private readonly skyColorHandler = (color: number): void => {
    Coherent.call('SET_MAP_CLEAR_COLOR', this.uid, color);
  };
  private readonly referenceHandler = (reference: EBingReference): void => {
    const flags = this.modeFlags | (reference === EBingReference.PLANE ? 1 : 0);
    this.mapListener.trigger('JS_BIND_BINGMAP', this.props.id, flags);
  };
  private readonly wxrModeHandler = (wxrMode: WxrMode): void => {
    Coherent.call('SHOW_MAP_WEATHER', this.uid, wxrMode.mode, wxrMode.arcRadians);
  };
  private readonly isoLinesHandler = (showIsolines: boolean): void => {
    Coherent.call('SHOW_MAP_ISOLINES', this.uid, showIsolines);
  };

  /**
   * Checks whether this Bing component has been bound.
   * @returns whether this Bing component has been bound.
   */
  public isBound(): boolean {
    return this._isBound;
  }

  /**
   * Checks whether this Bing component is awake.
   * @returns whether this Bing component is awake.
   */
  public isAwake(): boolean {
    return this._isAwake;
  }

  /** @inheritdoc */
  public onAfterRender(): void {
    if ((window as any)['IsDestroying']) {
      this.destroy();
      return;
    }

    this.resolutionPropSub = this.props.resolution?.sub(this.resolutionPropHandler, true);
    this.earthColorsPropSub = this.props.earthColors?.sub(this.earthColorsPropHandler, true);
    this.skyColorPropSub = this.props.skyColor?.sub(this.skyColorPropHandler, true);
    this.referencePropSub = this.props.reference?.sub(this.referencePropHandler, true);
    this.wxrModePropSub = this.props.wxrMode?.sub(this.wxrModePropHandler, true);
    this.isoLinesPropSub = this.props.isoLines?.sub(this.isoLinesPropHandler, true);

    const gameStateSubscribable = GameStateProvider.get();
    const gameState = gameStateSubscribable.get();

    if (gameState === GameState.briefing || gameState === GameState.ingame) {
      this.registerListener();
    } else {
      this.gameStateSub = gameStateSubscribable.sub(state => {
        if (this.isDestroyed) {
          return;
        }

        if (state === GameState.briefing || state === GameState.ingame) {
          this.gameStateSub?.destroy();
          this.registerListener();
        }
      });
    }

    window.addEventListener('OnDestroy', this.destroy.bind(this));
  }

  /**
   * Registers this component's Bing map listener.
   */
  private registerListener(): void {
    if ((this.props.delay ?? 0) > 0) {
      setTimeout(() => {
        if (this.isDestroyed) {
          return;
        }

        this.mapListener = RegisterViewListener('JS_LISTENER_MAPS', this.onListenerRegistered.bind(this));
      }, this.props.delay);
    } else {
      this.mapListener = RegisterViewListener('JS_LISTENER_MAPS', this.onListenerRegistered.bind(this));
    }
  }

  /**
   * A callback called when this component's Bing map listener is registered.
   */
  private onListenerRegistered(): void {
    if (this.isDestroyed || this.isListenerRegistered) {
      return;
    }

    this.mapListener.on('MapBinded', this.onListenerBound);
    this.mapListener.on('MapUpdated', this.onMapUpdate);

    this.isListenerRegistered = true;
    this.mapListener.trigger('JS_BIND_BINGMAP', this.props.id, this.modeFlags);
  }

  /**
   * A callback called when the listener is fully bound.
   * @param binder The binder from the listener.
   * @param uid The unique ID of the bound map.
   */
  private onListenerBound = (binder: BingMapsBinder, uid: number): void => {
    if (this.isDestroyed) {
      return;
    }

    if (binder.friendlyName === this.props.id) {
      // console.log('Bing map listener bound.');
      this.binder = binder;
      this.uid = uid;
      if (this._isBound) {
        return;
      }

      this._isBound = true;

      Coherent.call('SHOW_MAP', uid, true);

      const pause = !this._isAwake;

      this.earthColorsSub = this.earthColors.sub(this.earthColorsHandler, true, pause);
      this.skyColorSub = this.skyColor.sub(this.skyColorHandler, true, pause);
      this.referenceSub = this.reference.sub(this.referenceHandler, true, pause);
      this.wxrModeSub = this.wxrMode.sub(this.wxrModeHandler, true, pause);
      this.resolutionSub = this.resolution.sub(this.resolutionHandler, true, pause);
      this.isoLinesSub = this.isoLines.sub(this.isoLinesHandler, true, pause);

      if (this._isAwake && this.pos !== null) {
        Coherent.call('SET_MAP_PARAMS', this.uid, this.pos, this.radius, 1);
      }

      this.props.onBoundCallback && this.props.onBoundCallback(this);
    }
  };

  /**
   * A callback called when the map image is updated.
   * @param uid The unique ID of the bound map.
   * @param imgSrc The img tag src attribute to assign to the bing map image.
   */
  private onMapUpdate = (uid: number, imgSrc: string): void => {
    if (this.binder !== undefined && this.uid === uid && this.imgRef.instance !== null) {
      if (this.imgRef.instance.src !== imgSrc) {
        this.imgRef.instance.src = imgSrc;
      }
    }
  };

  /**
   * Wakes this Bing component. Upon awakening, this component will synchronize its state from when it was put to sleep
   * to the Bing instance to which it is bound.
   */
  public wake(): void {
    this._isAwake = true;

    if (!this._isBound) {
      return;
    }

    Coherent.call('SET_MAP_PARAMS', this.uid, this.pos, this.radius, 1);

    this.earthColorsSub?.resume(true);
    this.skyColorSub?.resume(true);
    this.referenceSub?.resume(true);
    this.wxrModeSub?.resume(true);
    this.resolutionSub?.resume(true);
    this.isoLinesSub?.resume(true);
  }

  /**
   * Puts this Bing component to sleep. While asleep, this component cannot make changes to the Bing instance to which
   * it is bound.
   */
  public sleep(): void {
    this._isAwake = false;

    if (!this._isBound) {
      return;
    }

    this.earthColorsSub?.pause();
    this.skyColorSub?.pause();
    this.referenceSub?.pause();
    this.wxrModeSub?.pause();
    this.resolutionSub?.pause();
    this.isoLinesSub?.pause();
  }

  /**
   * Sets the center position and radius.
   * @param pos The center position.
   * @param radius The radius, in meters.
   */
  public setPositionRadius(pos: LatLong, radius: number): void {
    this.pos = pos;
    this.radius = radius;

    if (this._isBound && this._isAwake) {
      Coherent.call('SET_MAP_PARAMS', this.uid, pos, radius, 1);
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <img ref={this.imgRef} src='' style='position: absolute; left: 0; top: 0; width: 100%; height: 100%;' class={this.props.class ?? ''} />
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    this.isDestroyed = true;
    this._isBound = false;

    this.gameStateSub?.destroy();

    this.resolutionPropSub?.destroy();
    this.earthColorsPropSub?.destroy();
    this.skyColorPropSub?.destroy();
    this.referencePropSub?.destroy();
    this.wxrModePropSub?.destroy();
    this.isoLinesPropSub?.destroy();

    this.mapListener?.off('MapBinded', this.onListenerBound);
    this.mapListener?.off('MapUpdated', this.onMapUpdate);
    this.mapListener?.trigger('JS_UNBIND_BINGMAP', this.props.id);
    this.isListenerRegistered = false;

    this.imgRef.instance.src = '';
    this.imgRef.instance.parentNode?.removeChild(this.imgRef.instance);
  }

  /**
   * Resets the img element's src attribute.
   */
  public resetImgSrc(): void {
    const imgRef = this.imgRef.getOrDefault();
    if (imgRef !== null) {
      const currentSrc = imgRef.src;
      imgRef.src = '';
      imgRef.src = currentSrc;
    }
  }

  /**
   * Converts an HTML hex color string to a numerical map RGB value.
   * @param hexColor The hex color string to convert.
   * @returns A numerical map RGB value.
   */
  public static hexaToRGBColor(hexColor: string): number {
    const hexStringColor = hexColor;
    let offset = 0;

    if (hexStringColor[0] === '#') {
      offset = 1;
    }

    const r = parseInt(hexStringColor.substr(0 + offset, 2), 16);
    const g = parseInt(hexStringColor.substr(2 + offset, 2), 16);
    const b = parseInt(hexStringColor.substr(4 + offset, 2), 16);

    const rgb = 256 * 256 * b + 256 * g + r;
    return rgb;
  }

  /**
   * Converts RGB color components to a numerical map RGB value.
   * @param r The red component, from 0 to 255.
   * @param g The green component, from 0 to 255.
   * @param b The blue component, from 0 to 255.
   * @returns A numerical map RGB value.
   */
  public static rgbColor(r: number, g: number, b: number): number {
    const rgb = 256 * 256 * b + 256 * g + r;
    return rgb;
  }

  /**
   * Creates a full Bing component earth colors array. The earth colors array will contain the specified water color
   * and terrain colors (including interpolated values between the explicitly defined ones, as necessary).
   * @param waterColor The desired water color, as a hex string with the format `#hhhhhh`.
   * @param terrainColors An array of desired terrain colors at specific elevations. Elevations should be specified in
   * feet and colors as hex strings with the format `#hhhhhh`.
   * @returns a full Bing component earth colors array.
   */
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static createEarthColorsArray(waterColor: string, terrainColors: { elev: number, color: string }[]): number[] {
    const earthColors = [BingComponent.hexaToRGBColor(waterColor)];

    const curve = new Avionics.Curve<string>();
    curve.interpolationFunction = Avionics.CurveTool.StringColorRGBInterpolation;
    for (let i = 0; i < terrainColors.length; i++) {
      curve.add(terrainColors[i].elev, terrainColors[i].color);
    }

    for (let i = 0; i < 60; i++) {
      const color = curve.evaluate(i * 30000 / 60);
      earthColors[i + 1] = BingComponent.hexaToRGBColor(color);
    }

    return earthColors;
  }
}
