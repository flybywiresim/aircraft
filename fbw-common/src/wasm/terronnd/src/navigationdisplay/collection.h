#pragma once

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunused-function"
#include <MSFS/MSFS_Core.h>
#pragma clang diagnostic pop
#include <map>
#include <memory>

#include "../simconnect/connection.hpp"
#include "../types/quantity.hpp"
#include "configuration.h"
#include "display.h"

namespace navigationdisplay {

/**
 * @brief A collection of all available ND displays to manage terrain on ND visualizations
 */
class Collection {
 private:
  struct EgpwcData {
    types::Arinc429Word<types::Angle> destinationLatitude;
    types::Arinc429Word<types::Angle> destinationLongitude;
    types::Arinc429Word<types::Angle> presentLatitude;
    types::Arinc429Word<types::Angle> presentLongitude;
    types::Arinc429Word<types::Length> altitude;
    types::Arinc429Word<types::Angle> heading;
    types::Arinc429Word<types::Velocity> verticalSpeed;
    bool gearIsDown;
    std::uint8_t terrOnNdRenderingMode;
  };

  struct GroundTruthPosition {
    types::Angle latitude;
    types::Angle longitude;
  };

  std::map<FsContext, std::shared_ptr<DisplayBase>> _displays;
  GroundTruthPosition _groundTruth;
  EgpwcData _egpwcData;
  DisplayBase::NdConfiguration _configurationLeft;
  DisplayBase::NdConfiguration _configurationRight;
  std::chrono::system_clock::time_point _lastAircraftStatusTransmission;
  bool _sendAircraftStatus;
  bool _reconfigureDisplayLeft;
  bool _reconfigureDisplayRight;

  // inputs
  std::shared_ptr<simconnect::SimObject<types::SimulatorData>> _simulatorData;
  std::shared_ptr<simconnect::LVarObject<EgpwcDestinationLat,
                                         EgpwcDestinationLong,
                                         EgpwcPresentLat,
                                         EgpwcPresentLong,
                                         EgpwcTerrOnNdRenderingMode,
                                         EgpwcAltitude,
                                         EgpwcHeading,
                                         EgpwcVerticalSpeed,
                                         EgpwcGearIsDown>>
      _aircraftStatus;
  std::shared_ptr<simconnect::LVarObject<EgpwcNdLeftRange,
                                         EfisNdLeftMode,
                                         EgpwcTerrOnNdLeftActive,
                                         EgpwcNdRightRange,
                                         EfisNdRightMode,
                                         EgpwcTerrOnNdRightActive,
                                         AcEssBus,
                                         Ac2Bus>>
      _ndConfiguration;

  // outputs
  std::shared_ptr<simconnect::ClientDataArea<types::AircraftStatusData>> _simconnectAircraftStatus;

 public:
  /**
   * @brief Construct a new Collection object and initializes the communication objects
   * @param connection The connection to SimConnect
   */
  Collection(simconnect::Connection& connection);
  Collection(const Collection&) = delete;
  ~Collection();

  Collection& operator=(const Collection&) = delete;

  /**
   * @brief Registers a new display for a specific side with a context per gauge
   * @param side The navigation display side
   * @param context The gauge context
   * @param connection The SimConnect connection
   */
  void registerDisplay(DisplaySide side, FsContext context, simconnect::Connection& connection);
  /**
   * @brief Destroys all displays and temporary instances
   */
  void destroy();

  /**
   * @brief Updates a specific display if needed
   * The Collection callbacks indicate if the displays need to be updated.
   * In this function are also the information for the SimBridge prepared and sent to it
   * @param context The gauge context
   */
  void updateDisplay(FsContext context);
  /**
   * @brief Renders the terrain on ND or background image for a specific display
   * @param pDraw The pointer to the gauge draw data object
   * @param context The context of the gauge
   */
  void renderDisplay(sGaugeDrawData* pDraw, FsContext context);
};

}  // namespace navigationdisplay
