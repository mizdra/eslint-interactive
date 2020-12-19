import { mul } from './lib/mul'
import { add } from './lib/add'
import { strictEqual } from 'assert'

const numA=add(1, 2)
let numB=add(3, 4)
let numC=mul(numA, numB)

strictEqual(numC, 21)
