friendlyName = "FlyByWire A380X Handler"
# Ensuring that Chocks and Brakes Tests are not overriden by an User-Profile
chocksTest = "(L:A32NX_PARK_BRAKE_LEVER_POS,number) (L:A32NX_GND_EQP_IS_VISIBLE,number) ||"
brakesTest = "(L:A32NX_PARK_BRAKE_LEVER_POS,number)"
fuelSync = LVariable("A32NX_GSX_FUEL_SYNC_ENABLED")

def onJetwayConnected(self):
    pass

def onJetwayDisconnected(self):
    pass

def setExtPowerAvail(self):
    pass

def customTruckRequestedMessage(self):
    if fuelSync.getValue() != 0:
        return "Fuel Truck requested - set planned Fuel in FlyPad"
    else:
        return self._super_customTruckRequestedMessage()

def customRefuelMessage(self):
    if fuelSync.getValue() != 0:
        return "GSX Refuel in Progress"
    else:
        return self._super_customRefuelMessage()

def customTruckInPositionMessage(self):
    if fuelSync.getValue() != 0:
        return "Fuel Truck in Position - Refuel starts automatically"
    else:
        return self._super_customTruckInPositionMessage()
