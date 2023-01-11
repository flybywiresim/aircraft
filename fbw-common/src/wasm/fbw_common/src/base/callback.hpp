#pragma once

#include <functional>

namespace base {

template <typename T>
struct Callback;

template <typename Ret, typename... Params>
struct Callback<Ret(Params...)> {
  std::function<Ret(Params...)> function;
};

}  // namespace base
