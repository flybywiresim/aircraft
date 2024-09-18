#include "display.h"

#ifdef A380X
#define INSTRUMENT_BG_COLOR nvgRGBA(0, 0, 0, 255)
#endif

#ifndef A380X
#define INSTRUMENT_BG_COLOR nvgRGBA(4, 4, 4, 255)
#endif

using namespace navigationdisplay;

DisplayBase::DisplayBase(DisplaySide side, FsContext context)
    : _side(side), _configuration(), _frameBufferSize(0), _nanovgImage(0), _context(nullptr), _thresholds(nullptr), _frameData(nullptr) {
  NVGparams params;
  params.userPtr       = context;
  params.edgeAntiAlias = false;
  this->_context       = nvgCreateInternal(&params);
}

DisplaySide DisplayBase::side() const {
  return this->_side;
}

void DisplayBase::destroy() {
  this->destroyImage();
  nvgDeleteInternal(this->_context);
  this->_context = nullptr;
}

void DisplayBase::destroyImage() {
  if (this->_nanovgImage != 0) {
    nvgDeleteImage(this->_context, this->_nanovgImage);
    this->_nanovgImage = 0;
  }
}

void DisplayBase::render(sGaugeDrawData* pDrawData) {
  if (this->_context == nullptr) {
    return;
  }

  const float ratio = static_cast<float>(pDrawData->fbWidth) / static_cast<float>(pDrawData->fbHeight);
  nvgBeginFrame(this->_context, static_cast<float>(pDrawData->winWidth), static_cast<float>(pDrawData->winHeight), ratio);
  {
    if (this->_configuration.powered) {
      if ((this->_nanovgImage == 0 || helper::Math::almostEqual(this->_configuration.potentiometer, 0.0f))) {
        nvgFillColor(this->_context, INSTRUMENT_BG_COLOR);
        nvgBeginPath(this->_context);
        nvgRect(this->_context, 0.0f, 0.0f, static_cast<float>(pDrawData->winWidth), static_cast<float>(pDrawData->winHeight));
        nvgFill(this->_context);
      } else {
        // draw the image
        nvgBeginPath(this->_context);
        NVGpaint imagePaint =
            nvgImagePattern(this->_context, 0.0f, 0.0f, static_cast<float>(pDrawData->winWidth), static_cast<float>(pDrawData->winHeight),
                            0.0, this->_nanovgImage, this->_configuration.potentiometer);
        nvgRect(this->_context, 0.0f, 0.0f, static_cast<float>(pDrawData->winWidth), static_cast<float>(pDrawData->winHeight));
        nvgFillPaint(this->_context, imagePaint);
        nvgFill(this->_context);
      }
    } else {
      nvgFillColor(this->_context, nvgRGBA(0, 0, 0, 255));
      nvgBeginPath(this->_context);
      nvgRect(this->_context, 0.0f, 0.0f, static_cast<float>(pDrawData->winWidth), static_cast<float>(pDrawData->winHeight));
      nvgFill(this->_context);
    }
  }
  nvgEndFrame(this->_context);
}
