import { EventBus, Publisher } from 'msfssdk';
import { getDisplayIndex } from 'PFDV2/pfd/components';
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
    chosenRa: Arinc429Word;

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

        subscriber.on('radioAltitude1').handle((ra) => {
            if (getDisplayIndex() === 1) {
                this.ownRadioAltitude.assign(ra);
            } else {
                this.oppRadioAltitude.assign(ra);
            }
            this.determineAndPublishChosenRadioAltitude(publisher);
        });

        subscriber.on('radioAltitude2').handle((ra) => {
            if (getDisplayIndex() === 2) {
                this.ownRadioAltitude.assign(ra);
            } else {
                this.oppRadioAltitude.assign(ra);
            }
            this.determineAndPublishChosenRadioAltitude(publisher);
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
