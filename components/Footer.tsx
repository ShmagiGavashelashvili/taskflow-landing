import { COPYRIGHT_YEAR, NEWSLETTER_INPUT_ID } from "@/constants/site";
import { footerColumns, socialLinks } from "@/data";
import EmailCapture from "./ui/EmailCapture";
import Logo from "./ui/Logo";

export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-4 max-w-xs text-white/70">
              The calm, clear way for small teams to plan, track and ship their work.
            </p>
            <div className="mt-6 flex gap-2">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-white motion-reduce:transition-none"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerColumns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="text-sm font-bold">{column.title}</h2>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-white/70 transition-colors hover:text-white focus-visible:outline-white motion-reduce:transition-none"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <div className="grid items-center gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-lg font-bold">Get product updates</h2>
              <p className="mt-1 text-sm text-white/70">One short email a month. No spam, unsubscribe anytime.</p>
            </div>
            <EmailCapture
              inputId={NEWSLETTER_INPUT_ID}
              label="Email for the newsletter"
              buttonLabel="Subscribe"
              successTitle="Thanks for subscribing!"
              successMessage="Demo only: no email was sent or stored."
              theme="dark"
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-white/60 sm:flex-row sm:justify-between">
          <p>&copy; {COPYRIGHT_YEAR} TaskFlow, Inc. All rights reserved.</p>
          <p>TaskFlow is a fictional product. This is a portfolio demo project.</p>
        </div>
      </div>
    </footer>
  );
}
