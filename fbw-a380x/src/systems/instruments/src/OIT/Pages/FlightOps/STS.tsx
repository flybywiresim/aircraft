import React, { FC } from 'react';
import { Button } from '../../Components/Button';
import { Dropdown, DropdownItem } from '../../Components/Dropdown';

export const STSPage: FC = () => {
  return (
    <>
      {/* Main Section */}

      <AircraftInfo />

      <line x1={19} y1={368} x2={1007} y2={368} fill="none" stroke="#666" strokeMiterlimit="10" strokeWidth={2} />

      <NavInfo />

      <line x1={19} y1={533} x2={1007} y2={533} fill="none" stroke="#666" strokeMiterlimit="10" strokeWidth={2} />

      <FlightInfo />
    </>
  );
};

const AircraftInfo: React.FC = () => (
  <>
    <text x={48} y={173} fontSize={18} fill="#fff">
      ACFT REGISTRATION
    </text>

    <Dropdown x={271} y={147} width={549} height={41} fill="cyan" title="F-WWOW">
      <DropdownItem centered>
        <tspan>idk what goes here</tspan>
      </DropdownItem>
    </Dropdown>

    <Button x={863} y={139} width={140} height={57} fill="#666" gradient>
      <tspan dy={-10}>SYNCHRO</tspan>
      <tspan dy={10}>AVIONICS</tspan>
    </Button>

    <text x={210} y={249} fontSize={18} fill="#fff">
      MSN
    </text>
    <text x={516} y={249} fontSize={18} fill="cyan">
      9804
    </text>

    <text x={121} y={317} fontSize={18} fill="#fff">
      OIS VERSION
    </text>
    <text x={465} y={317} fontSize={18} fill="#dcddde">
      14-JUL-08 V2.0
    </text>
  </>
);

const NavInfo: React.FC = () => (
  <>
    <text x={508} y={425} fontSize={18} fill="#fff">
      ACTIVE
    </text>
    <text x={175} y={486} fontSize={18} fill="#fff">
      CHARTS
    </text>
    <text x={427} y={486} fontSize={18} fill="lime">
      07-AUG-08 27-AUG-08
    </text>
  </>
);

const FlightInfo: React.FC = () => (
  <>
    <text x={168} y={603} fontSize={18} fill="#fff">
      FLT NBR
    </text>
    <rect x={269} y={577} width={548} height={41} fill="none" stroke="#666" strokeMiterlimit="10" strokeWidth={2} />
    <text x={508} y={604} fontSize={18} fill="cyan">
      AIB123
    </text>

    {/* The style for this dropdown is not finished, don't have enough references to be able to correctly stylize it */}
    <text x={196} y={670} fontSize={18} fill="#fff">
      FROM
    </text>
    <Dropdown x={268} y={645} width={233} height={41} fill="cyan" title="LFBO" selectable />

    <text x={538} y={671} fontSize={18} fill="#fff">
      TO
    </text>
    <Dropdown x={586} y={645} width={233} height={41} fill="cyan" title="LFBD" selectable />
  </>
);
