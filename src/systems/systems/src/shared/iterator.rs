pub struct OptionIterator<I> {
    opt_iterator: Option<I>,
}

impl<I> OptionIterator<I> {
    pub fn new(opt_iterator: Option<I>) -> OptionIterator<I> {
        OptionIterator { opt_iterator }
    }
}

impl<I, T> Iterator for OptionIterator<I>
where
    I: Iterator<Item = T>,
{
    type Item = T;
    fn next(&mut self) -> Option<T> {
        match &mut self.opt_iterator {
            Some(iterator) => iterator.next(),
            None => None,
        }
    }
}
