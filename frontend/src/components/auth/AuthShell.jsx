import {
  ArrowRightIcon,
  CheckBadgeIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import Card from "../common/Card";

const defaultHighlights = [
  "Verified profiles and transparent service details",
  "Fast dispatch with live progress visibility",
  "Secure checkout and clean account recovery",
];

const AuthShell = ({
  eyebrow,
  title,
  description,
  highlights = defaultHighlights,
  panelTitle,
  panelDescription,
  panelStats = [],
  footerLink,
  children,
}) => {
  return (
    <div className="min-h-screen bg-white text-primary-900">
      <div className="border-b border-hairline bg-primary-900 px-4 py-3 text-sm font-medium text-white sm:px-6 lg:px-8">
        <div className="page-shell flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Fixora-X keeps roadside access calm, branded, and easy to trust.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/90 transition-colors hover:text-white"
          >
            Back to home <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <main className="page-shell py-10 sm:py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.92fr] lg:gap-12">
          <section className="flex flex-col justify-between gap-8">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-3 rounded-full border border-hairline bg-white px-4 py-2 shadow-soft"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-900 text-sm font-semibold text-white">
                  F
                </span>
                <span>
                  <span className="block text-sm font-semibold text-primary-900">
                    Fixora-X
                  </span>
                  <span className="block text-xs text-secondary-500">
                    Roadside services
                  </span>
                </span>
              </Link>

              <p className="mt-10 text-sm font-semibold uppercase tracking-[0.25em] text-secondary-500">
                {eyebrow}
              </p>
              <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-primary-900 sm:text-5xl lg:text-6xl lg:leading-[1.05]">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-secondary-600 sm:text-lg">
                {description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {highlights.map((highlight) => (
                <Card key={highlight} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-success-50 text-success-600">
                      <CheckBadgeIcon className="h-4 w-4" />
                    </span>
                    <p className="text-sm leading-6 text-secondary-600">
                      {highlight}
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="overflow-hidden bg-primary-900 p-0 text-white">
              <div className="grid gap-0 sm:grid-cols-[1fr_auto]">
                <div className="p-6 sm:p-7">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
                    Guided flow
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                    Designed to feel calm under pressure.
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/80">
                    The public auth screens now share the same clean canvas,
                    clear hierarchy, and premium contrast as the rest of the
                    redesign.
                  </p>
                </div>
                <div className="border-t border-white/10 p-6 sm:border-l sm:border-t-0 sm:p-7">
                  <SparklesIcon className="h-8 w-8 text-brand-coral" />
                </div>
              </div>
            </Card>
          </section>

          <section className="flex flex-col gap-6">
            <Card className="p-6 sm:p-8 lg:p-10">{children}</Card>

            <Card className="p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {panelStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-surface p-4">
                    <p className="text-2xl font-semibold tracking-tight text-primary-900">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-secondary-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
              {panelTitle ? (
                <div className="mt-5 border-t border-hairline pt-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary-500">
                    {panelTitle}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-secondary-600">
                    {panelDescription}
                  </p>
                </div>
              ) : null}
              {footerLink ? (
                <div className="mt-5 border-t border-hairline pt-5 text-sm text-secondary-600">
                  {footerLink}
                </div>
              ) : null}
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AuthShell;
