export default function createCPU(){

    const registers = {
        a: 0,
        f: 0,
        b: 0,
        c: 0,
        d: 0,
        e: 0,
        h: 0,
        l: 0,
        pc: 0,
        sp: 0,
        get af() {  
            return (this.a << 8) | this.f
        },
        get bc() {
            return (this.b << 8) | this.c
        },
        get de() {
            return (this.d << 8) | this.e
        },
        get hl() {
            return (this.h << 8) | this.l
        },
        set af(af) {
            this.a = af >> 8
            this.f = af & 0xf0
        },
        set bc(bc) {
            this.b = bc >> 8
            this.c = bc & 0xff
        },
        set de(de) {
            this.d = de >> 8
            this.e = de & 0xff
        },
        set hl(hl) {
            this.h = hl >> 8
            this.l = hl & 0xff
        },
        get flagZ() {
            return this.f & 0b10000000
        },
        set flagZ(v){
            if(v) {
                this.f |= 0b10000000
            } else {
                this.f &= 0b01111111
            }
        },
        get flagN() {
            return this.f & 0b01000000
        },
        set flagN(v){
            if(v) {
                this.f |= 0b01000000
            } else {
                this.f &= 0b10111111
            }
        },
        get flagH() {
            return this.f & 0b00100000
        },
        set flagH(v){
            if(v) {
                this.f |= 0b00100000
            } else {
                this.f &= 0b11011111
            }
        },
        get flagC() {
            return this.f & 0b00010000
        },
        set flagC(v){
            if(v) {
                this.f |= 0b00010000
            } else {
                this.f &= 0b11101111
            }
        },
    }

    let ime = true
    let halt = false
    let waiting_ticks = 0

    function tick() {
        if (! --waiting_ticks){
            
        }
    }

    return {
        registers,
        tick
    }
}