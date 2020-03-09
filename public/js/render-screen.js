export default function renderScreen(screen, ppu, requestAnimationFrame){

    const width = screen.attributes.width;
    const lenght = screen.attributes.lenght;

    const context =  screen.getContext('2d')
    context.fillStyle = 'white'
    context.clearRect(0, 0, width, lenght)

    for(let y = 0; y < lenght; y++){
        for(let x = 0; x < width; x++) {
            context.fillStyle = ppu.framebuffer[y][x]
            context.fillRect(x,y,1,1)
        }
    }

    requestAnimationFrame(() => {
        renderScreen(screen, ppu, requestAnimationFrame)
    })

}