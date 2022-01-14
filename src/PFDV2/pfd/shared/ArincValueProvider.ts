import { EventBus } from 'msfssdk';
import { Arinc429Word } from './arinc429';
import { PFDSimvars } from './PFDSimvarPublisher';

export interface Arinc429Values {
    pitchAr: Arinc429Word;
    rollAr: Arinc429Word;
    altitudeAr: Arinc429Word;
    groundTrackAr: Arinc429Word;
    headingAr: Arinc429Word;
    speedAr: Arinc429Word;
    machAr: Arinc429Word;
    vs: Arinc429Word;
    gs: Arinc429Word;
    radioAltitude1Ar: Arinc429Word;
    radioAltitude2Ar: Arinc429Word;

}
export class ArincValueProvider {
    private roll = new Arinc429Word(0);

    private pitch = new Arinc429Word(0);

    private groundTrack = new Arinc429Word(0);

    private heading = new Arinc429Word(0);

    private speed = new Arinc429Word(0);

    private altitude = new Arinc429Word(0);

    private mach = new Arinc429Word(0);

    private vsInert = new Arinc429Word(0);

    private vsBaro = new Arinc429Word(0);

    private groundSpeed = new Arinc429Word(0);

    private radioAltitude1 = new Arinc429Word(0);

    private radioAltitude2 = new Arinc429Word(0);

    constructor(private readonly bus: EventBus) {

    }

    public init() {
        const publisher = this.bus.getPublisher<Arinc429Values>();
        const subscriber = this.bus.getSubscriber<PFDSimvars>();

        subscriber.on('pitch').handle((p) => {
            this.pitch.assign(p);
            publisher.pub('pitchAr', this.pitch);
        });
        subscriber.on('roll').handle((p) => {
            this.roll.assign(p);
            publisher.pub('rollAr', this.roll);
        });
        subscriber.on('groundTrack').handle((p) => {
            this.groundTrack.assign(p);
            publisher.pub('groundTrackAr', this.groundTrack);
        });
        subscriber.on('heading').handle((p) => {
            this.heading.assign(p);
            publisher.pub('headingAr', this.heading);
        });

        subscriber.on('speed').handle((p) => {
            this.speed.assign(p);
            publisher.pub('speedAr', this.speed);
        });

        subscriber.on('altitude').handle((p) => {
            this.altitude.assign(p);
            publisher.pub('altitudeAr', this.altitude);
        });

        subscriber.on('mach').handle((p) => {
            this.mach.assign(p);
            publisher.pub('machAr', this.mach);
        });

        subscriber.on('vs_inert').handle((ivs) => {
            this.vsInert.assign(ivs);

            if (this.vsInert.isNormalOperation()) {
                publisher.pub('vs', this.vsInert);
            }
        });

        subscriber.on('vs_baro').handle((vsb) => {
            this.vsBaro.assign(vsb);
            if (!this.vsInert.isNormalOperation()) {
                publisher.pub('vs', this.vsBaro);
            }
        });

        subscriber.on('groundSpeed').handle((gs) => {
            this.groundSpeed.assign(gs);
            publisher.pub('gs', this.groundSpeed);
        });

        subscriber.on('radioAltitude1').handle((gs) => {
            this.radioAltitude1.assign(gs);
            publisher.pub('radioAltitude1Ar', this.radioAltitude1);
        });

        subscriber.on('radioAltitude2').handle((gs) => {
            this.radioAltitude2.assign(gs);
            publisher.pub('radioAltitude2Ar', this.radioAltitude2);
        });
    }
}
