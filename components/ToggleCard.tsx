
type ToggleCardProps = Readonly<{
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}>;

export default function ToggleCard({ title, description, checked, onChange }: ToggleCardProps) {
    return (
        <label className="flex items-start justify-between gap-4 rounded-3xl border border-(--line) bg-(--field) px-5 py-4">
            <div>
                <div className="text-sm font-semibold text-foreground">{title}</div>
                <p className="mt-1 text-sm leading-6 text-(--muted)">{description}</p>
            </div>
            <span className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${checked ? "bg-(--accent)" : "bg-(--toggle-off)"}`}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => onChange(event.target.checked)}
                    className="peer sr-only" />
                <span className={`cursor-pointer inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
            </span>
        </label>
    );
}
