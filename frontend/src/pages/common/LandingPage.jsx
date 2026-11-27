import {
  ArrowRightIcon,
  CheckBadgeIcon,
  ClockIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Section from "../../components/common/Section";

const features = [
  {
    icon: <WrenchScrewdriverIcon className="h-6 w-6" />,
    title: "Verified mechanics",
    description:
      "Every mechanic profile is screened, rated, and presented with the right service specialties.",
    accent: "bg-brand-coral",
  },
  {
    icon: <MapPinIcon className="h-6 w-6" />,
    title: "Live location awareness",
    description:
      "Track service progress in real time and know exactly when support will reach you.",
    accent: "bg-brand-blue",
  },
  {
    icon: <ClockIcon className="h-6 w-6" />,
    title: "Always-on dispatch",
    description:
      "Roadside assistance stays available around the clock so emergencies do not wait for business hours.",
    accent: "bg-brand-purple",
  },
  {
    icon: <ShieldCheckIcon className="h-6 w-6" />,
    title: "Trusted payments",
    description:
      "Secure checkout, service transparency, and receipts keep every transaction clear.",
    accent: "bg-primary-900",
  },
];

const workflow = [
  {
    step: "01",
    title: "Describe the problem",
    description:
      "Capture the vehicle issue, the location, and how urgent the situation is.",
  },
  {
    step: "02",
    title: "Match the right mechanic",
    description:
      "The platform surfaces nearby, relevant, and available mechanics for the request.",
  },
  {
    step: "03",
    title: "Track arrival and complete service",
    description:
      "Follow the mechanic, review the job, and pay securely when the work is done.",
  },
];

const testimonials = [
  {
    name: "John Doe",
    role: "Customer",
    quote:
      "Fixora-X saved my day when I had a flat tire on the highway. The flow felt calm even in an emergency.",
  },
  {
    name: "Sarah Wilson",
    role: "Customer",
    quote:
      "The tracking and mechanic profiles made it easy to trust the service before anyone arrived.",
  },
  {
    name: "Rajesh Kumar",
    role: "Mechanic",
    quote:
      "It gives me a clear workflow and a cleaner way to reach customers without losing context.",
  },
];

const stats = [
  { value: "24/7", label: "dispatch coverage" },
  { value: "500+", label: "verified mechanics" },
  { value: "5k+", label: "resolved requests" },
  { value: "4.9/5", label: "average satisfaction" },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-primary-900">
      <div className="border-b border-hairline bg-primary-900 px-4 py-3 text-sm font-medium text-white sm:px-6 lg:px-8">
        <div className="page-shell flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Emergency roadside support, dispatch tracking, and transparent
            booking in one place.
          </p>
          <Link
            to="/register?role=customer"
            className="inline-flex items-center gap-2 text-white/90"
          >
            Start a request <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-20 border-b border-hairline bg-white/95 backdrop-blur">
        <div className="page-shell flex items-center justify-between gap-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-900 text-sm font-semibold text-white">
              F
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-900">Fixora-X</p>
              <p className="text-xs text-secondary-500">Roadside services</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-secondary-600 md:flex">
            <a
              href="#features"
              className="transition-colors hover:text-primary-900"
            >
              Features
            </a>
            <a
              href="#workflow"
              className="transition-colors hover:text-primary-900"
            >
              How it works
            </a>
            <a
              href="#stories"
              className="transition-colors hover:text-primary-900"
            >
              Stories
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:inline-flex">
              <Button variant="tertiary" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register" className="inline-flex">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="page-shell py-14 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-secondary-500">
                Emergency support, redesigned
              </p>
              <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-primary-900 sm:text-5xl lg:text-6xl xl:text-7xl lg:leading-[1.05]">
                Find a trusted mechanic before the problem gets worse.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-secondary-600 sm:text-xl">
                Fixora-X connects customers and mechanics with clean booking,
                live updates, transparent requests, and reliable payments. It is
                designed for urgency without losing clarity.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/register?role=customer">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<ArrowRightIcon className="h-4 w-4" />}
                    className="w-full sm:w-auto"
                  >
                    Request roadside help
                  </Button>
                </Link>
                <Link to="/register?role=mechanic">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Join as mechanic
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-secondary-600">
                <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-4 py-2">
                  <CheckBadgeIcon className="h-4 w-4 text-success-600" />
                  Verified profiles
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-4 py-2">
                  <TruckIcon className="h-4 w-4 text-brand-blue" />
                  Fast dispatch
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-4 py-2">
                  <SparklesIcon className="h-4 w-4 text-brand-coral" />
                  Premium UX
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <Card
                variant="product"
                className="overflow-hidden bg-gradient-to-br from-brand-coral via-brand-magenta to-brand-purple"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/80">
                      Live dispatch
                    </p>
                    <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                      Roadside assistance in motion.
                    </h2>
                  </div>
                  <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Active
                  </div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/15 p-4 text-white backdrop-blur-sm">
                    <p className="text-sm text-white/80">Nearest mechanic</p>
                    <p className="mt-2 text-xl font-semibold">2.4 km away</p>
                  </div>
                  <div className="rounded-2xl bg-white/15 p-4 text-white backdrop-blur-sm">
                    <p className="text-sm text-white/80">Arrival estimate</p>
                    <p className="mt-2 text-xl font-semibold">11 min</p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {stats.slice(0, 2).map((stat) => (
                  <Card key={stat.label} className="p-5">
                    <p className="text-3xl font-semibold tracking-tight text-primary-900">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm text-secondary-600">
                      {stat.label}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Section
          id="features"
          eyebrow="Capabilities"
          title="Built around the moments that matter most"
          description="The product experience centers on trust, speed, and clear service visibility from the first tap to the final payment."
          className="bg-surface py-16 sm:py-20"
        >
          <div className="page-shell">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  variant="feature"
                  className="flex h-full flex-col gap-5 bg-white"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${feature.accent}`}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-primary-900">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-secondary-600">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Section>

        <section id="workflow" className="page-shell py-16 sm:py-20 lg:py-24">
          <Section
            eyebrow="Workflow"
            title="Three simple steps from breakdown to resolution"
            description="The structure stays calm and readable even when the user is in a hurry."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {workflow.map((item, index) => (
                <Card
                  key={item.title}
                  className="flex h-full flex-col justify-between p-6"
                >
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-secondary-500">
                      {item.step}
                    </p>
                    <h3 className="mt-4 text-2xl font-semibold tracking-tight text-primary-900">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-secondary-600">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-8 h-px w-full bg-hairline" />
                  <p className="mt-4 text-sm font-medium text-secondary-500">
                    Step {index + 1} of {workflow.length}
                  </p>
                </Card>
              ))}
            </div>
          </Section>
        </section>

        <section className="page-shell py-16 sm:py-20">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-6">
                <p className="text-4xl font-semibold tracking-tight text-primary-900">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-secondary-600">{stat.label}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="stories" className="bg-surface py-16 sm:py-20 lg:py-24">
          <div className="page-shell">
            <Section
              eyebrow="Social proof"
              title="Trusted by customers and mechanics"
              description="Short, high-signal stories keep the landing page grounded in the actual workflow."
            >
              <div className="grid gap-4 md:grid-cols-3">
                {testimonials.map((testimonial) => (
                  <Card
                    key={testimonial.name}
                    className="flex h-full flex-col p-6"
                  >
                    <div className="flex items-center gap-1 text-warning-600">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <StarIcon
                          key={index}
                          className="h-4 w-4 fill-current"
                        />
                      ))}
                    </div>
                    <p className="mt-5 text-sm leading-7 text-secondary-600">
                      “{testimonial.quote}”
                    </p>
                    <div className="mt-6 pt-4">
                      <p className="text-sm font-semibold text-primary-900">
                        {testimonial.name}
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-secondary-500">
                        {testimonial.role}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </Section>
          </div>
        </section>

        <section className="page-shell py-16 sm:py-20 lg:py-24">
          <Card className="overflow-hidden bg-primary-900 p-0 text-white">
            <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="p-8 sm:p-10 lg:p-12">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
                  Ready for rollout
                </p>
                <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                  Bring roadside service into one calm, reliable flow.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                  Customers get a faster path to help. Mechanics get a clearer
                  workflow. The platform gets a brand that feels intentional
                  rather than improvised.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link to="/register?role=customer">
                    <Button variant="secondary" size="lg">
                      Sign Up as Customer
                    </Button>
                  </Link>
                  <Link to="/register?role=mechanic">
                    <Button variant="tertiary" size="lg">
                      Join as Mechanic
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="border-t border-white/10 p-8 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white/10 p-5">
                    <p className="text-sm text-white/70">Support status</p>
                    <p className="mt-2 text-2xl font-semibold">
                      Dispatch ready
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-5">
                    <p className="text-sm text-white/70">Coverage</p>
                    <p className="mt-2 text-2xl font-semibold">
                      Urban + highway
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-5">
                    <p className="text-sm text-white/70">Payments</p>
                    <p className="mt-2 text-2xl font-semibold">
                      Secure checkout
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <footer className="bg-primary-900 text-white">
        <div className="page-shell py-12 sm:py-14 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-primary-900">
                  F
                </div>
                <div>
                  <p className="text-sm font-semibold">Fixora-X</p>
                  <p className="text-xs text-white/70">
                    intelligence with everyone
                  </p>
                </div>
              </div>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
                A cleaner route to roadside assistance, trusted mechanics, and
                transparent service delivery.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Product</p>
              <div className="mt-4 space-y-2 text-sm text-white/70">
                <a
                  href="#features"
                  className="block transition-colors hover:text-white"
                >
                  Features
                </a>
                <a
                  href="#workflow"
                  className="block transition-colors hover:text-white"
                >
                  How it works
                </a>
                <a
                  href="#stories"
                  className="block transition-colors hover:text-white"
                >
                  Stories
                </a>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">For customers</p>
              <div className="mt-4 space-y-2 text-sm text-white/70">
                <Link
                  to="/login"
                  className="block transition-colors hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  to="/register?role=customer"
                  className="block transition-colors hover:text-white"
                >
                  Request help
                </Link>
                <Link
                  to="/register?role=mechanic"
                  className="block transition-colors hover:text-white"
                >
                  Become a mechanic
                </Link>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Contact</p>
              <div className="mt-4 space-y-2 text-sm text-white/70">
                <p>support@fixorax.com</p>
                <p>24/7 roadside dispatch</p>
                <p>Built for urgent service workflows</p>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-sm text-white/60 sm:flex sm:items-center sm:justify-between">
            <p>&copy; 2026 Fixora-X. All rights reserved.</p>
            <p>Designed for clarity, trust, and speed.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
