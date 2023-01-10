#pragma once

enum TerrainRenderingMode {
  ArcMode = 0,
  VerticalMode = 1,
};

#ifdef BUILD_SIDE_CAPT
static const std::string ConnectionName = "FBW_SIMBRIDGE_TERRONND_LEFT";
static const std::string MetadataName = "FBW_SIMBRIDGE_TERRONND_METADATA_LEFT";
static const std::string FrameDataName = "FBW_SIMBRIDGE_TERRONND_FRAME_DATA_LEFT";
static const std::string LightPotentiometerName = "LIGHT POTENTIOMETER:94";
static constexpr bool SendSimulatorData = true;
#elif BUILD_SIDE_FO
static const std::string ConnectionName = "FBW_SIMBRIDGE_TERRONND_RIGHT";
static const std::string MetadataName = "FBW_SIMBRIDGE_TERRONND_METADATA_RIGHT";
static const std::string FrameDataName = "FBW_SIMBRIDGE_TERRONND_FRAME_DATA_RIGHT";
static const std::string LightPotentiometerName = "LIGHT POTENTIOMETER:95";
static constexpr bool SendSimulatorData = false;
#else
static const std::string ConnectionName = "";
static const std::string MetadataName = "";
static const std::string FrameDataName = "";
static const std::string LightPotentiometerName = "";
static constexpr bool SendSimulatorData = false;
#error "Unknown side to compile"
#endif

#ifdef BUILD_A32NX
static constexpr TerrainRenderingMode RenderingMode = TerrainRenderingMode::ArcMode;
static constexpr std::uint8_t NavigationDisplayArcModeId = 3;

// macro to create the full SimVar name
#define FBW_LVAR_NAME(NAME) "A32NX_" NAME

#elif BUILD_A380X
static constexpr TerrainRenderingMode RenderingMode = TerrainRenderingMode::VerticalMode;
static constexpr std::uint8_t NavigationDisplayArcModeId = 3;

// TODO change prefix as soon as we switched
// macro to create the full SimVar name
#define FBW_LVAR_NAME(NAME) "A32NX_" NAME

#else
static constexpr TerrainRenderingMode RenderingMode = TerrainRenderingMode::ArcMode;
static constexpr std::uint8_t NavigationDisplayArcModeId = 3;
#define FBW_LVAR_NAME(NAME) ""
#error "Unknown aircraft build type"
#endif
