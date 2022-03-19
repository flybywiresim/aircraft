import stringify from 'safe-stable-stringify';

// TODO replace this with the class from the actual source once the repo is updated
export class FlowEventSync {
    static EB_LISTENER_KEY = 'EB_EVENTS';

    /**
     * Creates an instance of EventBusFlowEventSync.
     * @param recvEventCb A callback to execute when an event is received on the bus.
     * @param busId The ID of the bus.
     */

    private evtNum;

    private lastEventSynced;

    private dataPackageQueue;

    private recvEventCb;

    private busId;

    constructor(recvEventCb, busId) {
        this.evtNum = 0;
        this.lastEventSynced = -1;
        this.dataPackageQueue = [];
        this.recvEventCb = recvEventCb;
        this.busId = busId;
        Coherent.on('OnInteractionEvent', this.processEventsReceived.bind(this));
        /** Sends the queued up data packages */
        const sendFn = () => {
            if (this.dataPackageQueue.length > 0) {
                // console.log(`Sending ${this.dataPackageQueue.length} packages`);
                const syncDataPackage = {
                    busId: this.busId,
                    data: this.dataPackageQueue,
                };
                LaunchFlowEvent('ON_MOUSERECT_HTMLEVENT', FlowEventSync.EB_LISTENER_KEY, this.busId.toString(), stringify(syncDataPackage));
                this.dataPackageQueue.length = 0;
            }
            requestAnimationFrame(sendFn);
        };
        requestAnimationFrame(sendFn);
    }

    /**
     * Processes events received from onInteractionEvent and sends them onto the local bus.
     * @param target always empty
     * @param args [0] the bus id [1] SyncDataPackage
     */
    processEventsReceived(target, args) {
        // identify if its a busevent
        if (args.length === 0 || args[0] !== FlowEventSync.EB_LISTENER_KEY) {
            return;
        }
        // not coming from this bus?
        if (this.busId !== Number(args[1])) {
            const syncDataPackage = JSON.parse(args[2]);
            syncDataPackage.data.forEach((data) => {
                try {
                    // not entirely sure if this check is still needed
                    if (this.lastEventSynced !== data.evtNum) {
                        this.lastEventSynced = data.evtNum;
                        this.recvEventCb(data.topic, data.data !== undefined ? JSON.parse(data.data) : undefined, false, data.isCached);
                    } else {
                        console.warn('Same event received twice');
                    }
                } catch (e) {
                    console.error(e);
                    if (e instanceof Error) {
                        console.error(e.stack);
                    }
                }
            });
        }
    }

    /**
     * Sends an event via flow events.
     * @param topic The topic to send data on.
     * @param data The data to send.
     * @param isCached Whether or not this event is cached.
     */
    sendEvent(topic, data, isCached) {
        // HERE WE QUEUE STUFF TO SEND IT LATER
        // stringify data
        const dataObj = JSON.stringify(data);
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
