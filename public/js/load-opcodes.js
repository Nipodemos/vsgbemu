export default async function loadOpcodes () {
  return await (await fetch('https://gbdev.io/gb-opcodes/Opcodes.json')).json()
}
