friendlyName = "FlyByWire A32NX Handler"
chocksTest = "(L:A32NX_PARK_BRAKE_LEVER_POS,number) (L:A32NX_GND_EQP_IS_VISIBLE,number) ||"
brakesTest = "(L:A32NX_PARK_BRAKE_LEVER_POS,number)"
zfw = LVariable("A32NX_AIRFRAME_ZFW")

def onAircraftEngaged(self):
    pass

def onAircraftDisengaged(self):
    pass

def onBeforeVehicleSelect(self):
    pass

def onBoardingRequested(self):
    pass

def onDeboardingRequested(self):
    pass

def onDepartureRequested(self):
    pass

def onCateringRequested(self):
    pass

def onWaterServiceRequested(self):
    pass

def onWaterServiceCompleted(self):
    pass

def onLavatoryServiceRequested(self):
    pass

def onDeicingAction(self):
    pass

def onJetwayConnected(self):
    pass

def onJetwayDisconnected(self):
    pass

def onBypassPinConnected(self):
    pass

def onBypassPinDisconnected(self):
    pass

def onWaterOperateDoor(self, value=True):
    pass

def onLavatoryOperateDoor(self, value=True):
    pass

def operateChocks(self):
    pass

def operateGpu(self):
    pass

def setExtPowerAvail(self):
    pass

def setFuelLevel(self, level):
    pass

def setPlannedFuel(self):
    pass

def getCurrentZFW(self):
    return zfw.getValue()

def fuelPumpInsist(self):
    return 1

def setPayload(self):
    pass

def removePayload(self):
    pass

def customTruckRequestedMessage(self):
    pass

def customTruckInPositionMessage(self):
    pass
