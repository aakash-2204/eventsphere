import { categoryStyles } from "@/components/events/category-style";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import type { EventCategory, EventSummary } from "@/types/event";

type CategoriesSectionProps = {
  categories: EventCategory[];
  events: EventSummary[];
};

export function CategoriesSection({ categories, events }: CategoriesSectionProps) {
  return (
    <section aria-labelledby="categories-heading" className="border-y border-white/5 bg-navy-900/40 py-20">
      <Container>
        <SectionHeading
          id="categories-heading"
          eyebrow="Categories"
          title="Find events you'll love"
          description="Browse by what you're into. Use the search panel above to filter by category."
        />

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const { icon: Icon, accent } = categoryStyles[category.id];
            const count = events.filter((event) => event.categoryId === category.id).length;

            return (
              <li
                key={category.id}
                className="flex gap-4 rounded-2xl border border-white/10 bg-navy-900/70 p-5 transition hover:border-violet-500/40"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/5">
                  <Icon aria-hidden="true" className={`size-6 ${accent}`} />
                </span>
                <div>
                  <h3 className="font-semibold text-white">{category.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{category.description}</p>
                  <p className="mt-2 text-xs font-medium text-violet-300">
                    {count} sample {count === 1 ? "event" : "events"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
