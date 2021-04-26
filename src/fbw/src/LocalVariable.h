#pragma once

#include <iostream>
#include <set>
#include <string>
#include <utility>

#include <MSFS/Legacy/gauges.h>

class LocalVariable {
 public:
  explicit LocalVariable(const std::string& name, bool shouldUseDirtyState = true);
  ~LocalVariable();

  std::string getName();

  double get(bool shouldRead = false);
  void set(double newValue, bool shouldWrite = true);

  void read();
  void write();

  static void readAll();
  static void writeAll();

 private:
  static std::set<LocalVariable*> LOCAL_VARIABLES;

  ID id;
  std::string name;
  bool useDirtyState;
  bool isDirty;
  double value;
};
