# @brief Creates an optimized WASM library
# @param TARGET the library name
# @param DEPENDENCIES the library dependencies
macro(add_wasm_library)
    set(target NAME)
    set(dependencies DEPENDENCIES)
    cmake_parse_arguments(ADD_WASM_LIBRARY "" "${target}" "${dependencies}" ${ARGN})

    # create the list of the created object files
    set(OBJECT_FILES)
    foreach (arg IN ITEMS ${ADD_WASM_LIBRARY_DEPENDENCIES})
        list(APPEND OBJECT_FILES $<TARGET_OBJECTS:${arg}>)
    endforeach()

    # wasm-ld general flags
    set(CMAKE_WASM_LINKER_FLAGS --no-entry --allow-undefined --export __wasm_call_ctors --export-dynamic --export malloc --export free --export mallinfo --export mchunkit_begin --export mchunkit_next --export get_pages_state --export mark_decommit_pages --export-table --gc-sections -lc++ -lc++abi -L${MSFS_SDK}/WASM/wasi-sysroot/lib/wasm32-wasi -lc ${MSFS_SDK}/WASM/wasi-sysroot/lib/wasm32-wasi/libclang_rt.builtins-wasm32.a)

    # wasm build options for debug and release
    if (CMAKE_BUILD_TYPE STREQUAL "Debug")
        set(WASM_LD_ARGS -O0)
        set(WASM_OPT_FLAGS -O0)
        # to enable debugging wasm-opt must not run at all
        # we use `cp` to copy the unoptimized wasm file to the output directory
        set(WASM_OPT_FULL_CMD cp ${CMAKE_CURRENT_BINARY_DIR}/${ADD_WASM_LIBRARY_NAME}.wasm ${OUTPUT_DIRECTORY}/)
    else()
        set(WASM_LD_ARGS -O2 --lto-O2 --strip-debug)
        set(WASM_OPT_FLAGS -O1 --signext-lowering)
        set(WASM_OPT_FULL_CMD ${CMAKE_WASM_OPTIMIZER} ${WASM_OPT_FLAGS} -o ${OUTPUT_DIRECTORY}/${ADD_WASM_LIBRARY_NAME}.wasm ${CMAKE_CURRENT_BINARY_DIR}/${ADD_WASM_LIBRARY_NAME}.wasm)
    endif()

    # create the custom command to create the wasm library
    add_custom_command(
        OUTPUT always_rebuild
        # OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/${ADD_WASM_LIBRARY_NAME}.wasm
        COMMAND ${CMAKE_WASM_LINKER} ${WASM_LD_ARGS} ${CMAKE_WASM_LINKER_FLAGS} ${OBJECT_FILES} -o ${CMAKE_CURRENT_BINARY_DIR}/${ADD_WASM_LIBRARY_NAME}.wasm
        DEPENDS ${ADD_WASM_LIBRARY_DEPENDENCIES}
        COMMENT "Compiling WASM library ${ADD_WASM_LIBRARY_NAME}"
        COMMAND_EXPAND_LISTS
    )

    # create the optimized wasm library
    add_custom_command(
        OUTPUT ${OUTPUT_DIRECTORY}/${ADD_WASM_LIBRARY_NAME}.wasm
        COMMAND ${WASM_OPT_FULL_CMD}
        DEPENDS always_rebuild
        COMMENT "Compiling optimized WASM library ${ADD_WASM_LIBRARY_NAME}"
    )

    # define the target
    add_custom_target(${ADD_WASM_LIBRARY_NAME}_wasm ALL
        SOURCES ${OUTPUT_DIRECTORY}/${ADD_WASM_LIBRARY_NAME}.wasm
        DEPENDS always_rebuild
    )
endmacro()
