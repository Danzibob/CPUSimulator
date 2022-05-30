# CPU Simulator
This project is a register level CPU Simulator with support for arbitrary JIT compiled RTL defined instructions

While the core functionality is there, the user interface is missing some key quality of life features (eg, no status indicator for currently running). It may be advisable to keep the JS console open while running as the debug output can be helpful

## Running the project
In order to run the project, you must run a http server from the root directory of the project. Something like python's `simple-http-server` or node's `http-server` will work just fine.

# Usage
## Simulator View Tab
### Loading and editing code
The left panel of the window has 2 text fields, the left being for labels and the right for Assembly code.

To load this code into the CPU, first press the `Reset CPU` button in the top middle of the screen. This resets all registers and sets the program counter to 0.

Then, press `Compile`. This takes the assembly code and converts it, according to our instruction rules, into machine code and places this in the CPU

### Running Code

When the project first loads, an example program will be present. This example code loads two numbers into registers labelled "arg1" and "arg2" then calls a function "multiply" on them, stores the result in "result", then jumps back to the start.

The `Step` button will run a single instruction and show the changes to the CPU registers and memory on the right.

The `Run` button toggles the program automatically advancing. Currently this is set to be as fast as possible but one of the first improvements would be to add a slider for this setting.

## Design View - Custom Instructions

When the project first opens, the default instruction set is a close amalgam of SimpleCPU.

In this view, instruction OP codes, formats and RTL can be viewed, and error checked. Unfortunately they cannot be exported from this view at this time, but it can still be used to validate instructions written in the js file

### Instructions Definitions

In the project files, `SimpleCPU.js` holds the instruction definitions for the default CPU architecture. An example of an instruction definition would look something like this:

```javascript
{   names: ["SUB","SUBI"],
    format: {
        op: 0x2000,
        mask: 'OOOODD__KKKKKKKK'
    },
    rtl: "RD <- RD - KK",
    ALUFlags: true
},
```

This is the definition for the subtract instruction, AKA subtract immediate. The instruction definition has 5 important fields:

| Field         | Description |
| :---          | :---        |
| `names`       | Holds the Aliases for the instruction for assembly compilation. This is used for pattern matching. |
| `format.op`   | The op code of the instruction, supplied as a 16 bit bitmask. Here the opcode is 0010 in the first 4 digits of the instruction |
| `format.mask` | This field defines the format and arguments of the instruction. The letters will be covered in detail below, but here we can see that the first 4 bits are the mask for the op code |
| `rtl`         | Defines the behavior of the instruction. In this example, RD (destination register) gets set to its own value, minus KK (a constant) |
| `ALUFlags`    | Determines whether an instruction should set ALU flags. This is needed as not all math operations in the RTL description use the ALU (e.g. PC += 1) |

### RTL definition
This project uses a version of the RTL language modified from the version Intel use in the x86 manual, so the syntax should be familiar enough.

There are some reserved keywords in this language in particular which are listed below:

| Keyword       | Description |
| :---          | :---        |
| `PC`          | Program Counter |
| `SP`          | Stack Pointer |
| `R{A,B,X,Y}`  | The four CPU "accumulator" registers |
| `RS, RD`      | Register Source and Register Dest |
| `+,-,&,\|`    | Basic operations |
| `M[xxx]`      | Memory Access |
| `KK`, `AA,BB,CC...`| Instruction arguments / Constants |

The language also has support for increments `++` and IF ELSE statements, as demonstrated in the `JUMPZ` instruction

```javascript
{   names: ["JUMPZ","JMPZ"],
    format: {
        op: 0x9000,
        mask: 'OOOOAAAAAAAAAAAA'
    },
    rtl: "IF Z=1 PC <- AA ELSE PC++"
}
```

The full RTL language grammar is available in `CPU2.js`



# Major TODOs:
- Allow updating instructions from within the UI
- Allow exporting/importing CPU profiles & scripts
- Implement the peripherals system (backbone is there but no examples)
- QoL for simulator view
    - Speed slider
    - Jump scroll view automatically
    - Animation on value changes?