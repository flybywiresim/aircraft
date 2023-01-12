#include "display.h"

using namespace navigationdisplay;

DisplayBase::DisplayBase(DisplaySide side, FsContext context, std::uint32_t pixelWidth, std::uint32_t pixelHeight)
    : _side(side),
      _configuration(),
      _frameBuffer(),
      _frameBufferSize(0),
      _receivedFrameData(0),
      _nanovgImage(0),
      _context(),
      _thresholds(nullptr),
      _frameData(nullptr) {
  NVGparams params;
  params.userPtr = context;
  params.edgeAntiAlias = false;
  this->_context = nvgCreateInternal(&params);
}

DisplaySide DisplayBase::side() const {
  return this->_side;
}

void DisplayBase::destroy() {
  this->destroyImage();
  nvgDeleteInternal(this->_context);
}

void DisplayBase::destroyImage() {
  if (this->_nanovgImage != 0) {
    nvgDeleteImage(this->_context, this->_nanovgImage);
    this->_nanovgImage = 0;
  }
}

void DisplayBase::render(sGaugeDrawData* pDrawData, FsContext context) {
  const float ratio = pDrawData->fbWidth / pDrawData->fbHeight;
  nvgBeginFrame(this->_context, pDrawData->winWidth, pDrawData->winHeight, ratio);
  {
    // fill the background
    if (this->_nanovgImage == 0 || helper::Math::almostEqual(this->_configuration.potentiometer, 0.0f)) {
      nvgFillColor(this->_context, nvgRGBA(4, 4, 5, 255));
      nvgBeginPath(this->_context);
      nvgRect(this->_context, 0.0f, 0.0f, static_cast<float>(pDrawData->winWidth), static_cast<float>(pDrawData->winHeight));
      nvgFill(this->_context);
    } else {
      // draw the image
      nvgBeginPath(this->_context);
      NVGpaint imagePaint = nvgImagePattern(this->_context, 0.0f, 0.0f, pDrawData->winWidth, pDrawData->winHeight, 0.0, this->_nanovgImage,
                                            this->_configuration.potentiometer);
      nvgRect(this->_context, 0.0f, 0.0f, pDrawData->winWidth, pDrawData->winHeight);
      nvgFillPaint(this->_context, imagePaint);
      nvgFill(this->_context);
    }
  }
  nvgEndFrame(this->_context);
}
