#pragma once

namespace base {

/**
 * @brief Defines the base class to support the visitor pattern
 *
 * @tparam T Type that is supported by the visitor
 */
template <typename T>
class VisitorBase {
 public:
  virtual ~VisitorBase() {}
  virtual void visit(T&) = 0;
};

/**
 * @brief Recursive visitor pattern to build automatically the corresponding visit-functions
 *
 * @tparam T Current visitable type
 * @tparam Ts Remaining visitable types
 */
template <typename T, typename... Ts>
class RecursiveVisitor : public VisitorBase<T>, RecursiveVisitor<Ts...> {
 public:
  using VisitorBase<T>::visit;
  using RecursiveVisitor<Ts...>::visit;
};

/**
 * @brief Last class of the recursive visitor pattern
 *
 * @tparam T Last visitable type
 */
template <typename T>
class RecursiveVisitor<T> : public VisitorBase<T> {
 public:
  using VisitorBase<T>::visit;
};

/**
 * @brief Top level visitor class for better readability and collect all visit-functions
 *
 * @tparam Ts All visitable types
 */
template <typename... Ts>
class Visitor : public RecursiveVisitor<Ts...> {
 public:
  using RecursiveVisitor<Ts...>::visit;
};

/**
 * @brief Base class for every class that supports the visitor pattern
 *
 * @tparam T Current type that supports the visitor pattern
 * @tparam Ts The template signature of the corresponding visitor class
 */
template <typename T, typename... Ts>
class Visitable {
 public:
  virtual ~Visitable() {}

  /**
   * @brief Visitis this instance and provides the correct type to the visitor
   *
   * @param visitor The current visitor
   */
  virtual void accept(Visitor<Ts...>& visitor) { visitor.visit(static_cast<T&>(*this)); }
};

}  // namespace base
