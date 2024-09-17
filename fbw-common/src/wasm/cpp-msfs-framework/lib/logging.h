// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_LOGGING_H
#define FLYBYWIRE_LOGGING_H

#include <iostream>

/**
 * Simple logging facility for the FlyByWire Simulations C++ WASM framework.
 * No performance when turned off and only the minimum overhead when turned on to a specific level.
 *
 * Use in the following way:
 *
 * LOG_INFO("PANEL_SERVICE_PRE_INSTALL");
 * LOG_INFO("PANEL_SERVICE_PRE_INSTALL: " + panelService->getPanelServiceName());
 *
 * This will be improved and extended in the future.
 * E.g. it could be extended to log to a file.
 */

#define ZERO_LVL 0
#define CRITICAL_LVL 1
#define ERROR_LVL 2
#define WARN_LVL 3
#define INFO_LVL 4
#define DEBUG_LVL 5
#define VERBOSE_LVL 6
#define TRACE_LVL 7

#define LOG_CRITICAL(msg) logger->critical(msg)
#define LOG_ERROR(msg) logger->error(msg)
#define LOG_WARN(msg) logger->warn(msg)
#define LOG_INFO(msg) logger->info(msg)
#define LOG_DEBUG(msg) logger->debug(msg)
#define LOG_VERBOSE(msg) logger->verbose(msg)
#define LOG_TRACE(msg) logger->trace(msg)

/**
 * @brief The Logger class is a very simple logging facility.
 *
 * Singleton class for Logger
 * Very simple implementation for now.
 * The use of macros allows for a complete removal of logging code when not needed.
 *
 * Usage:
 *
 * 1. Include "logging.h" in your source file.
 * 2. Use the LOG_* macros to log messages to the console.
 */
class Logger {
 public:
  Logger() = default;
  /** get the singleton instance of Logger */
  static Logger* instance() {
    static Logger instance;
    return &instance;
  }

 public:
  // disallow copies
  Logger(Logger const&)             = delete;  // copy
  Logger& operator=(const Logger&)  = delete;  // copy assignment
  Logger(Logger const&&)            = delete;  // move
  Logger& operator=(const Logger&&) = delete;  // move assignment

  void critical([[maybe_unused]] const std::string& msg) {
#if LOG_LEVEL >= CRITICAL_LVL
    std::cerr << "critical: " + msg;
#endif
  }

  void error([[maybe_unused]] const std::string& msg) {
#if LOG_LEVEL >= ERROR_LVL
    std::cerr << "error: " + msg;
#endif
  }

  void warn([[maybe_unused]] const std::string& msg) {
#if LOG_LEVEL >= WARN_LVL
    std::cerr << "warn: " + msg;
#endif
  }

  void info([[maybe_unused]] const std::string& msg) {
#if LOG_LEVEL >= INFO_LVL
    std::cout << "info: " << msg << std::endl;
#endif
  }

  void debug([[maybe_unused]] const std::string& msg) {
#if LOG_LEVEL >= DEBUG_LVL
    std::cout << "debug: " << msg << std::endl;
#endif
  }

  void verbose([[maybe_unused]] const std::string& msg) {
#if LOG_LEVEL >= VERBOSE_LVL
    std::cout << "verbose: " << msg << std::endl;
#endif
  }

  void trace([[maybe_unused]] const std::string& msg) {
#if LOG_LEVEL >= TRACE_LVL
    std::cout << "trace: " << msg << std::endl;
#endif
  }
};

inline Logger* logger = Logger::instance();

#endif  // FLYBYWIRE_LOGGING_H
