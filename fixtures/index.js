import { mul } from './lib/mul'
import { add } from './lib/add'
import { sub } from './lib/sub'
import { strictEqual } from 'assert'

const numA=add(1, 2)
let numB=add(3, 4)
let numC=sub(5, 6)
let numD=mul(numA, numB, numC)

strictEqual(numD, -21)
