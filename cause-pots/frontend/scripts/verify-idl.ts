import { Contract, IDL } from '../idl'

console.log('✅ IDL Import Test')
console.log('==================')
console.log('')
console.log('Program Address:', IDL.address)
console.log('Program Name:', IDL.metadata.name)
console.log('Program Version:', IDL.metadata.version)
console.log('')
console.log('Instructions:')
IDL.instructions.forEach((ix: any) => {
  console.log(`  - ${ix.name}`)
})
console.log('')
console.log('Account Types:')
IDL.accounts.forEach((acc: any) => {
  console.log(`  - ${acc.name}`)
})
console.log('')
console.log('✅ IDL loaded successfully!')
console.log('Type checking works:', typeof (null as unknown as Contract))
