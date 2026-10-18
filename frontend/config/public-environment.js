// Firebase web configuration is public by design; backend credentials are not.
const publicApiKeys = new Set(['VITE_FIREBASE_API_KEY'])
const sensitiveName = /SECRET|PASSWORD|PRIVATE_KEY|DATABASE_URL|DIRECT_URL|OPENROUTER|OPENAI|SERVICE_ACCOUNT|CREDENTIAL|ACCESS_TOKEN|REFRESH_TOKEN|API_KEY/i

export function assertPublicEnvironment(env) {
  const unsafe = Object.keys(env).filter(name => name.startsWith('VITE_') &&
    sensitiveName.test(name) && !publicApiKeys.has(name))
  if (unsafe.length) throw new Error(`Backend secrets cannot be exposed in Vite: ${unsafe.join(', ')}. Use backend environment variables.`)
}
