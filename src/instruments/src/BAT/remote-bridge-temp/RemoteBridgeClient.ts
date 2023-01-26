import { AircraftClient, AircraftDataConsumer, AircraftCommandName } from '@flybywiresim/display-bridge-aircraft-server';

export class RemoteBridgeClient {
    private simVarSubscriptions = new Map<number, [string, string]>();

    private lastSimVarValues = new Map<number, any>();

    dataConsumer: AircraftDataConsumer = {
        subscribeToSimVar: (name: string, unit: string, id: number) => {
            console.log(`[subscribeToSimVar] name=${name} unit=${unit} id=${id}`);

            this.simVarSubscriptions.set(id, [name, unit]);
        },

        async setSimVarValue(name: string, unit: string, value): Promise<void> {
            console.log(`[setSimVarValue] name=${name} unit=${unit} value=${value}`);
        },
    };

    client = new AircraftClient(this.dataConsumer);

    connect() {
        this.client.connect('ws://localhost:8069');
    }

    update(deltaTime: number) {
        const parts: any[] = [];

        for (const [id, [name, unit]] of this.simVarSubscriptions) {
            const value = SimVar.GetSimVarValue(name, unit);

            if (value !== this.lastSimVarValues.get(id)) {
                this.lastSimVarValues.set(id, value);

                parts.push(id.toString(), JSON.stringify(value));
            }
        }

        if (parts.length > 0) {
            this.client.sendMessage([AircraftCommandName.SIMVAR_VALUES, ...parts]);
        }
    }
}
