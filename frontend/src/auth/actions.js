import { authError, validateSignup } from './validation.js'

// Keep account creation separate from follow-up steps: a failed verification
// email must not prompt the user to create the same account again.
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
      try {
        await client.sendVerification(user)
      } catch {
        warnings.push('The verification email could not be sent. Use Resend verification email to try again.')
      }
      return { user, message: warnings.join(' ') || 'Account created. Check your inbox for a verification email.' }
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
