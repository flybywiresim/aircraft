import React from 'react';
import { getRootElement } from '@instruments/common/defaults';
import { HashRouter as Router } from 'react-router-dom';
import ReactDOM from 'react-dom';
import '../index.scss';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { NavigationDatabase, NavigationDatabaseBackend } from '@fmgc/NavigationDatabase';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
import { DisplayUnitID } from '@instruments/common/LegacyCdsDisplayUnit';
import { render } from '../Common';
import { MultiFunctionDisplay } from './MultiFunctionDisplay';
import { renderTarget } from '../util.js';

NavigationDatabaseService.activeDatabase = new NavigationDatabase(NavigationDatabaseBackend.Navigraph);
FlightPlanService.createFlightPlans();

if (renderTarget) {
  let displayUnitID = DisplayUnitID.CaptMfd;

  const url = getRootElement().getAttribute('url');

  if (url) {
    const parsedUrl = new URL(url);

    if (parsedUrl) {
      const idString = new URLSearchParams(parsedUrl.search).get('duID');

      if (idString) {
        const numID = parseInt(idString);

        if (!Number.isNaN(numID)) {
          displayUnitID = numID as DisplayUnitID;
        }
      }
    }
  }

  console.log(`Initializing as DU#: ${displayUnitID} (${DisplayUnitID[displayUnitID]})`);

  render(
    <Router>
      <MultiFunctionDisplay displayUnitID={displayUnitID} />
    </Router>,
  );
}

getRootElement().addEventListener('unload', () => {
  ReactDOM.unmountComponentAtNode(renderTarget ?? document.body);
});
