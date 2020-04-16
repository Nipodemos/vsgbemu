export default function createBus(){

    const addressSpaces = []

    function read(address){
        for(let i = 0; i < addressSpaces.length; i++){
            if(addressSpaces[i].accept(address)){
                return addressSpaces[i].read(address) & 0xff
            }
        }
        console.error(`Address ${address.toString(16)} not accepted for any device`)
        return 0
    }

    function write(address, value){
        for(let i = 0; i < addressSpaces.length; i++){
            if(addressSpaces[i].accept(address)){
                addressSpaces[i].write(address,value & 0xff)
            }
        }
    }

    function register(addressSpace){
        addressSpaces.push(addressSpace)
    }

    return {
        read,
        write,
        register
    }

}