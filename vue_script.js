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

    },
    computed: {
        args: function(){
            // Selects contiguous sections of letters from an instruction mask
            // with special treatment for the op-code (O)
            let code = this.currentInstruction.format.mask
            let args = {}
            let ptr = 0
            let end = 0
            while (ptr < code.length){
                // Move end pointer to the end of this segment
                while(code[end] == code[ptr]) end++
                // If the letter is O, special case and find the rest of the op code
                if(code[ptr] == "O"){
                    args["OP"] = {mask: code.replace(/[A-Z]/gi, m => m=="O" ? "O" : "_")}
                } else {
                    args[code[ptr]] = {width: end - ptr, max: (Math.pow(2,end-ptr)).toString()}
                }
                ptr = end
            }
            return args
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
        },

    }
})