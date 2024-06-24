//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageType, AtsuMessageDirection, AtsuMessageSerializationFormat, AtsuMessage } from './AtsuMessage';
import { wordWrap } from '../components/Convert';

/**
 * Defines the general freetext message format
 */
export class FreetextMessage extends AtsuMessage {
  constructor() {
    super();
    this.Type = AtsuMessageType.Freetext;
    this.Direction = AtsuMessageDirection.Downlink;
  }

  public serialize(format: AtsuMessageSerializationFormat) {
    let message = '';

    if (
      format === AtsuMessageSerializationFormat.FmsDisplay ||
      format === AtsuMessageSerializationFormat.FmsDisplayMonitored
    ) {
      wordWrap(this.Message, 25).forEach((line) => {
        message += `{green}${line}{end}\n`;
      });
      message += '{white}------------------------{end}\n';
    } else {
      message = this.Message;
    }

    return message;
  }

  public static deserialize(jsonData: Record<string, unknown> | FreetextMessage): FreetextMessage {
    const retval = new FreetextMessage();
    AtsuMessage.deserialize(jsonData, retval);
    return retval;
  }
}
