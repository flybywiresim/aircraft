import { Clock, FSComponent } from 'msfssdk';
import { EventBus, HEventPublisher } from 'msfssdk/data';
import { PFDComponent } from './components';
import { AdirsValueProvider } from './shared/AdirsValueProvider';
import { ArincValueProvider } from './shared/ArincValueProvider';
import { PFDSimvarPublisher } from './shared/PFDSimvarPublisher';
import { SimplaneValueProvider } from './shared/SimplaneValueProvider';

import './style.scss';

class A32NX_PFD extends BaseInstrument {
    private bus: EventBus;

    private simVarPublisher: PFDSimvarPublisher;

    private readonly hEventPublisher;

    private readonly arincProvider: ArincValueProvider;

    private readonly simplaneValueProvider: SimplaneValueProvider;

    private readonly clock: Clock;

    constructor() {
        super();
        this.bus = new EventBus();
        this.simVarPublisher = new PFDSimvarPublisher(this.bus);
        this.hEventPublisher = new HEventPublisher(this.bus);
        this.arincProvider = new ArincValueProvider(this.bus);
        this.simplaneValueProvider = new SimplaneValueProvider(this.bus);
        this.clock = new Clock(this.bus);
    }

    get templateID(): string {
        return 'A32NX_PFD';
    }

    public getDeltaTime() {
        return this.deltaTime;
    }

    public onInteractionEvent(args: string[]): void {
        this.hEventPublisher.dispatchHEvent(args[0]);
    }

    public connectedCallback(): void {
        super.connectedCallback();

        this.arincProvider.init();
        this.clock.init();

        this.simVarPublisher.subscribe('elec');
        this.simVarPublisher.subscribe('coldDark');
        this.simVarPublisher.subscribe('potentiometer_captain');
        this.simVarPublisher.subscribe('pitch');
        this.simVarPublisher.subscribe('roll');
        this.simVarPublisher.subscribe('heading');
        this.simVarPublisher.subscribe('altitude');
        this.simVarPublisher.subscribe('speed');
        this.simVarPublisher.subscribe('alpha_prot');
        this.simVarPublisher.subscribe('onGround');
        this.simVarPublisher.subscribe('activeLateralMode');
        this.simVarPublisher.subscribe('activeVerticalMode');
        this.simVarPublisher.subscribe('fma_mode_reversion');
        this.simVarPublisher.subscribe('fma_speed_protection');
        this.simVarPublisher.subscribe('AThrMode');
        this.simVarPublisher.subscribe('ap_vs_selected');
        this.simVarPublisher.subscribe('radio_alt');
        this.simVarPublisher.subscribe('approachCapability');
        this.simVarPublisher.subscribe('ap1Active');
        this.simVarPublisher.subscribe('ap2Active');
        this.simVarPublisher.subscribe('fmaVerticalArmed');
        this.simVarPublisher.subscribe('fmaLateralArmed');
        this.simVarPublisher.subscribe('fd1Active');
        this.simVarPublisher.subscribe('fd2Active');
        this.simVarPublisher.subscribe('athrStatus');
        this.simVarPublisher.subscribe('athrModeMessage');
        this.simVarPublisher.subscribe('machPreselVal');
        this.simVarPublisher.subscribe('speedPreselVal');
        this.simVarPublisher.subscribe('mda');
        this.simVarPublisher.subscribe('dh');
        this.simVarPublisher.subscribe('attHdgKnob');
        this.simVarPublisher.subscribe('airKnob');
        this.simVarPublisher.subscribe('vs_baro');
        this.simVarPublisher.subscribe('vs_inert');
        this.simVarPublisher.subscribe('sideStickY');
        this.simVarPublisher.subscribe('sideStickX');
        this.simVarPublisher.subscribe('fdYawCommand');
        this.simVarPublisher.subscribe('fdBank');
        this.simVarPublisher.subscribe('fdPitch');
        this.simVarPublisher.subscribe('hasLoc');
        this.simVarPublisher.subscribe('hasDme');
        this.simVarPublisher.subscribe('navIdent');
        this.simVarPublisher.subscribe('navFreq');
        this.simVarPublisher.subscribe('dme');
        this.simVarPublisher.subscribe('navRadialError');
        this.simVarPublisher.subscribe('hasGlideslope');
        this.simVarPublisher.subscribe('glideSlopeError');
        this.simVarPublisher.subscribe('markerBeacon');
        this.simVarPublisher.subscribe('v1');
        this.simVarPublisher.subscribe('fwcFlightPhase');
        this.simVarPublisher.subscribe('fmgcFlightPhase');

        this.simVarPublisher.subscribe('vr');

        this.simVarPublisher.subscribe('vMax');

        this.simVarPublisher.subscribe('isAltManaged');

        this.simVarPublisher.subscribe('mach');
        this.simVarPublisher.subscribe('flapHandleIndex');

        this.simVarPublisher.subscribe('greenDotSpeed');

        this.simVarPublisher.subscribe('slatSpeed');

        this.simVarPublisher.subscribe('fSpeed');
        this.simVarPublisher.subscribe('transAlt');
        this.simVarPublisher.subscribe('transAltAppr');

        this.simVarPublisher.subscribe('groundTrack');
        this.simVarPublisher.subscribe('showSelectedHeading');
        this.simVarPublisher.subscribe('altConstraint');
        this.simVarPublisher.subscribe('trkFpaActive');
        this.simVarPublisher.subscribe('aoa');
        this.simVarPublisher.subscribe('groundHeadingTrue');
        this.simVarPublisher.subscribe('groundTrackTrue');

        this.simVarPublisher.subscribe('selectedFpa');
        this.simVarPublisher.subscribe('targetSpeedManaged');
        this.simVarPublisher.subscribe('vfeNext');
        this.simVarPublisher.subscribe('ilsCourse');
        this.simVarPublisher.subscribe('tla1');
        this.simVarPublisher.subscribe('tla2');
        this.simVarPublisher.subscribe('metricAltToggle');
        this.simVarPublisher.subscribe('landingElevation');

        this.simVarPublisher.subscribe('tcasState');
        this.simVarPublisher.subscribe('tcasCorrective');
        this.simVarPublisher.subscribe('tcasRedZoneL');
        this.simVarPublisher.subscribe('tcasRedZoneH');
        this.simVarPublisher.subscribe('tcasGreenZoneL');
        this.simVarPublisher.subscribe('tcasGreenZoneH');
        this.simVarPublisher.subscribe('tcasFail');
        this.simVarPublisher.subscribe('engOneRunning');
        this.simVarPublisher.subscribe('engTwoRunning');

        this.simVarPublisher.startPublish();
        this.hEventPublisher.startPublish();

        new AdirsValueProvider(this.bus, this.simVarPublisher);

        FSComponent.render(<PFDComponent bus={this.bus} instrument={this} />, document.getElementById('PFD_CONTENT'));
    }

    /**
   * A callback called when the instrument gets a frame update.
   */
    public Update(): void {
        super.Update();

        this.simVarPublisher.onUpdate();
        this.simplaneValueProvider.onUpdate();
        this.clock.onUpdate();
    }
}

registerInstrument('a32nx-pfd', A32NX_PFD);
