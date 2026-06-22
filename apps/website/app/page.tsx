import { Hero } from '@/components/home/hero';
import { TrustedReviews } from '@/components/home/trusted-reviews';
import { FeaturedGuides } from '@/components/home/featured-guides';
import { PersonalWay } from '@/components/home/personal-way';
import { ExploreMap } from '@/components/home/explore-map';
import { BecomeGuide } from '@/components/home/become-guide';
import { PopularSchools } from '@/components/home/popular-schools';
import { FaqSection } from '@/components/home/faq-section';
import { faqs } from '@/lib/data';

export default function HomePage() {
  return (
    <>
      <Hero />

      <TrustedReviews />

      <PersonalWay />

      <FeaturedGuides />

      <ExploreMap />

      <BecomeGuide />

      <PopularSchools />

      {/* FAQ */}
      <FaqSection items={faqs} />
    </>
  );
}
