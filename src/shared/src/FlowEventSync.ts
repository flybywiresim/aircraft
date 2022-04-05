import stringify from 'safe-stable-stringify';

// TODO replace this with the class from the actual source once the repo is updated
export class FlowEventSync {
    static EB_LISTENER_KEY = 'EB_EVENTS';

    /**
     * Creates an instance of EventBusFlowEventSync.
     * @param recvEventCb A callback to execute when an event is received on the bus.
     * @param busId The ID of the bus.
     */

    private evtNum: number;

    private dataPackageQueue: any[];

    private topic: string;

    private isRunning: boolean;

    private recvEventCb: (topic: string, data: any) => void;

    constructor(recvEventCb?: (topic: string, data: any) => void, topic?: string) {
        this.evtNum = 0;
        this.topic = topic;
        this.dataPackageQueue = [];
        this.isRunning = true;
        this.recvEventCb = recvEventCb;
        if (topic) {
            Coherent.on('OnInteractionEvent', this.processEventsReceived.bind(this));
        }
        /** Sends the queued up data packages */
        const sendFn = () => {
            if (this.dataPackageQueue.length > 0) {
                const syncDataPackage = { data: this.dataPackageQueue };
                LaunchFlowEvent('ON_MOUSERECT_HTMLEVENT', FlowEventSync.EB_LISTENER_KEY, stringify(syncDataPackage));
                this.dataPackageQueue.length = 0;
            }
            if (this.isRunning) {
                requestAnimationFrame(sendFn);
            }
        };
        requestAnimationFrame(sendFn);
    }

    public stop() {
        this.isRunning = false;
    }

    /**
     * Processes events received from onInteractionEvent and sends them onto the local bus.
     * @param target always empty
     * @param args [0] the bus id [1] SyncDataPackage
     */
    processEventsReceived(_target, args) {
        // identify if its a busevent
        if (args.length === 0 || args[0] !== FlowEventSync.EB_LISTENER_KEY) {
            return;
        }
        const syncDataPackage = JSON.parse(args[1]);
        syncDataPackage.data.forEach((data) => {
            if (data.topic === this.topic) {
                try {
                    this.recvEventCb(data.topic, data.data !== undefined ? JSON.parse(data.data) : undefined);
                } catch (e) {
                    console.error(e);
                    if (e instanceof Error) {
                        console.error(e.stack);
                    }
                }
            }
        });
    }

    /**
     * Sends an event via flow events.
     * @param topic The topic to send data on.
     * @param data The data to send.
     * @param isCached Whether or not this event is cached.
     */
    sendEvent(topic: string, data: any, isCached: boolean) {
        // HERE WE QUEUE STUFF TO SEND IT LATER
        // stringify data
        const dataObj = stringify(data);
        // build a data package
        const dataPackage = {
            evtNum: this.evtNum++,
            topic,
            data: dataObj,
            isCached,
        };
        // queue data package
        this.dataPackageQueue.push(dataPackage);
    }

    /** @inheritdoc */
    receiveEvent() {
        // noop
    }
}
