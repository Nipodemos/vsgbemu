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
        }
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