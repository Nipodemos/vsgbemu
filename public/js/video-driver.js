export default function createPpu(){

    const framebuffer = [] 
    for(let y = 0; y < 144; y++) {
        framebuffer.push(new Array())
        for(let x = 0; x < 160; x++) {
            framebuffer[y].push('#ffffff')
        }
    }

    let status = 0
    

    function tick(){

    }

    return {
        status,
        framebuffer,
        tick
    }
}

