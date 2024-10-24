use bytemuck::AnyBitPattern;
use clap::Parser;
use csv::WriterBuilder;
use fdr2csv_common::csv_header_serializer;
use flate2::bufread::GzDecoder;
use headers::{
    ap_raw_output, ap_sm_output, athr_out, base_elac_analog_outputs, base_elac_discrete_outputs,
    base_elac_out_bus, base_fac_analog_outputs, base_fac_bus, base_fac_discrete_outputs,
    base_sec_analog_outputs, base_sec_discrete_outputs, base_sec_out_bus, AdditionalData,
    EngineData,
};
use serde::Serialize;
use std::{
    fs::{File, OpenOptions},
    io::{prelude::*, BufReader, BufWriter, Error, ErrorKind},
    mem,
};

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
    delimiter: char,
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

const INTERFACE_VERSION: u64 = 3200001;

// Read number of bytes specified by the size of T from the binary file
fn read_bytes<T: AnyBitPattern>(reader: &mut impl Read) -> Result<T, Error> {
    let size = mem::size_of::<T>();

    // allocate the buffer that will hold the value read from the binary
    let mut buf = vec![0u8; size];

    // now read from the reader into the buffer
    reader.read_exact(&mut buf)?;

    // If the read was successful, reinterpret the bytes as the struct, and return
    let res = bytemuck::from_bytes::<T>(buf.as_slice());

    Ok(*res)
}

// A single FDR record
#[derive(Serialize, Default)]
struct FdrData {
    elac_1_bus: base_elac_out_bus,
    elac_1_discrete: base_elac_discrete_outputs,
    elac_1_analog: base_elac_analog_outputs,
    elac_2_bus: base_elac_out_bus,
    elac_2_discrete: base_elac_discrete_outputs,
    elac_2_analog: base_elac_analog_outputs,
    sec_1_bus: base_sec_out_bus,
    sec_1_discrete: base_sec_discrete_outputs,
    sec_1_analog: base_sec_analog_outputs,
    sec_2_bus: base_sec_out_bus,
    sec_2_discrete: base_sec_discrete_outputs,
    sec_2_analog: base_sec_analog_outputs,
    sec_3_bus: base_sec_out_bus,
    sec_3_discrete: base_sec_discrete_outputs,
    sec_3_analog: base_sec_analog_outputs,
    fac_1_bus: base_fac_bus,
    fac_1_discrete: base_fac_discrete_outputs,
    fac_1_analog: base_fac_analog_outputs,
    fac_2_bus: base_fac_bus,
    fac_2_discrete: base_fac_discrete_outputs,
    fac_2_analog: base_fac_analog_outputs,
    ap_sm: ap_sm_output,
    ap_law: ap_raw_output,
    athr: athr_out,
    engine: EngineData,
    data: AdditionalData,
}

// These are helper functions to read in a whole FDR record.
fn read_record(reader: &mut impl Read) -> Result<FdrData, Error> {
    Ok(FdrData {
        elac_1_bus: read_bytes::<base_elac_out_bus>(reader)?,
        elac_1_discrete: read_bytes::<base_elac_discrete_outputs>(reader)?,
        elac_1_analog: read_bytes::<base_elac_analog_outputs>(reader)?,
        elac_2_bus: read_bytes::<base_elac_out_bus>(reader)?,
        elac_2_discrete: read_bytes::<base_elac_discrete_outputs>(reader)?,
        elac_2_analog: read_bytes::<base_elac_analog_outputs>(reader)?,
        sec_1_bus: read_bytes::<base_sec_out_bus>(reader)?,
        sec_1_discrete: read_bytes::<base_sec_discrete_outputs>(reader)?,
        sec_1_analog: read_bytes::<base_sec_analog_outputs>(reader)?,
        sec_2_bus: read_bytes::<base_sec_out_bus>(reader)?,
        sec_2_discrete: read_bytes::<base_sec_discrete_outputs>(reader)?,
        sec_2_analog: read_bytes::<base_sec_analog_outputs>(reader)?,
        sec_3_bus: read_bytes::<base_sec_out_bus>(reader)?,
        sec_3_discrete: read_bytes::<base_sec_discrete_outputs>(reader)?,
        sec_3_analog: read_bytes::<base_sec_analog_outputs>(reader)?,
        fac_1_bus: read_bytes::<base_fac_bus>(reader)?,
        fac_1_discrete: read_bytes::<base_fac_discrete_outputs>(reader)?,
        fac_1_analog: read_bytes::<base_fac_analog_outputs>(reader)?,
        fac_2_bus: read_bytes::<base_fac_bus>(reader)?,
        fac_2_discrete: read_bytes::<base_fac_discrete_outputs>(reader)?,
        fac_2_analog: read_bytes::<base_fac_analog_outputs>(reader)?,
        ap_sm: read_bytes::<ap_sm_output>(reader)?,
        ap_law: read_bytes::<ap_raw_output>(reader)?,
        athr: read_bytes::<athr_out>(reader)?,
        engine: read_bytes::<EngineData>(reader)?,
        data: read_bytes::<AdditionalData>(reader)?,
    })
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

    // Print or check file version
    if args.get_input_file_version {
        println!("Interface version is {}", file_format_version);
        return Ok(());
    } else if INTERFACE_VERSION != file_format_version {
        return Err(std::io::Error::new(
            ErrorKind::InvalidInput,
            format!(
                "Mismatch between converter and file version (expected {INTERFACE_VERSION}, got {file_format_version})",
            ),
        ));
    }

    // Print info on conversion start
    println!(
        "Converting from '{}' to '{}' with interface version '{}' and delimiter '{}'",
        args.input, args.output, file_format_version, args.delimiter
    );

    // Open or create output file in truncate mode
    let out_file = OpenOptions::new()
        .write(true)
        .truncate(true)
        .create(true)
        .open(args.output.trim())
        .map_err(|e| std::io::Error::new(e.kind(), "Failed to open output file!"))?;

    let mut buf_writer = BufWriter::new(out_file);

    let mut counter = 0;

    // Generate and write the header
    let header = csv_header_serializer::to_string(&FdrData::default(), args.delimiter)
        .map_err(|_| std::io::Error::new(ErrorKind::Other, "Failed to generate header."))?;
    buf_writer.write(header.as_bytes())?;

    // Create the CSV writer, and serialize the file.
    let mut writer = WriterBuilder::new()
        .delimiter(args.delimiter as u8)
        .has_headers(false)
        .from_writer(buf_writer);

    while let Ok(fdr_data) = read_record(&mut reader) {
        writer.serialize(&fdr_data)?;

        counter += 1;

        if counter % 1000 == 0 {
            print!("Processed {counter} entries...\r");
            std::io::stdout().flush()?;
        }
    }

    println!("Processed {counter} entries...");

    Result::Ok(())
}
