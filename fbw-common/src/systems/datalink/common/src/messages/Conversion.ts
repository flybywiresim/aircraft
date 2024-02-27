//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessage, AtsuMessageType } from './AtsuMessage';
import { AtisMessage } from './AtisMessage';
import { CpdlcMessage } from './CpdlcMessage';
import { DclMessage } from './DclMessage';
import { FreetextMessage } from './FreetextMessage';
import { MetarMessage } from './MetarMessage';
import { OclMessage } from './OclMessage';
import { TafMessage } from './TafMessage';

export class Conversion {
  public static messageDataToMessage(data: AtsuMessage | Record<string, unknown>): AtsuMessage {
    switch (data.Type as AtsuMessageType) {
      case AtsuMessageType.ATIS:
        return AtisMessage.deserialize(data as AtisMessage);
      case AtsuMessageType.CPDLC:
        return CpdlcMessage.deserialize(data as CpdlcMessage);
      case AtsuMessageType.DCL:
        return DclMessage.deserialize(data as DclMessage);
      case AtsuMessageType.Freetext:
        return FreetextMessage.deserialize(data as FreetextMessage);
      case AtsuMessageType.METAR:
        return MetarMessage.deserialize(data as MetarMessage);
      case AtsuMessageType.OCL:
        return OclMessage.deserialize(data as OclMessage);
      case AtsuMessageType.TAF:
        return TafMessage.deserialize(data as TafMessage);
      default:
        return null;
    }
  }
}
