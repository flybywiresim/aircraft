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

    # create the custom command to create the wasm library
    add_custom_command(
        OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/${ADD_WASM_LIBRARY_NAME}.wasm
        COMMAND ${CMAKE_WASM_LINKER} ${CMAKE_WASM_LINKER_FLAGS} ${OBJECT_FILES} -o ${CMAKE_CURRENT_BINARY_DIR}/${ADD_WASM_LIBRARY_NAME}.wasm
        DEPENDS ${ADD_WASM_LIBRARY_DEPENDENCIES}
        COMMENT "Compiling WASM library ${ADD_WASM_LIBRARY_NAME}"
        COMMAND_EXPAND_LISTS
    )

    # create the optimized wasm library
    add_custom_command(
        OUTPUT ${OUTPUT_DIRECTORY}/${ADD_WASM_LIBRARY_NAME}.wasm
        COMMAND ${CMAKE_WASM_OPTIMIZER} -O1 -o ${OUTPUT_DIRECTORY}/${ADD_WASM_LIBRARY_NAME}.wasm ${CMAKE_CURRENT_BINARY_DIR}/${ADD_WASM_LIBRARY_NAME}.wasm
        DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/${ADD_WASM_LIBRARY_NAME}.wasm
        COMMENT "Compiling optimized WASM library ${ADD_WASM_LIBRARY_NAME}"
    )

    # define the target
    add_custom_target(${ADD_WASM_LIBRARY_NAME}_wasm ALL
        SOURCES ${OUTPUT_DIRECTORY}/${ADD_WASM_LIBRARY_NAME}.wasm
    )
endmacro()
