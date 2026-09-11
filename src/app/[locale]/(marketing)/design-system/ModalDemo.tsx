"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ShieldCheckIcon } from "@/components/ui/icons";

/** Holds the open/close state for the Modal preview below — Modal itself stays a stateless, controlled component. */
export function ModalDemo({
  triggerLabel,
  title,
  description,
  cancelLabel,
  confirmLabel,
}: {
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        icon={<ShieldCheckIcon width={28} height={28} />}
        title={title}
        description={description}
        cancelLabel={cancelLabel}
        confirmLabel={confirmLabel}
      />
    </>
  );
}
