/* Instruction looks like OOOODDSSKKKKKKKK
    O:Operand  K:Constant  _:Unused  A:Address  S:Source Reg  D:Dest. Reg 
    */
var SIMPLE_CPU = [
    {   names: ["MOVE","MOV"],
        format: {
            op: 0x0000,
            mask: 'OOOODD__KKKKKKKK'
        },
        rtl: "RD <- KK"
    },
    {   names: ["ADD","ADDI"],
        format: {
            op: 0x1000,
            mask: 'OOOODD__KKKKKKKK'
        },
        rtl: "RD <- RD + KK",
        ALUFlags: true
    },
    {   names: ["SUB","SUBI"],
        format: {
            op: 0x2000,
            mask: 'OOOODD__KKKKKKKK'
        },
        rtl: "RD <- RD - KK",
        ALUFlags: true
    },
    {   names: ["AND","ANDI"],
        format: {
            op: 0x3000,
            mask: 'OOOODD__KKKKKKKK'
        },
        rtl: "RD <- RD & KK",
        ALUFlags: true
    },
    {   names: ["LOAD","LOADI"],
        format: {
            op: 0x4000,
            mask: 'OOOOAAAAAAAAAAAA'
        },
        rtl: "RA <- M[AA]"
    },
    {   names: ["STORE","STOREI"],
        format: {
            op: 0x5000,
            mask: 'OOOOAAAAAAAAAAAA'
        },
        rtl: "M[AA] <- RA"
    },
    {   names: ["ADDM"],
        format: {
            op: 0x6000,
            mask: 'OOOOAAAAAAAAAAAA'
        },
        rtl: "RA <- RA + M[AA]",
        ALUFlags: true
    },
    {   names: ["SUBM"],
        format: {
            op: 0x7000,
            mask: 'OOOOAAAAAAAAAAAA'
        },
        rtl: "RA <- RA - M[AA]",
        ALUFlags: true
    },
    {   names: ["JUMP", "JMP", "JMPU", "JUMPU"],
        format: {
            op: 0x8000,
            mask: 'OOOOAAAAAAAAAAAA'
        },
        rtl: "PC <- AA"
    },
    {   names: ["JUMPZ","JMPZ"],
        format: {
            op: 0x9000,
            mask: 'OOOOAAAAAAAAAAAA'
        },
        rtl: "IF Z=1 PC <- AA ELSE PC++"
    },
    {   names: ["JUMPNZ","JMPNZ"],
        format: {
            op: 0xA000,
            mask: 'OOOOAAAAAAAAAAAA'
        },
        rtl: "IF Z=0 PC <- AA ELSE PC++"
    },
    {   names: ["JUMPC","JMPC"],
        format: {
            op: 0xB000,
            mask: 'OOOOAAAAAAAAAAAA'
        },
        rtl: "IF C=1 PC <- AA ELSE PC++"
    },
    {   names: ["CALL"],
        format: {
            op: 0xC000,
            mask: 'OOOOAAAAAAAAAAAA'
        },
        rtl: "M[SP] <- PC + 1\nSP <- SP - 1\nPC <- AA"
    },
    // Stack pointer starts at end of working memory and reverses
    {   names: ["RET"],
        format: {
            op: 0xF000,
            mask: 'OOOO________OOOO'
        },
        rtl: "SP <- SP + 1\nPC <- M[SP]"
    },
    {   names: ["MOVR","COPY"],
        format: {
            op: 0xF001,
            mask: 'OOOODDSS____OOOO'
        },
        rtl: "RD <- RS"
    },
    {   names: ["LOADR"],
        format: {
            op: 0xF002,
            mask: 'OOOODDSS____OOOO'
        },
        rtl: "RD <- M[RS]"
    },
    {   names: ["STORER"],
        format: {
            op: 0xF003,
            mask: 'OOOODDSS____OOOO'
        },
        rtl: "RD <- M[RS]"
    },
    // Assuming Shift Left by 8 (???)
    // Assuming this sets ALU Flags
    // Might not even be implemented
    {   names: ["ROL"],
        format: {
            op: 0xF004,
            mask: 'OOOODDSS____OOOO'
        },
        rtl: "RD[15:8] <- RS[7:0]"
    }
]

var test_code = `\
MOVE RA 4
STORE arg1
MOVE RA 6
STORE arg2
CALL multiply
JUMP 5





LOAD arg1
COPY RB RA
MOVE RA 0
ADDM arg2
SUB RB 1
JUMPNZ add_loop
STORE result
RET`

var test_labels = `\







arg1
arg2
result

multiply


add_loop




`