import React, { FC, useEffect, useRef, useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { Button } from '../Components/Button';
import { Pages } from './Pages';
import { MFDRedirect, MFDRoute } from '../Components/MFDRoute';
import { MFDMessageArea } from '../Messages/MFDMessageArea';
import { MFDMessagesList } from '../Messages/MFDMessagesList';

export const ATCCOM = () => {
  const { path } = useRouteMatch();

  return (
    <>
      <StatusBar />

      <PagesContainer />

      <ConnectButton />
      <RequestButton />
      <ReportButton />
      <MessageRecordButton />
      <AtisButton />
      <EmergencyButton />

      <MFDMessageArea path={path} />
    </>
  );
};

const ConnectButton: React.FC = () => {
  const textRef = useRef<SVGTextElement>(null);
  const [textBbox, setTextBbox] = useState<DOMRect>();
  const { path } = useRouteMatch();
  const history = useHistory();

  const active = history.location.pathname.includes('connect');

  useEffect(() => setTextBbox(textRef.current?.getBBox()), [textRef]);
  return (
    <Button x={3} y={45} width={145} height={60} onClick={() => history.push(`${path}/connect`)}>
      {active ? (
        <rect
          x={textBbox?.x! - 3}
          y={textBbox?.y! - 3}
          width={textBbox?.width! + 6}
          height={textBbox?.height! + 6}
          stroke={active ? 'white' : 'none'}
          strokeWidth={2}
          fill="none"
        />
      ) : (
        <></>
      )}
      <text ref={textRef} x={72} y={30} fill="white" fontSize={22} textAnchor="middle" dominantBaseline="central">
        CONNECT
      </text>
    </Button>
  );
};

const RequestButton: React.FC = () => {
  const textRef = useRef<SVGTextElement>(null);
  const [textBbox, setTextBbox] = useState<DOMRect>();
  const { path } = useRouteMatch();
  const history = useHistory();

  const active = history.location.pathname.includes('request');

  useEffect(() => setTextBbox(textRef.current?.getBBox()), [textRef]);
  return (
    <Button x={148} y={45} width={130} height={60} onClick={() => history.push(`${path}/request`)}>
      {active ? (
        <rect
          x={textBbox?.x! - 3}
          y={textBbox?.y! - 3}
          width={textBbox?.width! + 6}
          height={textBbox?.height! + 6}
          stroke={active ? 'white' : 'none'}
          strokeWidth={2}
          fill="none"
        />
      ) : (
        <></>
      )}
      <text ref={textRef} x={65} y={30} fill="white" fontSize={22} textAnchor="middle" dominantBaseline="central">
        REQUEST
      </text>
    </Button>
  );
};

const ReportButton: React.FC = () => {
  const textRefFirstLine = useRef<SVGTextElement>(null);
  const textRefSecondLine = useRef<SVGTextElement>(null);
  const [textBboxFirstLine, setTextBboxFirstLine] = useState<DOMRect>();
  const [textBboxSecondLine, setTextBboxSecondLine] = useState<DOMRect>();
  const { path } = useRouteMatch();
  const history = useHistory();

  const active = history.location.pathname.includes('report_&_modify');

  useEffect(() => setTextBboxFirstLine(textRefFirstLine.current?.getBBox()), [textRefFirstLine]);
  useEffect(() => setTextBboxSecondLine(textRefSecondLine.current?.getBBox()), [textRefSecondLine]);
  return (
    <Button x={278} y={45} width={155} height={60} onClick={() => history.push(`${path}/report_&_modify`)}>
      <rect
        x={textBboxFirstLine?.x! - 3}
        y={textBboxFirstLine?.y! - 3}
        width={textBboxFirstLine?.width! + 6}
        height={textBboxFirstLine?.height! + 1}
        stroke={active ? 'white' : 'none'}
        strokeWidth={2}
        fill="none"
      />
      <rect
        x={textBboxSecondLine?.x! - 3}
        y={textBboxSecondLine?.y! - 1}
        width={textBboxSecondLine?.width! + 6}
        height={textBboxSecondLine?.height! + 2}
        stroke={active ? 'white' : 'none'}
        strokeWidth={2}
        fill="none"
      />
      <text
        ref={textRefFirstLine}
        x={72}
        y={20}
        fill="white"
        fontSize={22}
        textAnchor="middle"
        dominantBaseline="central"
      >
        REPORT
      </text>
      <text
        ref={textRefSecondLine}
        x={72}
        y={41}
        fill="white"
        fontSize={22}
        textAnchor="middle"
        dominantBaseline="central"
      >
        &amp; MODIFY
      </text>
    </Button>
  );
};

const MessageRecordButton: React.FC = () => {
  const textRef = useRef<SVGTextElement>(null);
  const [textBbox, setTextBbox] = useState<DOMRect>();
  const { path } = useRouteMatch();
  const history = useHistory();

  const active = history.location.pathname.includes('msg_record');

  useEffect(() => setTextBbox(textRef.current?.getBBox()), [textRef]);
  return (
    <Button x={433} y={45} width={130} height={60} onClick={() => history.push(`${path}/msg_record`)}>
      {active ? (
        <rect
          x={textBbox?.x! - 3}
          y={textBbox?.y! - 3}
          width={textBbox?.width! + 6}
          height={textBbox?.height! + 3}
          stroke={active ? 'white' : 'none'}
          strokeWidth={2}
          fill="none"
        />
      ) : (
        <></>
      )}
      <text ref={textRef} x={63} y={30} fill="white" fontSize={22} textAnchor="middle">
        <tspan dx={16} dy={-10} dominantBaseline="central">
          MSG
        </tspan>
        <tspan dx={-63} dy={25} dominantBaseline="central">
          RECORD
        </tspan>
      </text>
    </Button>
  );
};

const AtisButton: React.FC = () => {
  const textRef = useRef<SVGTextElement>(null);
  const [textBbox, setTextBbox] = useState<DOMRect>();
  const { path } = useRouteMatch();
  const history = useHistory();

  const active = history.location.pathname.includes('d-atis');

  useEffect(() => setTextBbox(textRef.current?.getBBox()), [textRef]);
  return (
    <Button x={563} y={45} width={104} height={60} onClick={() => history.push(`${path}/d-atis/list`)}>
      {active ? (
        <rect
          x={textBbox?.x! - 3}
          y={textBbox?.y! - 3}
          width={textBbox?.width! + 6}
          height={textBbox?.height! + 6}
          stroke={active ? 'white' : 'none'}
          strokeWidth={2}
          fill="none"
        />
      ) : (
        <></>
      )}
      <text ref={textRef} x={52} y={30} fill="white" fontSize={22} textAnchor="middle" dominantBaseline="central">
        D-ATIS
      </text>
    </Button>
  );
};

const EmergencyButton: React.FC = () => {
  const textRef = useRef<SVGTextElement>(null);
  const [textBbox, setTextBbox] = useState<DOMRect>();
  const { path } = useRouteMatch();
  const history = useHistory();

  const active = history.location.pathname.includes('emergency');

  useEffect(() => setTextBbox(textRef.current?.getBBox()), [textRef]);
  return (
    <Button x={667} y={45} width={98} height={60} onClick={() => history.push(`${path}/emergency`)}>
      <rect
        x={textBbox?.x! - 3}
        y={textBbox?.y! - 2}
        width={textBbox?.width! + 6}
        height={textBbox?.height! + 4}
        stroke="none"
        fill="#f48244"
      />
      <rect
        x={textBbox?.x! - 3}
        y={textBbox?.y! - 6}
        width={textBbox?.width! + 6}
        height={textBbox?.height! + 12}
        stroke={active ? 'white' : 'none'}
        strokeWidth={2}
        fill="none"
      />
      <text ref={textRef} x={49} y={30} fill="black" fontSize={22} textAnchor="middle" dominantBaseline="central">
        EMER
      </text>
    </Button>
  );
};

const StatusBar: React.FC = () => {
  const history = useHistory();
  const { path } = useRouteMatch();

  let statusText = history.location.pathname.toUpperCase().substring(path.length + 1);
  if (statusText !== undefined && statusText.length > 0) statusText = statusText.replace('/_/g', ' ');
  const statusBackgroundColor = statusText === 'EMERGENCY' ? '#f48244' : '#eee';

  return (
    <>
      <rect fill={statusBackgroundColor} x={2} y={105} width={764} height={35} />

      <text x={18} y={134} letterSpacing={1.5} fill="black" fontSize={28}>
        {statusText}
      </text>
    </>
  );
};

const PagesContainer: FC = () => {
  const loggedInToAtc = true;

  return (
    <>
      <MFDRoute exact path="/">
        <MFDRedirect to={loggedInToAtc ? '/request' : '/connect'} />
      </MFDRoute>
      {/* Connect */}
      <MFDRoute exact path="/connect" component={Pages.Connect.Connect} />
      <MFDRoute path="/connect/max_uplink_delay" component={Pages.Connect.MaxUplinkDelay} />
      {/* Request */}
      <MFDRoute path="/request" component={Pages.Request} />
      {/* Report & Modify */}
      <MFDRoute exact path="/report_&_modify" component={Pages.Report.Report} />
      <MFDRoute path="/report/other_reports" component={Pages.Report.Other} />
      <MFDRoute path="/report/auto_&_manual_position" component={Pages.Report.PositionReport} />
      {/* Message record */}
      <MFDRoute exact path="/msg_record" component={Pages.MsgRecord.MsgRecord} />
      <MFDRoute path="/msg_record/all_msg" component={Pages.MsgRecord.AllMsg} />
      <MFDRoute path="/msg_record/monitored_msg" component={Pages.MsgRecord.MonitoredMsg} />
      {/* ATIS */}
      <MFDRoute path="/d-atis/list" component={Pages.Atis} />
      {/* Emergency */}
      <MFDRoute path="/emergency" component={Pages.Emergency} />
      {/* FMS message area */}
      <MFDRoute path="/messages_list" component={MFDMessagesList} />
    </>
  );
};
