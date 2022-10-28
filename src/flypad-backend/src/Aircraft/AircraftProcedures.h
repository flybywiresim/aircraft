#pragma once

#include <map>
#include <string>
#include <vector>
#include <array>

struct ProcedureStep {
  std::string description;
  // unique id for each step (will be assigned automatically in constructor)
  int id;
  // true if the procedure step is a pure condition check to wait for a certain state
  bool isConditional;
  // time to delay next step of execution of action - will be skipped if
  // expected state is already set
  double delayAfter;
  // check if desired state is already set so the action can be skipped
  std::string expectedStateCheckCode;
  // calculator code to achieve the desired state
  // if it is a conditional this calculator code needs to eval to true or false
  std::string actionCode;
};

class AircraftProcedures {
  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // Please remember to also update the EFB Presets page for the step description
  // if you make any changes to this list.
  // src/instruments/src/EFB/Presets/Widgets/AircraftPresets.tsx
  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  static const std::array<ProcedureStep, 32> POWERED_CONFIG_ON;
  static const std::array<ProcedureStep, 21> POWERED_CONFIG_OFF;
  static const std::array<ProcedureStep, 12> PUSHBACK_CONFIG_ON;
  static const std::array<ProcedureStep, 8> PUSHBACK_CONFIG_OFF;
  static const std::array<ProcedureStep, 21> TAXI_CONFIG_ON;
  static const std::array<ProcedureStep, 16> TAXI_CONFIG_OFF;
  static const std::array<ProcedureStep, 8> TAKEOFF_CONFIG_ON;
  static const std::array<ProcedureStep, 7> TAKEOFF_CONFIG_OFF;

  static inline constexpr std::size_t COLD_DARK_SIZE = TAKEOFF_CONFIG_OFF.size() + TAXI_CONFIG_OFF.size() + PUSHBACK_CONFIG_OFF.size() + POWERED_CONFIG_OFF.size();
  static inline constexpr std::size_t POWERED_SIZE = TAKEOFF_CONFIG_OFF.size() + TAXI_CONFIG_OFF.size() + PUSHBACK_CONFIG_OFF.size() + POWERED_CONFIG_ON.size();
  static inline constexpr std::size_t RDY_FOR_PUSHBACK_SIZE = TAKEOFF_CONFIG_OFF.size() + TAXI_CONFIG_OFF.size() + POWERED_CONFIG_ON.size() + PUSHBACK_CONFIG_ON.size();
  static inline constexpr std::size_t RDY_FOR_TAXI_SIZE = TAKEOFF_CONFIG_OFF.size() + POWERED_CONFIG_ON.size() + PUSHBACK_CONFIG_ON.size() + TAXI_CONFIG_ON.size();
  static inline constexpr std::size_t RDY_FOR_TAKEOFF_SIZE = POWERED_CONFIG_ON.size() + PUSHBACK_CONFIG_ON.size() + TAXI_CONFIG_ON.size() + TAKEOFF_CONFIG_ON.size();

  std::array<const ProcedureStep*, COLD_DARK_SIZE> coldAndDark;
  std::array<const ProcedureStep*, POWERED_SIZE> powered;
  std::array<const ProcedureStep*, RDY_FOR_PUSHBACK_SIZE> readyForPushback;
  std::array<const ProcedureStep*, RDY_FOR_TAXI_SIZE> readyForTaxi;
  std::array<const ProcedureStep*, RDY_FOR_TAKEOFF_SIZE> readyForTakeoff;

  template<std::size_t N1, std::size_t N2>
  static void doInsertProcedures(std::array<const ProcedureStep*, N1>& dest, const std::array<ProcedureStep, N2>& src) {
    static_assert(N1 == N2, "Sizes of arrays do not match, overflow prevented.");
    std::transform(begin(src), end(src), begin(dest), [](const auto& procedure) {
      return &procedure;
    });
  }

  template<std::size_t I, class... Arrays>
  static void insertProcedures(std::array<const ProcedureStep*, I>& dest, const Arrays&... procedures) {
    (doInsertProcedures(dest, procedures), ...);
  }

public:
  AircraftProcedures();

  [[nodiscard]]
  std::pair<const ProcedureStep*, const ProcedureStep*> getProcedure(int64_t pID) const;
};
