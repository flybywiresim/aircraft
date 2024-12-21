# FlyByWire Simulations - C++ WASM Development Guidelines

## Purpose

Reading and troubleshooting other developers code is hard in general. Also,  
developers new to the project have a hard time to get started with developing
new features and functionalities in the FlyByWire Simulations code base.

This document aims to provide a set of guidelines for the C++ WASM development in
the FlyByWire Simulations code base which aims to readability, maintainability of
the code base which is also easily accessible for new developers.

## C++ Code Style

The FlyByWire Cpp code style is based on the clang-format Chromium style
( see`.clang-format`).

## Commenting

Good commenting is a very important part of writing readable and maintainable
software. This is especially true in a multi-developer project with very different
developer backgrounds and level of experience amongst its developers.
The FlyByWire Open-Source project certainly falls into this category.

As a general rule code should be commented so that other developers should not
have to read the actual code to understand what classes, methods and members do
and why they exist in the first place.

In C++ in general, it should be sufficient to read the header file to understand
the purpose and usage of a class, method/function or any member. There should be
little need to read the code in the definition files (cpp) to know what a class
or any of its members does or how it should be used.
This is especially important for any public members of a class.

If you write comments think of the following questions:

- What? Why? How to use?
- What does the code do?
    - Give a short general description of what the code does
- What implications / side effects does this code have?
- Why does the code do it?
    - Explain the purpose of the code
    - e.g. why is this method/function needed and where is it used?
    - e.g. why is this variable needed and where is it used?
- How to use the code?
    - Explain how to use the code
    - e.g. how to use the method/function?
- How does the code actually do it conceptually (optional)?
    - Although good code speaks for itself it is helpful to explain in very
      broad strokes how the code does it esp. if the code has more complex logic

Modern IDEs like VSCode or JetBrain IDEs provide a lot of features to help
developers by simply hovering over a class, function, variable, etc. to get a
quick look at the documentation. Have this in mind when writing comments.

It is good practice to comment the code as you write it. Often it is easier to
start by writing parts of the documentation first. E.g. writing the header files
first by declaring members and document these often helps to achieve a better
and faster implementation.

## Logging

A very simple logging framework is in place in the logging.h header file.

This logging framework will be improved and extended over time.

Some notes on logging:

- challenge is to find a logging framework that does not use exceptions or
  threading (which is not supported in MSFS WASM)
- MSFS does not easily allow to attach a debugger for C++ and tends to crash if one does
- MSFS has no permanent logging to analyse CTDs
- Logging should not be excessive but allow to see where the code is at
- Logging should print any warning and errors to the console to make it easier
  to find issues later.

## Unit Testing

Unit testing is a very important part of writing maintainable and readable code.

A C++ Unit-testing framework has not yet been chosen or added to the project.
This is a TODO.
