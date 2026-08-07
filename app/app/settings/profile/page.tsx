// app/app/settings/profile/page.tsx
export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="border border-border bg-surface p-4">
        <p className="font-mono text-xs uppercase tracking-wide text-text-secondary">
          settings / user
        </p>
        <h1 className="mt-2 text-xl font-bold text-text-primary">Profile</h1>
        <p className="mt-1 text-sm text-text-secondary">
          This is how others will see you across Wayframe.
        </p>
      </header>

      <section className="flex items-center gap-4 border border-border bg-surface p-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent font-mono text-lg font-semibold text-white">
          CW
        </span>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
            active identity
          </span>
          <span className="text-sm font-semibold text-text-primary">User Name</span>
          <span className="font-mono text-xs text-text-secondary">user@example.com</span>
        </div>
      </section>

      <section className="border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-text-primary">
            public details
          </h2>
        </div>
        <div className="flex flex-col gap-3 p-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wide text-text-secondary">
            Display name
          </span>
          <input
            defaultValue="User Name"
            className="border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          />
        </label>
        <button
          type="button"
          className="w-fit border border-accent bg-accent px-3 py-1.5 font-mono text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          Save changes
        </button>
        </div>
      </section>
    </div>
  );
}
