export const pageMainClass = [
  'mx-auto grid min-h-svh max-w-[760px] gap-4 px-6 pt-10 pb-16 font-dm-sans text-ks-gray-text antialiased',
  'bg-[radial-gradient(ellipse_80%_50%_at_10%_0%,rgba(82,183,136,0.12)_0%,transparent_60%),radial-gradient(ellipse_60%_40%_at_90%_100%,rgba(183,224,85,0.1)_0%,transparent_55%),var(--ks-off-white)]',
  'max-sm:px-4 max-sm:pt-5 max-sm:pb-12',
].join(' ')

export const heroSectionClass = [
  'ks-hero-card relative overflow-hidden rounded-ks-lg px-10 py-12 shadow-[0_20px_60px_rgba(26,58,42,0.18)] animate-ks-slide-up',
  'bg-[linear-gradient(135deg,var(--ks-green-dark)_0%,var(--ks-green-mid)_60%,var(--ks-green-light)_100%)]',
  'max-sm:px-6 max-sm:py-8',
].join(' ')

export const formCardClass =
  'rounded-ks-lg border border-[rgba(82,183,136,0.18)] bg-white p-7 shadow-[0_8px_32px_rgba(26,58,42,0.12)] animate-ks-slide-up max-sm:p-5'

export const btnBase =
  'font-outfit inline-block cursor-pointer rounded-full  px-7 py-[13px] text-[15px] font-semibold tracking-[0.2px] no-underline transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:transform-none'

export const btnPrimary =
  'border-none bg-[linear-gradient(135deg,var(--ks-green-mid)_0%,var(--ks-green-light)_100%)] text-white shadow-[0_4px_16px_rgba(45,106,79,0.35)] hover:shadow-[0_8px_24px_rgba(45,106,79,0.45)]'

export const btnSecondary =
  'border border-[rgba(82,183,136,0.3)] bg-ks-gray-soft text-ks-green-dark'

export const btnGhost =
  'border border-[rgba(82,183,136,0.3)] bg-transparent hover:bg-ks-gray-soft backdrop-blur-md text-ks-green-dark'

export const fieldStackClass = 'flex flex-col gap-4'

export const labelClass =
  'block font-outfit text-[11px] font-bold tracking-[1.5px] text-ks-gray-text mb-1.5'

export const inputClass =
  'w-full rounded-ks-md border-[1.5px] border-ks-gray-soft bg-ks-off-white px-4 py-3 font-dm-sans text-[15px] text-ks-text-dark outline-none transition-colors duration-150 focus:border-ks-green-light focus:shadow-[0_0_0_3px_rgba(82,183,136,0.15)]'

export const feedbackSuccessClass = [
  'animate-ks-slide-up rounded-ks-md border border-[rgba(82,183,136,0.25)] px-5 py-4',
  'bg-[linear-gradient(135deg,rgba(82,183,136,0.08),rgba(183,224,85,0.08))]',
].join(' ')

export const feedbackErrorClass =
  'animate-ks-slide-up rounded-ks-md border border-[rgba(192,57,43,0.3)] bg-ks-red-soft px-5 py-4'
