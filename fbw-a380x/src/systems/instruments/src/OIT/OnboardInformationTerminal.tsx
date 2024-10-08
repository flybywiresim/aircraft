import React, { createContext, useContext } from 'react';
import { useHistory, useRouteMatch, Redirect, Route, Switch } from 'react-router-dom';
import { Pages } from './Pages';

import './index.scss';
import { Dropdown, DropdownDivider, DropdownItem, DropdownLink } from './Components/Dropdown';
import { Button } from './Components/Button';

enum OITDisplayPosition {
  Captain = 'CAPTAIN',
  FO = 'F/O',
  Backup = 'BACKUP',
}
type OITContextType = {
  displayPosition: OITDisplayPosition;
};

export const OITContext = createContext<OITContextType>(undefined as any);

export const useOITContext = () => useContext(OITContext);

export const OnboardInformationTerminal: React.FC = () => {
  const history = useHistory();
  const { path } = useRouteMatch();
  return (
    <svg viewBox="0 0 1024 768">
      <rect x={0} y={0} width={1024} height={768} />
      <PagesContainer />

      {/* fix prefixes for this */}
      <text x={172} y={27} fontSize={18} fill="cyan" textAnchor="middle">
        {history.location.pathname.toUpperCase().substring(path.length)}
      </text>

      <FunctionDropdown />
      <MessageDropdown />
      <MenuDropdown />
    </svg>
  );
};

const PagesContainer: React.FC = () => (
  <OITContext.Provider value={{ displayPosition: OITDisplayPosition.FO }}>
    <Switch>
      <Route exact path="/">
        <Redirect to="/login" />
      </Route>
      <Route path="/login" component={Pages.STSPage} />
      <Route path="/sts" component={Pages.STSPage} />
      <Route path="/menu" component={Pages.MenuPage} />
      <Route path="/loadbox" component={Pages.LoadBoxPage} />
    </Switch>
  </OITContext.Provider>
);

const MenuDropdown: React.FC = () => (
  <>
    <Dropdown x={0} y={0} width={81} height={39} dropDownWidth={200} fill="#fff" title="MENU" clipItems={false}>
      <DropdownLink height={30} link="menu">
        FLT OPS MENU
      </DropdownLink>

      <DropdownDivider height={1} />

      <DropdownItem height={30} centered={false}>
        FLT FOLDER
      </DropdownItem>
      <DropdownItem height={30} centered={false}>
        TERML CHART
      </DropdownItem>
      <DropdownItem height={30} centered={false}>
        OPS LIBRARY
      </DropdownItem>

      <DropdownDivider height={1} />

      <DropdownItem height={30} centered={false}>
        T.O PERF
      </DropdownItem>
      <DropdownItem height={30} centered={false}>
        LOADSHEET
      </DropdownItem>
      <DropdownItem height={30} centered={false}>
        LDG PERF
      </DropdownItem>
      <DropdownItem height={30} centered={false}>
        IN-FLT PERF
      </DropdownItem>

      <DropdownDivider height={1} />

      <DropdownLink height={30} link="sts">
        FLT OPS STS
      </DropdownLink>
      <DropdownLink height={30} link="loadbox">
        LOAD BOX
      </DropdownLink>
      <DropdownItem height={30} centered={false}>
        EXPORT BOX
      </DropdownItem>

      <DropdownDivider height={1} />

      <DropdownItem height={30} centered={false}>
        EXIT SESSION
      </DropdownItem>
    </Dropdown>
  </>
);

const FunctionDropdown: React.FC = () => (
  <>
    <Dropdown x={265} y={0} width={139} height={39} dropDownWidth={340} fill="#fff" title="FUNCTIONS" clipItems={false}>
      <DropdownItem height={30} centered={false}>
        HOME
      </DropdownItem>
      <DropdownItem height={30} centered={false}>
        PREVIOUS
      </DropdownItem>
      <DropdownItem height={30} centered={false}>
        NEXT
      </DropdownItem>

      <DropdownDivider height={1} />

      <DropdownItem height={30} centered={false}>
        PRINT
      </DropdownItem>
      <DropdownItem height={30} centered={false}>
        STORE
      </DropdownItem>
      <DropdownItem height={30} centered={false}>
        UPDATE
      </DropdownItem>

      <DropdownDivider height={1} />

      <DropdownItem height={30} centered={false}>
        UNDO
      </DropdownItem>
      <DropdownItem height={30} centered={false}>
        REDO
      </DropdownItem>

      <DropdownDivider height={1} />

      <DropdownItem height={30} centered={false}>
        HELP
      </DropdownItem>

      <DropdownDivider height={1} />

      <DropdownItem height={30} centered={false}>
        HIDE SWITCHING BAR
      </DropdownItem>

      <DropdownDivider height={1} />

      <DropdownItem height={30} centered={false}>
        CLOSE APPLICATION
      </DropdownItem>
    </Dropdown>
  </>
);

const MessageDropdown: React.FC = () => (
  <>
    <text x={415} y={27} fontSize={18} fill="#fff">
      0 MSG
    </text>

    <Dropdown x={490} y={0} width={461} height={39} fill="#666" title="" clipItems={false}>
      <DropdownItem>MESSAGE</DropdownItem>
    </Dropdown>

    <Button x={951} y={0} width={73} height={39}>
      <tspan fontSize={18}>CLEAR</tspan>
    </Button>
  </>
);
