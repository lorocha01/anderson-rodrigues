export function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return <img src={url} alt="" className="size-14 rounded-full object-cover" />;
  }
  const initials = name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return (
    <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-lilac-soft font-display text-lg font-semibold text-lilac">
      {initials}
    </span>
  );
}
