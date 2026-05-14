const OSC = '\x1B]';
const BEL = '\x07';

function buildOsc8Link(text: string, url: string): string {
  return `${OSC}8;;${url}${BEL}${text}${OSC}8;;${BEL}`;
}

function supportsHyperlinks(): boolean {
  if (process.env['FORCE_HYPERLINK'] === '1') return true;
  if (process.env['FORCE_HYPERLINK'] === '0') return false;
  return process.stdout.isTTY;
}

export function terminalLink(text: string, url: string): string {
  return supportsHyperlinks() ? buildOsc8Link(text, url) : text;
}
