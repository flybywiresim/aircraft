#pragma once

#include <array>
#include <string_view>

namespace helper {

template <std::string_view const&... Strings>
struct StringConcat {
 public:
  static constexpr auto impl() {
    constexpr std::size_t length = (Strings.size() + ... + 0);
    std::array<char, length + 1> arr{};

    auto append = [i = 0, &arr](auto const& str) mutable {
      for (auto c : str)
        arr[i++] = c;
    };
    (append(Strings), ...);
    arr[length] = 0;

    return arr;
  }

  static constexpr auto arr = impl();
  static constexpr std::string_view value{arr.data(), arr.size() - 1};
};

template <std::string_view const&... Strings>
static constexpr auto concat = StringConcat<Strings...>::value;

}  // namespace helper
