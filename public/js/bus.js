export default function createBus(){

    const addressSpaces = []

    function read(address){
        for(let addressSpace in addressSpaces){
            if(addressSpace.accept(address)){
                return addressSpace.read(address) & 0xff
            }
            return 0xff
        }
    }

    function write(address, value){
        for(let addressSpace in addressSpaces){
            if(addressSpace.accept(address)){
                addressSpace.write(address,value & 0xff)
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