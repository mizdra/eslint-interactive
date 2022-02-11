import { groupBy, unique } from './array.js';

test('unique', () => {
  expect(unique([0, 1, 1, 2, 1])).toStrictEqual([0, 1, 2]);
});

test('groupBy', () => {
  const map = groupBy([0, 1, 2, 3], (num) => num % 2);
  expect([...map.entries()]).toStrictEqual([
    [0, [0, 2]],
    [1, [1, 3]],
  ]);
});
