#pragma once

#include <cstdint>
#include <string>

namespace simconnect {

/**
 * @brief Defines all supported SimConnect types
 */
enum class DataTypes { None, Int32, UInt32, Float32, Float64, String8, String64, CharArray };

/**
 * @brief Defines the structure to translate DataTypes-value to types and default values
 *
 * @tparam D The data type instance
 */
template <DataTypes D>
struct DataTypeMap;

/**
 * @brief Mapping structure to translate DataTypes::None
 */
template <>
struct DataTypeMap<DataTypes::None> {
  using type = std::int32_t;
  static constexpr type value = 0;
  static constexpr std::size_t dataSize = sizeof(type);
};

/**
 * @brief Mapping structure to translate DataTypes::Int32
 */
template <>
struct DataTypeMap<DataTypes::Int32> {
  using type = std::int32_t;
  static constexpr type value = 0;
  static constexpr std::size_t dataSize = sizeof(type);
};

/**
 * @brief Mapping structure to translate DataTypes::UInt32
 */
template <>
struct DataTypeMap<DataTypes::UInt32> {
  using type = std::uint32_t;
  static constexpr type value = 0;
  static constexpr std::size_t dataSize = sizeof(type);
};

/**
 * @brief Mapping structure to translate DataTypes::Float32
 */
template <>
struct DataTypeMap<DataTypes::Float32> {
  using type = float;
  static constexpr type value = 0.0f;
  static constexpr std::size_t dataSize = sizeof(type);
};

/**
 * @brief Mapping structure to translate DataTypes::Float64
 */
template <>
struct DataTypeMap<DataTypes::Float64> {
  using type = double;
  static constexpr type value = 0.0;
  static constexpr std::size_t dataSize = sizeof(type);
};

/**
 * @brief Mapping structure to translate DataTypes::String8
 */
template <>
struct DataTypeMap<DataTypes::String8> {
  using type = std::string;
  inline static const type value = "";
  static constexpr std::size_t dataSize = 8;
};

/**
 * @brief Mapping structure to translate DataTypes::String64
 */
template <>
struct DataTypeMap<DataTypes::String64> {
  using type = std::string;
  inline static const type value = "";
  static constexpr std::size_t dataSize = 64;
};

/**
 * @brief Mapping structure to translate DataTypes::CharArray
 */
template <>
struct DataTypeMap<DataTypes::CharArray> {
  using type = std::string;
  inline static const type value = "";
  static constexpr std::size_t dataSize = 0;
};

}  // namespace simconnect
