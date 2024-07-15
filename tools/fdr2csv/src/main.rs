use bytemuck;
use bytemuck::AnyBitPattern;
use clap::Parser;
use csv::WriterBuilder;
use flate2::bufread::GzDecoder;
use headers::{ap_raw_output, ap_sm_output, athr_out, AdditionalData, EngineData};
use serde::Serialize;
use std::{
    fs::{File, OpenOptions},
    io::{prelude::*, BufReader, BufWriter, Error, ErrorKind},
    mem,
};

mod csv_header_serializer;
mod error;
mod headers;

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Input file
    #[arg(short, long)]
    input: String,
    /// Output file
    #[arg(short, long)]
    output: String,
    /// Delimiter
    #[arg(short, long, default_value = ",")]
    delimiter: String,
    /// Input file is not compressed
    #[arg(short, long, default_value_t = false)]
    no_compression: bool,
    /// Print struct size
    #[arg(short, long, default_value_t = false)]
    print_struct_size: bool,
    /// Print interface version of input file
    #[arg(short, long, default_value_t = false)]
    get_input_file_version: bool,
}

const INTERFACE_VERSION: u64 = 25;

// Read number of bytes specified by the size of T from the binary file
fn read_bytes<T: AnyBitPattern>(reader: &mut impl Read, data: &mut T) -> Result<(), Error> {
    let size = mem::size_of::<T>();

    // allocate the buffer that will hold the value read from the binary
    let mut buf = vec![0u8; size];

    // now read from the reader into the buffer
    match reader.read_exact(&mut buf) {
        Ok(()) => {
            // If the read was successful, reinterpret the bytes as the struct, and write them
            // into the input data
            let res: &T = bytemuck::from_bytes(buf.as_slice());
            *data = *res;
            return Ok(());
        }
        // If the read was not successful (i.e. EOF reached), return Err.
        Err(e) => return Err(e),
    }
}

// A single FDR record
#[derive(Serialize, Default)]
struct FdrData {
    ap_sm: ap_sm_output,
    ap_laws: ap_raw_output,
    athr: athr_out,
    engine_data: EngineData,
    additional_data: AdditionalData,
}

// These are helper functions to read in a whole FDR record.
fn read_record(reader: &mut impl Read, data: &mut FdrData) -> Result<(), Error> {
    read_bytes(reader, &mut data.ap_sm)?;
    read_bytes(reader, &mut data.ap_laws)?;
    read_bytes(reader, &mut data.athr)?;
    read_bytes(reader, &mut data.engine_data)?;
    read_bytes(reader, &mut data.additional_data)?;

    Ok(())
}

fn main() -> Result<(), std::io::Error> {
    // Parse CLI arguments
    let args = Args::parse();

    // Open the input file
    let in_file = match File::open(args.input.trim()) {
        Err(_) => {
            return Result::Err(std::io::Error::new(
                ErrorKind::NotFound,
                "Failed to open input file!",
            ));
        }
        Ok(f) => f,
    };

    // Create Gzip Reader
    let mut reader: Box<dyn Read> = if args.no_compression {
        Box::new(BufReader::new(in_file))
    } else {
        Box::new(GzDecoder::new(BufReader::new(in_file)))
    };

    // Read file version
    let mut file_format_version = u64::default();
    read_bytes(&mut reader, &mut file_format_version)?;

    // Print or check file version
    if args.get_input_file_version {
        println!("Interface version is {}", file_format_version);
        return Result::Ok(());
    } else if INTERFACE_VERSION != file_format_version {
        return Result::Err(std::io::Error::new(
            ErrorKind::InvalidInput,
            format!(
                "Mismatch between converter and file version (expected {}, got {})",
                INTERFACE_VERSION, file_format_version
            ),
        ));
    }

    // Print info on conversion start
    println!(
        "Converting from '{}' to '{}' with interface version '{}' and delimiter '{}'",
        args.input, args.output, file_format_version, args.delimiter
    );

    // Open or create output file in truncate mode
    let out_file = match OpenOptions::new()
        .write(true)
        .truncate(true)
        .create(true)
        .open(args.output.trim())
    {
        Err(_) => {
            return Result::Err(std::io::Error::new(
                ErrorKind::NotFound,
                "Failed to open output file!",
            ));
        }
        Ok(f) => f,
    };

    let mut buf_writer = BufWriter::new(out_file);

    let mut counter = 0;

    let mut buf = FdrData::default();

    // Generate and write the header
    let header = match csv_header_serializer::to_string(&buf, &args.delimiter) {
        Ok(s) => s,
        Err(_e) => {
            return Err(std::io::Error::new(
                ErrorKind::Other,
                "Failed to generate header.",
            ))
        }
    };
    buf_writer.write(header.as_bytes())?;

    // Create the CSV writer, and serialize the file.
    let mut writer = WriterBuilder::new()
        .delimiter(args.delimiter.as_bytes().get(0).unwrap().to_owned())
        .has_headers(false)
        .from_writer(buf_writer);

    while let Ok(()) = read_record(&mut reader, &mut buf) {
        writer.serialize(&buf)?;

        counter += 1;

        if counter % 1000 == 0 {
            print!("Processed {} entries...\r", counter);
            std::io::stdout().flush()?;
        }
    }

    println!("Processed {} entries...", counter);

    Result::Ok(())
}
