// const cpu = new CPU_SIM(12, 16)

const testWorker = new Worker("CPU_Worker.js")

function toHex(v,p=4){
    return '0x'+v.toString(16).padStart(p, '0')
}

function toBin(v, p=16){
    return '0b'+v.toString(2).padStart(p, '0')
}

function scrollMem(e){
    console.log("scroll", e)
}

let state = {}

testWorker.addEventListener('message', function(e){
    // console.log("MAIN RECIEVED: ", e)
    for(let k in e.data){
        // console.log(k, e.data[k])
        if(k != "mem"){
            app[k] = e.data[k]
        } else {
            for(let slice of e.data.mem){
                app.mem.set(slice[1], slice[0])
            }
            // app.mem.set(e.data.mem)
        }
    }
    console.log("Done update")
})

var app = new Vue({
    el: '#app',
    data: {
        // The Assembly IDE
        // IDE controls

        // Instruction Editor
        instructions: SIMPLE_CPU,
        selectedInstruction: 0,
        currentInstruction: Object.assign({}, SIMPLE_CPU[0]),

        // Assembly Editor
        lineNums: Array.from({length:4096},(_,k)=>k),
        labels: test_labels,//"\n".repeat(4096-1),
        code: test_code,//"",
        breakpoints: new Set(),
        bpts: [],

        // Registers
        PC: 0,
        SP: 4095,
        flags: ['Z','C','_'],
        flagVals: [0,0,0],
        regs: [0,0,0,0],
        regAliases: {
            0: "RA",
            1: "RB",
            2: "RX",
            3: "RY"
        },
        // Memory
        mem: new Uint16Array(4096),
        memPos: 0,
        hx: toHex,
        bn: toBin,

        // Parser
        parser: BNFParser.Build(RTL_GRAMMAR),
        errors: []

    },
    computed: {
        args: function(){
            // Selects contiguous sections of letters from an instruction mask
            // with special treatment for the op-code (O)
            let code = this.currentInstruction.format.mask
            console.log(this.currentInstruction)
            let args = {}
            let ptr = 0
            let end = 0
            while (ptr < code.length){
                // Move end pointer to the end of this segment
                while(code[end] == code[ptr]) end++

                // If the letter is O, special case and find the rest of the op code
                if(code[ptr] == "O"){
                    args["OP"] = {mask: code.replace(/[A-Z]/gi, m => m=="O" ? "O" : "_"), width: code.match(/O/g).length}
                } else if ((code[ptr] == "S") || (code[ptr] == "D")) {
                    args["R" + code[ptr]] = {width: end - ptr, max: (Math.pow(2,end-ptr)).toString()}
                } else {
                    args[code[ptr]+code[ptr]] = {width: end - ptr, max: (Math.pow(2,end-ptr)).toString()}
                }

                // Move pointer to next segment
                ptr = end
            }
            return args
        },
        validRTL: function(){
            let lines = this.currentInstruction.rtl.split("\n")
            // Check if RTL parses correctly
            // (may need to recompile grammar on demand later, probs not in this func tho)
            this.errors = []
            for(let l in lines){
                if(lines[l].length <= 1) continue
                let AST = BNFParser.Parse(lines[l], this.parser)
                if(AST.hasError || AST.isPartial){
                    this.errors.push(parseInt(l)+1)
                }
            }
            return this.errors.length == 0
        },
        opCodeFits: function(){
            let opcode = parseInt(this.currentInstruction.format.op).toString(2).padStart(16,'0')
            if(opcode.length > 16) return false
            let mask = this.currentInstruction.format.mask
            console.log(opcode)
            console.log(mask)
            for(let i=0; i<16; i++){
                console.log((opcode[i] == '1'),  (mask[i] != 'O'))
                if((opcode[i] == '1') && (mask[i] != 'O')) return false
            }
            return true
        }
    },
    methods: {
        loadProgram: function(event) {
            // collect and replace labels with numbers
            let assembly = this.code
            let labels = this.labels.split("\n")
            for(let i=0; i<labels.length; i++){
                if(labels[i] !== ""){
                    console.log(labels[i], i)
                    assembly = assembly.replaceAll(labels[i], i)
                }
            }
            console.log(assembly)
            testWorker.postMessage(["LOAD", assembly])
        },
        step: function(event) {
            testWorker.postMessage(["STEP"])
        },
        run: function(event) {
            testWorker.postMessage(["RUN"])
        },
        reset: function(event) {
            testWorker.postMessage(["RESET"])
        },
        reqMemSlices: function(slices){
            testWorker.postMessage(["TRACK_MEM", slices])
        },
        toggle: function(bp){
            if(!this.breakpoints.has(bp)){
                console.log("Toggle on", bp)
                this.breakpoints.add(bp)
            } else {
                this.breakpoints.delete(bp)
            }
            this.bpts = Array.from(this.breakpoints)
            testWorker.postMessage(["BREAK_AT", this.bpts])
        },
        updateInstructions: function(instructions){
            testWorker.postMessage(["NEW_INSTRUCTIONS", instructions])
        },
        selectInstruction: function(event){
            // Get number of selected instruction
            this.selectedInstruction = parseInt(event.srcElement.attributes.value.value)
            this.currentInstruction = Object.assign({}, SIMPLE_CPU[this.selectedInstruction])
            console.log(this.selectedInstruction)
            console.log(this.args)
        }
    }
})