const FEATURES = [
  {
    title: "Evidence-based Standards",
    description: "Built on the latest science and clinical safety.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 3l7 3v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Structured Curriculum",
    description: "A step-by-step learning journey from fundamentals to real practice.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7.5v1.2M16.5 12h-1.2M12 16.5v-1.2M7.5 12h1.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Expert Faculty",
    description: "Learn from experienced clinicians with real-world insights.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3.5 19c.8-3 3-4.8 5.5-4.8s4.7 1.8 5.5 4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="17" cy="8.5" r="2.3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M15.5 14.6c2-.2 3.8 1.2 4.5 3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function WhyHada() {
  return (
    <section className="border-b border-ink/10 bg-card">
      <div className="container-page py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">Why HADA</p>
            <h2 className="mt-2 max-w-md font-serif text-3xl font-medium leading-tight text-ink sm:text-4xl">
              More than knowledge. A higher standard of practice.
            </h2>
          </div>
          <p className="text-base leading-relaxed text-muted lg:pt-1">
            At HADA, we believe in empowering aesthetic practitioners with
            evidence-based education to deliver safer, more effective, and
            more meaningful results for their patients.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="text-center sm:text-left">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal-dark sm:mx-0">
                {feature.icon}
              </span>
              <h3 className="mt-4 font-serif text-lg text-ink">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
