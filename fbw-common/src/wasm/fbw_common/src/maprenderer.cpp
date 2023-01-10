#include <iostream>

#include <MSFS/Render/stb_image.h>

#include "maprenderer.h"

void MapRenderer::initialize(const FsContext& context) {
  NVGparams params;
  params.userPtr = context;
  params.edgeAntiAlias = false;
  this->_renderContext[context] = nvgCreateInternal(&params);
}

void MapRenderer::destroyImage(const FsContext& context) {
  if (this->_decodedImage != 0) {
    nvgDeleteImage(this->_renderContext[context], this->_decodedImage);
    this->_decodedImage = 0;
  }
}

void MapRenderer::update(const FsContext& context, std::uint8_t currentMode, bool active) {
  if (active && currentMode == this->_currentMode) {
    return;
  }

  this->_currentMode = currentMode;
  this->destroyImage(context);
}

void MapRenderer::newMap(const FsContext& context, const std::vector<std::uint8_t>& frame, const std::size_t realSize) {
  this->destroyImage(context);
  this->_decodedImage = nvgCreateImageMem(this->_renderContext[context], 0, (std::uint8_t*)frame.data(), realSize);
  if (this->_decodedImage == 0) {
    std::cout << "TERR ON ND: Failed to load image: " << stbi_failure_reason() << std::endl;
  }
}

void MapRenderer::render(sGaugeDrawData* pDrawData, const FsContext& context) {
  NVGcontext* nvgContext = this->_renderContext[context];

  const float ratio = pDrawData->fbWidth / pDrawData->fbHeight;
  nvgBeginFrame(nvgContext, pDrawData->winWidth, pDrawData->winHeight, ratio);
  {
    // fill the background
    if (this->_decodedImage == 0) {
      nvgFillColor(nvgContext, nvgRGBA(4, 4, 5, 255));
      nvgBeginPath(nvgContext);
      nvgRect(nvgContext, 0.0f, 0.0f, static_cast<float>(pDrawData->winWidth), static_cast<float>(pDrawData->winHeight));
      nvgFill(nvgContext);
    } else {
      // draw the image
      nvgBeginPath(nvgContext);
      NVGpaint imagePaint =
          nvgImagePattern(nvgContext, 0.0f, 0.0f, pDrawData->winWidth, pDrawData->winHeight, 0.0, this->_decodedImage, 1.0);
      nvgRect(nvgContext, 0.0f, 0.0f, pDrawData->winWidth, pDrawData->winHeight);
      nvgFillPaint(nvgContext, imagePaint);
      nvgFill(nvgContext);
    }
  }
  nvgEndFrame(nvgContext);
}

void MapRenderer::destroy(const FsContext& context) {
  this->destroyImage(context);
  nvgDeleteInternal(this->_renderContext[context]);
  this->_renderContext.erase(context);
}
