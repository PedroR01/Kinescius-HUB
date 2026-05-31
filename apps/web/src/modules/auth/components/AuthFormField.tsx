import type { ChangeEvent } from 'react'
import { inputClass, labelClass } from '@/lib/ks-page-styles'

type AuthFormFieldProps = {
  label: string
  name: string
  type: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  required?: boolean
}

export function AuthFormField({
  label,
  name,
  type,
  value,
  onChange,
  required,
}: AuthFormFieldProps) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={inputClass}
      />
    </label>
  )
}
