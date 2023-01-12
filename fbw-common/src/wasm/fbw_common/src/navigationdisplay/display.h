#pragma once

#include <MSFS/Legacy/gauges.h>
#include <MSFS/Render/nanovg.h>
#include <cstdint>
#include <string_view>
#include <vector>

#include <iostream>

#include "../simconnect/clientdataarea.hpp"
#include "../simconnect/connection.hpp"
#include "../simconnect/lvarobject.hpp"
#include "../simconnect/simobject.hpp"
#include "../types/arinc429.hpp"
#include "../types/quantity.hpp"
#include "../types/simbridge.h"
#include "configuration.h"

namespace navigationdisplay {

enum DisplaySide { Left = 'L', Right = 'R' };

class DisplayBase {
 public:
  struct NdConfiguration {
    types::Length range;
    std::uint8_t mode;
    bool terrainActive;
    float potentiometer;
  };

  DisplayBase(const DisplayBase&) = delete;
  virtual ~DisplayBase() { this->destroy(); }

  DisplayBase& operator=(const DisplayBase&) = delete;

  virtual void update(const NdConfiguration& config) = 0;

  DisplaySide side() const;
  void destroy();
  void render(sGaugeDrawData* pDrawData);

 protected:
  DisplaySide _side;
  NdConfiguration _configuration;
  std::vector<std::uint8_t> _frameBuffer;
  std::size_t _frameBufferSize;
  std::size_t _receivedFrameData;
  int _nanovgImage;
  NVGcontext* _context;
  std::shared_ptr<simconnect::ClientDataArea<types::ThresholdData>> _thresholds;
  std::shared_ptr<simconnect::ClientDataArea<types::FrameData>> _frameData;

  DisplayBase(DisplaySide side, FsContext context);

  void destroyImage();
};

template <std::string_view const& NdMinElevation,
          std::string_view const& NdMinElevationMode,
          std::string_view const& NdMaxElevation,
          std::string_view const& NdMaxElevationMode>
class Display : public DisplayBase {
 private:
  std::shared_ptr<simconnect::LVarObject<NdMinElevation, NdMinElevationMode, NdMaxElevation, NdMaxElevationMode>> _ndThresholdData;

  void resetNavigationDisplayData() {
    this->_ndThresholdData->template value<NdMinElevation>() = -1;
    this->_ndThresholdData->template value<NdMinElevationMode>() = 0;
    this->_ndThresholdData->template value<NdMaxElevation>() = -1;
    this->_ndThresholdData->template value<NdMaxElevationMode>() = 0;
    this->_ndThresholdData->writeValues();
  }

 public:
  Display(simconnect::Connection& connection, DisplaySide side, FsContext context) : DisplayBase(side, context), _ndThresholdData(nullptr) {
    this->_ndThresholdData = connection.lvarObject<NdMinElevation, NdMinElevationMode, NdMaxElevation, NdMaxElevationMode>();

    // write initial values to avoid invalid drawings
    this->resetNavigationDisplayData();

    this->_thresholds = connection.clientDataArea<types::ThresholdData>();
    this->_thresholds->defineArea(side == DisplaySide::Left ? ThresholdsLeftName : ThresholdsRightName);
    this->_thresholds->requestArea(SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET);
    this->_thresholds->setAlwaysChanges(true);
    this->_thresholds->setOnChangeCallback([=]() {
      this->_frameBufferSize = this->_thresholds->data().frameByteCount;
      this->_frameBuffer.reserve(this->_frameBufferSize);
      this->_receivedFrameData = 0;

      this->_ndThresholdData->template value<NdMinElevation>() = this->_thresholds->data().lowerThreshold;
      this->_ndThresholdData->template value<NdMinElevationMode>() = this->_thresholds->data().lowerThresholdMode;
      this->_ndThresholdData->template value<NdMaxElevation>() = this->_thresholds->data().upperThreshold;
      this->_ndThresholdData->template value<NdMaxElevationMode>() = this->_thresholds->data().upperThresholdMode;
      this->_ndThresholdData->writeValues();
    });

    this->_frameData = connection.clientDataArea<types::FrameData>();
    this->_frameData->defineArea(side == DisplaySide::Left ? FrameDataLeftName : FrameDataRightName);
    this->_frameData->requestArea(SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET);
    this->_frameData->setAlwaysChanges(true);
    this->_frameData->setOnChangeCallback([=]() {
      std::size_t copySize = this->_frameBufferSize - this->_receivedFrameData;
      if (copySize > SIMCONNECT_CLIENTDATA_MAX_SIZE) {
        copySize = SIMCONNECT_CLIENTDATA_MAX_SIZE;
      }

      if (this->_frameBuffer.capacity() >= this->_receivedFrameData + copySize) {
        std::memcpy(&(this->_frameBuffer.data()[this->_receivedFrameData]), &this->_frameData->data().data, copySize);
        this->_receivedFrameData += copySize;
      }

      if (this->_receivedFrameData >= this->_frameBufferSize && this->_context != nullptr) {
        this->destroyImage();
        this->_nanovgImage = nvgCreateImageMem(this->_context, 0, this->_frameBuffer.data(), this->_frameBufferSize);
        if (this->_nanovgImage == 0) {
          std::cerr << "TERR ON ND: Unable to decode the image from the stream" << std::endl;
        }
      }
    });
  }
  Display(const Display&) = delete;
  virtual ~Display() {}

  Display& operator=(const Display&) = delete;

  void update(const DisplayBase::NdConfiguration& config) override {
    bool oldArcMode = this->_configuration.mode == NavigationDisplayArcModeId;
    bool oldRoseMode = this->_configuration.mode == NavigationDisplayRoseLsModeId ||
                       this->_configuration.mode == NavigationDisplayRoseVorModeId ||
                       this->_configuration.mode == NavigationDisplayRoseNavModeId;
    bool newArcMode = config.mode == NavigationDisplayArcModeId;
    bool newRoseMode = config.mode == NavigationDisplayRoseLsModeId || config.mode == NavigationDisplayRoseVorModeId ||
                       config.mode == NavigationDisplayRoseNavModeId;

    this->_configuration = config;

    if (!config.terrainActive || oldArcMode != newArcMode || oldRoseMode != newRoseMode || !newRoseMode && !newArcMode) {
      this->resetNavigationDisplayData();
      this->destroyImage();
    }
  }
};

class DisplayLeft : public Display<NdLeftMinElevation, NdLeftMinElevationMode, NdLeftMaxElevation, NdLeftMaxElevationMode> {
 public:
  DisplayLeft(simconnect::Connection& connection, FsContext context)
      : Display<NdLeftMinElevation, NdLeftMinElevationMode, NdLeftMaxElevation, NdLeftMaxElevationMode>(connection,
                                                                                                        DisplaySide::Left,
                                                                                                        context) {}
  DisplayLeft(const DisplayLeft&) = delete;
  virtual ~DisplayLeft() {}

  DisplayLeft& operator=(const DisplayLeft&) = delete;
};

class DisplayRight : public Display<NdRightMinElevation, NdRightMinElevationMode, NdRightMaxElevation, NdRightMaxElevationMode> {
 public:
  DisplayRight(simconnect::Connection& connection, FsContext context)
      : Display<NdRightMinElevation, NdRightMinElevationMode, NdRightMaxElevation, NdRightMaxElevationMode>(connection,
                                                                                                            DisplaySide::Right,
                                                                                                            context) {}
  DisplayRight(const DisplayRight&) = delete;
  virtual ~DisplayRight() {}

  DisplayRight& operator=(const DisplayRight&) = delete;
};

}  // namespace navigationdisplay
