import React from 'react';
import { FansMode } from '@atsu/com/FutureAirNavigationSystem';
import { CpdlcMessageElement } from '@atsu/messages/CpdlcMessageElements';
import { RequestClimb } from './Vertical/RequestClimb';
import { RequestDescend } from './Vertical/RequestDescend';
import { RequestLevel } from './Vertical/RequestLevel';
import { RequestLevelBlock } from './Vertical/RequestLevelBlock';
import { RequestCruiseClimb } from './Vertical/RequestCruiseClimb';
import { RequestITP } from './Vertical/RequestItp';
import { RequestDirect } from './Lateral/RequestDirect';
import { RequestOffset } from './Lateral/RequestOffset';
import { RequestWeatherDeviation } from './Lateral/RequestWeatherDeviation';
import { RequestHeading } from './Lateral/RequestHeading';
import { RequestGroundTrack } from './Lateral/RequestGroundTrack';
import { RequestSpeed } from './Speed/RequestSpeed';
import { RequestSpeedRange } from './Speed/RequestSpeedRange';
import { RequestDepartureClearance } from './Clearance/RequestDepartureClearance';
import { RequestOceanicClearance } from './Clearance/RequestOceanicClearance';
import { RequestGenericClearance } from './Clearance/RequestGenericClearance';
import { WhenCanWeExpectLowerLevel } from './WhenCanWe/WhenCanWeExpectLowerLevel';
import { WhenCanWeExpectHigherLevel } from './WhenCanWe/WhenCanWeExpectHigherLevel';
import { WhenCanWeExpectClimb } from './WhenCanWe/WhenCanWeExpectClimb';
import { WhenCanWeExpectDescend } from './WhenCanWe/WhenCanWeExpectDescend';
import { WhenCanWeExpectCruiseClimb } from './WhenCanWe/WhenCanWeExpectCruiseClimb';
import { WhenCanWeExpectSpeed } from './WhenCanWe/WhenCanWeExpectSpeed';
import { WhenCanWeExpectSpeedRange } from './WhenCanWe/WhenCanWeExpectSpeedRange';
import { WhenCanWeExpectBackOnRoute } from './WhenCanWe/WhenCanWeExpectBackOnRoute';

export const MaxRequestElements = 5;

export type MessageVisualizationProps = {
  x?: number;
  y?: number;
  mode: FansMode;
  index: number;
  messageElements: { id: string; message: CpdlcMessageElement | undefined; readyToSend: boolean }[];
  onDelete: () => void;
};

export const MessageTable: {
  [id: string]: {
    visualization: React.FC<MessageVisualizationProps>;
    blacklisting: string[];
    exchanging: string | undefined;
    singleMessage: boolean;
  };
} = {
  RequestClimb: { visualization: RequestClimb, blacklisting: [], exchanging: 'RequestDescend', singleMessage: false },
  RequestDescend: { visualization: RequestDescend, blacklisting: [], exchanging: 'RequestClimb', singleMessage: false },
  RequestLevel: { visualization: RequestLevel, blacklisting: [], exchanging: undefined, singleMessage: false },
  RequestLevelBlock: {
    visualization: RequestLevelBlock,
    blacklisting: [],
    exchanging: undefined,
    singleMessage: false,
  },
  RequestCruiseClimb: {
    visualization: RequestCruiseClimb,
    blacklisting: [],
    exchanging: undefined,
    singleMessage: false,
  },
  RequestITP: { visualization: RequestITP, blacklisting: [], exchanging: undefined, singleMessage: true },
  RequestDirect: { visualization: RequestDirect, blacklisting: [], exchanging: undefined, singleMessage: false },
  RequestOffset: { visualization: RequestOffset, blacklisting: [], exchanging: undefined, singleMessage: false },
  RequestWeatherDeviation: {
    visualization: RequestWeatherDeviation,
    blacklisting: [],
    exchanging: undefined,
    singleMessage: false,
  },
  RequestHeading: { visualization: RequestHeading, blacklisting: [], exchanging: undefined, singleMessage: false },
  RequestGroundTrack: {
    visualization: RequestGroundTrack,
    blacklisting: [],
    exchanging: undefined,
    singleMessage: false,
  },
  RequestSpeed: { visualization: RequestSpeed, blacklisting: [], exchanging: undefined, singleMessage: false },
  RequestSpeedRange: {
    visualization: RequestSpeedRange,
    blacklisting: [],
    exchanging: undefined,
    singleMessage: false,
  },
  RequestDepartureClearance: {
    visualization: RequestDepartureClearance,
    blacklisting: [],
    exchanging: undefined,
    singleMessage: true,
  },
  RequestOceanicClearance: {
    visualization: RequestOceanicClearance,
    blacklisting: [],
    exchanging: undefined,
    singleMessage: true,
  },
  RequestGenericClearance: {
    visualization: RequestGenericClearance,
    blacklisting: [],
    exchanging: undefined,
    singleMessage: false,
  },
  WhenCanWeExpectLowerLevel: {
    visualization: WhenCanWeExpectLowerLevel,
    blacklisting: [],
    exchanging: 'WhenCanWeExpectHigherLevel',
    singleMessage: false,
  },
  WhenCanWeExpectHigherLevel: {
    visualization: WhenCanWeExpectHigherLevel,
    blacklisting: [],
    exchanging: 'WhenCanWeExpectLowerLevel',
    singleMessage: false,
  },
  WhenCanWeExpectClimb: {
    visualization: WhenCanWeExpectClimb,
    blacklisting: [],
    exchanging: 'WhenCanWeExpectDescend',
    singleMessage: false,
  },
  WhenCanWeExpectDescend: {
    visualization: WhenCanWeExpectDescend,
    blacklisting: [],
    exchanging: 'WhenCanWeExpectClimb',
    singleMessage: false,
  },
  WhenCanWeExpectCruiseClimb: {
    visualization: WhenCanWeExpectCruiseClimb,
    blacklisting: [],
    exchanging: undefined,
    singleMessage: false,
  },
  WhenCanWeExpectSpeed: {
    visualization: WhenCanWeExpectSpeed,
    blacklisting: [],
    exchanging: undefined,
    singleMessage: false,
  },
  WhenCanWeExpectSpeedRange: {
    visualization: WhenCanWeExpectSpeedRange,
    blacklisting: [],
    exchanging: undefined,
    singleMessage: false,
  },
  WhenCanWeExpectBackOnRoute: {
    visualization: WhenCanWeExpectBackOnRoute,
    blacklisting: [],
    exchanging: undefined,
    singleMessage: false,
  },
};
