#pragma once

#include <map>
#include <memory>
#include <set>
#include "FailureList.h"
#include "LocalVariable.h"

class FailuresConsumer {
 public:
  FailuresConsumer();

  bool isActive(Failures failure);

  bool isAnyActive();

  void initialize();

  void acceptFailures(const std::set<int>& failures);

 private:
  std::map<Failures, bool> activeFailures;
};
