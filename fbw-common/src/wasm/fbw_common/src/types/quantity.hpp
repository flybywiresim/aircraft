#pragma once

#include <cmath>
#include <ratio>

#include "../helper/math.hpp"

namespace types {

template <typename M, typename L, typename T, typename A>
class Quantity {
 private:
  float m_value;

 public:
  constexpr Quantity() noexcept : m_value(0.0f) {}
  explicit constexpr Quantity(float value) : m_value(value) {}

  constexpr Quantity const& operator+=(const Quantity& rhs) {
    this->m_value += rhs.m_value;
    return *this;
  }
  constexpr Quantity const& operator-=(const Quantity& rhs) {
    this->m_value -= rhs.m_value;
    return *this;
  }

  constexpr float value() const { return this->m_value; }
  constexpr void setValue(float value) { this->m_value = value; }
  constexpr float convert(const Quantity& rhs) const { return this->m_value / rhs.m_value; }
  constexpr Quantity<std::ratio_divide<M, std::ratio<2>>,
                     std::ratio_divide<L, std::ratio<2>>,
                     std::ratio_divide<T, std::ratio<2>>,
                     std::ratio_divide<A, std::ratio<2>>>
  sqrt() const {
    return Quantity<std::ratio_divide<M, std::ratio<2>>, std::ratio_divide<L, std::ratio<2>>, std::ratio_divide<T, std::ratio<2>>,
                    std::ratio_divide<A, std::ratio<2>>>(std::sqrtf(this->m_value));
  }
  constexpr Quantity<M, L, T, A> abs() const { return Quantity<M, L, T, A>(std::abs(this->m_value)); }
};

/** The mass specialization [kg] */
typedef Quantity<std::ratio<1>, std::ratio<0>, std::ratio<0>, std::ratio<0>> Mass;
/** The length specialization [m] */
typedef Quantity<std::ratio<0>, std::ratio<1>, std::ratio<0>, std::ratio<0>> Length;
/** The time specialization [s] */
typedef Quantity<std::ratio<0>, std::ratio<0>, std::ratio<1>, std::ratio<0>> Time;
/** The angle specialization [rad] */
typedef Quantity<std::ratio<0>, std::ratio<0>, std::ratio<0>, std::ratio<1>> Angle;
/** The velocity specialization [m/s] */
typedef Quantity<std::ratio<0>, std::ratio<1>, std::ratio<-1>, std::ratio<0>> Velocity;
/** The acceleration specialization [m/(s*s)] */
typedef Quantity<std::ratio<0>, std::ratio<1>, std::ratio<-2>, std::ratio<0>> Acceleration;
/** The angular velocity specialization [1/s] */
typedef Quantity<std::ratio<0>, std::ratio<0>, std::ratio<-1>, std::ratio<1>> AngularVelocity;
/** The angular acceleration specialization [1/(s*s)] */
typedef Quantity<std::ratio<0>, std::ratio<0>, std::ratio<-2>, std::ratio<1>> AngularAcceleration;

/**
 * @brief Adds rhs to lhs and returns a new instance
 * @param[in] lhs The left-hand-side component
 * @param[in] rhs The right-hand-side component
 * @return The resulting quantity with the updated value
 */
template <typename M, typename L, typename T, typename A>
constexpr Quantity<M, L, T, A> operator+(const Quantity<M, L, T, A>& lhs, const Quantity<M, L, T, A>& rhs) {
  return Quantity<M, L, T, A>(lhs.value() + rhs.value());
}
/**
 * @brief Substracts rhs to lhs and returns a new instance
 * @param[in] lhs The left-hand-side component
 * @param[in] rhs The right-hand-side component
 * @return The resulting quantity with the updated value
 */
template <typename M, typename L, typename T, typename A>
constexpr Quantity<M, L, T, A> operator-(const Quantity<M, L, T, A>& lhs, const Quantity<M, L, T, A>& rhs) {
  return Quantity<M, L, T, A>(lhs.value() - rhs.value());
}
/**
 * @brief Multiplies rhs to lhs and returns a new instance
 * @param[in] lhs The left-hand-side component
 * @param[in] rhs The right-hand-side component
 * @return The resulting quantity with the updated value
 */
template <typename M1, typename L1, typename T1, typename A1, typename M2, typename L2, typename T2, typename A2>
constexpr Quantity<std::ratio_add<M1, M2>, std::ratio_add<L1, L2>, std::ratio_add<T1, T2>, std::ratio_add<A1, A2>> operator*(
    const Quantity<M1, L1, T1, A1>& lhs,
    const Quantity<M2, L2, T2, A2>& rhs) {
  return Quantity<std::ratio_add<M1, M2>, std::ratio_add<L1, L2>, std::ratio_add<T1, T2>, std::ratio_add<A1, A2>>(lhs.value() *
                                                                                                                  rhs.value());
}
/**
 * @brief Multiplies lhs to rhs and returns a new instance
 * @param[in] lhs The SI-unit free factor
 * @param[in] rhs The right-hand-side component
 * @return The resulting quantity with the updated value
 */
template <typename M, typename L, typename T, typename A>
constexpr Quantity<M, L, T, A> operator*(const float& lhs, const Quantity<M, L, T, A>& rhs) {
  return Quantity<M, L, T, A>(lhs * rhs.value());
}
/**
 * @brief Multiplies rhs to lhs and returns a new instance
 * @param[in] lhs The left-hand-side component
 * @param[in] rhs The SI-unit free factor
 * @return The resulting quantity with the updated value
 */
template <typename M, typename L, typename T, typename A>
constexpr Quantity<M, L, T, A> operator*(const Quantity<M, L, T, A>& lhs, const float& rhs) {
  return Quantity<M, L, T, A>(lhs.value() * rhs);
}
/**
 * @brief Divides rhs from lhs and returns a new instance
 * @param[in] lhs The left-hand-side component
 * @param[in] rhs The right-hand-side component
 * @return The resulting quantity with the updated value
 */
template <typename M1, typename L1, typename T1, typename A1, typename M2, typename L2, typename T2, typename A2>
constexpr Quantity<std::ratio_subtract<M1, M2>, std::ratio_subtract<L1, L2>, std::ratio_subtract<T1, T2>, std::ratio_subtract<A1, A2>>
operator/(const Quantity<M1, L1, T1, A1>& lhs, const Quantity<M2, L2, T2, A2>& rhs) {
  return Quantity<std::ratio_subtract<M1, M2>, std::ratio_subtract<L1, L2>, std::ratio_subtract<T1, T2>, std::ratio_subtract<A1, A2>>(
      lhs.value() / rhs.value());
}
/**
 * @brief Divides rhs from lhs and returns a new instance
 * @param[in] lhs The SI-unit free factor
 * @param[in] rhs The right-hand-side component
 * @return The resulting quantity with the updated value
 */
template <typename M, typename L, typename T, typename A>
constexpr Quantity<std::ratio_subtract<std::ratio<0>, M>,
                   std::ratio_subtract<std::ratio<0>, L>,
                   std::ratio_subtract<std::ratio<0>, T>,
                   std::ratio_subtract<std::ratio<0>, A>>
operator/(const float& lhs, const Quantity<M, L, T, A>& rhs) {
  return Quantity<std::ratio_subtract<std::ratio<0>, M>, std::ratio_subtract<std::ratio<0>, L>, std::ratio_subtract<std::ratio<0>, T>,
                  std::ratio_subtract<std::ratio<0>, A>>(lhs / rhs.value());
}
/**
 * @brief Multiplies lhs from rhs and returns a new instance
 * @param[in] lhs The left-hand-side component
 * @param[in] rhs The SI-unit free factor
 * @return The resulting quantity with the updated value
 */
template <typename M, typename L, typename T, typename A>
constexpr Quantity<M, L, T, A> operator/(const Quantity<M, L, T, A>& lhs, const float& rhs) {
  return Quantity<M, L, T, A>(lhs.value() / rhs);
}

template <typename M, typename L, typename T, typename A>
constexpr bool operator==(const Quantity<M, L, T, A>& lhs, const Quantity<M, L, T, A>& rhs) {
  return true == helper::Math::almostEqual(lhs.value(), rhs.value(), 1e-8f);
}

template <typename M, typename L, typename T, typename A>
constexpr bool operator!=(const Quantity<M, L, T, A>& lhs, const Quantity<M, L, T, A>& rhs) {
  return false == helper::Math::almostEqual(lhs.value(), rhs.value(), 1e-8f);
}

template <typename M, typename L, typename T, typename A>
constexpr bool operator<=(const Quantity<M, L, T, A>& lhs, const Quantity<M, L, T, A>& rhs) {
  return lhs.value() <= rhs.value();
}

template <typename M, typename L, typename T, typename A>
constexpr bool operator<(const Quantity<M, L, T, A>& lhs, const Quantity<M, L, T, A>& rhs) {
  return lhs.value() < rhs.value();
}

template <typename M, typename L, typename T, typename A>
constexpr bool operator>=(const Quantity<M, L, T, A>& lhs, const Quantity<M, L, T, A>& rhs) {
  return lhs.value() >= rhs.value();
}

template <typename M, typename L, typename T, typename A>
constexpr bool operator>(const Quantity<M, L, T, A>& lhs, const Quantity<M, L, T, A>& rhs) {
  return lhs.value() > rhs.value();
}

constexpr Mass kilogram(1.0f);
constexpr Mass pound = 0.453592f * kilogram;
constexpr Mass operator"" _kg(long double value) {
  return Mass(static_cast<float>(value));
}
constexpr Mass operator"" _kg(unsigned long long int value) {
  return Mass(static_cast<float>(value));
}
constexpr Mass operator"" _lbs(long double value) {
  return static_cast<float>(value) * pound;
}
constexpr Mass operator"" _lbs(unsigned long long int value) {
  return static_cast<float>(value) * pound;
}

constexpr Length metre(1.0f);
constexpr Length feet = 0.3048f * metre;
constexpr Length kilometre = 1000.0f * metre;
constexpr Length nauticmile = 1852.0f * metre;
constexpr Length operator"" _m(long double value) {
  return Length(static_cast<float>(value));
}
constexpr Length operator"" _m(unsigned long long int value) {
  return Length(static_cast<float>(value));
}
constexpr Length operator"" _ft(long double value) {
  return static_cast<float>(value) * feet;
}
constexpr Length operator"" _ft(unsigned long long int value) {
  return static_cast<float>(value) * feet;
}
constexpr Length operator"" _km(long double value) {
  return static_cast<float>(value) * kilometre;
}
constexpr Length operator"" _km(unsigned long long int value) {
  return static_cast<float>(value) * kilometre;
}
constexpr Length operator"" _nm(long double value) {
  return static_cast<float>(value) * nauticmile;
}
constexpr Length operator"" _nm(unsigned long long int value) {
  return static_cast<float>(value) * nauticmile;
}

constexpr Time second(1.0f);
constexpr Time millisecond = second / 1000.0f;
constexpr Time minute = 60.0f * second;
constexpr Time hour = 60.0f * minute;
constexpr Time operator"" _ms(long double value) {
  return static_cast<float>(value) * millisecond;
}
constexpr Time operator"" _ms(unsigned long long int value) {
  return static_cast<float>(value) * millisecond;
}
constexpr Time operator"" _s(long double value) {
  return static_cast<float>(value) * second;
}
constexpr Time operator"" _s(unsigned long long int value) {
  return static_cast<float>(value) * second;
}
constexpr Time operator"" _min(long double value) {
  return static_cast<float>(value) * minute;
}
constexpr Time operator"" _min(unsigned long long int value) {
  return static_cast<float>(value) * minute;
}
constexpr Time operator"" _h(long double value) {
  return static_cast<float>(value) * hour;
}
constexpr Time operator"" _h(unsigned long long int value) {
  return static_cast<float>(value) * hour;
}

constexpr float operator"" _pi(long double value) {
  return static_cast<float>(value) * 3.1415926535897932384626433832795f;
}
constexpr float operator"" _pi(unsigned long long int value) {
  return static_cast<float>(value) * 3.1415926535897932384626433832795f;
}

constexpr Angle degree = Angle(1.0f);
constexpr Angle radian = 180.0f / 1_pi * degree;
constexpr Angle operator"" _rad(long double value) {
  return static_cast<float>(value) * radian;
}
constexpr Angle operator"" _rad(unsigned long long int value) {
  return static_cast<float>(value) * radian;
}
constexpr Angle operator"" _deg(long double value) {
  return static_cast<float>(value) * degree;
}
constexpr Angle operator"" _deg(unsigned long long int value) {
  return static_cast<float>(value) * degree;
}

constexpr Velocity knot = 0.51444f * metre / second;
constexpr Velocity ftpmin = feet / minute;
constexpr Velocity operator"" _mps(long double value) {
  return Velocity(static_cast<float>(value));
}
constexpr Velocity operator"" _mps(unsigned long long int value) {
  return Velocity(static_cast<float>(value));
}
constexpr Velocity operator"" _ftpmin(long double value) {
  return static_cast<float>(value) * feet / minute;
}
constexpr Velocity operator"" _ftpmin(unsigned long long int value) {
  return static_cast<float>(value) * feet / minute;
}
constexpr Velocity operator"" _kmph(long double value) {
  return static_cast<float>(value) * kilometre / hour;
}
constexpr Velocity operator"" _kmph(unsigned long long int value) {
  return static_cast<float>(value) * kilometre / hour;
}
constexpr Velocity operator"" _kn(long double value) {
  return static_cast<float>(value) * knot;
}
constexpr Velocity operator"" _kn(unsigned long long int value) {
  return static_cast<float>(value) * knot;
}

constexpr Acceleration G = 9.80665f * metre / (second * second);
constexpr Acceleration operator"" _mps2(long double value) {
  return Acceleration(static_cast<float>(value));
}
constexpr Acceleration operator"" _mps2(unsigned long long int value) {
  return Acceleration(static_cast<float>(value));
}
constexpr Acceleration operator"" _g(long double value) {
  return static_cast<float>(value) * G;
}
constexpr Acceleration operator"" _g(unsigned long long int value) {
  return static_cast<float>(value) * G;
}

constexpr AngularVelocity operator"" _radps(long double value) {
  return AngularVelocity(static_cast<float>(value));
}
constexpr AngularVelocity operator"" _radps(unsigned long long int value) {
  return AngularVelocity(static_cast<float>(value));
}
constexpr AngularVelocity operator"" _degps(long double value) {
  return static_cast<float>(value) * degree / second;
}
constexpr AngularVelocity operator"" _degps(unsigned long long int value) {
  return static_cast<float>(value) * degree / second;
}

constexpr AngularAcceleration operator"" _radps2(long double value) {
  return AngularAcceleration(static_cast<float>(value));
}
constexpr AngularAcceleration operator"" _radps2(unsigned long long int value) {
  return AngularAcceleration(static_cast<float>(value));
}
constexpr AngularAcceleration operator"" _degps2(long double value) {
  return static_cast<float>(value) * degree / (second * second);
}
constexpr AngularAcceleration operator"" _degps2(unsigned long long int value) {
  return static_cast<float>(value) * degree / (second * second);
}

}  // namespace types
