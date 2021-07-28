importScripts('bundle.js');
importScripts('SimpleCPU.js');
importScripts('CPU2.js');

console.log("Running from worker")
var CPU = new CPU_SIM(12, 16)

function update(){
    let snapshot = {
        PC: CPU.PC,
        SP: CPU.SP,
        regs: CPU.REGS,
        flagVals: [CPU.Z, CPU.C],
        mem: memSlices.map(s => [s[0], CPU.MEM.slice(s[0], s[1])])
    }
    self.postMessage(snapshot)
}

let running = false
let jobs = []

let memSlices = [[0,64], [4048,4096]]
let breakPoints = []

onmessage = function(e){
    // console.log(e)
    switch(e.data[0]){
        case "LOAD":
            let lines = e.data[1].split("\n")
            for(let i=0; i<lines.length; i++){
                CPU.MEM[i] = CPU.interpretAssembly(lines[i])
            }
            update()
            break
        case "BENCH":
            let j2 = setInterval(() => {update()}, 20)
            console.time("Run 10M cycles")
            for(let i=0;i<10000000;i++) CPU.FetchDecodeExecute()
            console.timeEnd("Run 10M cycles")
            this.clearInterval(j2)
            update()
            break
        case "STEP":
            if(running !== false) break;
            CPU.FetchDecodeExecute()
            update()
            break
        case "RESET":
            if(running !== false) break;
            CPU.reset()
            update();
            break;
        case "RUN":
            if(running === false){
                // run CPU at (1000/10)*10,000 = 1,000,000Hz = 1MHz
                let j1 = setInterval(() => {
                    for(let i=0; i<10000; i++){
                        CPU.FetchDecodeExecute()
                        if(breakPoints.indexOf(CPU.PC) != -1){
                            for(let x of jobs) clearInterval(x)
                            running = false;
                            update()
                            break;
                        }
                    }
                }, 10)
                jobs.push(j1)
                // but send updates at 50Hz
                let j2 = setInterval(() => {update()}, 20)
                jobs.push(j2)

                running = true

                console.log("Started execution!")
            } else {
                for(let x of jobs) clearInterval(x)
                running = false
                console.log("Halted execution!")
                update()
            }
            break
        case "TRACK_MEM":
            memSlices = e.data[1]
            break
        case "BREAK_AT":
            breakPoints = e.data[1]
            break
        
        case "NEW_INSTRUCTIONS":
            CPU.updateInstructions(e.data[1])
    }
}