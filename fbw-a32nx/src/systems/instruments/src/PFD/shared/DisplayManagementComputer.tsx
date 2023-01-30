import { Arinc429Word } from '@shared/arinc429';
import { Arinc429Values } from 'instruments/src/PFD/shared/ArincValueProvider';
import { PFDSimvars } from 'instruments/src/PFD/shared/PFDSimvarPublisher';
import { EventBus, Subject } from 'msfssdk';

export interface DisplayManagementComputerEvents {
    trueRefActive: boolean,
    heading: Arinc429Word,
    track: Arinc429Word,
}

export class DisplayManagementComputer {
    private readonly irMaintWord = Subject.create(new Arinc429Word(0));

    private readonly magHeading = Subject.create(new Arinc429Word(0));

    private readonly trueHeading = Subject.create(new Arinc429Word(0));

    private readonly magTrack = Subject.create(new Arinc429Word(0));

    private readonly trueTrack = Subject.create(new Arinc429Word(0));

    private readonly trueRefPb = Subject.create(false);

    private readonly trueRefActive = Subject.create(false);

    constructor(private bus: EventBus) {}

    init(): void {
        const pub = this.bus.getPublisher<DisplayManagementComputerEvents>();

        this.trueRefActive.sub((v) => {
            pub.pub('trueRefActive', v);
            this.handleHeading();
        }, true);

        const sub = this.bus.getSubscriber<Arinc429Values & PFDSimvars>();

        this.irMaintWord.sub(this.handleTrueRef.bind(this));
        this.trueRefPb.sub(this.handleTrueRef.bind(this), true);

        this.magHeading.sub(this.handleHeading.bind(this));
        this.magTrack.sub(this.handleHeading.bind(this));
        this.trueHeading.sub(this.handleHeading.bind(this));
        this.trueTrack.sub(this.handleHeading.bind(this));

        sub.on('irMaintWord').whenChanged().handle((v) => this.irMaintWord.set(v));
        sub.on('trueRefPushbutton').whenChanged().handle((v) => this.trueRefPb.set(v > 0));
        sub.on('magHeading').whenChanged().handle((v) => this.magHeading.set(v));
        sub.on('magTrack').whenChanged().handle((v) => this.magTrack.set(v));
        sub.on('trueHeading').whenChanged().handle((v) => this.trueHeading.set(v));
        sub.on('trueTrack').whenChanged().handle((v) => this.trueTrack.set(v));
    }

    private handleTrueRef(): void {
        // true ref is active when the PB is pressed or the ADIRU is at an extreme latitude
        // and the ADIRU must not be in ATT reversion mode
        const trueRequested = this.irMaintWord.get().getBitValueOr(15, false) || this.trueRefPb.get();
        this.trueRefActive.set(trueRequested && !this.irMaintWord.get().getBitValueOr(2, false));
    }

    private handleHeading(): void {
        const pub = this.bus.getPublisher<DisplayManagementComputerEvents>();

        pub.pub('heading', this.trueRefActive.get() ? this.trueHeading.get() : this.magHeading.get());
        pub.pub('track', this.trueRefActive.get() ? this.trueTrack.get() : this.magTrack.get());
    }
}
