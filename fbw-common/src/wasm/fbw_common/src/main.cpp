#include <MSFS/Legacy/gauges.h>
#include <MSFS/MSFS.h>
#include <MSFS/Render/nanovg.h>
#include <MSFS/Render/stb_image.h>

#include <chrono>
#include <iostream>
#include <map>

#include "interface/SimConnectInterface.h"
#include "main.h"

std::vector<std::uint8_t> imageBuffer;
SimConnectInterface simconnect;
std::map<FsContext, NVGcontext*> renderContext;
int decodedImage = 0;

__attribute__((export_name("terronnd_gauge_callback"))) extern "C" bool terronnd_gauge_callback(FsContext ctx,
                                                                                                int service_id,
                                                                                                void* pData) {
  // print event type
  switch (service_id) {
    case PANEL_SERVICE_PRE_INSTALL: {
      // connect to sim connect
      return simconnect.connect(static_cast<sGaugeInstallData*>(pData)->strParameters);
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
        decodedImage =
            nvgCreateImageMem(renderContext[ctx], 0, (std::uint8_t*)simconnect.frameData().data(), simconnect.metadata().frameByteCount);
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
        nvgFillColor(context, nvgRGB(4, 4, 5));
        nvgBeginPath(context);
        nvgRect(context, 0.0f, 0.0f, static_cast<float>(pDrawData->winWidth), static_cast<float>(pDrawData->winHeight));
        nvgFill(context);
        if (decodedImage != 0) {
          // draw the image
          NVGpaint imagePaint = nvgImagePattern(context, 0.0f, 0.0f, simconnect.metadata().imageWidth, simconnect.metadata().imageHeight,
                                                0.0, decodedImage, 1.0);
          nvgBeginPath(context);
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
