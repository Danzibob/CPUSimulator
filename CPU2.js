const isDec = /^\d+$/
const isHex = /^0x[0-9A-F]+$/
const isBin = /^0b[01]+$/

const RTL_GRAMMAR = `\
program ::= action | conditional
conditional ::= "IF " condition " " action " ELSE " action
action ::= increment | assignment | slice_assign
increment ::= location "++"
slice_assign ::= location slice " <- " expression
assignment ::= location " <- " expression

condition ::= flag comparator bin
expression ::= value expr_ext?
expr_ext ::= " " op " " value
value ::= arg | bin | location slice?
location ::= memory | register
slice ::= "[" number ":" number "]"

arg ::= "AA" | "BB" | "CC" | "DD" | "EE" | "FF" | "GG" | "HH" | "II" | "JJ" | "KK" | "LL" | "MM" | "NN" | "OO" | "PP" | "QQ" | "RR" | "SS" | "TT" | "UU" | "VV" | "WW" | "XX" | "YY" | "ZZ"
memory ::= "M[" mem_addr "]"
mem_addr ::= register | arg
register ::= "PC" | "SP" | reg | specreg
reg ::= "RA" | "RB" | "RX" | "RY"
specreg ::= "RD" | "RS"
flag ::= "Z" | "C"
bin ::= "1" | "0"
comparator ::= "="
op ::= "+" | "-" | "&" | "|"
number ::= digit*
digit ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"`
// Imported from bnf-parser node module bundle
const BNF = BNFParser

const OpDict = {'+':'+', '-':'-', '&':'&', '|':'|'}

class CPU_SIM {
    MEM = []
    PC = 0
    REGS = [0,0,0,0]
    Z = 0
    C = 0
    STACK = []
    SP = 4095

    INSTRUCTIONS = SIMPLE_CPU
    ass_LUT = {}

    OP = 'O'
    ARGS = "KASD"
    REGISTERS = ["RA", "RB", "RX", "RY"]

    constructor(){
        // Build the memory array
        this.MEM = new Uint16Array(4096).fill(0)
        // Set up parameters
        this.DATA_WIDTH = 16
        // Load the instruction set
        this.updateInstructions(this.INSTRUCTIONS)
    }

    updateInstructions(instructions){
        this.INSTRUCTIONS = instructions

        // Pre-compile the CPU instruction data
        this.precompileCPU()

        // Prepare the parser
        this.parserTree = BNF.Build(RTL_GRAMMAR)
        // Parse and Compile instructions
        for(let ins of this.INSTRUCTIONS){
            this.compileInstruction(ins)
        }

        // Pre-emptively reset the CPU
        this.reset()
}

    reset(){
        this.MEM = new Uint16Array(4096).fill(0)
        this.PC = 0
        this.REGS = [0,0,0,0]
        this.Z = 0
        this.C = 0
        this.STACK = []
        this.SP = 4095
    }

    mask(from, to){
        return (1<<(from+1))-(1<<(to))
    }

    // Generate helper data to make compiling and running code
    // on the CPU faster, and ensure instructions are valid
    precompileCPU(){
        // Clear the lookup table
        this.ass_LUT = {}

        for(let i in this.INSTRUCTIONS){
            // Lazy iterator
            let instruction = this.INSTRUCTIONS[i]
    
            // TODO: Validation
            // - Check there's no colliding instruction formats (post-compile) [Seperate function]
    
            if(instruction.format.mask.length != this.DATA_WIDTH){
                console.error(`Mask for instruction ${instruction.names} is the wrong length! Was ${instruction.format.mask.length}, should be ${this.DATA_WIDTH}`)
                return false
            }

            // Count the arguments in the instruction format
            let fields = new Set(instruction.format.mask)
            fields.delete('O') // Op code is in every instruction
            fields.delete("_") // Discount unused bytes
            let num_args = fields.size
    
            // Fill in LUT
            for(let word of instruction.names){
                // Add the word to the LUT if it's not already there
                if(!(word in this.ass_LUT)){
                    this.ass_LUT[word] = {}
    
                // Check if the prototype already exists
                } else if(num_args in this.ass_LUT[word]){
                        // This prototype already existed!
                        // The CPU model is invalid!
                        console.error(`Prototype ${word}(${num_args}) collides! (Instruction #${i} and #${this.ass_LUT[word][num_args]})`)
                        return false
                }
                this.ass_LUT[word][num_args] = parseInt(i)
            }

            // Create op code mask
            instruction.format.opMask = this._lettersToMask(instruction.format.mask, this.OP)
    
            // Create list of argument sizes and how to bitshift them, and masks
            // !!! Assumes non-opcode arguments will always be contiguous !!!
            instruction.args = {}
            instruction.assembly = []
            for(let arg_chr of fields){
                let res = instruction.format.mask.match(arg_chr + '+')
                let shiftBy = this.DATA_WIDTH - res.index - res[0].length
                let width = res[0].length
                let mask = this._lettersToMask(instruction.format.mask, arg_chr)
                instruction.args[arg_chr+arg_chr] = {shiftBy, width, mask}
                instruction.assembly.push(arg_chr+arg_chr)
            }
    
            console.log(instruction)
        }
        return true
    }

    // Uses precompiled CPU object to interpret lines of assembly to
    // lists of arguments - [instruction num, arg1, arg2]...
    interpretAssembly(line){
        // Assumes labels have already been stripped

        // Tokens must be space seperated
        let tokens = line.split(" ")
        let word = tokens[0]
        let args = tokens.splice(1)

        // Identify instruction by prototype (and check it exists)
        if(word in this.ass_LUT && args.length in this.ass_LUT[word]){
            let instruction = this.INSTRUCTIONS[this.ass_LUT[word][args.length]]
            // console.log(instruction)

            let machineCode = instruction.format.op

            for(let i=0; i < instruction.assembly.length; i++){
                // Special cases for args with syntactic sugar
                // console.log(instruction.assembly[i], instruction.args[instruction.assembly[i]])
                if(instruction.assembly[i].match(/(SS|DD)/g)){
                    // Get register from list
                    let regNum = this.REGISTERS.indexOf(args[i])
                    if(regNum > -1){
                        machineCode |= regNum << instruction.args[instruction.assembly[i]].shiftBy
                    } else {
                        // register was not in list => invalid code
                        console.error(`Invalid register: ${args[i]}`)
                        return false
                    }
                } else {
                    let v;
                    // Parse the value
                    if(isDec.test(args[i])){
                        v = parseInt(args[i], 10)
                    } else if(isBin.test(args[i])){
                        v = parseInt(args[i].slice(2), 2)
                    } else if(isHex.test(args[i])) {
                        v = parseInt(args[i].slice(2), 16)
                    } else {
                        console.error(`Invalid number format: ${args[i]}`)
                        return false
                    }
                    // Add the value to the machine code
                    machineCode |= v << instruction.args[instruction.assembly[i]].shiftBy
                }
            }
            return machineCode
        } else {
            // Instruction word didn't exist so the code is invalid
            console.error(`Instruction prototype ${word} (${args.length}) does not exist!`)
            return false
        }
    }

    // takes a line of machine code and runs the relevant precompiled JS function
    // This needs to be fairly performant to run at 10MHz
    FetchDecodeExecute(){
        // --- FETCH ---
        let mcode = this.MEM[this.PC]

        // --- DECODE ---
        let ins = this.INSTRUCTIONS.find(ins => (mcode & ins.format.opMask) == ins.format.op);
        if(!ins) return console.error(`Invalid instruction ${ins.toString(2)} at ${this.PC}`)

        // console.log(mcode.toString(2), mcode.toString(16), "("+ins.names[0]+")")

        // Parse the arguments
        let args = []
        for(let arg of ins.assembly){
            args.push((mcode & ins.args[arg].mask) >> ins.args[arg].shiftBy)
            // console.log(arg, (mcode & ins.args[arg].mask) >> ins.args[arg].shiftBy)
        }

        // --- EXECUTE ---
        // console.log(`Running ${ins.names[0]} with args ${args}`)
        ins.func(this, ...args)

        // --- Update Flags ---

    }

    // Converts RTL to runable JS functions (Very Cursed)
    // Won't run live but needs to generate performant functions
    compileInstruction(instruction){
        console.log(instruction.rtl)
        let statements = instruction.rtl.split("\n")
        let res = ""
        for(let s of statements){
            let translated = this.interpretRTL(s)
            res += "\t" + translated + "\n"
        }
        let func = 
`(${["CPU", ...instruction.assembly].join(", ")}) => {
${res.slice(0, -1)}
\t${res.indexOf("PC =") == -1 ? "CPU.PC++;":""}
}`
        console.log(func)
        instruction.func = eval(func)
        return func
    }

    // Interprets a single line of RTL
    interpretRTL(line){
        // Gets the AST from bnf-parser
        let AST = BNF.Parse(line, this.parserTree)
        if(AST.hasError || AST.isPartial){
            console.error(`AST for string "${line}" failed to parse fully!`, AST)
            //return false
        }
        // console.log("Line:", line)
        // console.log(AST)
        // console.log(this.translate(AST.tree))
        return this.translate(AST.tree)
    }

    // Sets flags and ensures result fits
    ALU(output){
        this.C = output > 0xffff ? 1 : 0
        output %= 0xffff
        this.Z = output === 0 ? 1 : 0
        return output
    }

    // Translates a BNF Syntax node into JS code
    translate(node){
        // console.log("Type:", node.type, node)
        switch(node.type){
            case "program":
                return this.translate(node.tokens[0]) + ';'
            
            case "action":
                return this.translate(node.tokens[0])
                
            case "assignment":      // location, literal, expression
                let location = this.translate(node.tokens[0][0])
                let expression = this.translate(node.tokens[2][0])
                return `${location} = (${expression})`
            
            case "slice_assign":
                let location1 = this.translate(node.tokens[0][0])
                let slice = this.translate(node.tokens[1][0])
                let expression1 = this.translate(node.tokens[3][0])
                return `${location1} = (${location1} & ${this.mask(slice[0],slice[1])} || (((${expression1}) & ${this.mask(slice[0]-slice[1],0)}) << ${slice[1]}))`
            
            case "increment":      // location, literal
                console.log("INCREMENT", node)
                let location2 = this.translate(node.tokens[0][0])
                return `${location2}++`

            case "location":        // memory | register
                return this.translate(node.tokens[0])

            case "memory":          // "M[" ( register | arg ) "]"
                return `CPU.MEM[${this.translate(node.tokens[1][0])}]`
            
            case "mem_addr":
                return this.translate(node.tokens[0])

            case "register":        // "PC" | "SP" | reg | specreg
                if (typeof node.tokens[0] === "string"){
                    return "CPU." + node.tokens
                }
                return this.translate(node.tokens[0])

            case "reg":             // "RA" | "RB" | "RX" | "RY"
                return `CPU.REGS[${this.REGISTERS.indexOf(node.tokens)}]`
            case "specreg":         // "RD" | "RS"
                return `CPU.REGS[${node.tokens[1]+node.tokens[1]}]`
            
            case "arg":             // "AA" | "KK"
                return node.tokens
             
            case "expression":      // value | ( value " " operator " " value )
                let v1 =  this.translate(node.tokens[0][0])
                return node.tokens[1].length ? `CPU.ALU(${v1 + this.translate(node.tokens[1][0])})` : v1
            
            case "expr_ext":

                return ` ${OpDict[node.tokens[1][0].tokens]} ${this.translate(node.tokens[3][0])}`
            
            case "value":           // location | arg
                console.log(node.tokens)
                let val = this.translate(node.tokens[0][0].tokens[0])
                if(node.tokens[1].length != 0){
                    let sli = this.translate(node.tokens[1][0])
                    console.log("slice", sli)
                    return `((${val} >> ${sli[1]}) & ${(1 << (sli[0]+2))-1})`
                } else {
                    return val
                }
            
            case "conditional":     // IF " " condition " " assignment
                return `if (${this.translate(node.tokens[1][0])}) ${this.translate(node.tokens[3][0])}\n`
                     + `\telse ${this.translate(node.tokens[5][0])}`
            case "condition":       // flag comparator bin
                return `CPU.${node.tokens[0][0].tokens[0]} ${this.translate(node.tokens[1][0])} ${node.tokens[2][0].tokens[0]}`
            
            case "comparator":
                if(node.tokens[0][0].tokens[0] == "=") return "==="
                console.error("Invalid Operator", node); break

            case "bin":
                return node.tokens
            
            case "slice":
                console.log(node)
                return [this.translate(node.tokens[1][0]), this.translate(node.tokens[3][0])]
            
            case "sliceAss":
                return node.tokens
            
            case "number":
                return node.tokens[0].map(x => x.tokens).join("")
            
            default:
                console.error("Unrecognised type: " + node.type + " in node", node)
                break;
        }
    }

    // Converts a letter based mask "OODDKKKK" to a bitmask 0xC0
    _lettersToMask(letters, symbol){
        return letters.split("").reduce((a, c, d) => a | (c == symbol) << (this.DATA_WIDTH - d - 1), 0)
    }

}

//const CPU = new CPU_SIM(12, 16)

// for(let i = 0; i<CPU.INSTRUCTIONS.length - 1; i++){
//     let x = (i*7)%(CPU.INSTRUCTIONS.length - 1)
//     console.log(CPU.INSTRUCTIONS[x].rtl)
//     console.log(CPU.compileInstruction(CPU.INSTRUCTIONS[x]))
//     console.log("")
// }

// ------====== WORKER CODE ======------

// const CPU = new CPU_SIM(12, 16)

// onmessage = function(e){
//     switch(e.data[0]){
//         case "LOAD":
//             let lines = e.data[1]
//             for(let i=0; i<lines.length; i++){
//                 CPU.MEM[i] = CPU.interpretAssembly(lines[i])
//             }
//             break
//         case "RUN":
//             console.time("Run 10M cycles")
//             for(leti=0;i<10000000;i++) CPU.FetchDecodeExecute()
//             console.timeEnd("Run 10M cycles")
//             break
//     }
//     console.log("Handled message", e)
// }