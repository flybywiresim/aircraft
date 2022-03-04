/// <reference types="msfstypes/JS/common" />
/// <reference types="msfstypes/JS/Types" />
/// <reference types="msfstypes/JS/NetBingMap" />

import {
  ArraySubject, ComponentProps, DisplayComponent, FSComponent, Subject, Subscribable, SubscribableArray,
  SubscribableArrayEventType, Vec2Subject, VNode
} from '../..';

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
  onBoundCallback: (component: BingComponent) => void;

  /**
   * A subscribable which provides the internal resolution for the Bing component. If not defined, the resolution
   * defaults to 1024x1024 pixels.
   */
  resolution?: Subscribable<Float64Array>;

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

  /** CSS class(es) to add to the Bing component's image. */
  class?: string;

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

  private pos: LatLong | null = null;
  private radius = 0;
  private readonly resolutionSub = Vec2Subject.createFromVector(new Float64Array([BingComponent.DEFAULT_RESOLUTION, BingComponent.DEFAULT_RESOLUTION]));
  private readonly resolutionPropHandler = (resolution: Float64Array): void => {
    this.resolutionSub.set(resolution);
  }
  private readonly resolutionHandler = (resolution: Float64Array): void => {
    Coherent.call('SET_MAP_RESOLUTION', this.uid, resolution[0], resolution[1]);
  }

  private readonly earthColorsSub = ArraySubject.create(BingComponent.createEarthColorsArray('#000000', [{ elev: 0, color: '#000000' }, { elev: 60000, color: '#000000' }]));
  private readonly skyColorSub = Subject.create(BingComponent.hexaToRGBColor('#000000'));
  private readonly referenceSub = Subject.create(EBingReference.SEA);
  private readonly wxrModeSub = Subject.create<WxrMode>({ mode: EWeatherRadar.OFF, arcRadians: 0.5 },
    (cur, prev) => cur.mode === prev.mode && cur.arcRadians === prev.arcRadians,
    (ref, val) => Object.assign(ref, val));

  private readonly earthColorsPropHandler = (index: number, type: SubscribableArrayEventType, item: number | readonly number[] | undefined, array: readonly number[]): void => {
    if (array.length !== 61) {
      return;
    }

    this.earthColorsSub.set(array);
  }
  private readonly skyColorPropHandler = (color: number): void => {
    this.skyColorSub.set(color);
  }
  private readonly referencePropHandler = (reference: EBingReference): void => {
    this.referenceSub.set(reference);
  }
  private readonly wxrModePropHandler = (wxrMode: WxrMode): void => {
    this.wxrModeSub.set(wxrMode);
  }

  private readonly earthColorsHandler = (index: number, type: SubscribableArrayEventType, item: number | readonly number[] | undefined, array: readonly number[]): void => {
    if (type !== SubscribableArrayEventType.Cleared) {
      if (array.length !== 61) {
        throw new Error(`Incorrect number of colors provided: was ${array.length} but should be 61`);
      }

      Coherent.call('SET_MAP_HEIGHT_COLORS', this.uid, array);
    }
  }
  private readonly skyColorHandler = (color: number): void => {
    Coherent.call('SET_MAP_CLEAR_COLOR', this.uid, color);
  }
  private readonly referenceHandler = (reference: EBingReference): void => {
    const flags = this.modeFlags | (reference === EBingReference.PLANE ? 1 : 0);
    this.mapListener.trigger('JS_BIND_BINGMAP', this.props.id, flags);
  }
  private readonly wxrModeHandler = (wxrMode: WxrMode): void => {
    Coherent.call('SHOW_MAP_WEATHER', this.uid, wxrMode.mode, wxrMode.arcRadians);
  }

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
    this.props.resolution?.sub(this.resolutionPropHandler, true);

    this.props.earthColors?.sub(this.earthColorsPropHandler, true);
    this.props.skyColor?.sub(this.skyColorPropHandler, true);
    this.props.reference?.sub(this.referencePropHandler, true);
    this.props.wxrMode?.sub(this.wxrModePropHandler, true);

    setTimeout(() => {
      this.mapListener = RegisterViewListener('JS_LISTENER_MAPS', this.onListenerRegistered);
    }, 3000);

    window.addEventListener('OnDestroy', this.onDestroy);
  }

  /**
   * A callback called when the listener is registered.
   */
  private onListenerRegistered = (): void => {
    if (this.isListenerRegistered) {
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
    if (binder.friendlyName === this.props.id) {
      // console.log('Bing map listener bound.');
      this.binder = binder;
      this.uid = uid;
      if (this._isBound) {
        return;
      }

      this._isBound = true;

      Coherent.call('SHOW_MAP', uid, true);

      if (this._isAwake) {
        Coherent.call('SET_MAP_RESOLUTION', uid, BingComponent.DEFAULT_RESOLUTION, BingComponent.DEFAULT_RESOLUTION);

        this.earthColorsSub.sub(this.earthColorsHandler, true);
        this.skyColorSub.sub(this.skyColorHandler, true);
        this.referenceSub.sub(this.referenceHandler, true);
        this.wxrModeSub.sub(this.wxrModeHandler, true);
        this.resolutionSub.sub(this.resolutionHandler, true);
      }

      this.props.onBoundCallback(this);
    }
  }

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
  }

  /**
   * A callback called when the instrument is destroyed.
   */
  private onDestroy = (): void => {
    this._isBound = false;

    this.props.earthColors?.unsub(this.earthColorsPropHandler);
    this.props.skyColor?.unsub(this.skyColorPropHandler);
    this.props.reference?.unsub(this.referencePropHandler);
    this.props.wxrMode?.unsub(this.wxrModePropHandler);
    this.props.resolution?.unsub(this.resolutionPropHandler);

    this.mapListener?.off('MapBinded', this.onListenerBound);
    this.mapListener?.off('MapUpdated', this.onMapUpdate);
    this.mapListener?.trigger('JS_UNBIND_BINGMAP', this.props.id);
    this.isListenerRegistered = false;

    if (this.imgRef.instance !== null) {
      this.imgRef.instance.src = '';
      this.imgRef.instance.parentNode?.removeChild(this.imgRef.instance);
    }
  }

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

    this.earthColorsSub.sub(this.earthColorsHandler, true);
    this.skyColorSub.sub(this.skyColorHandler, true);
    this.referenceSub.sub(this.referenceHandler, true);
    this.wxrModeSub.sub(this.wxrModeHandler, true);
    this.resolutionSub.sub(this.resolutionHandler, true);
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

    this.earthColorsSub.unsub(this.earthColorsHandler);
    this.skyColorSub.unsub(this.skyColorHandler);
    this.referenceSub.unsub(this.referenceHandler);
    this.wxrModeSub.unsub(this.wxrModeHandler);
    this.resolutionSub.unsub(this.resolutionHandler);
  }

  /**
   * Sets the center position and radius.
   * @param pos The center position.
   * @param radius The radius, in meters.
   */
  public setPositionRadius(pos: LatLong, radius: number): void {
    if (this._isBound && this._isAwake) {
      Coherent.call('SET_MAP_PARAMS', this.uid, pos, radius, 1);
      this.pos = pos;
      this.radius = radius;
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <img ref={this.imgRef} src='' style='position: absolute; left: 0; top: 0; width: 100%; height: 100%;' class={`${this.props.class ?? ''}`} />
    );
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
