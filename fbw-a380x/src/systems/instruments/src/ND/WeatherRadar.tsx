// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, DisplayComponent, FSComponent, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';
import { ArincEventBus, EfisNdMode, EfisSide, FcuSimVars } from '@flybywiresim/fbw-sdk';

interface WeatherMapEvents {
  set_show_map: boolean;
  set_map_center_lat: number;
  set_map_center_lon: number;
  set_map_center_y_bias: number;
  set_map_up_course: number;
  set_map_pixel_radius: number;
  set_map_range_radius: number;
}

interface WeatherRadarProps {
  bus: ArincEventBus;
  side: EfisSide;
  mode: Subscribable<EfisNdMode>;
}

const MAP_SIZE = 1088;
const MAP_OFFSET = (768 - MAP_SIZE) / 2;

export class WeatherRadar extends DisplayComponent<WeatherRadarProps> {
  private readonly containerRef = FSComponent.createRef<HTMLDivElement>();
  private readonly subscriptions: Subscription[] = [];
  private readonly activeOverlay = ConsumerSubject.create(
    this.props.bus.getSubscriber<FcuSimVars>().on('a380x_efis_cp_active_overlay'),
    0,
  );

  private map: BingMapElement | null = null;
  private timer: number | null = null;
  private ready = false;
  private visible = false;
  private mapShown = false;
  private latitude = NaN;
  private longitude = NaN;
  private centerYBias = 0;
  private course = 0;
  private pixelRadius = 384;
  private rangeRadius = 10;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<WeatherMapEvents>();
    this.subscriptions.push(
      sub.on('set_show_map').handle((value) => (this.mapShown = value)),
      sub.on('set_map_center_lat').handle((value) => (this.latitude = value)),
      sub.on('set_map_center_lon').handle((value) => (this.longitude = value)),
      sub.on('set_map_center_y_bias').handle((value) => (this.centerYBias = value)),
      sub.on('set_map_up_course').handle((value) => (this.course = value)),
      sub.on('set_map_pixel_radius').handle((value) => (this.pixelRadius = value)),
      sub.on('set_map_range_radius').handle((value) => (this.rangeRadius = value)),
    );

    try {
      const map = document.createElement('bing-map');
      map.style.position = 'absolute';
      map.style.left = `${MAP_OFFSET}px`;
      map.style.top = `${MAP_OFFSET}px`;
      map.style.width = `${MAP_SIZE}px`;
      map.style.height = `${MAP_SIZE}px`;
      this.containerRef.instance.appendChild(map);
      this.map = map;

      const config = new SvgMapConfig();
      config.load('/Pages/VCockpit/Instruments/Airliners/FlyByWire_A380/EFB/', () => {
        if (this.map !== map) {
          return;
        }
        try {
          config.generateBingMap(map);
          map.setConfig(0);
          map.setBingId(`A380X_ND_WXR_${this.props.side}`);
          map.setMode(EBingMode.VFR);
          map.setReference(EBingReference.PLANE);
          map.showWeather(EWeatherRadar.HORIZONTAL, 90);
          this.ready = true;
          this.update();
        } catch (error) {
          console.error('A380X weather radar initialization failed', error);
        }
      });
    } catch (error) {
      console.error('A380X weather radar map unavailable', error);
    }

    this.timer = window.setInterval(() => this.update(), 500);
  }

  private update(): void {
    const mode = this.props.mode.get();
    const validPosition = Number.isFinite(this.latitude) && Number.isFinite(this.longitude);
    const validRange =
      Number.isFinite(this.rangeRadius) &&
      this.rangeRadius > 0 &&
      Number.isFinite(this.pixelRadius) &&
      this.pixelRadius > 0;
    const validCourse = Number.isFinite(this.course) && this.course >= 0;
    const weatherSelected = this.activeOverlay.get() === 1;
    const enabled = Boolean(SimVar.GetSimVarValue('L:A380X_WXR_AUTO', 'bool'));
    const visible =
      this.ready &&
      enabled &&
      weatherSelected &&
      this.mapShown &&
      validPosition &&
      validRange &&
      validCourse &&
      (mode === EfisNdMode.ARC || mode === EfisNdMode.ROSE_NAV);

    if (visible !== this.visible) {
      this.visible = visible;
      this.containerRef.instance.style.visibility = visible ? 'visible' : 'hidden';
      this.map?.setVisible(visible);
    }
    if (!visible || !this.map) {
      return;
    }

    // The native map radius is in metres; ND map geometry is in nautical miles and pixels.
    const radius = (this.rangeRadius * 1852 * (MAP_SIZE / 2)) / this.pixelRadius;
    this.map.setParams({ lla: new LatLong(this.latitude, this.longitude), radius });
    this.map.style.top = `${MAP_OFFSET + this.centerYBias}px`;
    this.map.style.transform = `rotate(${-this.course}deg)`;
    this.map.style.transformOrigin = 'center';
    this.containerRef.instance.style.clipPath =
      mode === EfisNdMode.ARC
        ? "path('M0,312 a492,492 0 0 1 768,0 L768,562 L648,562 L591,625 L0,625 L0,312')"
        : 'circle(315px at 384px 384px)';
  }

  destroy(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
    }
    for (const subscription of this.subscriptions) {
      subscription.destroy();
    }
    this.activeOverlay.destroy();
    this.map?.setVisible(false);
    this.map?.remove();
    this.map = null;
    super.destroy();
  }

  render(): VNode {
    return (
      <div
        ref={this.containerRef}
        style="position: absolute; inset: 0; width: 768px; height: 768px; overflow: hidden; visibility: hidden; pointer-events: none;"
      />
    );
  }
}
