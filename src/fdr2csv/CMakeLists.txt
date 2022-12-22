cmake_minimum_required(VERSION 3.5)
project(fdr2csv LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_INCLUDE_CURRENT_DIR ON)

include_directories(
        AFTER
        "${CMAKE_SOURCE_DIR}/src"
        "${CMAKE_SOURCE_DIR}/src/commandline"
        "${CMAKE_SOURCE_DIR}/src/fmt/include"
        "${CMAKE_SOURCE_DIR}/../fbw_a320/src"
        "${CMAKE_SOURCE_DIR}/../fbw_a320/src/model"
        "${CMAKE_SOURCE_DIR}/../fbw_common/src/zlib"
)

add_executable(
        fdr2csv
        ../fbw_common/src/zlib/adler32.c
        ../fbw_common/src/zlib/crc32.c
        ../fbw_common/src/zlib/deflate.c
        ../fbw_common/src/zlib/gzclose.c
        ../fbw_common/src/zlib/gzlib.c
        ../fbw_common/src/zlib/gzread.c
        ../fbw_common/src/zlib/gzwrite.c
        ../fbw_common/src/zlib/infback.c
        ../fbw_common/src/zlib/inffast.c
        ../fbw_common/src/zlib/inflate.c
        ../fbw_common/src/zlib/inftrees.c
        ../fbw_common/src/zlib/trees.c
        ../fbw_common/src/zlib/zfstream.cc
        ../fbw_common/src/zlib/zutil.c
        src/commandline/CommandLine.cpp
        src/fmt/src/format.cc
        src/fmt/src/os.cc
        src/FlightDataRecorderConverter.cpp
        src/main.cpp
)

target_compile_features(fdr2csv PRIVATE cxx_std_20)
