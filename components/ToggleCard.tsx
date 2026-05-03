
type ToggleCardProps = Readonly<{
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}>;

export default function ToggleCard({ title, description, checked, onChange }: ToggleCardProps) {
    return (
        <label className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4">
            <div>
                <div className="text-sm font-semibold text-slate-900">{title}</div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            </div>
            <span className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${checked ? "bg-teal-700" : "bg-slate-300"}`}>
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