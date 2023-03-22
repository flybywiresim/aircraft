import { EventBus, SimVarDefinition, SimVarPublisher, SimVarValueType, Subject } from 'msfssdk';
import { Arinc429RegisterSubject } from '../Arinc429RegisterSubject';
import { AdirsSimVars } from '../SimVarTypes';

export interface DmcLogicEvents {
    trueRefActive: boolean,
    heading: number,
    track: number,
}

export interface DmcDiscreteInputEvents {
    trueRefPushButton: boolean,
}

export type DmcEvents = DmcLogicEvents & DmcDiscreteInputEvents;

export class DmcPublisher extends SimVarPublisher<DmcDiscreteInputEvents> {
    private readonly irMaintWord = Arinc429RegisterSubject.createEmpty();

    private readonly magHeading = Subject.create(0);

    private readonly trueHeading = Subject.create(0);

    private readonly magTrack = Subject.create(0);

    private readonly trueTrack = Subject.create(0);

    private readonly trueRefPb = Subject.create(false);

    private readonly trueRefActive = Subject.create(false);

    constructor(private eventBus: EventBus) {
        const simVars = new Map<keyof DmcDiscreteInputEvents, SimVarDefinition>([
            // FIXME, per-side
            ['trueRefPushButton', { name: 'L:A32NX_PUSH_TRUE_REF', type: SimVarValueType.Bool }],
        ]);
        super(simVars, eventBus);
    }

    init(): void {
        const pub = this.eventBus.getPublisher<DmcLogicEvents>();

        this.trueRefActive.sub((v) => {
            pub.pub('trueRefActive', v);
            this.handleHeading();
        }, true);

        const sub = this.eventBus.getSubscriber<AdirsSimVars & DmcDiscreteInputEvents>();

        this.irMaintWord.sub(this.handleTrueRef.bind(this));
        this.trueRefPb.sub(this.handleTrueRef.bind(this), true);

        this.magHeading.sub(this.handleHeading.bind(this));
        this.magTrack.sub(this.handleHeading.bind(this));
        this.trueHeading.sub(this.handleHeading.bind(this));
        this.trueTrack.sub(this.handleHeading.bind(this));

        sub.on('irMaintWordRaw').whenChanged().handle((v) => this.irMaintWord.setWord(v));
        sub.on('trueRefPushButton').whenChanged().handle((v) => this.trueRefPb.set(v));
        sub.on('magHeadingRaw').whenChanged().handle((v) => this.magHeading.set(v));
        sub.on('magTrackRaw').whenChanged().handle((v) => this.magTrack.set(v));
        sub.on('trueHeadingRaw').whenChanged().handle((v) => this.trueHeading.set(v));
        sub.on('trueTrackRaw').whenChanged().handle((v) => this.trueTrack.set(v));
    }

    private handleTrueRef(): void {
        // true ref is active when the PB is pressed or the ADIRU is at an extreme latitude
        // and the ADIRU must not be in ATT reversion mode
        const trueRequested = this.irMaintWord.get().bitValueOr(15, false) || this.trueRefPb.get();
        this.trueRefActive.set(trueRequested && !this.irMaintWord.get().bitValueOr(2, false));
    }

    private handleHeading(): void {
        const pub = this.eventBus.getPublisher<DmcLogicEvents>();

        pub.pub('heading', this.trueRefActive.get() ? this.trueHeading.get() : this.magHeading.get());
        pub.pub('track', this.trueRefActive.get() ? this.trueTrack.get() : this.magTrack.get());
    }
}
