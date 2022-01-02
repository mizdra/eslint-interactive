import oraNative, { Ora } from 'ora';

export function ora(text: string): Ora {
  return oraNative({
    text,
    spinner: 'moon',
  });
}
