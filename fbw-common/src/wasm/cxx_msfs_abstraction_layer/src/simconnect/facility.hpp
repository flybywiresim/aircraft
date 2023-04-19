#pragma once

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wsign-conversion"
#pragma clang diagnostic ignored "-Wundef"
#include <SimConnect.h>
#pragma clang diagnostic pop
#include <iostream>
#include <string>
#include <tuple>
#include <type_traits>
#include <variant>
#include <vector>

#include <base/receivable.hpp>
#include <base/visitor.hpp>
#include <simconnect/datatypes.hpp>
#include <simconnect/facilitydatatypes.hpp>

namespace simconnect {

class Connection;

template <DataTypes T>
class FacilityTreeNode;

/**
 * @brief Base class to define nodes of the facility tree
 * The tree supports the visitor pattern to access elements
 */
class FacilityTreeNodeBase : public base::Visitable<FacilityTreeNodeBase,
                                                    FacilityTreeNodeBase,
                                                    FacilityTreeNode<DataTypes::None>,
                                                    FacilityTreeNode<DataTypes::Int32>,
                                                    FacilityTreeNode<DataTypes::UInt32>,
                                                    FacilityTreeNode<DataTypes::Float32>,
                                                    FacilityTreeNode<DataTypes::Float64>,
                                                    FacilityTreeNode<DataTypes::String8>,
                                                    FacilityTreeNode<DataTypes::String64>,
                                                    FacilityTreeNode<DataTypes::CharArray>> {
 private:
  std::string _name;
  DataTypes _type;
  FacilityDataTypes _facilityType;
  std::vector<FacilityTreeNodeBase*> _children;

 public:
  /**
   * @brief Construct a new Facility Tree Node Base object
   *
   * @param name Name of the new object
   * @param type SimConnect data type of the node
   */
  FacilityTreeNodeBase(const std::string& name, DataTypes type, FacilityDataTypes facilityType)
      : _name(name), _type(type), _facilityType(facilityType), _children() {}
  /**
   * @brief Construct a new Facility Tree Node Base object
   *
   * @param name Name of the new object
   * @param type SimConnect data type of the node
   * @param children The children of the node
   */
  FacilityTreeNodeBase(const std::string& name,
                       DataTypes type,
                       FacilityDataTypes facilityType,
                       std::vector<FacilityTreeNodeBase*>&& children)
      : _name(name), _type(type), _facilityType(facilityType), _children(std::forward<std::vector<FacilityTreeNodeBase*>>(children)) {}

  virtual ~FacilityTreeNodeBase() {
    for (auto child : this->_children) {
      delete child;
    }
    this->_children.clear();
  }

  /**
   * @brief Returns the SimConnect data type
   *
   * @return DataTypes The SimConnect type
   */
  DataTypes type() const { return this->_type; }

  /**
   * @brief Returns the facility data type
   *
   * @return FacilityDataTypes The facility type
   */
  FacilityDataTypes facilityType() const { return this->_facilityType; }

  /**
   * @brief Returns the node's name
   *
   * @return const std::string& The node's name
   */
  const std::string& name() const { return this->_name; }

  /**
   * @brief Returns the children if T == DataTypes::None
   *
   * @return const std::vector<FacilityTreeNodeBase*>& The node's children
   */
  const std::vector<FacilityTreeNodeBase*>& children() const { return this->_children; }
};

/**
 * @brief Defines the node of the facility node in the tree
 *
 * A node contains the SimConnect type and the fallback type DataTypes::None
 * is used to define nodes with children inside the tree.
 * All other DataTypes contain the value and are setable and getable
 *
 * @tparam T The SimConnect type of the node
 */
template <DataTypes T>
class FacilityTreeNode : public FacilityTreeNodeBase,
                         public base::Visitable<FacilityTreeNode<T>,
                                                FacilityTreeNodeBase,
                                                FacilityTreeNode<DataTypes::None>,
                                                FacilityTreeNode<DataTypes::Int32>,
                                                FacilityTreeNode<DataTypes::UInt32>,
                                                FacilityTreeNode<DataTypes::Float32>,
                                                FacilityTreeNode<DataTypes::Float64>,
                                                FacilityTreeNode<DataTypes::String8>,
                                                FacilityTreeNode<DataTypes::String64>,
                                                FacilityTreeNode<DataTypes::CharArray>> {
 private:
  typename DataTypeMap<T>::type _value;

 public:
  /**
   * @brief Construct a new Facility Tree Node object without children
   *
   * @param name The node's name
   * @param facilityType The node's facility type
   */
  FacilityTreeNode(const std::string& name, FacilityDataTypes facilityType)
      : FacilityTreeNodeBase(name, T, facilityType), _value(DataTypeMap<T>::value) {}
  /**
   * @brief Construct a new Facility Tree Node object with children
   *
   * @param name The node's name
   * @param facilityType The node's facility type
   * @param children The children of the node
   */
  FacilityTreeNode(const std::string& name, FacilityDataTypes facilityType, std::vector<FacilityTreeNodeBase*>&& children)
      : FacilityTreeNodeBase(name, T, facilityType, std::forward<std::vector<FacilityTreeNodeBase*>>(children)),
        _value(DataTypeMap<T>::value) {}

  /**
   * @brief Sets the value of the node if T != DataTypes::None
   *
   * @param value The new value for the node
   */
  template <DataTypes Q = T>
  typename std::enable_if<Q != DataTypes::None, void>::type set(const typename DataTypeMap<T>::type& value) {
    this->_value = value;
  }

  /**
   * @brief Returns the node's value if T != DataTypes::None
   *
   * @return const DataTypeMap<T>::type& Constant reference to the C++ representation of the SimConnect type
   */
  template <DataTypes Q = T>
  typename std::enable_if<Q != DataTypes::None, const typename DataTypeMap<T>::type&>::type get() const {
    return this->_value;
  }

  /**
   * @brief Creates a new node without children if T != DataTypes::None
   *
   * @param name The node's name
   * @return FacilityTreeNode<Q>* Pointer to the new node instance
   */
  template <DataTypes Q = T>
  static typename std::enable_if<Q != DataTypes::None, FacilityTreeNode<Q>*>::type create(const std::string& name) {
    return new FacilityTreeNode<Q>(name, FacilityDataTypes::Undefined);
  }

  /**
   * @brief Creates a new node with children if T == DataTypes::None
   *
   * @param name The node's name
   * @param facilityType The node's facility type
   * @param children The node's children
   * @return FacilityTreeNode<Q>* Pointer to the new node instance
   */
  template <DataTypes Q = T>
  static typename std::enable_if<Q == DataTypes::None, FacilityTreeNode<Q>*>::type create(FacilityDataTypes facilityType,
                                                                                          std::vector<FacilityTreeNodeBase*>&& children) {
    return new FacilityTreeNode<Q>(MapFacilityDataType::translate(facilityType), facilityType,
                                   std::forward<std::vector<FacilityTreeNodeBase*>>(children));
  }
};

/**
 * @brief Tree class to handle the different nodes and provide convenience functions for the access
 * The tree can be interpreted as a filesystem path with "/" as the delimiter to request specific elements.
 * The visitor definitions are only used for internal access
 */
class FacilityTree : base::Visitor<FacilityTreeNodeBase,
                                   FacilityTreeNode<DataTypes::None>,
                                   FacilityTreeNode<DataTypes::Int32>,
                                   FacilityTreeNode<DataTypes::UInt32>,
                                   FacilityTreeNode<DataTypes::Float32>,
                                   FacilityTreeNode<DataTypes::Float64>,
                                   FacilityTreeNode<DataTypes::String8>,
                                   FacilityTreeNode<DataTypes::String64>,
                                   FacilityTreeNode<DataTypes::CharArray>> {
 private:
  FacilityTreeNodeBase* _root;
  std::variant<std::int32_t, std::uint32_t, float, double, std::string> _value;
  std::vector<std::string> _path;
  std::size_t _index;
  DataTypes _type;
  bool _foundNode;
  bool _setValue;

  /**
   * @brief Splits a string into a handable path for the tree functions
   * The result is stored in the member variable _path
   *
   * @param s The string that needs to be splitted
   */
  void split(const std::string& s) {
    size_t pos_start = 0, pos_end;
    std::string token;
    this->_path.clear();

    while ((pos_end = s.find("/", pos_start)) != std::string::npos) {
      token = s.substr(pos_start, pos_end - pos_start);
      pos_start = pos_end + 1;
      this->_path.push_back(token);
    }

    this->_path.push_back(s.substr(pos_start));
  }

  /**
   * @brief Calls the correct visit function according to the contained data type
   *
   * @param node The node that needs to be visited
   */
  void visit(FacilityTreeNodeBase& node) override {
    switch (node.type()) {
      case DataTypes::None:
        this->visit(static_cast<FacilityTreeNode<DataTypes::None>&>(node));
        break;
      case DataTypes::Int32:
        this->visit(static_cast<FacilityTreeNode<DataTypes::Int32>&>(node));
        break;
      case DataTypes::UInt32:
        this->visit(static_cast<FacilityTreeNode<DataTypes::UInt32>&>(node));
        break;
      case DataTypes::Float32:
        this->visit(static_cast<FacilityTreeNode<DataTypes::Float32>&>(node));
        break;
      case DataTypes::Float64:
        this->visit(static_cast<FacilityTreeNode<DataTypes::Float64>&>(node));
        break;
      case DataTypes::String8:
        this->visit(static_cast<FacilityTreeNode<DataTypes::String8>&>(node));
        break;
      case DataTypes::String64:
        this->visit(static_cast<FacilityTreeNode<DataTypes::String64>&>(node));
        break;
      case DataTypes::CharArray:
        this->visit(static_cast<FacilityTreeNode<DataTypes::CharArray>&>(node));
        break;
      default:
        std::cerr << "MSFSAL: FacilityTree: Unknown data type in visit(): " << std::to_string(static_cast<int>(node.type())) << std::endl;
        break;
    }
  }
  void visit(FacilityTreeNode<DataTypes::None>& node) override {
    if (this->_index >= this->_path.size() || node.name() != this->_path[this->_index]) {
      this->_foundNode = false;
      return;
    }

    this->_index += 1;
    for (const auto& child : std::as_const(node.children())) {
      child->accept(*this);
      if (this->_foundNode) {
        break;
      }
    }
  }
  /**
   * @brief Generic visit-function for leaf nodes
   * It gets or sets the value of the node (if it matches the path) according to the configuration.
   * The path and the type have to be correct
   *
   * @tparam D The SimConnect data type
   * @param node The currently visited node
   */
  template <DataTypes D>
  void visit(FacilityTreeNode<D>& node) {
    if (this->_index != (this->_path.size() - 1) || node.name() != this->_path[this->_index] || D != this->_type) {
      this->_foundNode = false;
      return;
    }

    this->_foundNode = true;
    if (this->_setValue) {
      node.set(std::get<typename DataTypeMap<D>::type>(this->_value));
    } else {
      this->_value = node.get();
    }
  }
  void visit(FacilityTreeNode<DataTypes::Int32>& node) override { this->visit<DataTypes::Int32>(node); }
  void visit(FacilityTreeNode<DataTypes::UInt32>& node) override { this->visit<DataTypes::UInt32>(node); }
  void visit(FacilityTreeNode<DataTypes::Float32>& node) override { this->visit<DataTypes::Float32>(node); }
  void visit(FacilityTreeNode<DataTypes::Float64>& node) override { this->visit<DataTypes::Float64>(node); }
  void visit(FacilityTreeNode<DataTypes::String8>& node) override { this->visit<DataTypes::String8>(node); }
  void visit(FacilityTreeNode<DataTypes::String64>& node) override { this->visit<DataTypes::String64>(node); }
  void visit(FacilityTreeNode<DataTypes::CharArray>& node) override { this->visit<DataTypes::CharArray>(node); }

 public:
  /**
   * @brief Construct a new Tree object
   * The Tree object takes over the memory responsibility of root
   *
   * @param root The root node of the tree
   */
  FacilityTree(FacilityTreeNodeBase* root)
      : _root(root), _value(), _path(), _index(0), _type(DataTypes::None), _foundNode(false), _setValue(false) {}
  /**
   * @brief Moves one tree into an other
   *
   * @param other The source tree
   */
  FacilityTree(FacilityTree&& other)
      : _root(other._root),
        _value(std::move(other._value)),
        _path(std::move(other._path)),
        _index(other._index),
        _type(other._type),
        _foundNode(other._foundNode),
        _setValue(other._setValue) {
    other._root = nullptr;
  }
  /**
   * @brief Destroy the Tree object and the underlying tree
   */
  ~FacilityTree() {
    if (this->_root != nullptr) {
      delete this->_root;
      this->_root = nullptr;
    }
  }

  /**
   * @brief Gets the value of a node according to the given path
   *
   * @tparam D The expected type of the node
   * @param path The "/" delimited path to the leaf
   * @return std::tuple<bool, typename DataTypeMap<D>::type> The tuple of the result.
   * True indicates that the node was found, otherwise false
   */
  template <DataTypes D>
  std::tuple<bool, typename DataTypeMap<D>::type> get(const std::string& path) {
    if (this->_root == nullptr) {
      return std::make_tuple(false, DataTypeMap<D>::value);
    }

    this->_setValue = false;
    this->split(path);
    this->_index = 0;
    this->_type = D;

    this->visit(*this->_root);
    return std::make_tuple(this->_foundNode, std::get<typename DataTypeMap<D>::type>(this->_value));
  }

  /**
   * @brief Sets the value of a node according to the given path
   *
   * @tparam D The expected type of the node
   * @param path The "/" delimited path to the leaf
   * @param value The new value for the node
   * @return bool True indicates that the node was found and the value is set, otherwise false
   */
  template <DataTypes D>
  bool set(const std::string& path, const typename DataTypeMap<D>::type& value) {
    if (this->_root == nullptr) {
      return false;
    }

    this->_setValue = true;
    this->_value = value;
    this->split(path);
    this->_index = 0;
    this->_type = D;

    this->visit(*this->_root);
    return this->_foundNode;
  }

  /**
   * @brief Returns the root node of the underlying tree
   *
   * @return FacilityTreeNodeBase* Pointer to the root node
   */
  FacilityTreeNodeBase* root() const { return this->_root; }
};

/**
 * @brief Defines the facility to request data from the simulator
 * It uses the tree structure to define the requested data structure.
 * The tree contains the received values when the received() callback is triggered.
 */
class Facility : public base::Receivable<FacilityTree>,
                 base::Visitor<FacilityTreeNodeBase,
                               FacilityTreeNode<DataTypes::None>,
                               FacilityTreeNode<DataTypes::Int32>,
                               FacilityTreeNode<DataTypes::UInt32>,
                               FacilityTreeNode<DataTypes::Float32>,
                               FacilityTreeNode<DataTypes::Float64>,
                               FacilityTreeNode<DataTypes::String8>,
                               FacilityTreeNode<DataTypes::String64>,
                               FacilityTreeNode<DataTypes::CharArray>> {
  friend Connection;

 private:
  HANDLE* _connection;
  std::uint32_t _requestId;
  FacilityTree _tree;

  /**
   * @brief Calls the correct visit function to handle the structure correct
   *
   * @param node The current node
   */
  void visit(FacilityTreeNodeBase& node) override {
    switch (node.type()) {
      case DataTypes::None:
        this->visit(static_cast<FacilityTreeNode<DataTypes::None>&>(node));
        break;
      case DataTypes::Int32:
        this->visit(static_cast<FacilityTreeNode<DataTypes::Int32>&>(node));
        break;
      case DataTypes::UInt32:
        this->visit(static_cast<FacilityTreeNode<DataTypes::UInt32>&>(node));
        break;
      case DataTypes::Float32:
        this->visit(static_cast<FacilityTreeNode<DataTypes::Float32>&>(node));
        break;
      case DataTypes::Float64:
        this->visit(static_cast<FacilityTreeNode<DataTypes::Float64>&>(node));
        break;
      case DataTypes::String8:
        this->visit(static_cast<FacilityTreeNode<DataTypes::String8>&>(node));
        break;
      case DataTypes::String64:
        this->visit(static_cast<FacilityTreeNode<DataTypes::String64>&>(node));
        break;
      case DataTypes::CharArray:
        this->visit(static_cast<FacilityTreeNode<DataTypes::CharArray>&>(node));
        break;
      default:
        std::cerr << "MSFSAL: Facility: Unknown data type in visit(): " << std::to_string(static_cast<int>(node.type())) << std::endl;
    }
  }
  /**
   * @brief Defines the facility structure in simconnect for the next tree level
   * The OPEN and CLOSE calls are handled internally
   * @param node The non-leaf node
   */
  void visit(FacilityTreeNode<DataTypes::None>& node) override {
    const std::string open("OPEN " + node.name());
    const std::string close("CLOSE " + node.name());

    HRESULT result = SimConnect_AddToFacilityDefinition(*this->_connection, this->_requestId, open.c_str());
    if (!SUCCEEDED(result)) {
      std::cerr << "MSFSAL: Facility: Unable to open data for request: " << node.name() << std::endl;
      return;
    }

    for (const auto& child : std::as_const(node.children())) {
      child->accept(*this);
    }

    result = SimConnect_AddToFacilityDefinition(*this->_connection, this->_requestId, close.c_str());
    if (!SUCCEEDED(result)) {
      std::cerr << "MSFSAL: Facility: Unable to close data for request: " << node.name() << std::endl;
      return;
    }
  }
  /**
   * @brief Defines the leaf structure in the simconnect tree
   *
   * @tparam D The datatype of the leaf
   * @param node The currently relevant leaf
   */
  template <DataTypes D>
  void visit(FacilityTreeNode<D>& node) {
    HRESULT result = SimConnect_AddToFacilityDefinition(*this->_connection, this->_requestId, node.name().c_str());
    if (!SUCCEEDED(result)) {
      std::cerr << "MSFSAL: Facility: Unable to add data to request: " << node.name() << std::endl;
      return;
    }
  }
  void visit(FacilityTreeNode<DataTypes::Int32>& node) override { this->visit<DataTypes::Int32>(node); }
  void visit(FacilityTreeNode<DataTypes::UInt32>& node) override { this->visit<DataTypes::UInt32>(node); }
  void visit(FacilityTreeNode<DataTypes::Float32>& node) override { this->visit<DataTypes::Float32>(node); }
  void visit(FacilityTreeNode<DataTypes::Float64>& node) override { this->visit<DataTypes::Float64>(node); }
  void visit(FacilityTreeNode<DataTypes::String8>& node) override { this->visit<DataTypes::String8>(node); }
  void visit(FacilityTreeNode<DataTypes::String64>& node) override { this->visit<DataTypes::String64>(node); }
  void visit(FacilityTreeNode<DataTypes::CharArray>& node) override { this->visit<DataTypes::CharArray>(node); }

  /**
   * @brief Find the parent node of entries to handle the specific entries
   *
   * @param facilityType The relevant facility type of received data
   * @param root The local root for checks
   * @return FacilityTreeNodeBase* The parent node of the entries or nullptr
   */
  static FacilityTreeNodeBase* findFacilityNode(FacilityDataTypes facilityType, FacilityTreeNodeBase* root) {
    if (root == nullptr) {
      return nullptr;
    }

    if (root->facilityType() == facilityType) {
      return root;
    }

    for (auto& child : root->children()) {
      if (child->type() == DataTypes::None) {
        auto retval = Facility::findFacilityNode(facilityType, child);
        if (retval != nullptr) {
          return retval;
        }
      }
    }

    return nullptr;
  }

  template <DataTypes T>
  typename std::enable_if<T != DataTypes::CharArray, std::size_t>::type readData(FacilityTreeNode<T>& node, const std::uint8_t* data) {
    if constexpr (T == DataTypes::String8 || T == DataTypes::String64) {
      node.set(typename DataTypeMap<T>::type(reinterpret_cast<const char*>(data)));
    } else {
      node.set(*reinterpret_cast<const typename DataTypeMap<T>::type*>(data));
    }

    return DataTypeMap<T>::dataSize;
  }

  template <DataTypes T>
  typename std::enable_if<T == DataTypes::CharArray, std::size_t>::type readData(FacilityTreeNode<T>& node, const std::uint8_t* data) {
    std::string content(reinterpret_cast<const char*>(data));
    node.set(content);
    return content.length();
  }

  std::size_t readData(FacilityTreeNodeBase* node, const std::uint8_t* data) {
    switch (node->type()) {
      case DataTypes::Int32:
        return this->readData(static_cast<FacilityTreeNode<DataTypes::Int32>&>(*node), data);
      case DataTypes::UInt32:
        return this->readData(static_cast<FacilityTreeNode<DataTypes::UInt32>&>(*node), data);
      case DataTypes::Float32:
        return this->readData(static_cast<FacilityTreeNode<DataTypes::Float32>&>(*node), data);
      case DataTypes::Float64:
        return this->readData(static_cast<FacilityTreeNode<DataTypes::Float64>&>(*node), data);
      case DataTypes::String8:
        return this->readData(static_cast<FacilityTreeNode<DataTypes::String8>&>(*node), data);
      case DataTypes::String64:
        return this->readData(static_cast<FacilityTreeNode<DataTypes::String64>&>(*node), data);
      case DataTypes::CharArray:
        return this->readData(static_cast<FacilityTreeNode<DataTypes::CharArray>&>(*node), data);
      default:
        std::cerr << "MSFSAL: Facility: Unknown data type in , data(): " << std::to_string(static_cast<int>(node->type())) << std::endl;
        return 0;
    }
  }

  void receivedData(FacilityDataTypes facilityType, const std::uint8_t* data) {
    auto parent = Facility::findFacilityNode(facilityType, this->_tree.root());
    if (parent == nullptr) {
      std::cerr << "MSFSAL: Facility: Unable to find parent of type: " << std::to_string(static_cast<int>(facilityType)) << std::endl;
      return;
    }

    std::size_t byteOffset = 0;
    for (auto& child : parent->children()) {
      if (child->type() != DataTypes::None) {
        byteOffset += this->readData(child, &data[byteOffset]);
      }
    }
  }

  void receivedAllData() {
    std::cout << "OANS: RECEIVED ALL" << std::endl;
    this->received(this->_tree);
  }

 public:
  /**
   * @brief Construct a new Facility object
   *
   * @param connection The established connection to SimConnect
   * @param requestId The unique request ID
   * @param tree The tree structure for the request
   */
  Facility(HANDLE* connection, std::uint32_t requestId, FacilityTree&& tree)
      : _connection(connection), _requestId(requestId), _tree(std::forward<FacilityTree>(tree)) {
    this->visit(*this->_tree.root());
  }

  /**
   * @brief Requests data for a specific airport and region
   *
   * @param icao Airport's ICAO code
   * @param region Region for NDB or VOR data
   * @return true Request was successfully sent
   * @return false Request failed
   */
  bool request(const std::string& icao, const std::string& region = "") {
    auto result = SimConnect_RequestFacilityData(*this->_connection, this->_requestId, this->_requestId, icao.c_str(), region.c_str());
    return SUCCEEDED(result);
  }
};

}  // namespace simconnect
