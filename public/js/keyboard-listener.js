export default function createKeyboardListener(document) {
    const state = {
        observers: [],
        playerId: null
    }

    function registerPlayerId(playerId) {
        state.playerId = playerId
    }

    function subscribe(observerFunction) {
        state.observers.push(observerFunction)
    }

    function notifyAll(command) {
        for (const observerFunction of state.observers) {
            observerFunction(command)
        }
    }

    document.addEventListener('keydown', handleKeydown)

    function handleKeydown(event) {
        const keyPressed = event.key

        const command = {
            type: 'keyDown',
            keyPressed
        }
        console.log(command)
        notifyAll(command)
    }

    document.addEventListener('keyup', handleKeyup)

    function handleKeyup(event) {
        const keyPressed = event.key

        const command = {
            type: 'keyUp',
            keyPressed
        }
        console.log(command)

        notifyAll(command)
    }

    return {
        subscribe,
        registerPlayerId
    }
}