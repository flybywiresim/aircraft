import { AtsuMessage, AtsuMessageType } from './AtsuMessage';
import { AtisMessage } from './AtisMessage';
import { CpdlcMessage } from './CpdlcMessage';
import { DclMessage } from './DclMessage';
import { FreetextMessage } from './FreetextMessage';
import { MetarMessage } from './MetarMessage';
import { OclMessage } from './OclMessage';
import { TafMessage } from './TafMessage';

export class Conversion {
    public static messageDataToMessage<T extends AtsuMessage>(data: T): T {
        let message = null;

        switch (data.Type as AtsuMessageType) {
        case AtsuMessageType.ATIS:
            message = new AtisMessage();
            break;
        case AtsuMessageType.CPDLC:
            message = new CpdlcMessage();
            break;
        case AtsuMessageType.DCL:
            message = new DclMessage();
            break;
        case AtsuMessageType.Freetext:
            message = new FreetextMessage();
            break;
        case AtsuMessageType.METAR:
            message = new MetarMessage();
            break;
        case AtsuMessageType.OCL:
            message = new OclMessage();
            break;
        case AtsuMessageType.TAF:
            message = new TafMessage();
            break;
        default:
            break;
        }

        message.deserialize(data);
        return message;
    }
}
