import React, { FC } from 'react';
import { Layer } from '@instruments/common/utils';
import { Button } from '../../../Components/Button';
import { Dropdown, DropdownItem } from '../../../Components/Dropdown';

export const Page: FC = () => (
  <Layer x={0} y={140}>
    <Button x={573} y={306} width={180} height={64} disabled>
      <text x={195} y={19} fill="grey" fontSize={22} textAnchor="start" dominantBaseline="central">
        <tspan x={133} dy={9}>
          ADD
        </tspan>
        <tspan x={118} dy={26}>
          TEXT
        </tspan>
      </text>
    </Button>
    <Button x={573} y={242} width={180} height={64}>
      <text x={195} y={19} fill="white" fontSize={22} textAnchor="start" dominantBaseline="central">
        <tspan x={35} dy={9}>
          MONITORING
        </tspan>
        <tspan x={118} dy={26}>
          FREQ
        </tspan>
      </text>
    </Button>
    <Button x={573} y={178} width={180} height={64}>
      <text x={195} y={19} fill="white" fontSize={22} textAnchor="start" dominantBaseline="central">
        <tspan x={91} dy={9}>
          GROUND
        </tspan>
        <tspan x={105} dy={26}>
          SPEED
        </tspan>
      </text>
    </Button>
    <Dropdown x={573} y={136} width={180} height={42} dropDownWidth={269} title="TRAFFIC" horizontal expandLeft>
      <DropdownItem>SIGHTED</DropdownItem>
      <DropdownItem>SIGHTED AND PASSED</DropdownItem>
      <DropdownItem>NOT SIGHTED</DropdownItem>
    </Dropdown>
    <Dropdown x={573} y={94} width={180} height={42} dropDownWidth={218} title="ETA" horizontal expandLeft>
      <DropdownItem>ETA</DropdownItem>
      <DropdownItem>REVISED ETA</DropdownItem>
      <DropdownItem>TOP OF DESCENT</DropdownItem>
    </Dropdown>
    <Dropdown x={573} y={52} width={180} height={42} dropDownWidth={243} title="LATERAL" horizontal expandLeft>
      <DropdownItem>BACK ON ROUTE</DropdownItem>
      <DropdownItem>PASSING POSITION</DropdownItem>
    </Dropdown>
    <Dropdown x={573} y={10} width={180} height={42} dropDownWidth={257} title="VERTICAL" horizontal expandLeft>
      <DropdownItem>MAINTAINING LEVEL</DropdownItem>
      <DropdownItem>LEAVING LEVEL</DropdownItem>
      <DropdownItem>PREFERRED LEVEL</DropdownItem>
      <DropdownItem>REACHING BLOCK</DropdownItem>
      <DropdownItem>TOP OF DESCENT</DropdownItem>
    </Dropdown>

    <Button x={3} y={744} width={184} height={64} disabled>
      CANCEL
    </Button>
    <Button x={582} y={744} width={184} height={64} disabled>
      <tspan dy={-3}>XFR</tspan>
      <tspan dy={19}>TO MAILBOX</tspan>
    </Button>
  </Layer>
);
