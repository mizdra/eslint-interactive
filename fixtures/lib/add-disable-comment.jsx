const a = 0;
// eslint-disable-next-line semi
const b = 0
/* eslint-disable-next-line semi */
const c = 0
// eslint-disable-next-line ban-exponentiation-operator
const d = 0
// eslint-disable-next-line no-unused-vars
const jsx = (
  <>
    <div>{2 ** 10}</div>
    {/* eslint-disable-next-line semi */}
    <div>{2 ** 10}</div>
  </>
);
