// app/app/settings/account/page.tsx
export default function AccountPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="border border-border bg-surface p-4">
        <p className="font-mono text-xs uppercase tracking-wide text-text-secondary">
          settings / account
        </p>
        <h1 className="mt-2 text-xl font-bold text-text-primary">Account</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your login and account-level preferences.
        </p>
      </header>

      <section className="border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-text-primary">
            login
          </h2>
        </div>
        <div className="p-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wide text-text-secondary">
              Email
            </span>
            <input
              disabled
              defaultValue="user@example.com"
              className="border border-border bg-bg px-3 py-2 text-sm text-text-secondary outline-none"
            />
          </label>
        </div>
      </section>

      <section className="border border-danger/40 bg-surface">
        <div className="border-b border-danger/40 px-4 py-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-danger">
            danger zone
          </h2>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <p className="text-xs text-text-secondary">
            Deleting your account removes all projects permanently.
          </p>
          <button
            type="button"
            className="w-fit border border-danger px-3 py-1.5 font-mono text-xs font-medium text-danger transition-colors hover:bg-danger hover:text-white"
          >
            Delete account
          </button>
        </div>
      </section>
    </div>
  );
}
