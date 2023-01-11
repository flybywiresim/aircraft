#pragma once

#include <string_view>

namespace navigationdisplay {

static const std::string ThresholdsLeftName = "FBW_SIMBRIDGE_TERRONND_THRESHOLDS_LEFT";
static const std::string ThresholdsRightName = "FBW_SIMBRIDGE_TERRONND_THRESHOLDS_RIGHT";
static const std::string FrameDataLeftName = "FBW_SIMBRIDGE_TERRONND_FRAME_DATA_LEFT";
static const std::string FrameDataRightName = "FBW_SIMBRIDGE_TERRONND_FRAME_DATA_RIGHT";
static constexpr std::string_view EgpwcTerrOnNdRightActive = "EGPWC_ND_R_TERRAIN_ACTIVE";
static constexpr std::string_view NdLeftMinElevation = "EGPWC_ND_L_TERRAIN_MIN_ELEVATION";
static constexpr std::string_view NdLeftMinElevationMode = "EGPWC_ND_L_TERRAIN_MIN_ELEVATION_MODE";
static constexpr std::string_view NdLeftMaxElevation = "EGPWC_ND_L_TERRAIN_MAX_ELEVATION";
static constexpr std::string_view NdLeftMaxElevationMode = "EGPWC_ND_L_TERRAIN_MAX_ELEVATION_MODE";
static constexpr std::string_view NdRightMinElevation = "EGPWC_ND_R_TERRAIN_MIN_ELEVATION";
static constexpr std::string_view NdRightMinElevationMode = "EGPWC_ND_R_TERRAIN_MIN_ELEVATION_MODE";
static constexpr std::string_view NdRightMaxElevation = "EGPWC_ND_R_TERRAIN_MAX_ELEVATION";
static constexpr std::string_view NdRightMaxElevationMode = "EGPWC_ND_R_TERRAIN_MAX_ELEVATION_MODE";
static constexpr std::string_view EgpwcDestinationLat = "EGPWC_DEST_LAT";
static constexpr std::string_view EgpwcDestinationLong = "EGPWC_DEST_LONG";
static constexpr std::string_view EgpwcPresentLat = "EGPWC_PRESENT_LAT";
static constexpr std::string_view EgpwcPresentLong = "EGPWC_PRESENT_LONG";
static constexpr std::string_view Adirs1Altitude = "ADIRS_ADR_1_ALTITUDE";
static constexpr std::string_view Adirs1TrueHeading = "ADIRS_IR_1_TRUE_HEADING";
static constexpr std::string_view Adirs1VerticalSpeed = "ADIRS_IR_1_VERTICAL_SPEED";
static constexpr std::string_view EgpwcGearIsDown = "EGPWC_GEAR_IS_DOWN";
static constexpr std::string_view EgpwcNdLeftRange = "EGPWC_ND_L_RANGE";
static constexpr std::string_view EfisNdLeftMode = "EFIS_L_ND_MODE";
static constexpr std::string_view EgpwcTerrOnNdLeftActive = "EGPWC_ND_L_TERRAIN_ACTIVE";
static constexpr std::string_view EgpwcNdRightRange = "EGPWC_ND_R_RANGE";
static constexpr std::string_view EfisNdRightMode = "EFIS_R_ND_MODE";
static const std::string LightPotentiometerLeftName = "LIGHT POTENTIOMETER:94";
static const std::string LightPotentiometerRightName = "LIGHT POTENTIOMETER:95";

static constexpr std::uint8_t NavigationDisplayArcModeId = 3;

}  // namespace navigationdisplay
