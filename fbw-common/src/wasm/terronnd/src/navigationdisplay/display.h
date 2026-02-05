#pragma once

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunused-function"
#pragma clang diagnostic ignored "-Wunused-parameter"
#pragma clang diagnostic ignored "-Wsign-conversion"
#include <MSFS/Legacy/gauges.h>
#include <MSFS/Render/nanovg.h>
#include <MSFS/Render/stb_image.h>
#pragma clang diagnostic pop
#include <cstdint>
#include <iostream>
#include <string_view>
#include <vector>

#define FMT_HEADER_ONLY
#include <fmt/format.h>

#include "../simconnect/clientdataarea.hpp"
#include "../simconnect/connection.hpp"
#include "../simconnect/lvarobject.hpp"
#include "../simconnect/simobject.hpp"
#include "../types/arinc429.hpp"
#include "../types/quantity.hpp"
#include "../types/simbridge.h"
#include "configuration.h"

namespace navigationdisplay {

/**
 * @brief Defines the different display sides
 */
enum DisplaySide { Left = 'L', Right = 'R' };

/**
 * @brief The base class for a display
 */
class DisplayBase {
 public:
  struct NdConfiguration {
    types::Length range;
    std::uint8_t  mode;
    bool          terrOnNd;
    bool          terrOnVd;
    float         potentiometer;
    bool          powered;
  };

  DisplayBase(const DisplayBase&) = delete;
  virtual ~DisplayBase() { this->destroy(); }

  DisplayBase& operator=(const DisplayBase&) = delete;

  virtual void update(const NdConfiguration& config) = 0;

  DisplaySide side() const;
  void        destroy();
  void        render(sGaugeDrawData* pDrawData);

 protected:
  DisplaySide                                                                                       _side;
  NdConfiguration                                                                                   _configuration;
  std::size_t                                                                                       _frameBufferSize;
  int                                                                                               _nanovgImage;
  NVGcontext*                                                                                       _context;
  std::shared_ptr<simconnect::ClientDataArea<types::ThresholdData>>                                 _thresholds;
  std::shared_ptr<simconnect::ClientDataAreaBuffered<std::uint8_t, SIMCONNECT_CLIENTDATA_MAX_SIZE>> _frameData;

  DisplayBase(DisplaySide side, FsContext context);

  void destroyImage();
};

/**
 * @brief Template class with functionality to manage the terrain on ND data
 * @tparam NdMinElevation Aircraft variable name to define the minimum elevation
 * @tparam NdMinElevationMode Aircraft variable name to define the minimum elevation mode
 * @tparam NdMaxElevation Aircraft variable name to define the maximum elevation
 * @tparam NdMaxElevationMode Aircraft variable name to define the maximum elevation mode
 */
template <std::string_view const& NdMinElevation,
          std::string_view const& NdMinElevationMode,
          std::string_view const& NdMaxElevation,
          std::string_view const& NdMaxElevationMode>
class Display : public DisplayBase {
 private:
  std::shared_ptr<simconnect::LVarObject<NdMinElevation, NdMinElevationMode, NdMaxElevation, NdMaxElevationMode>> _ndThresholdData;
  bool                                                                                                            _ignoreNextFrame;

  void resetNavigationDisplayData() {
    this->_ndThresholdData->template value<NdMinElevation>()     = -1;
    this->_ndThresholdData->template value<NdMinElevationMode>() = 0;
    this->_ndThresholdData->template value<NdMaxElevation>()     = -1;
    this->_ndThresholdData->template value<NdMaxElevationMode>() = 0;
    this->_ndThresholdData->writeValues();
  }

 public:
  /**
   * @brief Construct a new Display object
   *
   * Communcation concept to the SimBridge:
   *  - The threshold data block from the SimBridge contains the number of bytes for a frame
   *  - The framedata is sent afterwards in chunks of SIMCONNECT_CLIENTDATA_MAX_SIZE bytes per chunk, until the frame is transmitted
   *
   * @param connection The connection to SimCommect
   * @param side The display side
   * @param context The gauge context
   */
  Display(simconnect::Connection& connection, DisplaySide side, FsContext context) : DisplayBase(side, context), _ndThresholdData(nullptr) {
    this->_ndThresholdData = connection.lvarObject<NdMinElevation, NdMinElevationMode, NdMaxElevation, NdMaxElevationMode>();

    // write initial values to avoid invalid drawings
    this->resetNavigationDisplayData();

    this->_frameData = connection.clientDataArea<std::uint8_t, SIMCONNECT_CLIENTDATA_MAX_SIZE>();
    this->_frameData->defineArea(side == DisplaySide::Left ? FrameDataLeftName : FrameDataRightName);
    this->_frameData->requestArea(SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET);
    this->_frameData->setOnChangeCallback([=]() {
      if (!this->_ignoreNextFrame && (this->_configuration.terrOnNd || this->_configuration.terrOnVd)) {
        if (this->_nanovgImage == 0) {
          // If we don't have an image yet, create one
          this->_nanovgImage =
              nvgCreateImageMem(this->_context, 0, this->_frameData->data().data(), static_cast<int>(this->_frameBufferSize));
          if (this->_nanovgImage == 0) {
            std::cerr << fmt::format("TERR ON ND: Unable to create the image from the stream. Reason: {}", stbi_failure_reason());
          }

          return;
        }

        // Otherwise, decode the PNG manually and update the existing image
        int      decodedWidth, decodedHeight;
        uint8_t* decodedImage = stbi_load_from_memory(this->_frameData->data().data(), static_cast<int>(this->_frameBufferSize),
                                                      &decodedWidth, &decodedHeight, nullptr, 4);
        if (decodedImage == nullptr) {
          std::cerr << fmt::format("TERR ON ND: Unable to create the image from the stream. Reason: {}", stbi_failure_reason());
          return;
        }

        int width, height;
        nvgImageSize(this->_context, this->_nanovgImage, &width, &height);

        if (decodedWidth != width || decodedHeight != height) {
          // This should never happen, but bail just in case
          std::cerr << fmt::format("TERR ON ND: The image size does not match the expected size. Expected: {}x{}, actual: {}x{}", width,
                                   height, decodedWidth, decodedHeight);
          stbi_image_free(decodedImage);
          return;
        }

        nvgUpdateImage(this->_context, this->_nanovgImage, decodedImage);

        stbi_image_free(decodedImage);
      } else {
        this->resetNavigationDisplayData();
      }
    });

    this->_thresholds = connection.clientDataArea<types::ThresholdData>();
    this->_thresholds->defineArea(side == DisplaySide::Left ? ThresholdsLeftName : ThresholdsRightName);
    this->_thresholds->requestArea(SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET);
    this->_thresholds->setAlwaysChanges(true);
    this->_thresholds->setOnChangeCallback([=]() {
      this->_frameBufferSize = this->_thresholds->data().frameByteCount;
      this->_frameData->reserve(this->_frameBufferSize);
      this->_ignoreNextFrame =
          this->_ignoreNextFrame &&
          (this->_thresholds->data().firstFrame == 0 || this->_configuration.mode != this->_thresholds->data().displayMode ||
           this->_configuration.range != (this->_thresholds->data().displayRange * types::nauticmile));

      if (!this->_ignoreNextFrame) {
        this->_ndThresholdData->template value<NdMinElevation>()     = this->_thresholds->data().lowerThreshold;
        this->_ndThresholdData->template value<NdMinElevationMode>() = this->_thresholds->data().lowerThresholdMode;
        this->_ndThresholdData->template value<NdMaxElevation>()     = this->_thresholds->data().upperThreshold;
        this->_ndThresholdData->template value<NdMaxElevationMode>() = this->_thresholds->data().upperThresholdMode;
        this->_ndThresholdData->writeValues();
      }
    });
  }
  Display(const Display&) = delete;
  virtual ~Display() {}

  Display& operator=(const Display&) = delete;

  /**
   * @brief Updates the configuration of the display and maybe resets the ND image
   * @param config The new ND configuration instance
   */
  void update(const DisplayBase::NdConfiguration& config) override {
    const bool resetMapData = this->_configuration.mode != config.mode || config.range != this->_configuration.range ||
                              this->_configuration.terrOnNd != config.terrOnNd || this->_configuration.terrOnVd != config.terrOnVd;
    const bool validEfisMode = config.mode == NavigationDisplayArcModeId || config.mode == NavigationDisplayRoseLsModeId ||
                               config.mode == NavigationDisplayRoseNavModeId || config.mode == NavigationDisplayRoseVorModeId;

    this->_configuration = config;
    this->_configuration.terrOnNd &= validEfisMode;

    if (!(this->_configuration.terrOnNd || this->_configuration.terrOnVd) || !validEfisMode || resetMapData) {
      this->resetNavigationDisplayData();
      this->destroyImage();
      this->_ignoreNextFrame = true;
    }
  }
};

/**
 * @brief Specialization of the display for the left side
 */
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

/**
 * @brief Specialization of the display for the right side
 */
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
