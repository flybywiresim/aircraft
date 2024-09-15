import useMouse from '@react-hook/mouse-position';
import { InputManagerProvider } from '@instruments/common/input';
import { useSimVar } from '@instruments/common/simVars';
import React, { FC, useRef, useState } from 'react';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';
import { FlightPlanProvider } from '@instruments/common/flightplan';
import { Position } from '@instruments/common/types';
import { LegacyCdsDisplayUnit, DisplayUnitID } from '@instruments/common/LegacyCdsDisplayUnit';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { useUpdate } from '@instruments/common/hooks';
import { EfisSymbols } from '@fmgc/efis/EfisSymbols';
import { Dropdown, DropdownLink } from './Components/Dropdown';
import { MFDMessageManagerProvider } from './Messages/MFDMessageManager';
import { ATCCOM } from './ATCCOM';

import './styles.scss';

export interface MultiFunctionDisplayProps {
  displayUnitID: DisplayUnitID;
}

export const MultiFunctionDisplay: FC<MultiFunctionDisplayProps> = ({ displayUnitID }) => {
  const ref = useRef(null);
  const mouse = useMouse(ref, {
    fps: 165,
    enterDelay: 100,
    leaveDelay: 100,
  });
  const [hideCursor, setHideCursor] = useState(false);
  const [flightNumber] = useSimVar('ATC FLIGHT NUMBER', 'string', 250);

  const [guidanceController] = useState(() => {
    if (displayUnitID === DisplayUnitID.FoMfd) {
      return null;
    }

    const controller = new GuidanceController();

    controller.init();

    return controller;
  });

  const [efisSymbols] = useState(() => (guidanceController ? new EfisSymbols(guidanceController) : null));

  useUpdate((deltaTime) => {
    if (displayUnitID === DisplayUnitID.FoMfd) {
      return;
    }

    efisSymbols?.update(deltaTime);
    guidanceController?.update(deltaTime);
  });

  return (
    <InputManagerProvider onInputChange={setHideCursor}>
      <LegacyCdsDisplayUnit ref={ref} displayUnitId={DisplayUnitID.CaptMfd}>
        <MFDMessageManagerProvider>
          <g style={{ pointerEvents: hideCursor ? 'none' : 'auto', cursor: 'none' }}>
            <rect width={1000} height={2000} />
            <text x={593} y={22} fontSize={24} fill="white">
              {flightNumber}
            </text>

            <Switch>
              <Route exact path="/">
                <Redirect to="/fms" />
              </Route>
              <Route path="/fms">
                <FlightPlanProvider>
                  <FMS />
                </FlightPlanProvider>
              </Route>
              <Route path="/atccom">
                <ATCCOM />
              </Route>
            </Switch>
            <SystemDropdown />
            <line x1={0} x2={760} y1={950} y2={950} stroke="#eee" strokeWidth={1} />
            {!hideCursor && <Cursor x={mouse.x ?? 0} y={mouse.y ?? 0} />}
          </g>
        </MFDMessageManagerProvider>
      </LegacyCdsDisplayUnit>
    </InputManagerProvider>
  );
};

const SystemDropdown: React.FC = () => {
  const history = useHistory();
  let title = '';

  if (history.location.pathname.includes('fms')) {
    title = 'FMS 1';
  } else if (history.location.pathname.includes('atccom')) {
    title = 'ATCCOM';
  }

  return (
    <Dropdown x={0} height={45} title={title} selectable>
      <DropdownLink link="/fms">FMS 1</DropdownLink>
      <DropdownLink link="/atccom">ATCCOM</DropdownLink>
    </Dropdown>
  );
};

export const Cursor: React.FC<Position> = ({ x, y }) => (
  <g
    stroke="#ffff00"
    fill="none"
    strokeWidth={2.5}
    style={{ pointerEvents: 'none', transform: `translate(${x}px, ${y}px)` }}
  >
    <path d="m -50 35 l 40 -45 l -40 -45" />

    <path strokeWidth={1.5} d="m -3 -10 h 6" />
    <path strokeWidth={1.5} d="m 0 -13 v 6" />

    <path d="m 50 35 l -40 -45 l 40 -45" />
  </g>
);
