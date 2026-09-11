/**
 * Deletes marketing content entries (Blog Posts, Beers, Hero Slides, Brand Story)
 * from the target MongoDB database.
 *
 *   pnpm run clear-mock        (dev DB — .env.local + .env.development.local)
 *   pnpm run clear-mock:prod   (prod DB — .env.local + .env.production.local)
 */
import mongoose from "mongoose";
import { Database } from "../src/lib/db/mongodb";
import { env } from "../src/lib/env";
import { BlogPostModel } from "../src/models/BlogPost";
import { BeerModel } from "../src/models/Beer";
import { HeroSectionModel } from "../src/models/HeroSection";
import { BrandStoryModel } from "../src/models/BrandStory";

function redactedTarget(uri: string): string {
  return uri.replace(/\/\/[^/@]+@/, "//<redacted>@");
}

async function clearMockData() {
  console.log(`Target database: ${redactedTarget(env.MONGODB_URI)}\n`);
  await Database.connect();

  const blogPostResult = await BlogPostModel.deleteMany({});
  console.log(`Deleted ${blogPostResult.deletedCount} blog post(s).`);

  const beerResult = await BeerModel.deleteMany({});
  console.log(`Deleted ${beerResult.deletedCount} beer(s).`);

  const heroResult = await HeroSectionModel.deleteMany({});
  console.log(`Deleted ${heroResult.deletedCount} hero section document(s).`);

  const brandStoryResult = await BrandStoryModel.deleteMany({});
  console.log(`Deleted ${brandStoryResult.deletedCount} brand story document(s).`);

  console.log("\nFinished clearing mock marketing content.");
}

clearMockData()
  .catch((err) => {
    console.error("Error clearing mock data:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
