/**
 * Known existing page reloads
 * pageRedrawCallback: 100ms: CDUMain
 * refreshPageCallback: 250ms: FMCMain -> updateRadioNavState()
 * returnPageCallback: ?ms: ?location
 * page.SelfPtr: dynamic ms: CDUMain (Timeout)
 * FMSPerformancePage refresh: 50: PerformancePage
 * _autoRefresh(): 1000ms: IRSInit
 * pageUpdate
 */

class MCDUPageTemplateStatic {
    constructor(id, system, page) {
        this._id = id;
        this._system = system;
        this._page = page;
        this._load = () => {};
    }

    /**
     * Use this function to load a mcdu page.
     * Note: For automatic updating see "update" function.
     * @param mcdu {A320_Neo_CDU_MainDisplay}
     * @param params {array[any]}
     * @example1: Any additional parameters are also respected
     * mcduPages.MenuPage.display(mcdu, offset)
     * @example2: Any additional parameters are also respected
     * mcduPages.FMSIRSInit.display(mcdu, lon, originAirportLat, originAirportLon, referenceName, originAirportCoordinates, alignMsg)
     */
    display(mcdu, ...params) {
        mcdu.clearDisplay();
        mcdu.currentPage = this;
        this._load = () => this._page(mcdu, ...params);
        this._load();
    }

    get id() {
        return this._id;
    }

    get system() {
        return this._system;
    }

    update(mcdu, deltaTime, forceUpdate) {
        if (!forceUpdate) {
            return;
        }
        mcdu.clearDisplay();
        this._load();
    }
}

class MCDUPageTemplate extends MCDUPageTemplateStatic {
    constructor(id, system, page, updateInterval = 1000) {
        super(id, system, page);
        this._updateThrottler = new UpdateThrottler(updateInterval);
        this._skipFirstUpdate = true;
    }

    /**
     * Use this function to load a mcdu page.
     * Note: For automatic updating see "update" function.
     * @param mcdu {A320_Neo_CDU_MainDisplay}
     * @param params {array[any]}
     * @example1: Any additional parameters are also respected
     * mcduPages.MenuPage.display(mcdu, offset)
     * @example2: Any additional parameters are also respected
     * mcduPages.FMSIRSInit.display(mcdu, lon, originAirportLat, originAirportLon, referenceName, originAirportCoordinates, alignMsg)
     */
    display(mcdu, ...params) {
        super.display(mcdu, ...params);
        this._skipFirstUpdate = true;
    }

    /**
     * This function manages the automatic reload/refresh of all mcdu pages.
     * Note: The first update after the pages has been opened is skipped to prevent unnecessary page reloads.
     * @param mcdu {A320_Neo_CDU_MainDisplay}
     * @param deltaTime {number}
     * @param forceUpdate {boolean}
     */
    update(mcdu, deltaTime, forceUpdate) {
        if (this._updateThrottler.canUpdate(deltaTime, forceUpdate) === -1) {
            return;
        }
        if (this._skipFirstUpdate) {
            this._skipFirstUpdate = false;
            return;
        }
        mcdu.clearDisplay();
        this._load();
    }
}

class FMGCPage extends MCDUPageTemplate {
    constructor(page, updateInterval = 100) {
        super(mcduPageCounter++, mcduSubSystems.FMS, page, updateInterval);
    }
}

class FMGCPageStatic extends MCDUPageTemplateStatic {
    constructor(page) {
        super(mcduPageCounter++, mcduSubSystems.FMS, page);
    }
}

class ATSUPage extends MCDUPageTemplate {
    constructor(page, updateInterval = undefined) {
        super(mcduPageCounter++, mcduSubSystems.ATSU, page, updateInterval);
    }
}

class ATSUPageStatic extends MCDUPageTemplateStatic {
    constructor(page) {
        super(mcduPageCounter++, mcduSubSystems.ATSU, page);
    }
}

class AIDSPage extends MCDUPageTemplateStatic {
    constructor(page) {
        super(mcduPageCounter++, mcduSubSystems.AIDS, page);
    }
}

class CFDSPageStatic extends MCDUPageTemplateStatic {
    constructor(page) {
        super(mcduPageCounter++, mcduSubSystems.CFDS, page);
    }
}

class MenuPageStatic extends MCDUPageTemplateStatic {
    constructor(page) {
        super(mcduPageCounter++, mcduSubSystems.NONE, page);
    }
}

const mcduSubSystems = {
    "NONE": 0,
    "FMS": 1,
    "ATSU": 2,
    "AIDS": 3,
    "CFDS": 4,
};

let mcduPageCounter = 0;

const mcduPages = {
    "MenuPage":                     new MenuPageStatic(CDUMenuPage.ShowPage),
    "FMGCAirportsMonitor":          new FMGCPage(CDUAirportsMonitor.ShowPage, 2000),
    "FMGCAirwaysFromWaypointPage":  new FMGCPageStatic(A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage),
    "FMGCAvailableArrivalsPage":    new FMGCPageStatic(CDUAvailableArrivalsPage.ShowPage),
    "FMGCAvailableArrivalsPageVia": new FMGCPageStatic(CDUAvailableArrivalsPage.ShowViasPage),
    "FMGCAvailableDeparturesPage":  new FMGCPageStatic(CDUAvailableDeparturesPage.ShowPage),
    "FMGCAvailableFlightPlanPage":  new FMGCPageStatic(CDUAvailableFlightPlanPage.ShowPage),
    "FMGCDataIndexPage1":           new FMGCPageStatic(CDUDataIndexPage.ShowPage1),
    "FMGCDataIndexPage2":           new FMGCPageStatic(CDUDataIndexPage.ShowPage2),
    "FMGCDirectToPage":             new FMGCPage(CDUDirectToPage.ShowPage),
    "FMGCFixInfoPage":              new FMGCPage(CDUFixInfoPage.ShowPage),
    "FMGCFlightPlanPage":           new FMGCPage(CDUFlightPlanPage.ShowPage),
    "FMGCFuelPredPage":             new FMGCPage(CDUFuelPredPage.ShowPage),
    "FMGCGPSMonitor":               new FMGCPage(CDUGPSMonitor.ShowPage, 500),
    "FMGCHoldAtPage":               new FMGCPageStatic(CDUHoldAtPage.ShowPage),
    "FMGCIdentPage":                new FMGCPage(CDUIdentPage.ShowPage),
    "FMGCInitPageA":                new FMGCPage(CDUInitPage.ShowPage1),
    "FMGCInitPageB":                new FMGCPage(CDUInitPage.ShowPage2),
    "FMGCIRSInit":                  new FMGCPage(CDUIRSInit.ShowPage, 1000),
    "FMGCIRSMonitor":               new FMGCPage(CDUIRSMonitor.ShowPage, 1000),
    "FMGCIRSStatus":                new FMGCPage(CDUIRSStatus.ShowPage, 2000),
    "FMGCIRSStatusFrozen":          new FMGCPageStatic(CDUIRSStatusFrozen.ShowPage),
    "FMGCLateralRevisionPage":      new FMGCPageStatic(CDULateralRevisionPage.ShowPage),
    "FMGCNavaidPage":               new FMGCPageStatic(CDUNavaidPage.ShowPage),
    "FMGCNavRadioPage":             new FMGCPage(CDUNavRadioPage.ShowPage, 250),
    "FMGCNewWaypoint":              new FMGCPageStatic(CDUNewWaypoint.ShowPage),
    "FMGCPerformancePageTO":        new FMGCPage(CDUPerformancePage.ShowTAKEOFFPage, 50),
    "FMGCPerformancePageCLB":       new FMGCPage(CDUPerformancePage.ShowCLBPage, 100),
    "FMGCPerformancePageCRZ":       new FMGCPage(CDUPerformancePage.ShowCRZPage, 100),
    "FMGCPerformancePageDES":       new FMGCPage(CDUPerformancePage.ShowDESPage, 100),
    "FMGCPerformancePageAPP":       new FMGCPage(CDUPerformancePage.ShowAPPRPage, 100),
    "FMGCPerformancePageGO":        new FMGCPage(CDUPerformancePage.ShowGOAROUNDPage, 100),
    "FMGCPilotsWaypoint":           new FMGCPageStatic(CDUPilotsWaypoint.ShowPage),
    "FMGCPosFrozen":                new FMGCPageStatic(CDUPosFrozen.ShowPage),
    "FMGCPositionMonitorPage":      new FMGCPage(CDUPositionMonitorPage.ShowPage, 2000),
    "FMGCProgressPage":             new FMGCPage(CDUProgressPage.ShowPage, 2000),
    "FMGCProgressPageReport":       new FMGCPage(CDUProgressPage.ShowReportPage, 2000),
    "FMGCProgressPageGPS":          new FMGCPage(CDUProgressPage.ShowPredictiveGPSPage, 2000),
    "FMGCSecFplnMain":              new FMGCPageStatic(CDUSecFplnMain.ShowPage),
    "FMGCSelectedNavaids":          new FMGCPageStatic(CDUSelectedNavaids.ShowPage),
    "FMGCSelectWptPage":            new FMGCPageStatic(A320_Neo_CDU_SelectWptPage.ShowPage),
    "FMGCVerticalRevisionPage":     new FMGCPage(CDUVerticalRevisionPage.ShowPage, 100),
    "FMGCWaypointPage":             new FMGCPageStatic(CDUWaypointPage.ShowPage),
    "FMGCWindPage":                 new FMGCPageStatic(CDUWindPage.ShowPage),
    "FMGCWindPageCLB":              new FMGCPageStatic(CDUWindPage.ShowCLBPage),
    "FMGCWindPageCRZ":              new FMGCPageStatic(CDUWindPage.ShowCRZPage),
    "FMGCWindPageDES":              new FMGCPageStatic(CDUWindPage.ShowDESPage),
    "AIDSMainMenu":                 new AIDSPage(CDU_AIDS_MainMenu.ShowPage),
    "ATSUAtcLatRequest":            new ATSUPageStatic(CDUAtcLatRequest.ShowPage),
    "ATSUAtcMenuFansA":             new ATSUPage(CDUAtcMenuFansA.ShowPage, 3000),
    "ATSUAtcTextFansAPage1":        new ATSUPageStatic(CDUAtcTextFansA.ShowPage1),
    "ATSUAtcTextFansAPage2":        new ATSUPageStatic(CDUAtcTextFansA.ShowPage2),
    "ATSUAtcVertRequestPage1":      new ATSUPageStatic(CDUAtcVertRequest.ShowPage1),
    "ATSUAtcVertRequestPage2":      new ATSUPageStatic(CDUAtcVertRequest.ShowPage2),
    "ATSUAtcMenuFansB":             new ATSUPage(CDUAtcMenuFansB.ShowPage, 3000),
    "ATSUAtcRequest":               new ATSUPageStatic(CDUAtcRequest.ShowPage),
    "ATSUAocFreeText":              new ATSUPageStatic(CDUAocFreeText.ShowPage), //may be updatable
    "ATSUAocInitPage1":             new ATSUPage(CDUAocInit.ShowPage, 100),
    "ATSUAocInitPage2":             new ATSUPage(CDUAocInit.ShowPage2, 2000),
    "ATSUAocMenu":                  new ATSUPageStatic(CDUAocMenu.ShowPage),
    "ATSUAocMessageSentDetail":     new ATSUPageStatic(CDUAocMessageSentDetail.ShowPage),
    "ATSUAocMessagesReceived":      new ATSUPage(CDUAocMessagesReceived.ShowPage, 3000),
    "ATSUAocMessagesSent":          new ATSUPage(CDUAocMessagesSent.ShowPage, 3000),
    "ATSUAocOfpData":               new ATSUPage(CDUAocOfpData.ShowPage, 500),
    "ATSUAocRequestsAtis":          new ATSUPageStatic(CDUAocRequestsAtis.ShowPage),
    "ATSUAocRequestsMessage":       new ATSUPageStatic(CDUAocRequestsMessage.ShowPage),
    "ATSUAocRequestsWeather":       new ATSUPageStatic(CDUAocRequestsWeather.ShowPage),
    "ATSUAtcAtisAutoUpdate":        new ATSUPageStatic(CDUAtcAtisAutoUpdate.ShowPage),
    "ATSUAtcAtisMenu":              new ATSUPageStatic(CDUAtcAtisMenu.ShowPage),
    "ATSUAtcConnection":            new ATSUPageStatic(CDUAtcConnection.ShowPage),
    "ATSUAtcConnectionNotification":new ATSUPage(CDUAtcConnectionNotification.ShowPage, 2000),
    "ATSUAtcConnectionStatus":      new ATSUPage(CDUAtcConnectionStatus.ShowPage, 2000),
    "ATSUAtcDepartReqPage1":        new ATSUPageStatic(CDUAtcDepartReq.ShowPage1),
    "ATSUAtcDepartReqPage2":        new ATSUPageStatic(CDUAtcDepartReq.ShowPage2),
    "ATSUAtcEmergency":             new ATSUPageStatic(CDUAtcEmergency.ShowPage),
    "ATSUAtcMaxUplinkDelay":        new ATSUPage(CDUAtcMaxUplinkDelay.ShowPage, 2000),
    "ATSUAtcMenuPage1":             new ATSUPageStatic(CDUAtcMenu.ShowPage1),
    "ATSUAtcMenuPage2":             new ATSUPageStatic(CDUAtcMenu.ShowPage2),
    "ATSUAtcMessage":               new ATSUPageStatic(CDUAtcMessage.ShowPage),
    "ATSUAtcMessagesRecord":        new ATSUPage(CDUAtcMessagesRecord.ShowPage, 250),
    "ATSUAtcOceanicReqPage1":       new ATSUPageStatic(CDUAtcOceanicReq.ShowPage1),
    "ATSUAtcOceanicReqPage2":       new ATSUPageStatic(CDUAtcOceanicReq.ShowPage2),
    "ATSUAtcPositionReport":        new ATSUPage(CDUAtcPositionReport.ShowPage, 250),
    "ATSUAtcReportAtis":            new ATSUPageStatic(CDUAtcReportAtis.ShowPage),
    "ATSUAtcReports":               new ATSUPageStatic(CDUAtcReports.ShowPage),
    "ATSUAtsuDatalinkStatus":       new ATSUPage(CDUAtsuDatalinkStatus.ShowPage, 250),
    "ATSUAtsuMenu":                 new ATSUPageStatic(CDUAtsuMenu.ShowPage),
    "ATSUCommMenu":                 new ATSUPageStatic(CDUCommMenu.ShowPage),
    "CFDSAvionicsMenuPage1":        new CFDSPageStatic(CDUCfdsAvionicsMenu.ShowPage),
    "CFDSAvionicsMenuPage2":        new CFDSPageStatic(CDUCfdsAvionicsMenu.ShowPage2),
    "CFDSMainMenuPage1":            new CFDSPageStatic(CDUCfdsMainMenu.ShowPage),
    "CFDSMainMenuPage2":            new CFDSPageStatic(CDUCfdsMainMenu.ShowPage2),
    "CFDSTestMenuPage1":            new CFDSPageStatic(CDUCfdsTestMenu.ShowPage),
    "CFDSTestMenuPage2":            new CFDSPageStatic(CDUCfdsTestMenu.ShowPage2),
    "CFDSTestCommonGroundScanning": new CFDSPageStatic(CDU_CFDS_Test_Common_GroundScanning.ShowPage),
    "CFDSTestCommonPowerUp":        new CFDSPageStatic(CDU_CFDS_Test_Common_PowerUp.ShowPage),
    "CFDSTestAircond":              new CFDSPageStatic(CDUCfdsTestAircond.ShowPage),
    "CFDSTestComPage1":             new CFDSPageStatic(CDUCfdsTestCom.ShowPage),
    "CFDSTestComPage2":             new CFDSPageStatic(CDUCfdsTestCom.ShowPage2),
    "CFDSTestElec":                 new CFDSPageStatic(CDUCfdsTestElec.ShowPage),
    "CFDSTestEng":                  new CFDSPageStatic(CDUCfdsTestEng.ShowPage),
    "CFDSTestFctl":                 new CFDSPageStatic(CDUCfdsTestFctl.ShowPage),
    "CFDSTestFire":                 new CFDSPageStatic(CDUCfdsTestFire.ShowPage),
    "CFDSTestFuel":                 new CFDSPageStatic(CDUCfdsTestFuel.ShowPage),
    "CFDSTestIce":                  new CFDSPageStatic(CDUCfdsTestIce.ShowPage),
    "CFDSTestInfo":                 new CFDSPageStatic(CDUCfdsTestInfo.ShowPage),
    "CFDSTestInst":                 new CFDSPageStatic(CDUCfdsTestInst.ShowPage),
    "CFDSTestInstCFDIUMenu":        new CFDSPageStatic(CDU_CFDS_Test_Inst_CFDIU_Menu.ShowPage),
    "CFDSTestInstDFDRSMenu":        new CFDSPageStatic(CDU_CFDS_Test_Inst_DFDRS_Menu.ShowPage),
    "CFDSTestInstECAMMenu":         new CFDSPageStatic(CDU_CFDS_Test_Inst_ECAM_Menu.ShowPage),
    "CFDSTestInstEISMenu":          new CFDSPageStatic(CDU_CFDS_Test_Inst_EIS_Menu.ShowPage),
    "CFDSTestInstEISTests":         new CFDSPageStatic(CDU_CFDS_Test_Inst_EIS_Tests.ShowPage),
    "CFDSTestInstEISTestsDisplay":  new CFDSPageStatic(CDU_CFDS_Test_Inst_EIS_Tests_Display.ShowPage),
    "CFDSTestLG":                   new CFDSPageStatic(CDUCfdsTestLG.ShowPage),
    "CFDSTestNavPage1":             new CFDSPageStatic(CDUCfdsTestNav.ShowPage),
    "CFDSTestNavPage2":             new CFDSPageStatic(CDUCfdsTestNav.ShowPage2),
    "CFDSTestNavPage3":             new CFDSPageStatic(CDUCfdsTestNav.ShowPage3),
    "CFDSTestPneu":                 new CFDSPageStatic(CDUCfdsTestPneu.ShowPage)
};
