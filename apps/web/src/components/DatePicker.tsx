import { useState } from "react"

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export function DatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha...',
  minDate,
  maxDate,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minDate?: string
  maxDate?: string
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [open, setOpen] = useState(false)

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const handleDay = (day: number) => {
    const date = new Date(viewYear, viewMonth, day)
    const dow = date.getDay()
    // Block weekends
    if (dow === 0 || dow === 6) return
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    if (minDate && dateStr < minDate) return
    if (maxDate && dateStr > maxDate) return
    onChange(dateStr)
    setOpen(false)
  }

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="relative mt-1.5">
      <div
        onClick={() => setOpen(o => !o)}
        className={`input mt-0 flex items-center justify-between user-select-none ${value ? 'text-(--text-style)' : 'text-gray-400'}`}
      >
        <span>{displayValue || placeholder}</span>
        <span className='text-xs opacity-50'>▼</span>
      </div>

      {open && (
        <div className='absolute top-[calc(100%+6px)] left-0 z-100 bg-white border border-emerald-300 rounded-lg p-4 shadow-lg w-64'>
          <div className='flex items-center justify-between mb-3'>
            <button onClick={prevMonth} className='bg-transparent border-none cursor-pointer text-lg text-(--green) p-2'>‹</button>
            <span className='font-semibold text-base text-(--text-style)'>{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} className='bg-transparent border-none cursor-pointer text-lg text-(--green) p-2'>›</button>
          </div>

          <div className='grid grid-cols-7 gap-1 mb-2'>
            {DAYS.map(d => (
              <div key={d} className='text-center text-xs font-semibold text-[d === "Dom" || d === "Sáb" ? "rgba(13,31,24,0.25)" : "rgba(13,31,24,0.45)"] py-1'>{d}</div>
            ))}
          </div>

          <div className='grid grid-cols-7 gap-1'>
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />
              const date = new Date(viewYear, viewMonth, day)
              const dow = date.getDay()
              const isWeekend = dow === 0 || dow === 6
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isSelected = value === dateStr
              const isDisabled = isWeekend || (!!minDate && dateStr < minDate) || (!!maxDate && dateStr > maxDate)
              const isToday = date.getTime() === today.getTime()
              return (
                <div
                  key={day}
                  onClick={() => handleDay(day)}
                  className={`text-center p-1.5 rounded-md text-sm font-${isSelected ? 'bold' : 'normal'} cursor-${isDisabled ? 'default' : 'pointer'} bg-${isSelected ? 'emerald-500' : isToday ? 'emerald-50/10' : 'transparent'} text-${isSelected ? 'white' : isDisabled ? 'gray-400' : 'text-style'} border-${isToday && !isSelected ? 'emerald-500' : 'transparent'} transition-all duration-150`}
                  onMouseEnter={e => { if (!isDisabled) (e.currentTarget.style.background = isSelected ? 'var(--green)' : 'rgba(45,190,127,0.12)') }}
                  onMouseLeave={e => { if (!isDisabled) (e.currentTarget.style.background = isSelected ? 'var(--green)' : isToday ? 'rgba(45,190,127,0.1)' : 'transparent') }}
                >
                  {day}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePicker;