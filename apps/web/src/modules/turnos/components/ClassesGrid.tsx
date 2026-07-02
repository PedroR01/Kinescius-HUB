import ClassCard from "@/modules/turnos/components/classCard";
import type { ClassSlot } from "@/lib/class-interface";

interface ClassesGridProps {
  viewAll: boolean;
  dates: ClassSlot[];
  appointmentSlots: ClassSlot[];
  selectedDate: string;
  enrolledClassIds: Set<number>;
  waitList: string[];
  isInCart: (key: string) => boolean;
  onEnroll: (slot: ClassSlot) => void;
  onAddToCart: (slot: ClassSlot) => void;
  onWaitList: (slot: ClassSlot) => Promise<void>;
}

function getWaitKey(slot: ClassSlot): string {
  return `${slot.date} ${slot.time}hs ${slot.className}`;
}

export function ClassesGrid({
  viewAll,
  dates,
  appointmentSlots,
  selectedDate,
  enrolledClassIds,
  waitList,
  isInCart,
  onEnroll,
  onAddToCart,
  onWaitList,
}: ClassesGridProps) {
  const classesByDate = appointmentSlots.filter((slot) => slot.date === selectedDate);

  if (viewAll) {
    if (dates.length === 0) {
      return <p className="py-2 text-sm text-ks-gray-text">No hay clases disponibles.</p>;
    }

    return (
      <div className="flex flex-col gap-6">
        {dates.map((dateSlot) => {
          const slotsForDate = appointmentSlots.filter((slot) => slot.date === dateSlot.date);
          return (
            <div key={dateSlot.date}>
              <div className="mb-3 border-b-[1.5px] border-ks-gray-soft pb-2">
                <span className="font-outfit text-[13px] font-bold tracking-[0.5px] text-ks-green-dark capitalize">
                  {dateSlot.dayLabel} {dateSlot.dateLabel}
                </span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 max-sm:grid-cols-2">
                {slotsForDate.map((slot) => (
                  <ClassCard
                    key={slot.key}
                    slot={slot}
                    isEnrolled={enrolledClassIds.has(slot.source.id)}
                    isWaited={waitList.includes(getWaitKey(slot))}
                    isInCart={isInCart(slot.key)}
                    onEnroll={onEnroll}
                    onAddToCart={onAddToCart}
                    onWaitList={onWaitList}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (classesByDate.length === 0) {
    return <p className="py-2 text-sm text-ks-gray-text">No hay clases para este día.</p>;
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 max-sm:grid-cols-2">
      {classesByDate.map((slot) => (
        <ClassCard
          key={slot.key}
          slot={slot}
          isEnrolled={enrolledClassIds.has(slot.source.id)}
          isWaited={waitList.includes(getWaitKey(slot))}
          isInCart={isInCart(slot.key)}
          onEnroll={onEnroll}
          onAddToCart={onAddToCart}
          onWaitList={onWaitList}
        />
      ))}
    </div>
  );
}
