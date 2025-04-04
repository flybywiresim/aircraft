#ifdef A380X
#define VD_ALWAYS_ACTIVE 1
#endif

#ifndef A380X
#define VD_ALWAYS_ACTIVE 0
#endif

#include "collection.h"

using namespace navigationdisplay;

Collection::Collection(simconnect::Connection& connection)
    : _displays(),
      _groundTruth(),
      _egpwcData(),
      _configurationLeft(),
      _configurationRight(),
      _lastAircraftStatusTransmission(),
      _sendAircraftStatus(false),
      _reconfigureDisplayLeft(false),
      _reconfigureDisplayRight(false),
      _simulatorData(nullptr),
      _aircraftStatus(nullptr),
      _ndConfiguration(nullptr),
      _simconnectAircraftStatus(nullptr) {
  this->_simconnectAircraftStatus = connection.clientDataArea<types::AircraftStatusData>();
  this->_simconnectAircraftStatus->defineArea("FBW_SIMBRIDGE_EGPWC_AIRCRAFT_STATUS");
  this->_simconnectAircraftStatus->allocateArea(true);

  this->_aircraftStatus =
      connection.lvarObject<EgpwcDestinationLat, EgpwcDestinationLong, EgpwcPresentLat, EgpwcPresentLong, EgpwcTerrOnNdRenderingMode,
                            EgpwcAltitude, EgpwcHeading, EgpwcVerticalSpeed, EgpwcGearIsDown>();
  this->_aircraftStatus->setUpdateCycleTime(100 * types::millisecond);
  this->_aircraftStatus->setOnChangeCallback([=]() {
    this->_egpwcData.destinationLatitude =
        types::Arinc429Word<types::Angle>::fromSimVar(this->_aircraftStatus->value<EgpwcDestinationLat>(), types::degree);
    this->_egpwcData.destinationLongitude =
        types::Arinc429Word<types::Angle>::fromSimVar(this->_aircraftStatus->value<EgpwcDestinationLong>(), types::degree);
    this->_egpwcData.presentLatitude =
        types::Arinc429Word<types::Angle>::fromSimVar(this->_aircraftStatus->value<EgpwcPresentLat>(), types::degree);
    this->_egpwcData.presentLongitude =
        types::Arinc429Word<types::Angle>::fromSimVar(this->_aircraftStatus->value<EgpwcPresentLong>(), types::degree);
    this->_egpwcData.altitude = types::Arinc429Word<types::Length>::fromSimVar(this->_aircraftStatus->value<EgpwcAltitude>(), types::feet);
    this->_egpwcData.heading  = types::Arinc429Word<types::Angle>::fromSimVar(this->_aircraftStatus->value<EgpwcHeading>(), types::degree);
    this->_egpwcData.verticalSpeed =
        types::Arinc429Word<types::Velocity>::fromSimVar(this->_aircraftStatus->value<EgpwcVerticalSpeed>(), types::ftpmin);
    this->_egpwcData.gearIsDown            = static_cast<std::uint8_t>(this->_aircraftStatus->value<EgpwcGearIsDown>()) != 0;
    this->_egpwcData.terrOnNdRenderingMode = static_cast<std::uint8_t>(this->_aircraftStatus->value<EgpwcTerrOnNdRenderingMode>());

    this->_sendAircraftStatus = true;
  });

  this->_ndConfiguration = connection.lvarObject<EgpwcNdLeftRange, EfisNdLeftMode, EgpwcTerrOnNdLeftActive, EgpwcNdRightRange,
                                                 EfisNdRightMode, EgpwcTerrOnNdRightActive, AcEssBus, Ac2Bus>();
  this->_ndConfiguration->setUpdateCycleTime(200 * types::millisecond);
  this->_ndConfiguration->setOnChangeCallback([=]() {
    this->_configurationLeft.range    = static_cast<float>(this->_ndConfiguration->value<EgpwcNdLeftRange>()) * types::nauticmile;
    this->_configurationLeft.mode     = static_cast<std::uint8_t>(this->_ndConfiguration->value<EfisNdLeftMode>());
    this->_configurationLeft.terrOnNd = static_cast<std::uint8_t>(this->_ndConfiguration->value<EgpwcTerrOnNdLeftActive>()) != 0;
    this->_configurationLeft.terrOnVd = VD_ALWAYS_ACTIVE == 1;
    this->_configurationLeft.powered  = static_cast<std::uint8_t>(this->_ndConfiguration->value<AcEssBus>()) != 0;

    this->_configurationRight.range    = static_cast<float>(this->_ndConfiguration->value<EgpwcNdRightRange>()) * types::nauticmile;
    this->_configurationRight.mode     = static_cast<std::uint8_t>(this->_ndConfiguration->value<EfisNdRightMode>());
    this->_configurationRight.terrOnNd = static_cast<std::uint8_t>(this->_ndConfiguration->value<EgpwcTerrOnNdRightActive>()) != 0;
    this->_configurationRight.terrOnVd = VD_ALWAYS_ACTIVE == 1;
    this->_configurationRight.powered  = static_cast<std::uint8_t>(this->_ndConfiguration->value<Ac2Bus>()) != 0;

    this->_reconfigureDisplayLeft  = true;
    this->_reconfigureDisplayRight = true;
    this->_sendAircraftStatus      = true;
  });

  this->_simulatorData = connection.simObject<types::SimulatorData>();
  this->_simulatorData->addEntry("PLANE LATITUDE", "degrees");
  this->_simulatorData->addEntry("PLANE LONGITUDE", "degrees");
  this->_simulatorData->addEntry(LightPotentiometerLeftName, "percent over 100");
  this->_simulatorData->addEntry(LightPotentiometerRightName, "percent over 100");
  this->_simulatorData->defineObject();
  this->_simulatorData->requestData(SIMCONNECT_PERIOD_VISUAL_FRAME);
  this->_simulatorData->setOnChangeCallback([=]() {
    this->_configurationLeft.potentiometer  = static_cast<float>(this->_simulatorData->data().potentiometerLeft);
    this->_configurationRight.potentiometer = static_cast<float>(this->_simulatorData->data().potentiometerRight);
    this->_reconfigureDisplayLeft           = true;
    this->_reconfigureDisplayRight          = true;

    types::Angle latitude  = static_cast<float>(this->_simulatorData->data().latitude) * types::degree;
    types::Angle longitude = static_cast<float>(this->_simulatorData->data().longitude) * types::degree;
    if (latitude != this->_groundTruth.latitude || longitude != this->_groundTruth.longitude) {
      this->_groundTruth.latitude  = latitude;
      this->_groundTruth.longitude = longitude;
      this->_sendAircraftStatus    = true;
    }
  });
}

Collection::~Collection() {
  this->destroy();
}

void Collection::registerDisplay(DisplaySide side, FsContext context, simconnect::Connection& connection) {
  if (side == DisplaySide::Left) {
    this->_displays.insert({context, std::shared_ptr<DisplayBase>(new DisplayLeft(connection, context))});
    std::cout << "TERR ON ND: Created left display" << std::endl;
  } else {
    this->_displays.insert({context, std::shared_ptr<DisplayBase>(new DisplayRight(connection, context))});
    std::cout << "TERR ON ND: Created right display" << std::endl;
  }
}

void Collection::destroy() {
  for (auto display : this->_displays) {
    display.second->destroy();
  }
  this->_displays.clear();
}

void Collection::updateDisplay(FsContext context) {
  const auto now = std::chrono::system_clock::now();
  const auto dt =
      static_cast<float>(std::chrono::duration_cast<std::chrono::milliseconds>(now - this->_lastAircraftStatusTransmission).count()) *
      types::millisecond;

  if (this->_sendAircraftStatus && dt >= 100 * types::millisecond) {
    this->_simconnectAircraftStatus->data().adiruValid = this->_egpwcData.presentLatitude.isNo() &&
                                                         this->_egpwcData.presentLongitude.isNo() && this->_egpwcData.altitude.isNo() &&
                                                         this->_egpwcData.heading.isNo() && this->_egpwcData.verticalSpeed.isNo();
    this->_simconnectAircraftStatus->data().latitude  = this->_egpwcData.presentLatitude.value().convert(types::degree);
    this->_simconnectAircraftStatus->data().longitude = this->_egpwcData.presentLongitude.value().convert(types::degree);
    this->_simconnectAircraftStatus->data().altitude  = static_cast<std::int32_t>(this->_egpwcData.altitude.value().convert(types::feet));
    this->_simconnectAircraftStatus->data().heading   = static_cast<std::int16_t>(this->_egpwcData.heading.value().convert(types::degree));
    this->_simconnectAircraftStatus->data().verticalSpeed =
        static_cast<std::int16_t>(this->_egpwcData.verticalSpeed.value().convert(types::ftpmin));
    this->_simconnectAircraftStatus->data().gearIsDown = static_cast<std::uint8_t>(this->_egpwcData.gearIsDown);

    this->_simconnectAircraftStatus->data().destinationValid =
        this->_egpwcData.destinationLatitude.isNo() && this->_egpwcData.destinationLongitude.isNo();
    this->_simconnectAircraftStatus->data().destinationLatitude  = this->_egpwcData.destinationLatitude.value().convert(types::degree);
    this->_simconnectAircraftStatus->data().destinationLongitude = this->_egpwcData.destinationLongitude.value().convert(types::degree);

    bool arcMode        = this->_configurationLeft.mode == NavigationDisplayArcModeId;
    bool terrainMapMode = this->_configurationLeft.mode == NavigationDisplayRoseLsModeId ||
                          this->_configurationLeft.mode == NavigationDisplayRoseVorModeId ||
                          this->_configurationLeft.mode == NavigationDisplayRoseNavModeId || arcMode;
    this->_simconnectAircraftStatus->data().ndRangeCapt =
        static_cast<std::uint16_t>(this->_configurationLeft.range.convert(types::nauticmile));
    this->_simconnectAircraftStatus->data().ndArcModeCapt = this->_configurationLeft.mode == NavigationDisplayArcModeId;
    this->_simconnectAircraftStatus->data().ndTerrainOnNdActiveCapt =
        static_cast<std::uint8_t>((this->_configurationLeft.terrOnNd || this->_configurationLeft.terrOnVd) && terrainMapMode);
    this->_simconnectAircraftStatus->data().efisModeCapt = this->_configurationLeft.mode;

    arcMode        = this->_configurationRight.mode == NavigationDisplayArcModeId;
    terrainMapMode = this->_configurationRight.mode == NavigationDisplayRoseLsModeId ||
                     this->_configurationRight.mode == NavigationDisplayRoseVorModeId ||
                     this->_configurationRight.mode == NavigationDisplayRoseNavModeId || arcMode;
    this->_simconnectAircraftStatus->data().ndRangeFO =
        static_cast<std::uint16_t>(this->_configurationRight.range.convert(types::nauticmile));
    this->_simconnectAircraftStatus->data().ndArcModeFO = this->_configurationRight.mode == NavigationDisplayArcModeId;
    this->_simconnectAircraftStatus->data().ndTerrainOnNdActiveFO =
        static_cast<std::uint8_t>((this->_configurationRight.terrOnNd || this->_configurationRight.terrOnVd) && terrainMapMode);
    this->_simconnectAircraftStatus->data().efisModeFO = this->_configurationRight.mode;

    this->_simconnectAircraftStatus->data().ndTerrainOnNdRenderingMode = this->_egpwcData.terrOnNdRenderingMode;
    this->_simconnectAircraftStatus->data().groundTruthLatitude        = this->_groundTruth.latitude.convert(types::degree);
    this->_simconnectAircraftStatus->data().groundTruthLongitude       = this->_groundTruth.longitude.convert(types::degree);

    this->_simconnectAircraftStatus->setArea();
    this->_lastAircraftStatusTransmission = now;
    this->_sendAircraftStatus             = false;
  }

  // update the display
  const auto displayIterator = this->_displays.find(context);
  if (displayIterator != this->_displays.cend()) {
    const auto display = displayIterator->second;

    switch (display->side()) {
      case DisplaySide::Left:
        if (this->_reconfigureDisplayLeft) {
          display->update(this->_configurationLeft);
          this->_reconfigureDisplayLeft = false;
        }
        break;
      case DisplaySide::Right:
        if (this->_reconfigureDisplayRight) {
          display->update(this->_configurationRight);
          this->_reconfigureDisplayRight = false;
        }
        break;
      default:
        break;
    }
  }
}

void Collection::renderDisplay(sGaugeDrawData* pDraw, FsContext context) {
  // render the display
  const auto displayIterator = this->_displays.find(context);
  if (displayIterator != this->_displays.cend()) {
    const auto display = displayIterator->second;
    display->render(pDraw);
  }
}
