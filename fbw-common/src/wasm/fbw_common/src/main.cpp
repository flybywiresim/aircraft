#include <MSFS/Legacy/gauges.h>
#include <MSFS/MSFS.h>
#include <MSFS/Render/nanovg.h>
#include <MSFS/Render/stb_image.h>

#include <chrono>
#include <iostream>
#include <map>

#include "config.h"
#include "interface/SimConnectInterface.h"
#include "main.h"

std::vector<std::uint8_t> imageBuffer;
SimConnectInterface simconnect;
std::map<FsContext, NVGcontext*> renderContext;
int decodedImage = 0;

#if BUILD_SIDE_CAPT
__attribute__((export_name("terronnd_left_gauge_callback")))
#elif BUILD_SIDE_FO
__attribute__((export_name("terronnd_right_gauge_callback")))
#endif
extern "C" bool
terronnd_gauge_callback(FsContext ctx, int service_id, void* pData) {
  // print event type
  switch (service_id) {
    case PANEL_SERVICE_PRE_INSTALL: {
      // connect to sim connect
      return simconnect.connect();
    };
    case PANEL_SERVICE_POST_INSTALL: {
      NVGparams params;
      params.userPtr = ctx;
      params.edgeAntiAlias = false;
      renderContext[ctx] = nvgCreateInternal(&params);
      break;
    }
    case PANEL_SERVICE_PRE_DRAW: {
      const bool retval = simconnect.update();

      if (simconnect.receivedFrameData()) {
        if (decodedImage != 0) {
          nvgDeleteImage(renderContext[ctx], decodedImage);
          decodedImage = 0;
        }

        // decode the frame
        if (decodedImage == 0) {
          decodedImage = nvgCreateImageRGBA(renderContext[ctx], simconnect.metadata().imageWidth, simconnect.metadata().imageHeight, 0,
                                            (std::uint8_t*)simconnect.frameData().data());
        } else {
          nvgUpdateImage(renderContext[ctx], decodedImage, (std::uint8_t*)simconnect.frameData().data());
        }
        if (decodedImage == 0) {
          std::cout << "TERR ON ND: Failed to load image: " << stbi_failure_reason() << std::endl;
        }
        simconnect.processedFrame();
      }

      sGaugeDrawData* pDrawData = (sGaugeDrawData*)pData;
      NVGcontext* context = renderContext[ctx];

      const float ratio = pDrawData->fbWidth / pDrawData->fbHeight;
      nvgBeginFrame(context, pDrawData->winWidth, pDrawData->winHeight, ratio);
      {
        // fill the background
        if (decodedImage == 0) {
          nvgFillColor(context, nvgRGBA(4, 4, 5, 255));
          nvgBeginPath(context);
          nvgRect(context, 0.0f, 0.0f, static_cast<float>(pDrawData->winWidth), static_cast<float>(pDrawData->winHeight));
          nvgFill(context);
        } else {
          // draw the image
          nvgBeginPath(context);
          NVGpaint imagePaint = nvgImagePattern(context, 0.0f, 0.0f, simconnect.metadata().imageWidth, simconnect.metadata().imageHeight,
                                                0.0, decodedImage, 1.0);
          nvgRect(context, 0.0f, 0.0f, simconnect.metadata().imageWidth, simconnect.metadata().imageHeight);
          nvgFillPaint(context, imagePaint);
          nvgFill(context);
        }
      }
      nvgEndFrame(context);

      return retval;
    };

    case PANEL_SERVICE_PRE_KILL: {
      // disconnect sim connect
      simconnect.disconnect();
      if (decodedImage != 0) {
        nvgDeleteImage(renderContext[ctx], decodedImage);
      }
      nvgDeleteInternal(renderContext[ctx]);
      renderContext.erase(ctx);
      break;
    }
  }

  // success
  return true;
}
