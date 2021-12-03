use proc_macro2::{Ident, TokenStream};
use quote::quote;
use syn::{
    parse_macro_input, spanned::Spanned, Data, DataEnum, DataStruct, DeriveInput, Fields, Generics,
};

/// Derive the `NestedElement` trait for the given struct.
/// This automatically registers all the fields of the `struct` as sub-elements.
#[proc_macro_derive(NestedElement)]
pub fn actor(input: proc_macro::TokenStream) -> proc_macro::TokenStream {
    let data = parse_macro_input!(input as DeriveInput);
    match data.data {
        Data::Struct(s) => as_struct(data.ident, s, data.generics),
        Data::Enum(e) => as_enum(data.ident, e, data.generics),
        Data::Union(_) => {
            syn::Error::new(data.span(), "Unions are not supported").to_compile_error()
        }
    }
    .into()
}

fn as_struct(name: Ident, s: DataStruct, generics: Generics) -> TokenStream {
    let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();
    let subfields = match s.fields {
        Fields::Named(fields) => fields
            .named
            .into_iter()
            .map(|field| {
                let ident = field.ident.unwrap();
                quote! {
                    (&mut self.#ident).accept(visitor);
                }
            })
            .collect(),
        Fields::Unnamed(fields) => (0..fields.unnamed.len())
            .map(|field| {
                quote! {
                    (&mut self.#field).accept(visitor);
                }
            })
            .collect(),
        _ => Vec::new(),
    };

    quote! {
        impl #impl_generics systems::simulation::NestedElement for #name #ty_generics #where_clause {
            fn accept<V: systems::simulation::SimulationElementVisitor>(&mut self, visitor: &mut V)
            where
                Self: Sized,
            {
                use systems::simulation::BaseNestedElement;

                #(#subfields)*

                visitor.visit(self);
            }
        }
    }
}

fn as_enum(name: Ident, e: DataEnum, generics: Generics) -> TokenStream {
    let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();
    let variants: Vec<_> = e
        .variants
        .into_iter()
        .map(|variant| {
            let ident = variant.ident;
            match variant.fields {
                Fields::Named(fields) => {
                    let names = fields.named.into_iter().map(|field| field.ident.unwrap());
                    let names_2 = names.clone();
                    quote! {
                        #name::#ident { #(#names,)* } => {
                            #((&mut #names_2).accept(visitor);)*
                        }
                    }
                }
                Fields::Unnamed(fields) => {
                    let names = fields
                        .unnamed
                        .into_iter()
                        .enumerate()
                        .map(|field| "_".to_string() + &field.0.to_string());
                    let names_2 = names.clone();
                    quote! {
                        #name::#ident(#(#names,)*) => {
                            #((&mut #names_2).accept(visitor);)*
                        }
                    }
                }
                Fields::Unit => quote! {
                    #name::#ident => {},
                },
            }
        })
        .collect();

    quote! {
        impl #impl_generics systems::simulation::NestedElement for #name #ty_generics #where_clause {
            fn accept<V: systems::simulation::SimulationElementVisitor>(&mut self, visitor: &mut V)
            where
                Self: Sized,
            {
                use systems::simulation::BaseNestedElement;

                match self {
                    #(#variants)*
                }

                visitor.visit(self);
            }
        }
    }
}
