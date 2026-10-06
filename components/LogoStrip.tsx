import { companies } from "@/data";
import Reveal from "./ui/Reveal";

export default function LogoStrip() {
  return (
    <section aria-labelledby="logos-title" className="py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2
            id="logos-title"
            className="text-center text-sm font-semibold tracking-wide text-muted"
          >
            Trusted by 2,000+ teams
          </h2>
          <ul className="mt-8 grid grid-cols-2 items-center gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {companies.map((company) => (
              <li
                key={company.id}
                className="flex items-center justify-center gap-2 text-slate-500 grayscale transition-colors hover:text-slate-700 motion-reduce:transition-none"
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <circle cx="11" cy="11" r="9.5" stroke="currentColor" strokeWidth="2" />
                  <path d="M6.5 14.5 11 6l4.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-lg font-extrabold tracking-tight">{company.name}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
