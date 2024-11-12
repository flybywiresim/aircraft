// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, EventBus, FSComponent, InstrumentBackplane, Subject } from '@microsoft/msfs-sdk';
import { FCUSimvarPublisher } from './shared/FcuSimvarPublisher';
import { FCUComponent } from './FCU';
import { calculateSunAzimuthElevation, lerp, calculateAmbientBrightness } from './SunAngle';
import { MsfsAircraftSystemEvents, MsfsAircraftSystemPublisher } from '@flybywiresim/fbw-sdk';

// eslint-disable-next-line camelcase
class A32NX_FCU extends BaseInstrument {
  private readonly bus = new EventBus();
  private readonly backplane = new InstrumentBackplane();

  private sub = this.bus.getSubscriber<MsfsAircraftSystemEvents>();

  private readonly simVarPublisher = new FCUSimvarPublisher(this.bus);
  private readonly msfsAircraftSystemPublisher = new MsfsAircraftSystemPublisher(this.bus);

  private simTime = new Date();

  private solarParams = calculateSunAzimuthElevation(this.simTime, 0, 0);

  private readonly ambientBrightness = Subject.create(0, (a, b) => Math.abs(a - b) < 0.01);

  private readonly screenBrightness = ConsumerSubject.create(this.sub.on('msfs_light_potentiometer_87'), 0);

  constructor() {
    super();

    this.backplane.addPublisher('SimVarPublisher', this.simVarPublisher);
    this.backplane.addPublisher('MsfsAircraftSystem', this.msfsAircraftSystemPublisher);

    this.ambientBrightness.sub((ambientBrightness) => {
      SimVar.SetSimVarValue('L:A32NX_AMBIENT_BRIGHTNESS', 'number', ambientBrightness);
      this.updateDisplayBrightness();
    });

    this.screenBrightness.sub(this.updateDisplayBrightness.bind(this), true);
  }

  get templateID(): string {
    return 'A32NX_FCU';
  }

  private updateDisplayBrightness() {
    const ambientBrightness = this.ambientBrightness.get();
    const screenBrightess = this.screenBrightness.get();

    const saturation = screenBrightess > 0 ? lerp(ambientBrightness * (1.05 - screenBrightess), 1, 0.6, 0, 100) : 0;
    const luminosity = lerp(ambientBrightness * (1.05 - screenBrightess), 1, 0.6, 80, 55);
    const colour = `hsl(31, ${saturation.toFixed(1)}%, ${luminosity.toFixed(1)}%)`;
    document.documentElement.style.setProperty('--main-display-colour', colour);

    const textShadowOpacity = lerp(screenBrightess, 0, 1, 0, 0.3) * lerp(ambientBrightness, 0, 0.9, 1, 0);
    const textShadow = `rgba(207, 110, 0, ${textShadowOpacity.toFixed(2)})`;
    document.documentElement.style.setProperty('--main-text-shadow-colour', textShadow);

    const backgroundOpacity = lerp(screenBrightess, 0, 1, 0, 0.3) * lerp(ambientBrightness, 0, 0.8, 1, 0.1);
    document.documentElement.style.setProperty('--main-background-opacity', backgroundOpacity.toString());
  }

  public connectedCallback(): void {
    super.connectedCallback();

    FSComponent.render(<FCUComponent bus={this.bus} />, document.getElementById('FCU_CONTENT'));

    // Remove "instrument didn't load" text
    document.getElementById('FCU_CONTENT').querySelector(':scope > h1').remove();

    this.backplane.init();
  }

  public Update(): void {
    super.Update();

    this.backplane.onUpdate();

    const lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degrees');
    const lon = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degrees');
    const simTimestamp = SimVar.GetSimVarValue('E:ABSOLUTE TIME', 'seconds') - 62135596800;
    this.simTime.setTime(simTimestamp * 1000);

    const sunParams = calculateSunAzimuthElevation(this.simTime, lat, lon, this.solarParams);
    const ambientBrightness = calculateAmbientBrightness(sunParams);
    this.ambientBrightness.set(ambientBrightness);
  }
}

registerInstrument('a32nx-fcu', A32NX_FCU);
