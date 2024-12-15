import stringify from 'safe-stable-stringify';

export class FlowEventSync {
  static EB_LISTENER_KEY = 'EB_EVENTS';

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

    const sendFn = () => {
      if (this.dataPackageQueue.length > 0) {
        const syncDataPackage = { data: this.dataPackageQueue };
        if (!window.ACE_ENGINE_HANDLE) {
          LaunchFlowEvent('ON_MOUSERECT_HTMLEVENT', FlowEventSync.EB_LISTENER_KEY, stringify(syncDataPackage));
        }
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
   * Processes events received from onInteractionEvent and executes the configured callback.
   * @param target always empty
   * @param args [0] the eventlistener key [1] SyncDataPackage
   */
  processEventsReceived(_target, args) {
    // identify if its a flowsyncevent
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
   */
  sendEvent(topic: string, data: any) {
    const dataObj = stringify(data);

    const dataPackage = {
      evtNum: this.evtNum++,
      topic,
      data: dataObj,
    };

    this.dataPackageQueue.push(dataPackage);
  }

  receiveEvent() {
    // noop
  }
}
