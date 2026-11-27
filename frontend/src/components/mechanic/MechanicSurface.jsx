import Card from "../common/Card";
import Section from "../common/Section";

const MechanicSurface = ({
  eyebrow,
  title,
  description,
  actions,
  stats = [],
  children,
  className = "",
}) => {
  return (
    <div className={`space-y-8 ${className}`.trim()}>
      <Section
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={actions}
      >
        {stats.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-5">
                <p className="text-3xl font-semibold tracking-tight text-primary-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-secondary-600">{stat.label}</p>
              </Card>
            ))}
          </div>
        ) : null}
      </Section>
      {children}
    </div>
  );
};

export default MechanicSurface;
