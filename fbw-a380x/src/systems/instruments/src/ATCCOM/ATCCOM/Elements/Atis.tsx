import React, { FC } from 'react';
import { AutoPrintIcon } from './AutoPrintIcon';
import { AutoUpdateIcon } from './AutoUpdateIcon';
import { Button } from '../../Components/Button';
import { Dropdown, DropdownItem } from '../../Components/Dropdown';
import { Layer } from '../../Components/Layer';
import { NewAtisIcon } from './NewAtisIcon';
import { TextBox } from '../../Components/Textbox';

type AtisProps = {
  x?: number;
  y?: number;
  airport: string;
  arrival?: boolean;
};

export const Atis: FC<AtisProps> = ({ x = 0, y = 0, airport, arrival }) => {
  const updatePrintTitle = (
    <>
      <tspan dx={5} dy={-7}>
        UPDATE
      </tspan>
      <tspan dx={-96} dy={25}>
        OR PRINT
      </tspan>
    </>
  );

  // TODO add the >>>-button as soon as font is updated
  // TODO update GND SYS button as soon as font is updated
  // TODO other buttons based on message state
  // <Button x={605} y={5} width={159} height={64} disabled>
  //     <tspan dy={-9}>SEND</tspan>
  //     <tspan dy={12}>REQUEST</tspan>
  // </Button>
  // <Button x={605} y={69} width={159} height={64} disabled>
  //     <tspan dy={-9}>AUTO</tspan>
  //     <tspan dy={12}>UPDATE</tspan>
  // </Button>

  return (
    <Layer x={x} y={y}>
      <text fill="white" fontSize={27} textAnchor="start">
        <tspan x={15} y={97}>
          EDDF DEP ATIS K 1005Z RWY 25C ILS RWY 25C
        </tspan>
        <tspan x={15} dy={36}>
          RWY 25L CLOSED TRANS LVL 5000FT TWY N1 N2 N5
        </tspan>
        <tspan x={15} dy={36}>
          L CLSD EXPECT TKOF FROM L6 3266M AVLB IF
        </tspan>
        <tspan x={15} dy={36}>
          UNABLE DV PREFLIGHT WIND 27012KT VIS 10KM
        </tspan>
        <tspan x={15} dy={36}>
          CLOUD FEW011 BKN041 OVC054 TEMP ......
        </tspan>
      </text>

      <path stroke="#eee" fill="none" strokeWidth={1} d="m 7 247 h 753 z" />

      <TextBox x={7} y={14} width={106} defaultValue={airport} placeholder=" " maxLength={4} />
      <Dropdown x={116} y={14} width={106} height={41} title={arrival ? 'ARR' : 'DEP'} selectable>
        <DropdownItem>DEP</DropdownItem>
        <DropdownItem>ARR</DropdownItem>
      </Dropdown>
      <text x={230} y={42} fill="white" fontSize={22}>
        K 1005Z
      </text>

      <NewAtisIcon x={335} y={20} />
      <AutoUpdateIcon x={381} y={15} />
      <AutoPrintIcon x={426} y={10} width={40} height={40} />

      <Dropdown x={605} y={5} width={159} height={64} title={updatePrintTitle}>
        <DropdownItem>UPDATE</DropdownItem>
        <DropdownItem>PRINT</DropdownItem>
      </Dropdown>
      <Button x={474} y={5} width={131} height={64} disabled>
        <tspan dy={-3}>GND SYS</tspan>
        <tspan dy={19}>MSG AAA</tspan>
      </Button>
    </Layer>
  );
};
