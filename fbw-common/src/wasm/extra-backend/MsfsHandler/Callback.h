// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_CALLBACK_H
#define FLYBYWIRE_AIRCRAFT_CALLBACK_H

#include <functional>

template <typename T>
struct Callback;

/**
 * Callback container to define callbacks with use of template arguments - this allows for
 * static callbacks to be used with member functions.
 *
 * @tparam Ret The callback's return type
 * @tparam Params The callback's parameters as a variadic list
 * @See https://blog.mbedded.ninja/programming/languages/c-plus-plus/callbacks/#static-variables-with-templating
 */
template <typename Ret, typename... Params>
struct Callback<Ret(Params...)> {
  template <typename... Args>
  static Ret callback(Args... args) {
    return func(args...);
  }
  static std::function<Ret(Params...)> func;
};

template <typename Ret, typename... Params>
std::function<Ret(Params...)> Callback<Ret(Params...)>::func;

#endif //FLYBYWIRE_AIRCRAFT_CALLBACK_H
