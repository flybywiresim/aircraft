#include "LocalVariable.h"

using std::cout;
using std::endl;
using std::set;
using std::string;

set<LocalVariable*> LocalVariable::LOCAL_VARIABLES;

LocalVariable::LocalVariable(const string& variable, bool shouldUseDirtyState) {
  // initialize variables
  useDirtyState = shouldUseDirtyState;
  isDirty = false;
  value = 0.0;
  name = variable;
  // register variable
  id = register_named_variable(name.c_str());
  // read current value
  read();
  // remember in global list (for readAll)
  LOCAL_VARIABLES.insert(this);
}

LocalVariable::~LocalVariable() {
  LOCAL_VARIABLES.erase(this);
}

string LocalVariable::getName() {
  return name;
}

double LocalVariable::get(bool shouldRead) {
  if (shouldRead) {
    read();
  }
  return value;
}

void LocalVariable::set(double newValue, bool shouldWrite) {
  value = newValue;
  isDirty = true;
  if (shouldWrite) {
    write();
  }
}

void LocalVariable::read() {
  value = get_named_variable_value(id);
}

void LocalVariable::write() {
  if (useDirtyState && !isDirty) {
    return;
  }
  set_named_variable_value(id, value);
  isDirty = false;
}

void LocalVariable::readAll() {
  for (auto variable : LOCAL_VARIABLES) {
    variable->read();
  }
}

void LocalVariable::writeAll() {
  for (auto variable : LOCAL_VARIABLES) {
    variable->write();
  }
}
