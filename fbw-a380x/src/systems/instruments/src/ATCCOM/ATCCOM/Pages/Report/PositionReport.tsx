import React, { useState, FC } from 'react';
import { Layer } from '@instruments/common/utils';
import { Button } from '../../../Components/Button';
import { Checkbox, CheckboxItem } from '../../../Components/Checkbox';
import { Dropdown, DropdownItem } from '../../../Components/Dropdown';
import { SwitchButton } from '../../Elements/SwitchButton';
import { TextBox } from '../../../Components/Textbox';

export const Page: FC = () => {
  const [icing, setIcing] = useState(' ');
  const [turbulence, setTurbulence] = useState(' ');
  const [deviating, setDeviating] = useState(false);
  const [climbingTo, setClimbingTo] = useState(false);
  const [descendingTo, setDescendingTo] = useState(false);

  // TODO remove with real code
  const [preloadingData, setPreloadingData] = useState<boolean>(true);
  setTimeout(() => setPreloadingData(false), 2000);

  return (
    <>
      <Layer x={0} y={140}>
        <text x={155} y={49} fontSize={22} fill="#fff">
          AUTO POSITION REPORT
        </text>
        <SwitchButton x={485} y={4} first="ON" second="OFF" onClick={() => {}} />
        <path stroke="#eee" fill="none" strokeWidth={1} d="m 20 85 h 728 z" />

        <text x={460} y={120} fontSize={22} fill="#fff">
          UTC
        </text>
        <text x={630} y={120} fontSize={22} fill="#fff">
          ALT
        </text>

        <text x={5} y={155} fontSize={22} fill="#fff">
          OVHD
        </text>
        <TextBox x={65} y={127} width={360} maxLength={5} disabled={preloadingData} />
        {!preloadingData && (
          <>
            <TextBox x={430} y={127} width={105} maxLength={4} suffix="Z" fixFontSize={22} textAnchor="middle" />
            <TextBox x={540} y={127} width={220} maxLength={5} prefix="FL" fixFontSize={22} textAnchor="middle" />
          </>
        )}

        <text x={5} y={200} fontSize={22} fill="#fff">
          PPOS
        </text>
        <TextBox x={65} y={172} width={360} maxLength={5} disabled={preloadingData} />
        <TextBox
          x={430}
          y={172}
          width={105}
          maxLength={4}
          suffix="Z"
          fixFontSize={22}
          textAnchor="middle"
          disabled={preloadingData}
        />
        <TextBox
          x={540}
          y={172}
          width={220}
          maxLength={5}
          prefix="FL"
          fixFontSize={22}
          textAnchor="middle"
          disabled={preloadingData}
        />

        <text x={33} y={245} fontSize={22} fill="#fff">
          TO
        </text>
        <TextBox x={65} y={217} width={360} maxLength={5} disabled={preloadingData} />
        {!preloadingData && (
          <TextBox x={430} y={217} width={105} maxLength={4} suffix="Z" fixFontSize={22} textAnchor="middle" />
        )}

        <text x={5} y={290} fontSize={22} fill="#fff">
          NEXT
        </text>
        <TextBox x={65} y={262} width={360} maxLength={5} disabled={preloadingData} />

        <text x={100} y={358} fontSize={22} fill="#fff">
          SPD
        </text>
        <TextBox
          x={145}
          y={330}
          width={190}
          maxLength={3}
          suffix="KT"
          fixFontSize={22}
          textAnchor="middle"
          disabled={preloadingData}
        />
        <text x={485} y={358} fontSize={22} fill="#fff">
          HDG
        </text>
        <TextBox
          x={530}
          y={330}
          width={150}
          maxLength={3}
          suffix="T"
          fixFontSize={22}
          textAnchor="middle"
          disabled={preloadingData}
        />

        <text x={45} y={403} fontSize={22} fill="#fff">
          GND SPD
        </text>
        <TextBox
          x={145}
          y={375}
          width={190}
          maxLength={3}
          suffix="KT"
          fixFontSize={22}
          textAnchor="middle"
          disabled={preloadingData}
        />
        <text x={485} y={403} fontSize={22} fill="#fff">
          TRK
        </text>
        <TextBox
          x={530}
          y={375}
          width={150}
          maxLength={3}
          suffix="T"
          fixFontSize={22}
          textAnchor="middle"
          disabled={preloadingData}
        />

        <text x={100} y={448} fontSize={22} fill="#fff">
          V/S
        </text>
        <TextBox
          x={145}
          y={420}
          width={190}
          maxLength={3}
          suffix="FT/MIN"
          fixFontSize={22}
          textAnchor="middle"
          disabled={preloadingData}
        />

        <text x={85} y={511} fontSize={22} fill="#fff">
          WIND
        </text>
        <TextBox
          x={145}
          y={483}
          width={120}
          maxLength={3}
          suffix="°"
          fixFontSize={22}
          textAnchor="middle"
          disabled={preloadingData}
        />
        <TextBox
          x={270}
          y={483}
          width={120}
          maxLength={2}
          suffix="KT"
          fixFontSize={22}
          textAnchor="middle"
          disabled={preloadingData}
        />

        <text x={100} y={560} fontSize={22} fill="#fff">
          SAT
        </text>
        <TextBox
          x={145}
          y={532}
          width={120}
          maxLength={3}
          suffix="C"
          fixFontSize={22}
          textAnchor="middle"
          disabled={preloadingData}
        />

        <text x={30} y={626} fontSize={22} fill="#fff">
          ETA DEST
        </text>
        <TextBox
          x={145}
          y={597}
          width={120}
          maxLength={4}
          suffix="Z"
          fixFontSize={22}
          textAnchor="middle"
          disabled={preloadingData}
        />
        <text x={400} y={626} fontSize={22} fill="#fff">
          ENDURANCE
        </text>
        <TextBox
          x={530}
          y={597}
          width={150}
          maxLength={4}
          midfix="H"
          midfixPosition={2}
          suffix="MIN"
          fixFontSize={22}
          textAnchor="middle"
          disabled={preloadingData}
        />

        <Checkbox x={30} y={660} buttonWidth={22} textSpacing={6} strokeWidth={3} disabled={preloadingData}>
          <CheckboxItem selected={deviating} onSelect={() => setDeviating(!deviating)}>
            DEVIATING
          </CheckboxItem>
        </Checkbox>
        {deviating ? (
          <>
            <TextBox x={30} y={695} width={195} maxLength={3} fixFontSize={22} textAnchor="middle" />
          </>
        ) : (
          <></>
        )}
        <Checkbox x={275} y={660} buttonWidth={22} textSpacing={6} strokeWidth={3} disabled={preloadingData}>
          <CheckboxItem
            selected={climbingTo}
            onSelect={() => {
              setClimbingTo(!climbingTo);
              setDescendingTo(false);
            }}
          >
            CLIMBING TO
          </CheckboxItem>
        </Checkbox>
        {climbingTo ? (
          <>
            <TextBox x={275} y={695} width={195} maxLength={5} fixFontSize={22} textAnchor="middle" />
          </>
        ) : (
          <></>
        )}
        <Checkbox x={520} y={660} buttonWidth={22} textSpacing={6} strokeWidth={3} disabled={preloadingData}>
          <CheckboxItem
            selected={descendingTo}
            onSelect={() => {
              setClimbingTo(false);
              setDescendingTo(!descendingTo);
            }}
          >
            DESCENDING TO
          </CheckboxItem>
        </Checkbox>
        {descendingTo ? (
          <>
            <TextBox x={520} y={695} width={195} maxLength={5} fixFontSize={22} textAnchor="middle" />
          </>
        ) : (
          <></>
        )}

        <text x={471} y={560} fontSize={22} fill="#fff">
          TURB
        </text>
        <Dropdown
          x={530}
          y={532}
          width={210}
          height={41}
          title={turbulence}
          selectable
          disabled={preloadingData}
          showBlackBoundingBox
        >
          <DropdownItem onSelect={() => setTurbulence(' ')}> </DropdownItem>
          <DropdownItem onSelect={() => setTurbulence('LIGHT')}>LIGHT</DropdownItem>
          <DropdownItem onSelect={() => setTurbulence('MODERATE')}>MODERATE</DropdownItem>
          <DropdownItem onSelect={() => setTurbulence('SEVERE')}>SEVERE</DropdownItem>
        </Dropdown>

        <text x={459} y={511} fontSize={22} fill="#fff">
          ICING
        </text>
        <Dropdown
          x={530}
          y={483}
          width={210}
          height={41}
          title={icing}
          selectable
          disabled={preloadingData}
          showBlackBoundingBox
        >
          <DropdownItem onSelect={() => setIcing(' ')}> </DropdownItem>
          <DropdownItem onSelect={() => setIcing('TRACE')}>TRACE</DropdownItem>
          <DropdownItem onSelect={() => setIcing('LIGHT')}>LIGHT</DropdownItem>
          <DropdownItem onSelect={() => setIcing('MODERATE')}>MODERATE</DropdownItem>
          <DropdownItem onSelect={() => setIcing('SEVERE')}>SEVERE</DropdownItem>
        </Dropdown>

        <Button x={211} y={744} width={184} height={64}>
          <tspan dy={-3}>REFRESH</tspan>
          <tspan dy={19}>DATA</tspan>
        </Button>
        <Button x={396} y={744} width={184} height={64} disabled>
          <tspan dy={-3}>ADD</tspan>
          <tspan dy={19}>FREETEXT</tspan>
        </Button>
        <Button x={581} y={744} width={184} height={64}>
          <tspan dy={-3}>XFR</tspan>
          <tspan dy={19}>TO MAILBOX</tspan>
        </Button>
      </Layer>
    </>
  );
};
