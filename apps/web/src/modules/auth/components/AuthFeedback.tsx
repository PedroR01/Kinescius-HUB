import { feedbackErrorClass, feedbackSuccessClass } from '@/lib/ks-page-styles'

type AuthFeedbackProps = {
  message?: string
  error?: string
}

export function AuthFeedback({ message, error }: AuthFeedbackProps) {
  return (
    <>
      {message && (
        <section className={feedbackSuccessClass}>
          <p className="text-sm leading-relaxed font-medium text-ks-green-dark">{message}</p>
        </section>
      )}
      {error && (
        <section className={feedbackErrorClass}>
          <p className="text-sm leading-relaxed font-medium text-ks-red">{error}</p>
        </section>
      )}
    </>
  )
}
