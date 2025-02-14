#include "FailuresConsumer.h"
#include <MSFS/MSFS_CommBus.h>
#include <algorithm>
#include <iostream>
#include <nlohmann/json.hpp>
#include <utility>

using json = nlohmann::json;

static void FailuresConsumerCommBusHandler(const char* buf, unsigned int bufSize, void* ctx) {
  auto* failuresConsumer = static_cast<FailuresConsumer*>(ctx);
  if (failuresConsumer == nullptr || buf == nullptr || bufSize < 1 || buf[bufSize - 1] != '\0') {
    return;
  }

  json data = json::parse(buf);
  if (!data.is_array()) {
    return;
  }

  std::set<int> failures;
  data.get_to(failures);

  failuresConsumer->acceptFailures(failures);
}

FailuresConsumer::FailuresConsumer() {
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Prim1, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Prim2, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Prim3, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Sec1, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Sec2, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Sec3, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Fcdc1, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Fcdc2, false));
}

void FailuresConsumer::initialize() {
  fsCommBusRegister("FBW_FAILURE_UPDATE", FailuresConsumerCommBusHandler, this);
  fsCommBusCall("FBW_FAILURE_REQUEST", nullptr, 0, FsCommBusBroadcast_JS);
}

void FailuresConsumer::acceptFailures(const std::set<int>& failures) {
  for (auto& activeFailure : activeFailures) {
    activeFailure.second = failures.contains(static_cast<int>(activeFailure.first));
  }
}

bool FailuresConsumer::isActive(Failures failure) {
  return (*activeFailures.find(failure)).second;
}

bool FailuresConsumer::isAnyActive() {
  if (std::any_of(activeFailures.begin(), activeFailures.end(), [](auto pair) { return pair.second; })) {
    return true;
  }
  return false;
}
