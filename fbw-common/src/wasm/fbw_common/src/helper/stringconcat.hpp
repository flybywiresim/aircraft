#pragma once

#include <array>
#include <string_view>

namespace helper {

template <std::string_view const&... Strings>
struct StringConcat {
  static constexpr auto impl() {
    constexpr std::size_t length = (Strings.size() + ... + 0);
    std::array<char, length + 1> localArr{};

    auto append = [i = 0, &localArr](auto const& str) mutable {
      for (auto c : str)
        localArr[static_cast<std::size_t>(i++)] = c;
    };
    (append(Strings), ...);
    localArr[length] = 0;

    return localArr;
  }

  static constexpr auto arr = impl();
  static constexpr std::string_view value{arr.data(), arr.size() - 1};
};

template <std::string_view const&... Strings>
static constexpr auto concat = StringConcat<Strings...>::value;

}  // namespace helper
