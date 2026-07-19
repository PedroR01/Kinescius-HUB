import { CheckIcon, ShoppingCartIcon, UserIcon } from "lucide-react";
import type { ClassSlot } from "@/lib/class-interface";
import { cn } from "@/lib/utils";

export default function ClassCard({
  slot,
  isEnrolled = false,
  isWaited,
  isInCart,
  onEnroll,
  onAddToCart,
  onWaitList,
}: {
  slot: ClassSlot;
  isEnrolled?: boolean;
  isWaited: boolean;
  isInCart: boolean;
  onEnroll: (slot: ClassSlot) => void;
  onAddToCart: (slot: ClassSlot) => void;
  onWaitList: (slot: ClassSlot) => void;
}) {
  const isInactive = isEnrolled || slot.sinCupo;

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-ks-md border-[1.5px] p-[18px_16px] transition-all duration-180ms",
        isInactive
          ? "border-ks-gray-soft bg-ks-gray-soft opacity-70"
          : "border-ks-gray-soft bg-ks-off-white",
        isInCart && !isInactive && "border-ks-green-light shadow-[0_0_0_2px_rgba(82,183,136,0.15)]"
      )}
    >
      <div
        className={cn(
          "font-outfit text-[22px] font-bold tracking-[-0.5px] text-ks-text-dark",
          isInactive && "text-ks-gray-text"
        )}
      >
        {slot.time} hs
      </div>
      <div className="mb-1 text-[13px] font-normal text-ks-gray-text">{slot.className}</div>

      {slot.profesor && (
        <div
          className={cn(
            "mb-2 flex items-center gap-1 text-[12px] font-medium",
            isInactive ? "text-ks-gray-text" : "text-ks-green-mid"
          )}
        >
          <UserIcon className="size-3" />
          {slot.profesor}
        </div>
      )}

      {isEnrolled ? (
        <span className="inline-flex w-fit items-center gap-[5px] rounded-ks-full bg-ks-green-pale px-2.5 py-1 font-outfit text-xs font-semibold text-ks-green-mid">
          <CheckIcon className="size-3.5" />
          Ya estás inscripto
        </span>
      ) : slot.sinCupo ? (
        <>
          <span className="inline-flex w-fit items-center gap-[5px] rounded-ks-full bg-black/6 px-2.5 py-1 font-outfit text-xs font-semibold text-ks-gray-text">
            Sin cupo
          </span>
          <button
            type="button"
            className={cn(
              "mt-2 block w-full cursor-pointer rounded-ks-full border-[1.5px] px-3 py-[7px] text-center font-outfit text-xs font-semibold transition-colors duration-150",
              isWaited
                ? "border-[rgba(82,183,136,0.4)] bg-ks-green-pale text-ks-green-mid"
                : "border-[rgba(192,57,43,0.3)] bg-ks-red-soft text-ks-red hover:border-ks-red hover:bg-[#fbd0cd]"
            )}
            onClick={() => onWaitList(slot)}
          >
            {isWaited ? "✓ En lista de espera" : "Unirse a lista de espera"}
          </button>
        </>
      ) : (
        <>
          {slot.cupo === 1 ? (
            <span className="inline-flex w-fit items-center gap-[5px] rounded-ks-full bg-[rgba(255,180,0,0.15)] px-2.5 py-1 font-outfit text-xs font-semibold text-[#a67c00]">
              ¡Solo 1!
            </span>
          ) : (
            <span className="inline-flex w-fit items-center gap-[5px] rounded-ks-full bg-ks-green-pale px-2.5 py-1 font-outfit text-xs font-semibold text-ks-green-mid">
              {slot.cupo} lugares
            </span>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="flex-1 cursor-pointer rounded-ks-full border-none bg-[linear-gradient(135deg,var(--ks-green-mid)_0%,var(--ks-green-light)_100%)] px-3 py-2 font-outfit text-xs font-semibold text-white shadow-[0_2px_8px_rgba(45,106,79,0.3)] transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0"
              onClick={() => onEnroll(slot)}
            >
              Inscribirme Ya
            </button>
            <button
              type="button"
              className={cn(
                "flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-ks-full border-[1.5px] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0",
                isInCart
                  ? "border-ks-green-mid bg-ks-green-pale text-ks-green-mid"
                  : "border-[rgba(82,183,136,0.3)] bg-ks-gray-soft text-ks-green-dark hover:border-ks-green-light"
              )}
              onClick={() => onAddToCart(slot)}
              aria-label={isInCart ? "Ya está en el carrito" : "Agregar al carrito"}
            >
              {isInCart ? <CheckIcon className="size-4" /> : <ShoppingCartIcon className="size-4" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}