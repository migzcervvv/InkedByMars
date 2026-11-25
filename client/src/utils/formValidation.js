export function formErrors(form, labels, rules = {}) {
  const fields = {}
  for (const [name, label] of Object.entries(labels)) {
    const input = form.elements.namedItem(name)
    if (!input?.willValidate) continue
    const { validity, value } = input
    if (validity.valueMissing || (input.required && input.type !== 'password' && !value.trim())) {
      const action = ['select-one', 'date', 'time'].includes(input.type) ? 'Choose' : 'Enter'
      fields[name] = `${action} ${label}.`
    } else if (validity.typeMismatch && input.type === 'email') {
      fields[name] = 'Enter an email address like name@example.com.'
    } else if (input.minLength > 0 && value && value.length < input.minLength) {
      fields[name] = `Use at least ${input.minLength} characters for ${label}.`
    } else if (input.maxLength > 0 && value.length > input.maxLength) {
      fields[name] = `Use ${input.maxLength} characters or fewer for ${label}.`
    } else if (!validity.valid) {
      fields[name] = `Check ${label} and try again.`
    } else {
      const message = rules[name]?.(value)
      if (message) fields[name] = message
    }
  }
  return Object.keys(fields).length ? { fields } : null
}

export function checkNewPassword(value) {
  if (new TextEncoder().encode(value).length > 72) return 'Use a shorter password.'
  if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) return 'Use an uppercase letter and a number in the password.'
}
