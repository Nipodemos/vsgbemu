import loadOpcodes from './load-opcodes.js'

export default async function createCPU(pbus){

    const opcodes = await loadOpcodes()

    const bus = pbus;

    function getSourceOperandValue(instruction){
        const operand = instruction.opcode.operands[instruction.opcode.operands.length-1]
        if (operand.immediate){
            if(Object.keys(registers).includes(operand.name)){
                return registers[operand.name]
            }else{
                switch(operand.name) {
                    case 'd8':
                        return instruction.parameters[0]
                    case 'd16':
                        return (instruction.parameters[0] & (instruction.parameters[1] << 8))
                    case 'r8':
                        return instruction.parameters[0] > 127 ? (instruction.parameters[0] & 0x7f) - 0x80 : instruction.parameters[0]
                }
            }
            
        } else {
            if(Object.keys(registers).includes(operand.name)){
                let source_value = bus.read(registers[operand.name])
                if(operand.increment){
                    registers[operand.name]++
                }
                if(operand.decrement){
                    registers[operand.name]--
                }
                return source_value
            }else{
                switch(operand.name) {
                    case 'a8':
                        return bus.read(instruction.parameters[0] + 0xff00)
                    case 'a16':
                        return bus.read(instruction.parameters[0] & (instruction.parameters[1] << 8))
                }
            }
        }
        return source_value
    }

    const instructions = {
        'LD': (instruction) => {
            // Source
            let source_value = getSourceOperandValue(instruction)
            const destOperand = instruction.opcode.operands[0]
            if(destOperand.immediate){
                registers[destOperand.name] = source_value
            }else{
                let address = registers[destOperand.name]
                if(destOperand.increment){
                    registers[destOperand.name]++
                }
                if(destOperand.decrement){
                    registers[destOperand.name]--
                }
                bus.write(address,source_value)

            }
            return instruction.opcode.cycles[0]
        },
        'AND': (instruction) => {
            let source_value = getSourceOperandValue(instruction)
            registers.A &= source_value 
            //TODO flags
            return instruction.opcode.cycles[0]
        },
        'OR': (instruction) => {
            let source_value = getSourceOperandValue(instruction)
            registers.A |= source_value 
            //TODO flags
            return instruction.opcode.cycles[0]
        },
        'XOR': (instruction) => {
            let source_value = getSourceOperandValue(instruction)
            registers.A ^= source_value 
            //TODO flags
            return instruction.opcode.cycles[0]
        },
        'ADD': (instruction) => {
            let source_value = getSourceOperandValue(instruction)
            registers.A += source_value 
            //TODO flags
            return instruction.opcode.cycles[0]
        },
        'ADC': (instruction) => {
            let source_value = getSourceOperandValue(instruction)
            registers.A += source_value 
            //TODO flags
            return instruction.opcode.cycles[0]
        },
        'SUB': (instruction) => {
            let source_value = getSourceOperandValue(instruction)
            registers.A += source_value 
            //TODO flags
            return instruction.opcode.cycles[0]
        },
        'SBC': (instruction) => {
            let source_value = getSourceOperandValue(instruction)
            registers.A += source_value 
            //TODO flags
            return instruction.opcode.cycles[0]
        },
        'EI': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'DI': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'LDH': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'DAA': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'SCF': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'CPL': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'CCF': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'JR': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'JP': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'CALL': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'RET': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'RETI': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'CP': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'RST': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'NOP': (instruction) => { return instruction.opcode.cycles[0]},
        'STOP': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'HALT': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'INC': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'DEC': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'PUSH': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'POP': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'RLCA': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'RRCA': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'RLA': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'RRA': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'RLC': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'RRC': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'RL': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'RR': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'SLA': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'SRA': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'SWAP': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'SRL': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'BIT': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'RES': (instruction) => { return instruction.opcode.cycles[0]}, //TODO
        'SET': (instruction) => { return instruction.opcode.cycles[0]} //TODO
        
    }

    const registers = {
        A: 0,
        F: 0,
        B: 0,
        C: 0,
        D: 0,
        E: 0,
        H: 0,
        L: 0,
        PC: 0,
        SP: 0,
        get AF() {  
            return (this.A << 8) | this.F
        },
        get BC() {
            return (this.B << 8) | this.C
        },
        get DE() {
            return (this.D << 8) | this.E
        },
        get HL() {
            return (this.H << 8) | this.L
        },
        set AF(af) {
            this.A = af >> 8
            this.F = af & 0xf0
        },
        set BC(bc) {
            this.B = bc >> 8
            this.C = bc & 0xff
        },
        set DE(de) {
            this.D = de >> 8
            this.E = de & 0xff
        },
        set HL(hl) {
            this.H = hl >> 8
            this.L = hl & 0xff
        },
        get flagZ() {
            return this.F & 0b10000000
        },
        set flagZ(v){
            if(v) {
                this.F |= 0b10000000
            } else {
                this.F &= 0b01111111
            }
        },
        get flagN() {
            return this.F & 0b01000000
        },
        set flagN(v){
            if(v) {
                this.F |= 0b01000000
            } else {
                this.F &= 0b10111111
            }
        },
        get flagH() {
            return this.F & 0b00100000
        },
        set flagH(v){
            if(v) {
                this.F |= 0b00100000
            } else {
                this.F &= 0b11011111
            }
        },
        get flagC() {
            return this.F & 0b00010000
        },
        set flagC(v){
            if(v) {
                this.F |= 0b00010000
            } else {
                this.F &= 0b11101111
            }
        },
    }

    let ime = true
    let halt = false
    let waiting_ticks = 0

    function tick() {
        //if (! --waiting_ticks){
            const instruction = fetchInstruction()
            console.log(instruction)
            instructions[instruction.opcode.mnemonic](instruction)
            
        //}
    }

    function fetchInstruction(){
        let prefixed = false
        let opcode = bus.read(registers.PC)
        registers.PC++
        if ( opcode === 0xcb ){
            opcode = bus.read(registers.PC)
            prefixed = true
            registers.PC++
        }
        
        const instruction = opcodes[prefixed ? 'cbprefixed' : 'unprefixed']['0x'+(0x100 + opcode).toString(16).substring(1).toUpperCase()]
        const parameters = []
        for(let i = 0; i < instruction['bytes'] - ( prefixed ? 2 : 1 ); i++){
            parameters.push(bus.read(registers.PC))
            registers.PC++
        }
        return {
            'opcode':instruction,
            parameters

        }
    }

    return {
        tick
    }
}