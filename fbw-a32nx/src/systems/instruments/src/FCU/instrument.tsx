import { EventBus, FSComponent, Subject } from '@microsoft/msfs-sdk';
import { FCUSimvarPublisher } from './shared/FcuSimvarPublisher';
import { FCUComponent } from './FCU';
import { calculateSunAzimuthElevation, lerp, calculateAmbientBrightness } from './SunAngle';

// eslint-disable-next-line camelcase
class A32NX_FCU extends BaseInstrument {
  private bus: EventBus;

  private simVarPublisher: FCUSimvarPublisher;

  /**
   * "mainmenu" = 0
   * "loading" = 1
   * "briefing" = 2
   * "ingame" = 3
   */
  private gameState = 0;

  private simTime = new Date();

  private solarParams = calculateSunAzimuthElevation(this.simTime, 0, 0);

  private ambientBrightness = Subject.create(0, (a, b) => Math.abs(a - b) < 0.01);

  private screenBrightess = Subject.create(0, (a, b) => Math.abs(a - b) < 0.01);

  constructor() {
    super();
    this.bus = new EventBus();
    this.simVarPublisher = new FCUSimvarPublisher(this.bus);

    this.ambientBrightness.sub((ambientBrightness) => {
      SimVar.SetSimVarValue('L:A32NX_AMBIENT_BRIGHTNESS', 'number', ambientBrightness);
      this.updateDisplayBrightness();
    });

    this.screenBrightess.sub(this.updateDisplayBrightness.bind(this), true);

    // need to run this at high speed to avoid jumps when the knob is rotated
    setInterval(() => {
      const screenBrightess = SimVar.GetSimVarValue('A:LIGHT POTENTIOMETER:87', 'percent over 100');
      this.screenBrightess.set(screenBrightess);
    });
  }

  get templateID(): string {
    return 'A32NX_FCU';
  }

  private updateDisplayBrightness() {
    const ambientBrightness = this.ambientBrightness.get();
    const screenBrightess = this.screenBrightess.get();

    const saturation = lerp(ambientBrightness * (1.05 - screenBrightess), 1, 0.6, 10, 100);
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
  }

  public Update(): void {
    super.Update();

    if (this.gameState !== 3) {
      const gamestate = this.getGameState();
      if (gamestate === 3) {
        this.simVarPublisher.startPublish();
      }
      this.gameState = gamestate;
    } else {
      this.simVarPublisher.onUpdate();
    }

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
