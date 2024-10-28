import React, { FC } from 'react';
import { CpdlcMessageElement } from '@atsu/messages/CpdlcMessageElements';
import { Layer } from '@instruments/common/utils';
import { Dropdown, DropdownItem } from '../../../Components/Dropdown';
import { MaxRequestElements } from '../../Messages/Registry';
import { atLeastOnElementInList, isInList } from './Common';

type MenuProps = {
  x: number;
  y: number;
  elements: { id: string; message: CpdlcMessageElement | undefined; readyToSend: boolean }[];
  blacklist: string[];
  exchangelist: string[];
  disableFreetext: boolean;
  onSelect: (id: string) => void;
};

export const Menu: FC<MenuProps> = ({ x, y, elements, blacklist, exchangelist, disableFreetext, onSelect }) => {
  const title = (
    <>
      <tspan x={173} dy={-6}>
        WHEN CAN
      </tspan>
      <tspan x={173} dy={24}>
        WE EXPECT
      </tspan>
    </>
  );

  return (
    <Layer x={x} y={y}>
      <Dropdown
        x={0}
        y={326}
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
        <DropdownItem>DUE TO TURBULENCE</DropdownItem>
        <DropdownItem>DUE TO TECHNICAL</DropdownItem>
        <DropdownItem>DUE TO MEDICAL</DropdownItem>
        <DropdownItem>AT PILOTS DISCRETION</DropdownItem>
        <DropdownItem>FREETEXT</DropdownItem>
      </Dropdown>
      <Dropdown
        x={0}
        y={242}
        width={180}
        dropDownWidth={296}
        height={42}
        title="OTHER"
        horizontal
        expandLeft
        disabled={MaxRequestElements <= elements.length}
      >
        <DropdownItem>FREETEXT</DropdownItem>
        <DropdownItem>VOICE CONTACT</DropdownItem>
        <DropdownItem>OWN SEPARATION &amp; VMC</DropdownItem>
        <DropdownItem>VMC DES</DropdownItem>
      </Dropdown>
      <Dropdown
        x={0}
        y={178}
        width={180}
        dropDownWidth={231}
        height={64}
        title={title}
        horizontal
        expandLeft
        disabled={
          MaxRequestElements <= elements.length &&
          !atLeastOnElementInList(
            [
              'WhenCanWeExpectHigherLevel',
              'WhenCanWeExpectLowerLevel',
              'WhenCanWeExpectClimb',
              'WhenCanWeExpectDescend',
            ],
            exchangelist,
          )
        }
      >
        <DropdownItem
          onSelect={() => onSelect('WhenCanWeExpectHigherLevel')}
          disabled={
            !isInList(exchangelist, 'WhenCanWeExpectHigherLevel') &&
            (MaxRequestElements <= elements.length || isInList(blacklist, 'WhenCanWeExpectHigherLevel'))
          }
        >
          HIGHER ALTITUDE
        </DropdownItem>
        <DropdownItem
          onSelect={() => onSelect('WhenCanWeExpectLowerLevel')}
          disabled={
            !isInList(exchangelist, 'WhenCanWeExpectLowerLevel') &&
            (MaxRequestElements <= elements.length || isInList(blacklist, 'WhenCanWeExpectLowerLevel'))
          }
        >
          LOWER ALTITUDE
        </DropdownItem>
        <DropdownItem
          onSelect={() => onSelect('WhenCanWeExpectClimb')}
          disabled={
            !isInList(exchangelist, 'WhenCanWeExpectClimb') &&
            (MaxRequestElements <= elements.length || isInList(blacklist, 'WhenCanWeExpectClimb'))
          }
        >
          CLIMB TO
        </DropdownItem>
        <DropdownItem
          onSelect={() => onSelect('WhenCanWeExpectDescend')}
          disabled={
            !isInList(exchangelist, 'WhenCanWeExpectDescend') &&
            (MaxRequestElements <= elements.length || isInList(blacklist, 'WhenCanWeExpectDescend'))
          }
        >
          DESCEND TO
        </DropdownItem>
        <DropdownItem
          onSelect={() => onSelect('WhenCanWeExpectCruiseClimb')}
          disabled={MaxRequestElements <= elements.length || isInList(blacklist, 'WhenCanWeExpectCruiseClimb')}
        >
          CRUISE CLIMB
        </DropdownItem>
        <DropdownItem
          onSelect={() => onSelect('WhenCanWeExpectSpeed')}
          disabled={MaxRequestElements <= elements.length || isInList(blacklist, 'WhenCanWeExpectSpeed')}
        >
          SPEED
        </DropdownItem>
        <DropdownItem
          onSelect={() => onSelect('WhenCanWeExpectSpeedRange')}
          disabled={MaxRequestElements <= elements.length || isInList(blacklist, 'WhenCanWeExpectSpeedRange')}
        >
          SPEED RANGE
        </DropdownItem>
        <DropdownItem
          onSelect={() => onSelect('WhenCanWeExpectBackOnRoute')}
          disabled={MaxRequestElements <= elements.length || isInList(blacklist, 'WhenCanWeExpectBackOnRoute')}
        >
          BACK ON ROUTE
        </DropdownItem>
      </Dropdown>
      <Dropdown
        x={0}
        y={136}
        width={180}
        dropDownWidth={152}
        height={42}
        title="CLEARANCE"
        horizontal
        expandLeft
        disabled={MaxRequestElements <= elements.length}
      >
        <DropdownItem
          onSelect={() => onSelect('RequestDepartureClearance')}
          disabled={isInList(blacklist, 'RequestDepartureClearance')}
        >
          DEPARTURE
        </DropdownItem>
        <DropdownItem
          onSelect={() => onSelect('RequestOceanicClearance')}
          disabled={isInList(blacklist, 'RequestOceanicClearance')}
        >
          OCEANIC
        </DropdownItem>
        <DropdownItem
          onSelect={() => onSelect('RequestGenericClearance')}
          disabled={isInList(blacklist, 'RequestGenericClearance')}
        >
          GENERIC
        </DropdownItem>
      </Dropdown>
      <Dropdown
        x={0}
        y={94}
        width={180}
        height={42}
        dropDownWidth={178}
        title="SPEED"
        horizontal
        expandLeft
        disabled={MaxRequestElements <= elements.length}
      >
        <DropdownItem onSelect={() => onSelect('RequestSpeed')} disabled={isInList(blacklist, 'RequestSpeed')}>
          SPEED
        </DropdownItem>
        <DropdownItem
          onSelect={() => onSelect('RequestSpeedRange')}
          disabled={isInList(blacklist, 'RequestSpeedRange')}
        >
          SPEED RANGE
        </DropdownItem>
      </Dropdown>
      <Dropdown
        x={0}
        y={52}
        width={180}
        height={42}
        dropDownWidth={244}
        title="LATERAL"
        horizontal
        expandLeft
        disabled={MaxRequestElements <= elements.length}
      >
        <DropdownItem onSelect={() => onSelect('RequestDirect')} disabled={isInList(blacklist, 'RequestDirect')}>
          DIRECT TO
        </DropdownItem>
        <DropdownItem onSelect={() => onSelect('RequestOffset')} disabled={isInList(blacklist, 'RequestOffset')}>
          OFFSET
        </DropdownItem>
        <DropdownItem
          onSelect={() => onSelect('RequestWeatherDeviation')}
          disabled={isInList(blacklist, 'RequestWeatherDeviation')}
        >
          WX DEVIATION
        </DropdownItem>
        <DropdownItem onSelect={() => onSelect('RequestHeading')} disabled={isInList(blacklist, 'RequestHeading')}>
          HEADING
        </DropdownItem>
        <DropdownItem
          onSelect={() => onSelect('RequestGroundTrack')}
          disabled={isInList(blacklist, 'RequestGroundTrack')}
        >
          TRACK
        </DropdownItem>
        <DropdownItem>SID/STAR</DropdownItem>
        <DropdownItem>TAILORED ARRIVAL</DropdownItem>
        <DropdownItem>REROUTING</DropdownItem>
      </Dropdown>
      <Dropdown
        x={0}
        y={10}
        width={180}
        dropDownWidth={191}
        height={42}
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
        <DropdownItem
          onSelect={() => onSelect('RequestLevel')}
          disabled={MaxRequestElements <= elements.length || isInList(blacklist, 'RequestLevel')}
        >
          ALT/FL
        </DropdownItem>
        <DropdownItem
          onSelect={() => onSelect('RequestLevelBlock')}
          disabled={MaxRequestElements <= elements.length || isInList(blacklist, 'RequestLevelBlock')}
        >
          BLOCK ALT/FL
        </DropdownItem>
        <DropdownItem
          onSelect={() => onSelect('RequestCruiseClimb')}
          disabled={MaxRequestElements <= elements.length || isInList(blacklist, 'RequestCruiseClimb')}
        >
          CRUISE CLIMB
        </DropdownItem>
        <DropdownItem
          onSelect={() => onSelect('RequestITP')}
          disabled={MaxRequestElements <= elements.length || isInList(blacklist, 'RequestITP')}
        >
          ITP
        </DropdownItem>
      </Dropdown>
    </Layer>
  );
};
