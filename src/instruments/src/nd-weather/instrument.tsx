import { NDWeatherSimvarPublisher } from 'instruments/src/nd-weather/NDWeatherSimvarPublisher';
import { WeatherComponent } from 'instruments/src/nd-weather/Weather';
import { FSComponent, EventBus } from 'msfssdk';
import './style.scss';

class ND_WEATHER extends BaseInstrument {
    private bus: EventBus;

    private simVarPublisher: NDWeatherSimvarPublisher;

    /**
     * "mainmenu" = 0
     * "loading" = 1
     * "briefing" = 2
     * "ingame" = 3
     */
    private gameState = 0;

    constructor() {
        super();
        this.bus = new EventBus();
        this.simVarPublisher = new NDWeatherSimvarPublisher(this.bus);
    }

    get templateID(): string {
        return 'WEATHER';
    }

    public getDeltaTime() {
        return this.deltaTime;
    }

    public connectedCallback(): void {
        super.connectedCallback();

        FSComponent.render(<WeatherComponent bus={this.bus} />, document.getElementById('WEATHER_CONTENT'));
    }

    /**
   * A callback called when the instrument gets a frame update.
   */
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
    }
}

registerInstrument('nd-weather', ND_WEATHER);
