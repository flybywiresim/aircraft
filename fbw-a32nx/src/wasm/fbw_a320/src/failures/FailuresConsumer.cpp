#include "FailuresConsumer.h"
#include <algorithm>
#include <utility>

FailuresConsumer::FailuresConsumer() {
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Elac1, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Elac2, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Sec1, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Sec2, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Sec3, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Fac1, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Fac2, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Fcdc1, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Fcdc2, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Fcu1, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Fcu2, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Fmgc1, false));
  activeFailures.emplace(std::make_pair<Failures, bool>(Failures::Fmgc2, false));
}

void FailuresConsumer::initialize() {
  activateLvar = std::make_unique<LocalVariable>("A32NX_FAILURE_ACTIVATE");
  deactivateLvar = std::make_unique<LocalVariable>("A32NX_FAILURE_DEACTIVATE");
}

void FailuresConsumer::update() {
  updateActivate();
  updateDeactivate();
}

bool FailuresConsumer::isActive(Failures failure) {
  return (*activeFailures.find(failure)).second;
}

void FailuresConsumer::updateActivate() {
  double index = activateLvar->get();
  if (setIfFound(index, true)) {
    activateLvar->set(0);
  }
}

void FailuresConsumer::updateDeactivate() {
  double index = deactivateLvar->get();
  if (setIfFound(index, false)) {
    deactivateLvar->set(0);
  }
}

bool FailuresConsumer::setIfFound(double identifier, bool value) {
  auto pair = activeFailures.find(static_cast<Failures>(identifier));
  if (pair == activeFailures.end()) {
    return false;
  } else {
    (*pair).second = value;
    return true;
  }
}

bool FailuresConsumer::isAnyActive() {
  if (std::any_of(activeFailures.begin(), activeFailures.end(), [](auto pair) { return pair.second; })) {
    return true;
  }
  return false;
}
