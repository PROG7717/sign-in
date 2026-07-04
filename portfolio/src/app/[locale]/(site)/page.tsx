import { getApprovedReviews, getFeaturedProjects } from "@/lib/data";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import Services from "@/components/home/Services";
import FeaturedWork from "@/components/home/FeaturedWork";
import ReviewsStrip from "@/components/home/ReviewsStrip";
import ContactCTA from "@/components/home/ContactCTA";

export default async function HomePage() {
  const [projects, reviews] = await Promise.all([
    getFeaturedProjects(),
    getApprovedReviews(),
  ]);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return (
    <>
      <Hero avgRating={avgRating} reviewCount={reviews.length} />
      <Marquee />
      <Services />
      <FeaturedWork projects={projects} />
      <ReviewsStrip reviews={reviews} />
      <ContactCTA />
    </>
  );
}
