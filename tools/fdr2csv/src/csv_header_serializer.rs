use serde::{ser, Serialize};

use crate::error::{Error, Result};

// By convention, the public API of a Serde serializer is one or more `to_abc`
// functions such as `to_string`, `to_bytes`, or `to_writer` depending on what
// Rust types the serializer is able to produce as output.
//
// This basic serializer supports only `to_string`.
pub fn to_string<T>(value: &T, delimiter: char) -> Result<String>
where
    T: Serialize,
{
    let mut serializer = CsvHeaderSerializer {
        output: String::new(),
        field_name_list: Vec::new(),
        delimiter,
    };
    value.serialize(&mut serializer)?;

    // Trim trailing comma
    serializer.output.pop();
    // Add newline and return
    Ok(serializer.output + "\n")
}

pub struct CsvHeaderSerializer {
    // The output string will be populated after each elementary data type in the record.
    output: String,

    // The field name list will keep track of the "higher" level field names
    field_name_list: Vec<String>,

    delimiter: char,
}

impl CsvHeaderSerializer {
    // This method will be called if an elementary data type has been encountered.
    // The field name list will then be joined together with a period as separator,
    // and at the end the delimiter will be appended.
    fn serialize_scalar(&mut self) -> Result<()> {
        self.output += &self.field_name_list.join(".");
        self.output.push(self.delimiter);

        Ok(())
    }
}

impl<'a> ser::Serializer for &'a mut CsvHeaderSerializer {
    // The output type produced by this `Serializer` during successful
    // serialization. Most serializers that produce text or binary output should
    // set `Ok = ()` and serialize into an `io::Write` or buffer contained
    // within the `Serializer` instance, as happens here. Serializers that build
    // in-memory data structures may be simplified by using `Ok` to propagate
    // the data structure around.
    type Ok = ();

    // The error type when some error occurs during serialization.
    type Error = Error;

    // Associated types for keeping track of additional state while serializing
    // compound data structures like sequences and maps. In this case no
    // additional state is required beyond what is already stored in the
    // Serializer struct.
    type SerializeSeq = Self;
    type SerializeTuple = Self;
    type SerializeTupleStruct = Self;
    type SerializeTupleVariant = Self;
    type SerializeMap = Self;
    type SerializeStruct = Self;
    type SerializeStructVariant = Self;

    // All of the elementary data times will call the serialize_scalar function
    // when being serialized, and thus generate the output.
    fn serialize_bool(self, _v: bool) -> Result<()> {
        self.serialize_scalar()
    }

    fn serialize_i8(self, _v: i8) -> Result<()> {
        self.serialize_scalar()
    }

    fn serialize_i16(self, _v: i16) -> Result<()> {
        self.serialize_scalar()
    }

    fn serialize_i32(self, _vv: i32) -> Result<()> {
        self.serialize_scalar()
    }

    fn serialize_i64(self, _v: i64) -> Result<()> {
        self.serialize_scalar()
    }

    fn serialize_u8(self, _v: u8) -> Result<()> {
        self.serialize_scalar()
    }

    fn serialize_u16(self, _v: u16) -> Result<()> {
        self.serialize_scalar()
    }

    fn serialize_u32(self, _v: u32) -> Result<()> {
        self.serialize_scalar()
    }

    fn serialize_u64(self, _v: u64) -> Result<()> {
        self.serialize_scalar()
    }

    fn serialize_f32(self, _v: f32) -> Result<()> {
        self.serialize_scalar()
    }

    fn serialize_f64(self, _v: f64) -> Result<()> {
        self.serialize_scalar()
    }

    fn serialize_char(self, _v: char) -> Result<()> {
        self.serialize_scalar()
    }

    fn serialize_str(self, _v: &str) -> Result<()> {
        self.serialize_scalar()
    }

    fn serialize_bytes(self, _v: &[u8]) -> Result<()> {
        Err(Error::Message("Unsupported datatype".to_owned()))
    }

    fn serialize_none(self) -> Result<()> {
        Err(Error::Message("Unsupported datatype".to_owned()))
    }

    fn serialize_some<T>(self, _value: &T) -> Result<()>
    where
        T: ?Sized + Serialize,
    {
        Err(Error::Message("Unsupported datatype".to_owned()))
    }

    fn serialize_unit(self) -> Result<()> {
        Err(Error::Message("Unsupported datatype".to_owned()))
    }

    fn serialize_unit_struct(self, _name: &'static str) -> Result<()> {
        Err(Error::Message("Unsupported datatype".to_owned()))
    }

    fn serialize_unit_variant(
        self,
        _name: &'static str,
        _variant_index: u32,
        _variant: &'static str,
    ) -> Result<()> {
        Err(Error::Message("Unsupported datatype".to_owned()))
    }

    fn serialize_newtype_struct<T>(self, _name: &'static str, _value: &T) -> Result<()>
    where
        T: ?Sized + Serialize,
    {
        Err(Error::Message("Unsupported datatype".to_owned()))
    }

    fn serialize_newtype_variant<T>(
        self,
        _name: &'static str,
        _variant_index: u32,
        _variant: &'static str,
        _value: &T,
    ) -> Result<()>
    where
        T: ?Sized + Serialize,
    {
        Err(Error::Message("Unsupported datatype".to_owned()))
    }

    fn serialize_seq(self, _len: Option<usize>) -> Result<Self::SerializeSeq> {
        Err(Error::Message("Unsupported datatype".to_owned()))
    }

    fn serialize_tuple(self, _len: usize) -> Result<Self::SerializeTuple> {
        Err(Error::Message("Unsupported datatype".to_owned()))
    }

    // Tuple structs look just like sequences in JSON.
    fn serialize_tuple_struct(
        self,
        _name: &'static str,
        _len: usize,
    ) -> Result<Self::SerializeTupleStruct> {
        Err(Error::Message("Unsupported datatype".to_owned()))
    }

    fn serialize_tuple_variant(
        self,
        _name: &'static str,
        _variant_index: u32,
        _variant: &'static str,
        _len: usize,
    ) -> Result<Self::SerializeTupleVariant> {
        Err(Error::Message("Unsupported datatype".to_owned()))
    }

    fn serialize_map(self, _len: Option<usize>) -> Result<Self::SerializeMap> {
        Err(Error::Message("Unsupported datatype".to_owned()))
    }

    // For structs, return this as the Serializer. Nothing else needs to be done here.
    fn serialize_struct(self, _name: &'static str, _len: usize) -> Result<Self::SerializeStruct> {
        Ok(self)
    }

    fn serialize_struct_variant(
        self,
        _name: &'static str,
        _variant_index: u32,
        _variant: &'static str,
        _len: usize,
    ) -> Result<Self::SerializeStructVariant> {
        Err(Error::Message("Unsupported datatype".to_owned()))
    }
}

// The following 7 impls deal with the serialization of compound types like
// sequences and maps. Serialization of such types is begun by a Serializer
// method and followed by zero or more calls to serialize individual elements of
// the compound type and one call to end the compound type.
//
// This impl is SerializeSeq so these methods are called after `serialize_seq`
// is called on the Serializer.
impl<'a> ser::SerializeSeq for &'a mut CsvHeaderSerializer {
    // Must match the `Ok` type of the serializer.
    type Ok = ();
    // Must match the `Error` type of the serializer.
    type Error = Error;

    // Serialize a single element of the sequence.
    fn serialize_element<T>(&mut self, _value: &T) -> Result<()>
    where
        T: ?Sized + Serialize,
    {
        unreachable!();
    }

    // Close the sequence.
    fn end(self) -> Result<()> {
        unreachable!();
    }
}

impl<'a> ser::SerializeTuple for &'a mut CsvHeaderSerializer {
    type Ok = ();
    type Error = Error;

    fn serialize_element<T>(&mut self, _value: &T) -> Result<()>
    where
        T: ?Sized + Serialize,
    {
        unreachable!();
    }

    fn end(self) -> Result<()> {
        unreachable!();
    }
}

impl<'a> ser::SerializeTupleStruct for &'a mut CsvHeaderSerializer {
    type Ok = ();
    type Error = Error;

    fn serialize_field<T>(&mut self, _value: &T) -> Result<()>
    where
        T: ?Sized + Serialize,
    {
        unreachable!();
    }

    fn end(self) -> Result<()> {
        unreachable!();
    }
}

impl<'a> ser::SerializeTupleVariant for &'a mut CsvHeaderSerializer {
    type Ok = ();
    type Error = Error;

    fn serialize_field<T>(&mut self, _value: &T) -> Result<()>
    where
        T: ?Sized + Serialize,
    {
        unreachable!()
    }

    fn end(self) -> Result<()> {
        unreachable!()
    }
}

impl<'a> ser::SerializeMap for &'a mut CsvHeaderSerializer {
    type Ok = ();
    type Error = Error;

    fn serialize_key<T>(&mut self, _key: &T) -> Result<()>
    where
        T: ?Sized + Serialize,
    {
        unreachable!()
    }

    fn serialize_value<T>(&mut self, _value: &T) -> Result<()>
    where
        T: ?Sized + Serialize,
    {
        unreachable!()
    }

    fn end(self) -> Result<()> {
        unreachable!()
    }
}

// Here we add the struct field name handling
impl<'a> ser::SerializeStruct for &'a mut CsvHeaderSerializer {
    type Ok = ();
    type Error = Error;

    fn serialize_field<T>(&mut self, key: &'static str, value: &T) -> Result<()>
    where
        T: ?Sized + Serialize,
    {
        // For each struct field we encounter, we first add the field name to
        // the field name list.
        self.field_name_list.push(key.to_owned());
        // Then, we serialize the field. If it is another struct, the fields will again be
        // added to the field name list, until an elementary data type is finally encountered.
        value.serialize(&mut **self)?;
        // After we have serialized the field, pop the field name again to clear for the next field.
        self.field_name_list.pop();
        Ok(())
    }

    // Nothing needs to be done here.
    fn end(self) -> Result<()> {
        Ok(())
    }
}

impl<'a> ser::SerializeStructVariant for &'a mut CsvHeaderSerializer {
    type Ok = ();
    type Error = Error;

    fn serialize_field<T>(&mut self, _key: &'static str, _value: &T) -> Result<()>
    where
        T: ?Sized + Serialize,
    {
        unreachable!();
    }

    fn end(self) -> Result<()> {
        unreachable!();
    }
}
