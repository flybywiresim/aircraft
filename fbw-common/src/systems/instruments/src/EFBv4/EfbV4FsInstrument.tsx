import { Clock, EventBus, FSComponent, FsInstrument, HEventPublisher, InstrumentBackplane } from '@microsoft/msfs-sdk';

import { EFBv4 } from './EFBv4';
import { busContext, initializeEventBusContext } from './Contexts';
import { EFBSimvarPublisher } from './EFBSimvarPublisher';

export class EfbV4FsInstrument implements FsInstrument {
    private readonly bus = new EventBus();

    private readonly backplane = new InstrumentBackplane();

    private readonly hEventPublisher = new HEventPublisher(this.bus)

    constructor(
        public readonly instrument: BaseInstrument,
    ) {
        this.backplane.addInstrument('clock', new Clock(this.bus));
        this.backplane.addPublisher('efb', new EFBSimvarPublisher(this.bus));
        this.backplane.init();

        initializeEventBusContext(this.bus);

        FSComponent.render(
            <busContext.Provider value={this.bus}>
                <EFBv4 />
            </busContext.Provider>,
            document.getElementById('EFBv4_CONTENT'),
        );

        // Remove "instrument didn't load" text
        document.getElementById('EFBv4_CONTENT')?.querySelector(':scope > h1')?.remove();
    }

    Update(): void {
        this.backplane.onUpdate();
    }

    onFlightStart(): void {
        // noop
    }

    onGameStateChanged(_oldState: GameState, _newState: GameState): void {
        // noop
    }

    onInteractionEvent(args: Array<string>): void {
        this.hEventPublisher.dispatchHEvent(args[0]);
    }

    // eslint-disable-next-line camelcase
    onSoundEnd(_soundEventId: Name_Z): void {
        // noop
    }
}
