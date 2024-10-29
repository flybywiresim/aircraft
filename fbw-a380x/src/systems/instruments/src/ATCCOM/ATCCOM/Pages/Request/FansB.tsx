import React, { FC } from 'react';
import { CpdlcMessageElement } from '@atsu/messages/CpdlcMessageElements';
import { Layer } from '@instruments/common/utils';
import { Dropdown, DropdownItem } from '../../../Components/Dropdown';
import { MaxRequestElements } from '../../Messages/Registry';
import { isInList, atLeastOnElementInList } from './Common';

type MenuProps = {
  x: number;
  y: number;
  elements: { id: string; message: CpdlcMessageElement | undefined; readyToSend: boolean }[];
  blacklist: string[];
  exchangelist: string[];
  disableFreetext: boolean;
  onSelect: (id: string) => void;
};

export const Menu: FC<MenuProps> = ({ x, y, elements, blacklist, exchangelist, disableFreetext, onSelect }) => (
  <Layer x={x} y={y}>
    <Dropdown
      x={0}
      y={220}
      width={180}
      dropDownWidth={323}
      height={42}
      title="ADD TEXT"
      horizontal
      expandLeft
      disabled={disableFreetext || elements.length === 0 || MaxRequestElements <= elements.length}
    >
      <DropdownItem>DUE TO WEATHER</DropdownItem>
      <DropdownItem>DUE TO A/C PERFORMANCE</DropdownItem>
    </Dropdown>
    <Dropdown
      x={0}
      y={94}
      width={180}
      height={42}
      dropDownWidth={98}
      title="SPEED"
      horizontal
      expandLeft
      disabled={MaxRequestElements <= elements.length}
    >
      <DropdownItem onSelect={() => onSelect('RequestSpeed')} disabled={isInList(blacklist, 'RequestSpeed')}>
        SPEED
      </DropdownItem>
    </Dropdown>
    <Dropdown
      x={0}
      y={136}
      width={180}
      dropDownWidth={139}
      height={42}
      title="OTHER"
      horizontal
      expandLeft
      disabled={MaxRequestElements <= elements.length}
    >
      <DropdownItem>FREETEXT</DropdownItem>
    </Dropdown>
    <Dropdown
      x={0}
      y={52}
      width={180}
      height={42}
      dropDownWidth={191}
      title="LATERAL"
      horizontal
      expandLeft
      disabled={MaxRequestElements <= elements.length}
    >
      <DropdownItem onSelect={() => onSelect('RequestDirect')} disabled={isInList(blacklist, 'RequestDirect')}>
        DIRECT TO
      </DropdownItem>
      <DropdownItem
        onSelect={() => onSelect('RequestWeatherDeviation')}
        disabled={isInList(blacklist, 'RequestWeatherDeviation')}
      >
        WX DEVIATION
      </DropdownItem>
    </Dropdown>
    <Dropdown
      x={0}
      y={10}
      width={180}
      height={42}
      dropDownWidth={166}
      title="VERTICAL"
      horizontal
      expandLeft
      disabled={
        MaxRequestElements <= elements.length &&
        !atLeastOnElementInList(['RequestClimb', 'RequestDescend'], exchangelist)
      }
    >
      <DropdownItem onSelect={() => onSelect('RequestClimb')} disabled={isInList(blacklist, 'RequestClimb')}>
        CLIMB TO
      </DropdownItem>
      <DropdownItem onSelect={() => onSelect('RequestDescend')} disabled={isInList(blacklist, 'RequestDescend')}>
        DESCEND TO
      </DropdownItem>
      <DropdownItem onSelect={() => onSelect('RequestLevel')} disabled={isInList(blacklist, 'RequestLevel')}>
        ALT/FL
      </DropdownItem>
      <DropdownItem onSelect={() => onSelect('RequestITP')} disabled={isInList(blacklist, 'RequestITP')}>
        ITP
      </DropdownItem>
    </Dropdown>
  </Layer>
);
