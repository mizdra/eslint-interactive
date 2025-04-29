import { mul } from './lib/mul'
import { add } from './lib/add'
import { sub } from './lib/sub'
import { exp } from './lib/exp'
import { strictEqual } from 'assert'

const numA=add(1, 2)
let numB=add(3, 4)
let numC=sub(5, 6)
let numD=exp(2, 2)
let numE=mul(numA, numB, numC, numD)

strictEqual(numD, -84)
