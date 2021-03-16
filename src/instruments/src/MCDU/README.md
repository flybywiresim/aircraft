# Multi-Function Control and Display Unit (MCDU)
welcome to the MCDU React rewrite!

# Modules

## Buttons
The buttons modules contains exported enums for all the names regarding interaction events for the MCDU, it is highly
**reccomended** to use this module for interaction events to avoid spelling mistakes or any other related errors.

# Components
The MCDU Rewrite comes with several components similarly to the EFB that allows you
to build MCDU pages as needed.

## Main Components
The main components are `Content`, `RowHolder` and `LineHolder`. 

Firstly the `Content` component contains content of that MCDU page, excluding the title and scratchpad.
The content component dynamically creates a total of 6 empty rows (`RowHolder`) based on the indexing provided by 
`RowHolders`. The content 
will accept up to 6 RowHolder items.

The RowHolder contains the content of that specific row, indexed by a number symbolising the position of the row from 1-6.
For example,
```html
<RowHolder index={1} >
    ...
</RowHolder >
```

Lastly, a `LineHolder` holds lines. The LineHolder component is a flex item with a fixed height, and only allows two lines
inside, to conform with the main structure of the MCDU. Where each row contains two lines (per side), commonly the 
labels and data field (the 'label' field can be re-used for many differing scenarios and is not strictly a label).

With this information, pages should be created in the resulting manner
```jsx
<Content>
    <RowHolder index={1} >
        <LineHolder >
            ...
        </LineHolder>
    </RowHolder>
    // Dynamic Insertion of remaining empty rows
</Content>
```

**At the current moment the main components are not to be re-configured without reason.**

## Lines
Currently, there are 4 types of lines, `EmptyLine`, `InteractiveSplitLine`, `Line` and `SplitLine`. 

**All lines require a side for the field values to properly orient them.**

The `EmptyLine` component is pretty self-explanatory, it inserts an EmptyLine that contains the required height for each
line in a `LineHolder`. Empty lines are usually used for when you wish to have text in a data field but would like the 
label field empty or vice versa. Refer to Menu.tsx for an example.

The `Line` component is your basic line where a large majority of your fields will be inserted (both interactive and
non-interactive). It requires a side of which can also be found in Line.tsx exported as `lineSides`. An example usage of
a line can be seen below 
```jsx
<Line 
    side={lineSides.left} 
    value={...} 
/> 
```

**It should be noted that currently the line component contains all the CSS modifiers for text including side, size and
color, this is WIP until a moved to a more appropriate class.**

The `SplitLine` component is very similar to the `Line` component however rather than a value prop, it accepts a 
leftSide and rightSide prop. It also accepts a `slashColor` prop whose name is pretty self-explanatory. **The Split Line
should only contain non-interactive split fields.**

The `InteractiveSplitLine` component is a WIP implementation for handling split fields. Currently, it's usage has not been
extensively tested and is yet to be finalised. Due to this, there is no documentation for this component but, feel free
to take a look at the code to get a better understanding if you have plans to modify or even re-write it's implementation.

## Fields
Fields are split between interactive and non-interactive where for the former requires callbacks, validations and which
LSK press to listen out for whereas non-interactive simply text with no possible user modification.

### Interactive Fields
Currently, there is `LineSelectField`, `StringInputField` and `NumberInputField`. Each of these fields with, exception of
`LineSelectField`, retrieve the scratchpad value and carries out validation then a provided action.

The former, `LineSelectField` is akin to a button on a webpage, it contains some text and listens out for the provided
LSK (Line Select Key) and does a provided action. It's usage can be seen below:
```jsx
<LineSelectField 
    value={"TEST"}
    size={lineSizes.regular} 
    color={lineColors.white} 
    lsk={lineSelectKeys.L1} 
    selectedCallback={() => changePage()}
/> 
```

#### Split Interactive Fields
These fields are similar to the above fields however omits the usage of a LSK which is used by the `InteractiveSplitLine`
instead. No more documentation is provided for the same reasons as its parent components.

`StringInputField` contains the same fields as `LineSelectField` with the addition of a nullValue (where the value prop
is undefined), and a validation prop that return a boolean.

Much like the others, `NumberInputField` has the addition of a max and min value to be used as validation for inserted
values.

### Non-Interactive Field
These fields are pretty explanatory in the sense that they act as field/labels with no interaction whatsoever.

#### Split Non-Interactive Field
For usage in `SplitLine`, similar to the above.

# Scratchpad
TODO

# Titlebar
TODO
 

# Contributing
TODO
