import { families } from "@/catalog/families";
import { catalog } from "@/catalog/registry";

export default function Home() {
  const visibleFamilies = families.filter((family) =>
    catalog.some((entry) => entry.family === family.id),
  );

  return (
    <main className="mx-auto flex w-full max-w-200 flex-1 flex-col gap-16 pt-16 pr-[max(1.5rem,env(safe-area-inset-right))] pb-[max(4rem,env(safe-area-inset-bottom))] pl-[max(1.5rem,env(safe-area-inset-left))]">
      <header className="flex flex-col gap-4">
        <h1 className="text-balance font-serif text-2xl font-normal leading-[1.1] tracking-[-0.015em] sm:text-5xl">
          Beyond the happy path.
        </h1>
        <p className="max-w-prose text-pretty leading-relaxed text-muted">
          Interactive UI states for the things that happen in real applications
          — slow networks, failed requests, offline moments, and everything in
          between.
        </p>
      </header>
      {visibleFamilies.map((family) => (
        <section
          key={family.id}
          className="flex flex-col gap-10 border-t border-border pt-10 [border-top-width:var(--line)]"
          aria-labelledby={family.id}
        >
          <h2
            id={family.id}
            className="text-balance font-sans text-xs font-medium tracking-[0.14em] text-muted uppercase"
          >
            {family.label}
          </h2>
          <div className="flex flex-col gap-16">
            {catalog
              .filter((entry) => entry.family === family.id)
              .map(({ id, Demo }) => (
                <Demo key={id} />
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
