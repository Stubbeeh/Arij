"use client";

export function Modal({
  children,
  onClose,
  drawer,
}: {
  children: React.ReactNode;
  onClose: () => void;
  drawer?: boolean;
}) {
  return (
    <div className={`backdrop ${drawer ? "" : "center"}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={drawer ? "drawer" : "modal"}>{children}</div>
    </div>
  );
}
