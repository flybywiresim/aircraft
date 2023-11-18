import { EventBus, Publisher } from '@microsoft/msfs-sdk';
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

    private radioAltitude1 = new Arinc429Word(0);

    private radioAltitude2 = new Arinc429Word(0);

    private radioAltitude3 = new Arinc429Word(0);

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
            this.radioAltitude1 = new Arinc429Word(ra);
            this.determineAndPublishChosenRadioAltitude(publisher);
        });

        subscriber.on('radioAltitude2').handle((ra) => {
            this.radioAltitude2 = new Arinc429Word(ra);
            this.determineAndPublishChosenRadioAltitude(publisher);
        });

        subscriber.on('radioAltitude3').handle((ra) => {
            this.radioAltitude3 = new Arinc429Word(ra);
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
        const validRaMap = [
            this.radioAltitude1,
            this.radioAltitude2,
            this.radioAltitude3,
        ].map((ra) => !ra.isFailureWarning() && !ra.isNoComputedData());
        const validCount = validRaMap.filter(x => !!x).length;

        let chosenRas = [this.radioAltitude1, this.radioAltitude2]; // Default: 1 gets 1, 2 gets 2
        if (validCount === 3) {
            // pick the median
            const heights = [
                this.radioAltitude1,
                this.radioAltitude2,
                this.radioAltitude3,
            ].sort((a, b) => a.value - b.value);
            chosenRas = [heights[1], heights[1]];
        } else if (validCount === 2) {
            if (!validRaMap[0]) {
                // fail PFD 1 to RA 3
                chosenRas = [this.radioAltitude3, this.radioAltitude2];
            }
            else if (!validRaMap[1]) {
                // fail PFD 2 to RA 3
                chosenRas = [this.radioAltitude1, this.radioAltitude3];
            }
            // otherwise stick with the default (PFD 1 to 1, PFD 2 to 2)
        } else if (validCount === 1) {
            if (validRaMap[0]) {
                // both get RA 1
                chosenRas = [this.radioAltitude1, this.radioAltitude1];
            }
            else if (validRaMap[1]) {
                // both get RA 2
                chosenRas = [this.radioAltitude2, this.radioAltitude2];
            }
            else {
                // both get RA 3
                chosenRas = [this.radioAltitude3, this.radioAltitude3];
            }
        } else {
            // at this point all have either NCD or FW
            // try to fail back a bit more intelligently around FWs to prioritize NCDs
            const nonFailedMap = [
                this.radioAltitude1,
                this.radioAltitude2,
                this.radioAltitude3,
            ].map((ra) => !ra.isFailureWarning());
            const nonFailedCount = nonFailedMap.filter(x => !!x).length;
            if (nonFailedCount === 2) {
                if (!nonFailedMap[0]) {
                    // fail PFD 1 to RA 3
                    chosenRas = [this.radioAltitude3, this.radioAltitude2];
                }
                else if (!nonFailedMap[1]) {
                    // fail PFD 2 to RA 3
                    chosenRas = [this.radioAltitude1, this.radioAltitude3];
                }
            }
            else if (nonFailedCount === 1) {
                if (nonFailedMap[0]) {
                    // both get RA 1
                    chosenRas = [this.radioAltitude1, this.radioAltitude1];
                }
                else if (nonFailedMap[1]) {
                    // both get RA 2
                    chosenRas = [this.radioAltitude2, this.radioAltitude2];
                }
                else {
                    // both get RA 3
                    chosenRas = [this.radioAltitude3, this.radioAltitude3];
                }
            }
            // don't do anything in case of 3 FWs or 0 FWs and stick to the default
        }

        publisher.pub('chosenRa', getDisplayIndex() === 1 ? chosenRas[0] : chosenRas[1]);
    }
}
