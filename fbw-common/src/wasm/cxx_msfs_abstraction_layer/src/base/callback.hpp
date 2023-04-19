#pragma once

#include <functional>

namespace base {

template <typename T>
struct Callback;

/**
 * @brief Callback container to define callbacks with use of template arguments
 * @tparam Ret The callback's return type
 * @tparam Params The callback's parameters as a variadic list
 */
template <typename Ret, typename... Params>
struct Callback<Ret(Params...)> {
  std::function<Ret(Params...)> function;
};

}  // namespace base
