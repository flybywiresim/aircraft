import { Page as Atis } from './Atis';
import { Page as MaxUplinkDelay } from './Connect/MaxUplinkDelay';
import { Page as Connect } from './Connect/Mainpage';
import { Page as Emergency } from './Emergency';
import { Page as AllMsg } from './MsgRecord/AllMessages';
import { Page as MonitoredMsg } from './MsgRecord/MonitoredMessages';
import { Page as MsgRecord } from './MsgRecord/Mainpage';
import { Page as Report } from './Report/Mainpage';
import { Page as Other } from './Report/Other';
import { Page as PositionReport } from './Report/PositionReport';
import { Page as Request } from './Request';

export const Pages = {
  Atis,
  Connect: {
    MaxUplinkDelay,
    Connect,
  },
  Emergency,
  MsgRecord: {
    MsgRecord,
    AllMsg,
    MonitoredMsg,
  },
  Report: {
    Other,
    PositionReport,
    Report,
  },
  Request,
};
