import { FSComponent, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { RequestClimb } from 'instruments/src/MFD/pages/ATCCOM/Messages/Vertical/RequestClimb';
import { RequestDescend } from 'instruments/src/MFD/pages/ATCCOM/Messages/Vertical/RequestDescend';
import { RequestDepartureClearance } from 'instruments/src/MFD/pages/ATCCOM/Messages/Clearance/RequestDepartureClearance';
import { RequestDirect } from 'instruments/src/MFD/pages/ATCCOM/Messages/Lateral/RequestDirect';

export const MaxRequestElements = 5;

export interface MessageVisualizationProps extends AbstractMfdPageProps {
  // x?: number;
  // y?: number;
  mode: string;
  index: number;
  messageElements: { id: string; message: string | undefined; readyToSend: boolean }[];
  onDelete: () => void;
}

export const MessageTable: {
  [id: string]: {
    visualization: (
      props: any,
      mode: string,
      index: number,
      messageElements: { id: string; message: undefined; readyToSend: boolean }[],
      onDelete: any,
    ) => VNode;
    blacklisting: string[];
    exchanging: string | undefined;
    singleMessage: boolean;
  };
} = {
  RequestClimb: {
    visualization: (props, mode, index, messageElements, onDelete): VNode => {
      return (
        <RequestClimb
          bus={props.bus}
          mfd={props.mfd}
          fmcService={props.fmcService}
          mode={mode}
          index={index}
          messageElements={messageElements}
          onDelete={onDelete}
        />
      );
    },
    blacklisting: [],
    exchanging: 'RequestDescend',
    singleMessage: false,
  },
  RequestDescend: {
    visualization: (props, mode, index, messageElements, onDelete): VNode => {
      return (
        <RequestDescend
          bus={props.bus}
          mfd={props.mfd}
          fmcService={props.fmcService}
          mode={mode}
          index={index}
          messageElements={messageElements}
          onDelete={onDelete}
        />
      );
    },
    blacklisting: [],
    exchanging: 'RequestClimb',
    singleMessage: false,
  },
  RequestDirect: {
    visualization: (props, mode, index, messageElements, onDelete): VNode => {
      return (
        <RequestDirect
          bus={props.bus}
          mfd={props.mfd}
          fmcService={props.fmcService}
          mode={mode}
          index={index}
          messageElements={messageElements}
          onDelete={onDelete}
        />
      );
    },
    blacklisting: [],
    exchanging: undefined,
    singleMessage: false,
  },
  RequestDepartureClearance: {
    visualization: (props, mode, index, messageElements, onDelete): VNode => {
      return (
        <RequestDepartureClearance
          bus={props.bus}
          mfd={props.mfd}
          fmcService={props.fmcService}
          mode={mode}
          index={index}
          messageElements={messageElements}
          onDelete={onDelete}
        />
      );
    },
    blacklisting: [],
    exchanging: undefined,
    singleMessage: true,
  },
};
