import { EventBus, Publisher } from 'msfssdk';
import { getDisplayIndex } from 'instruments/src/PFD/PFD';
import { Arinc429Word } from '@shared/arinc429';
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
    chosenRa: Arinc429Word;
    fpa: Arinc429Word;
    da: Arinc429Word;

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

    private ownRadioAltitude = new Arinc429Word(0);

    private oppRadioAltitude = new Arinc429Word(0);

    private fpa = new Arinc429Word(0);

    private da = new Arinc429Word(0);

    constructor(private readonly bus: EventBus) {

    }

    public init() {
        const publisher = this.bus.getPublisher<Arinc429Values>();
        const subscriber = this.bus.getSubscriber<PFDSimvars>();

        subscriber.on('pitch').handle((p) => {
            this.pitch = new Arinc429Word(p);
            publisher.pub('pitchAr', this.pitch);
        });
        subscriber.on('roll').handle((p) => {
            this.roll = new Arinc429Word(p);
            publisher.pub('rollAr', this.roll);
        });
        subscriber.on('groundTrack').handle((gt) => {
            this.groundTrack = new Arinc429Word(gt);
            publisher.pub('groundTrackAr', this.groundTrack);
        });
        subscriber.on('heading').handle((h) => {
            this.heading = new Arinc429Word(h);
            publisher.pub('headingAr', this.heading);
        });

        subscriber.on('speed').handle((s) => {
            this.speed = new Arinc429Word(s);
            publisher.pub('speedAr', this.speed);
        });

        subscriber.on('altitude').handle((a) => {
            this.altitude = new Arinc429Word(a);
            publisher.pub('altitudeAr', this.altitude);
        });

        subscriber.on('mach').handle((m) => {
            this.mach = new Arinc429Word(m);
            publisher.pub('machAr', this.mach);
        });

        subscriber.on('vsInert').handle((ivs) => {
            this.vsInert = new Arinc429Word(ivs);

            if (this.vsInert.isNormalOperation()) {
                publisher.pub('vs', this.vsInert);
            }
        });

        subscriber.on('vsBaro').handle((vsb) => {
            this.vsBaro = new Arinc429Word(vsb);
            if (!this.vsInert.isNormalOperation()) {
                publisher.pub('vs', this.vsBaro);
            }
        });

        subscriber.on('groundSpeed').handle((gs) => {
            this.groundSpeed = new Arinc429Word(gs);
            publisher.pub('gs', this.groundSpeed);
        });

        subscriber.on('radioAltitude1').handle((ra) => {
            if (getDisplayIndex() === 1) {
                this.ownRadioAltitude = new Arinc429Word(ra);
            } else {
                this.oppRadioAltitude = new Arinc429Word(ra);
            }
            this.determineAndPublishChosenRadioAltitude(publisher);
        });

        subscriber.on('radioAltitude2').handle((ra) => {
            if (getDisplayIndex() === 2) {
                this.ownRadioAltitude = new Arinc429Word(ra);
            } else {
                this.oppRadioAltitude = new Arinc429Word(ra);
            }
            this.determineAndPublishChosenRadioAltitude(publisher);
        });

        subscriber.on('fpaRaw').handle((fpa) => {
            this.fpa = new Arinc429Word(fpa);
            publisher.pub('fpa', this.fpa);
        });

        subscriber.on('daRaw').handle((da) => {
            this.da = new Arinc429Word(da);
            publisher.pub('da', this.da);
        });
    }

    private determineAndPublishChosenRadioAltitude(publisher: Publisher<Arinc429Values>) {
        const ownRadioAltitudeHasData = !this.ownRadioAltitude.isFailureWarning() && !this.ownRadioAltitude.isNoComputedData();
        const oppRadioAltitudeHasData = !this.oppRadioAltitude.isFailureWarning() && !this.oppRadioAltitude.isNoComputedData();
        const chosenRadioAltitude = (
            // the own RA has no data and the opposite one has data
            (!ownRadioAltitudeHasData && oppRadioAltitudeHasData)
            // the own RA has FW and the opposite has NCD
            || this.ownRadioAltitude.isFailureWarning() && this.oppRadioAltitude.isNoComputedData()
        ) ? this.oppRadioAltitude : this.ownRadioAltitude;

        publisher.pub('chosenRa', chosenRadioAltitude);
    }
}
