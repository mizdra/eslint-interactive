// @ts-check

import { join } from 'path';

/** @typedef {{ label: string, source: string, amount: number }} Case */

/**
 * @param {import('memfs').Volume} vol
 * @param {string} fixturesDirPath
 * @param {Case[]} cases
 */
export async function createFixtures(vol, fixturesDirPath, cases) {
  // remove old fixtures
  vol.rmSync(fixturesDirPath, { recursive: true, force: true });

  // create fixtures directory
  vol.mkdirSync(fixturesDirPath, { recursive: true });

  // create fixtures
  for (const c of cases) {
    for (let i = 0; i < c.amount; i++) {
      vol.writeFileSync(join(fixturesDirPath, `${c.label}-${i + 1}.js`), c.source);
    }
  }
}

/**
 * @param {import('../dist/core.js').Core} core
 */
export async function runAllFixes(core) {
  const results = await core.lint();
  {
    const undo = await core.applyAutoFixes(results, ['semi', 'arrow-body-style']);
    await undo();
  }
  {
    // disablePerLine
    const undo = await core.disablePerLine(results, ['semi', 'arrow-body-style']);
    await undo();
  }
  {
    // disablePerFile
    const undo = await core.disablePerFile(results, ['semi', 'arrow-body-style']);
    await undo();
  }
  {
    // makeFixableAndFix
    const undo = await core.makeFixableAndFix(results, ['semi', 'arrow-body-style'], (message) => {
      return message.fix;
    });
    await undo();
  }
}
