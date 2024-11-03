use bytemuck::AnyBitPattern;
use clap::Parser;
use csv::WriterBuilder;
use flate2::bufread::GzDecoder;
use std::{
    fs::{File, OpenOptions},
    io::{prelude::*, BufReader, BufWriter, Error, ErrorKind},
    mem,
};

mod a320;
mod a320_headers;
mod a380;
mod a380_headers;
mod csv_header_serializer;
mod error;

#[derive(Debug)]
enum AircraftType {
    A320,
    A380,
}

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Input file
    #[arg(short, long)]
    input: String,
    /// Output file
    #[arg(short, long, required_unless_present_any(["get_input_file_version", "get_raw_input_file_version"]))]
    output: Option<String>,
    /// Delimiter
    #[arg(short, long, default_value = ",")]
    delimiter: char,
    /// Input file is not compressed
    #[arg(short, long, default_value_t = false)]
    no_compression: bool,
    /// Print struct size
    #[arg(short, long, default_value_t = false)]
    print_struct_size: bool,
    /// Print interface version and aircraft type of input file
    #[arg(short, long, default_value_t = false)]
    get_input_file_version: bool,
    /// Print raw interface version of input file
    #[arg(short = 'r', long, default_value_t = false)]
    get_raw_input_file_version: bool,
}

// Read number of bytes specified by the size of T from the binary file
pub fn read_bytes<T: AnyBitPattern>(reader: &mut impl Read) -> Result<T, Error> {
    let size = mem::size_of::<T>();

    // allocate the buffer that will hold the value read from the binary
    let mut buf = vec![0u8; size];

    // now read from the reader into the buffer
    reader.read_exact(&mut buf)?;

    // If the read was successful, reinterpret the bytes as the struct, and return
    let res = bytemuck::from_bytes::<T>(buf.as_slice());

    Ok(*res)
}

fn main() -> Result<(), std::io::Error> {
    // Parse CLI arguments
    let args = Args::parse();

    // Open the input file
    let in_file = File::open(args.input.trim())
        .map_err(|e| std::io::Error::new(e.kind(), "Failed to open input file!"))?;

    // Create Gzip Reader
    let mut reader: Box<dyn Read> = if args.no_compression {
        Box::new(BufReader::new(in_file))
    } else {
        Box::new(GzDecoder::new(BufReader::new(in_file)))
    };

    // Read file version
    let file_format_version = read_bytes::<u64>(&mut reader)?;
    let aircraft_type = if file_format_version > a380::INTERFACE_MIN_VERSION {
        AircraftType::A380
    } else {
        AircraftType::A320
    };

    let aircraft_interface_version = match aircraft_type {
        AircraftType::A320 => a320::INTERFACE_VERSION,
        AircraftType::A380 => a380::INTERFACE_VERSION,
    };

    // Print or check file version
    if args.get_input_file_version {
        println!(
            "Aircraft Type is {:?}, Interface version is {}",
            aircraft_type, file_format_version
        );
        return Ok(());
    } else if args.get_raw_input_file_version {
        println!("{}", file_format_version);
        return Ok(());
    } else if aircraft_interface_version != file_format_version {
        return Err(std::io::Error::new(
            ErrorKind::InvalidInput,
            format!(
                "Mismatch between converter and file version (expected {aircraft_interface_version}, got {file_format_version})",
            ),
        ));
    }

    // Print info on conversion start
    println!(
        "Converting from '{}' to '{}' for aircraft type '{:?}' with interface version '{}' and delimiter '{}'",
        args.input, args.output.clone().unwrap(), aircraft_type, file_format_version, args.delimiter
    );

    // Open or create output file in truncate mode
    let out_file = OpenOptions::new()
        .write(true)
        .truncate(true)
        .create(true)
        .open(args.output.clone().unwrap().trim())
        .map_err(|e| std::io::Error::new(e.kind(), "Failed to open output file!"))?;

    let mut buf_writer = BufWriter::new(out_file);

    let mut counter = 0;

    // Generate and write the header
    let header = match aircraft_type {
        AircraftType::A320 => {
            csv_header_serializer::to_string(&a320::FdrData::default(), args.delimiter)
        }
        AircraftType::A380 => {
            csv_header_serializer::to_string(&a380::FdrData::default(), args.delimiter)
        }
    }
    .map_err(|_| std::io::Error::new(ErrorKind::Other, "Failed to generate header."))?;

    buf_writer.write(header.as_bytes())?;

    // Create the CSV writer, and serialize the file.
    let mut writer = WriterBuilder::new()
        .delimiter(args.delimiter as u8)
        .has_headers(false)
        .from_writer(buf_writer);

    match aircraft_type {
        AircraftType::A320 => {
            while let Ok(fdr_data) = a320::read_record(&mut reader) {
                writer.serialize(&fdr_data)?;

                counter += 1;

                if counter % 1000 == 0 {
                    print!("Processed {counter} entries...\r");
                    std::io::stdout().flush()?;
                }
            }
        }
        AircraftType::A380 => {
            while let Ok(fdr_data) = a380::read_record(&mut reader) {
                writer.serialize(&fdr_data)?;

                counter += 1;

                if counter % 1000 == 0 {
                    print!("Processed {counter} entries...\r");
                    std::io::stdout().flush()?;
                }
            }
        }
    }

    println!("Processed {counter} entries...");

    Result::Ok(())
}
