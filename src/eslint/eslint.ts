export async function shouldUseFlatConfig(): Promise<boolean> {
  try {
    const eslintModule = await import('eslint'); // for eslint v9
    if ('shouldUseFlatConfig' in eslintModule) {
      return await eslintModule.shouldUseFlatConfig();
    }
    const useAtYourOwnRiskModule = await import('eslint/use-at-your-own-risk'); // for eslint v8
    if ('shouldUseFlatConfig' in useAtYourOwnRiskModule) {
      return await useAtYourOwnRiskModule.shouldUseFlatConfig();
    }
  } catch (_e) {
    // noop
  }
  return false; // for eslint v7
}
