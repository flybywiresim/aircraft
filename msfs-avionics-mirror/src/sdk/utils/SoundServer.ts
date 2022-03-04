import { EventBus, PublishPacer } from '../data/EventBus';
import { BasePublisher } from '../instruments/BasePublishers';
import { EventSubscriber } from '../data/EventSubscriber';

/** Events related to sound playback. */
export interface SoundEvents {
  /** Request to play a sound once. */
  play_sound: string,
  /** Start playing a sound repeatedly. */
  start_sound: string,
  /** Stop playing a repeated sound.*/
  stop_sound: string,
  /** Notification that sound playback has been triggered..  */
  sound_queued: string,
  /** Notification that sound playback has ended. */
  sound_played: string,
}


/** A publisher for sound events. */
export class SoundPublisher extends BasePublisher<SoundEvents> {
  /**
   * Create a SoundPublisher.
   * @param bus An event bus.
   * @param pacer An optional pacer to controle the rate of publishing.
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<SoundEvents>) {
    super(bus, pacer);
  }

  /**
   * Request that a sound be played.
   * @param soundId The id of the sound to play.
   */
  public playSound(soundId: string): void {
    this.publish('play_sound', soundId, true);
  }

  /**
   * Request that a continuous sound be started.
   * @param soundId The id of the sound to play.
   */
  public startSound(soundId: string): void {
    this.publish('start_sound', soundId, true);
  }

  /**
   * Request that a continuous sound be stopped.
   * @param soundId The id of the sound to play.
   */
  public stopSound(soundId: string): void {
    this.publish('stop_sound', soundId, true);
  }

  /**
   * Send a notification that play has been requested.
   * @param soundId The id of the sound requested.
   */
  public soundQueued(soundId: string): void {
    this.publish('sound_queued', soundId, true);
  }

  /**
   * Send a notification that play has completed.
   * @param soundId The id of the sound played.
   */
  public soundPlayed(soundId: string): void {
    this.publish('sound_played', soundId, true);
  }
}

/** A sound play record. */
type PlayRecord = {
  /** The event ID of the sound. */
  soundEventId: Name_Z,
  /** Play continuously or once. */
  continuous: boolean
}

/**
 * A event-drive sound server that manages both one-shot and continuous sound playback.
 */
export class SoundServer {
  private instrument: BaseInstrument;
  private playing: Map<string, PlayRecord>;
  private subscriber: EventSubscriber<SoundEvents>;
  private publisher: SoundPublisher;

  /**
   * Create a sound server.
   * @param bus An event bus.
   * @param publisher A sound publisher.
   * @param instrument The hosting instance of BaseInstrument.
   */
  constructor(bus: EventBus, publisher: SoundPublisher, instrument: BaseInstrument) {
    this.instrument = instrument;
    this.playing = new Map<string, PlayRecord>();
    this.subscriber = bus.getSubscriber<SoundEvents>();
    this.publisher = publisher;

    this.subscriber.on('play_sound').handle((soundId: string) => { this.playSound(soundId, false); });
    this.subscriber.on('start_sound').handle((soundId: string) => { this.playSound(soundId, true); });
    this.subscriber.on('stop_sound').handle((soundId: string) => { this.stopSound(soundId); });
  }

  /**
   * Play a requested sound once or continuously.
   * @param soundId The id of the sound to play.
   * @param continuous Whether to play it continuously.
   */
  protected playSound(soundId: string, continuous = false): void {
    if (!this.playing.has(soundId)) {
      this.instrument.playInstrumentSound(soundId);
      this.playing.set(soundId, { soundEventId: new Name_Z(soundId), continuous: continuous });
      this.publisher.soundQueued(soundId);
    }
  }

  /**
   * Stop a continuously played sound.
   * @param soundId The id of the sound to stop.
   */
  protected stopSound(soundId: string): void {
    const record = this.playing.get(soundId);
    if (record) {
      // Setting continuous to false means it won't be retriggered next time it ends.
      record.continuous = false;
      this.playing.set(soundId, record);
    }
  }


  /**
   * Handle a sound end event.  This needs to be called by the parent device,
   * and it takes a Name_Z, as sent from VCockpit.js in the master onSoundEnd call.
   * @param soundEventId The id of the sound event.
   */
  public onSoundEnd(soundEventId: Name_Z): void {
    for (const entry of this.playing.entries()) {
      // Name_Z can't be compared with ==, you need to use the in-built function.
      if (Name_Z.compare(entry[1].soundEventId, soundEventId)) {
        if (entry[1].continuous) {
          this.instrument.playInstrumentSound(entry[0]);
          return;
        } else {
          this.publisher.soundPlayed(entry[0]);
          this.playing.delete(entry[0]);
          return;
        }
      }
    }
  }
}