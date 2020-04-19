/* eslint-disable camelcase */
import loadOpcodes from './load-opcodes.js'

export default async function createCPU (pbus) {
  const opcodes = await loadOpcodes()

  const bus = pbus

  function getSourceValue (operand, parameters) {
    if (operand.immediate) {
      if (Object.keys(registers).includes(operand.name)) {
        return registers[operand.name]
      } else {
        switch (operand.name) {
          case 'd8':
            return parameters[0]
          case 'd16':
            return (parameters[0] | (parameters[1] << 8))
          case 'r8':
            return parameters[0] > 127 ? (parameters[0] & 0x7f) - 0x80 : parameters[0]
        }
      }
    } else {
      if (Object.keys(registers).includes(operand.name) && operand.name.length !== 1) {
        const source_value = bus.read(registers[operand.name])
        if (operand.increment) {
          registers[operand.name]++
        }
        if (operand.decrement) {
          registers[operand.name]--
        }
        return source_value
      } else {
        switch (operand.name) {
          case 'a8':
            return bus.read(parameters[0] + 0xff00)
          case 'a16':
            return bus.read(parameters[0] | (parameters[1] << 8))
          case 'C':
            return bus.read(registers.C + 0xff00)
        }
      }
    }
  }

  function setDestinationValue (operand, value, parameters) {
    if (operand.immediate) {
      registers[operand.name] = value
    } else {
      let address = 0
      if (Object.keys(registers).includes(operand.name) && operand.name.length !== 1) {
        address = registers[operand.name]
      } else {
        switch (operand.name) {
          case 'a8':
            address = parameters[0] + 0xff00
            break
          case 'a16':
            address = parameters[0] | (parameters[1] << 8)
            break
          case 'C':
            address = registers.C + 0xff00
            break
        }
      }
      if (operand.increment) {
        registers[operand.name]++
      }
      if (operand.decrement) {
        registers[operand.name]--
      }
      bus.write(address, value)
    }
  }

  function setDefaultFlags (flags) {
    const flagNames = Object.keys(flags)
    for (let i = 0; i < flagNames.length; i++) {
      const flag = flags[flagNames[i]]
      const flagValue = parseInt(flag)
      if (!isNaN(flagValue)) {
        registers[`flag${flagNames[i]}`] = (flagValue === 1)
      }
    }
  }

  function checkCondition (operand) {
    const condition = operand.name
    const flag = `flag${condition.slice(-1)}`
    return ((registers[flag] && condition.length === 1) || (!registers[flag] && condition.length === 2))
  }

  function pushByte (value) {
    value = value & 0xff
    registers.SP--
    bus.write(registers.SP, value)
  }

  function pushWord (value) {
    pushByte((value >> 8))
    pushByte(value)
  }

  function popByte () {
    const value = bus.read(registers.SP)
    registers.SP++
    return value
  }

  function popWord () {
    return popByte() | (popByte() << 8)
  }

  const instructions = {
    LD: (instruction) => {
      const source_value = getSourceValue(instruction.opcode.operands[1], instruction.parameters)
      setDestinationValue(instruction.opcode.operands[0], source_value, instruction.parameters)
      return instruction.opcode.cycles[0]
    },
    AND: (instruction) => {
      const source_value = getSourceValue(instruction.opcode.operands[0], instruction.parameters)
      registers.A &= source_value
      setDefaultFlags(instruction.opcode.flags)
      registers.flagZ = (registers.A === 0)
      return instruction.opcode.cycles[0]
    },
    OR: (instruction) => {
      const source_value = getSourceValue(instruction.opcode.operands[0], instruction.parameters)
      registers.A |= source_value
      setDefaultFlags(instruction.opcode.flags)
      registers.flagZ = (registers.A === 0)
      return instruction.opcode.cycles[0]
    },
    XOR: (instruction) => {
      const source_value = getSourceValue(instruction.opcode.operands[0], instruction.parameters)
      registers.A ^= source_value
      setDefaultFlags(instruction.opcode.flags)
      registers.flagZ = (registers.A === 0)
      return instruction.opcode.cycles[0]
    },
    CP: (instruction) => { return instruction.opcode.cycles[0] }, // TODO
    ADD: (instruction) => {
      const source_value = getSourceValue(instruction.opcode.operands[1], instruction.parameters)
      registers.A += source_value
      setDefaultFlags(instruction.opcode.flags)
      // TODO flags && ADD SP
      return instruction.opcode.cycles[0]
    },
    ADC: (instruction) => {
      const source_value = getSourceValue(instruction.opcode.operands[0], instruction.parameters)
      registers.A += source_value
      setDefaultFlags(instruction.opcode.flags)
      // TODO flags
      return instruction.opcode.cycles[0]
    },
    SUB: (instruction) => {
      const source_value = getSourceValue(instruction.opcode.operands[0], instruction.parameters)
      registers.A += source_value
      setDefaultFlags(instruction.opcode.flags)
      // TODO flags
      return instruction.opcode.cycles[0]
    },
    SBC: (instruction) => {
      const source_value = getSourceValue(instruction.opcode.operands[0], instruction.parameters)
      registers.A += source_value
      setDefaultFlags(instruction.opcode.flags)
      // TODO flags
      return instruction.opcode.cycles[0]
    },
    EI: (instruction) => {
      ime = true
      return instruction.opcode.cycles[0]
    },
    DI: (instruction) => {
      ime = false
      return instruction.opcode.cycles[0]
    },
    LDH: (instruction) => {
      const operands = instruction.opcode.operands
      if (operands[0].immediate) {
        bus.write(0xff00 + instruction.parameters[0], registers.A)
      } else {
        registers.A = bus.read(0xff00 + instruction.parameters[0])
      }
      return instruction.opcode.cycles[0]
    },
    DAA: (instruction) => {
      let temp = registers.A
      if (registers.flagN) {
        if (registers.flagH) { temp = (temp - 0x06) & 0xff }
        if (registers.flagC) { temp = (temp - 0x60) & 0xff }
      } else {
        if (registers.flagH || (temp & 0x0f) > 0x09) { temp += 0x06 }
        if (registers.flagC || temp > 0x9f) { temp += 0x60 }
      }
      registers.flagH = false
      if (temp > 0xff) { registers.flagC = true }
      temp &= 0xff
      if (temp === 0) { registers.flagZ = true } else { registers.flagZ = false }
      registers.A = temp
      return instruction.opcode.cycles[0]
    },
    SCF: (instruction) => {
      setDefaultFlags(instruction.opcode.flags)
      return instruction.opcode.cycles[0]
    },
    CPL: (instruction) => {
      setDefaultFlags(instruction.opcode.flags)
      registers.A = registers.A ^ 0xff
      return instruction.opcode.cycles[0]
    },
    CCF: (instruction) => { return instruction.opcode.cycles[0] }, // TODO
    JR: (instruction) => {
      const operands = instruction.opcode.operands
      const relative = getSourceValue(operands.slice(-1)[0], instruction.parameters)
      if (operands.length !== 1) {
        if (!checkCondition(operands[0])) { return instruction.opcode.cycles[1] }
      }
      registers.PC += relative
      return instruction.opcode.cycles[0]
    },
    JP: (instruction) => {
      const operands = instruction.opcode.operands
      const address = getSourceValue(operands.slice(-1)[0], instruction.parameters)
      if (operands.length !== 1) {
        if (!checkCondition(operands[0])) { return instruction.opcode.cycles[1] }
      }
      registers.PC = address
      return instruction.opcode.cycles[0]
    },
    CALL: (instruction) => {
      const operands = instruction.opcode.operands
      const address = getSourceValue(operands.slice(-1)[0], instruction.parameters)
      if (operands.length !== 1) {
        if (!checkCondition(operands[0])) { return instruction.opcode.cycles[1] }
      }
      pushWord(registers.PC)
      registers.PC = address
      return instruction.opcode.cycles[0]
    },
    RET: (instruction) => {
      const operands = instruction.opcode.operands
      if (operands.length !== 0) {
        if (!checkCondition(operands[0])) { return instruction.opcode.cycles[1] }
      }
      const address = popWord()
      registers.PC = address
      return instruction.opcode.cycles[0]
    },
    RETI: (instruction) => {
      const address = popWord()
      ime = true
      registers.PC = address
      return instruction.opcode.cycles[0]
    },
    RST: (instruction) => {
      const pc = parseInt(instruction.opcode.operands[0].slice(0, -1))
      registers.pc = pc
      return instruction.opcode.cycles[0]
    },
    NOP: (instruction) => { return instruction.opcode.cycles[0] },
    STOP: (instruction) => {
      stop = true
      return instruction.opcode.cycles[0]
    },
    HALT: (instruction) => { return instruction.opcode.cycles[0] }, // TODO
    INC: (instruction) => { return instruction.opcode.cycles[0] }, // TODO
    DEC: (instruction) => { return instruction.opcode.cycles[0] }, // TODO
    PUSH: (instruction) => {
      const source_value = getSourceValue(instruction.opcode.operands[0])
      pushWord(source_value)
      return instruction.opcode.cycles[0]
    },
    POP: (instruction) => {
      const value = popWord()
      setDestinationValue(instruction.opcode.operands[0], value, instruction.parameters)
      return instruction.opcode.cycles[0]
    },
    RLCA: (instruction) => {
      setDefaultFlags(instruction.opcode.flags)

      const bit_out = ((registers.A & 0b10000000) === 0b10000000 ? 1 : 0)
      registers.flagC = bit_out === 1
      registers.flagZ = ((registers.A << 1) & 0xff) + bit_out === 0x00

      registers.A = ((registers.A << 1) & 0xff) + bit_out
      return instruction.opcode.cycles[0]
    },
    RRCA: (instruction) => {
      setDefaultFlags(instruction.opcode.flags)

      const bit_out = ((registers.A & 0b10000000) === 0b10000000 ? 0b10000000 : 0)
      registers.flagC = bit_out === 0b10000000
      registers.flagZ = ((registers.A >> 1) & 0xff) + bit_out === 0x00
      registers.A = (registers.A >> 1) + bit_out
      return instruction.opcode.cycles[0]
    },
    RLA: (instruction) => { return instruction.opcode.cycles[0] }, // TODO
    RRA: (instruction) => { return instruction.opcode.cycles[0] }, // TODO
    RLC: (instruction) => {
      setDefaultFlags(instruction.opcode.flags)
      const value = getSourceValue(instruction.opcode.operands[0])
      const bit_out = ((value & 0b10000000) === 0b10000000 ? 0b00000001 : 0)
      registers.flagC = bit_out === 1
      registers.flagZ = ((value << 1) & 0xff) + bit_out === 0x00

      setDestinationValue(instruction.opcode.operands[0], ((value << 1) & 0xff) + bit_out)
      return instruction.opcode.cycles[0]
    },
    RRC: (instruction) => {
      setDefaultFlags(instruction.opcode.flags)
      const value = getSourceValue(instruction.opcode.operands[0])
      const bit_out = ((value & 0b10000000) === 0b10000000 ? 0b10000000 : 0)
      registers.flagC = bit_out === 0b10000000
      registers.flagZ = ((value >> 1) & 0xff) + bit_out === 0x00
      setDestinationValue(instruction.opcode.operands[0], (value >> 1) + bit_out)
      return instruction.opcode.cycles[0]
    },
    RL: (instruction) => { return instruction.opcode.cycles[0] }, // TODO
    RR: (instruction) => { return instruction.opcode.cycles[0] }, // TODO
    SLA: (instruction) => { return instruction.opcode.cycles[0] }, // TODO
    SRA: (instruction) => { return instruction.opcode.cycles[0] }, // TODO
    SWAP: (instruction) => { return instruction.opcode.cycles[0] }, // TODO
    SRL: (instruction) => { return instruction.opcode.cycles[0] }, // TODO
    BIT: (instruction) => {
      const value = getSourceValue(instruction.opcode.operands[1])
      const bitshift = parseInt(instruction.opcode.operands[0])
      setDefaultFlags(instruction.opcode.flags)
      registers.flagZ = (value & (1 << bitshift) === 0)
      return instruction.opcode.cycles[0]
    },
    RES: (instruction) => {
      const source_value = getSourceValue(instruction.opcode.operands[1])
      const bit = parseInt(instruction.opcode.operands[0])
      setDestinationValue(instruction.opcode.operands[1], source_value & (0xff - (1 << bit)), instruction.parameters)
      return instruction.opcode.cycles[0]
    },
    SET: (instruction) => {
      const source_value = getSourceValue(instruction.opcode.operands[1])
      const bit = parseInt(instruction.opcode.operands[0])
      setDestinationValue(instruction.opcode.operands[1], source_value & (0xff - (1 << bit)), instruction.parameters)
      return instruction.opcode.cycles[0]
    }

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
    get AF () {
      return (this.A << 8) | this.F
    },
    get BC () {
      return (this.B << 8) | this.C
    },
    get DE () {
      return (this.D << 8) | this.E
    },
    get HL () {
      return (this.H << 8) | this.L
    },
    set AF (af) {
      this.A = af >> 8
      this.F = af & 0xf0
    },
    set BC (bc) {
      this.B = bc >> 8
      this.C = bc & 0xff
    },
    set DE (de) {
      this.D = de >> 8
      this.E = de & 0xff
    },
    set HL (hl) {
      this.H = hl >> 8
      this.L = hl & 0xff
    },
    get flagZ () {
      return this.F & 0b10000000
    },
    set flagZ (v) {
      if (v) {
        this.F |= 0b10000000
      } else {
        this.F &= 0b01111111
      }
    },
    get flagN () {
      return this.F & 0b01000000
    },
    set flagN (v) {
      if (v) {
        this.F |= 0b01000000
      } else {
        this.F &= 0b10111111
      }
    },
    get flagH () {
      return this.F & 0b00100000
    },
    set flagH (v) {
      if (v) {
        this.F |= 0b00100000
      } else {
        this.F &= 0b11011111
      }
    },
    get flagC () {
      return this.F & 0b00010000
    },
    set flagC (v) {
      if (v) {
        this.F |= 0b00010000
      } else {
        this.F &= 0b11101111
      }
    }
  }

  let ime = true
  const halt = false
  let waiting_ticks = 0

  function tick () {
    if (!waiting_ticks--) {
      const instruction = fetchInstruction()
      console.log(instruction)
      waiting_ticks = instructions[instruction.opcode.mnemonic](instruction)
    }
  }

  function fetchInstruction () {
    let prefixed = false
    let opcode = bus.read(registers.PC)
    registers.PC++
    if (opcode === 0xcb) {
      opcode = bus.read(registers.PC)
      prefixed = true
      registers.PC++
    }

    const instruction = opcodes[prefixed ? 'cbprefixed' : 'unprefixed']['0x' + (0x100 + opcode).toString(16).substring(1).toUpperCase()]
    const parameters = []
    for (let i = 0; i < instruction.bytes - (prefixed ? 2 : 1); i++) {
      parameters.push(bus.read(registers.PC))
      registers.PC++
    }
    return {
      opcode: instruction,
      parameters

    }
  }

  return {
    tick
  }
}
