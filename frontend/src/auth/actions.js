import { authError, validateSignup } from './validation.js'

export function createAuthActions(client) {
  return {
    async signup(values) {
      const error = validateSignup(values)
      if (error) throw new Error(error)
      const user = await client.create(values.email.trim(), values.password)
      const warnings = []
      try {
        await client.updateName(user, `${values.firstName.trim()} ${values.lastName.trim()}`)
      } catch {
        warnings.push('Your account was created, but your name could not be saved.')
      }
      return { user, message: warnings.join(' ') || 'Account created. You are signed in.' }
    },
    async resetPassword(email) {
      try {
        await client.resetPassword(email.trim())
      } catch (error) {
        // Give the same result for unknown addresses without disclosing accounts.
        if (error.code !== 'auth/user-not-found') throw error
      }
      return 'If an account exists for this email, a password reset link has been sent.'
    },
  }
}

export { authError }
