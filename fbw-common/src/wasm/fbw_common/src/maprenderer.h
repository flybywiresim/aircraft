#pragma once

#include <cstdint>
#include <map>
#include <vector>

#include <MSFS/Legacy/gauges.h>
#include <MSFS/Render/nanovg.h>

class MapRenderer {
 private:
  std::map<FsContext, NVGcontext*> _renderContext;
  std::uint8_t _currentMode = 0;
  int _decodedImage = 0;

  void destroyImage(const FsContext& context);

 public:
  void initialize(const FsContext& context);
  void update(const FsContext& context, std::uint8_t currentMode, bool active);
  void newMap(const FsContext& context, const std::vector<std::uint8_t>& frame, const std::size_t realSize);
  void render(sGaugeDrawData* pDrawData, const FsContext& context);
  void destroy(const FsContext& context);
};
