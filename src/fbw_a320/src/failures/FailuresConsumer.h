#pragma once

#include <map>
#include <memory>
#include "../LocalVariable.h"
#include "FailureList.h"

class FailuresConsumer {
 public:
  FailuresConsumer();

  void update();

  bool isActive(Failures failure);

  bool isAnyActive();

  void initialize();

 private:
  std::map<Failures, bool> activeFailures;

  void updateActivate();

  void updateDeactivate();

  bool setIfFound(double identifier, bool value);

  std::unique_ptr<LocalVariable> activateLvar;

  std::unique_ptr<LocalVariable> deactivateLvar;
};
