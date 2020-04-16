export default function loadRom(file) {

    const rom = new Uint8Array(file)

    function accept(address) {
        return address >= 0 && address < 0x8000
    }

    function read(address) {
        return rom[address]
    }

    function write(address, value){
        // Do nothing
    }

    return {
        accept,
        write,
        read
    }
}