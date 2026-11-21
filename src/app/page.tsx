import { Header } from "@/components/shop/header";
import { Hero } from "@/components/shop/hero";
import { WhatsappStrip } from "@/components/shop/whatsapp-strip";
import { Collections } from "@/components/shop/collections";
import { FeatureSplit } from "@/components/shop/feature-split";
import { VipBanner } from "@/components/shop/vip-banner";
import { Occasions } from "@/components/shop/occasions";
import { Beyond } from "@/components/shop/beyond";
import { BestSellers } from "@/components/shop/best-sellers";
import { Galleries } from "@/components/shop/galleries";
import { InstagramSection } from "@/components/shop/instagram";
import { Footer } from "@/components/shop/footer";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { AccountDrawer } from "@/components/shop/account-drawer";
import { CustomFlower } from "@/components/shop/custom-flower";
import { FlowerTestWizard } from "@/components/shop/flower-test-wizard";
import { AllProducts } from "@/components/shop/all-products";
import { getSiteContent } from "@/lib/site-content";
import { getSettings } from "@/lib/settings";
import { getCustomFlowerConfig } from "@/lib/custom-flower-content";
import { getStorefrontProducts } from "@/lib/storefront-products";

// Storefront always renders from live DB content so CMS edits
// (hero image, texts, ...) show up on the deployed site instantly.
export const dynamic = "force-dynamic";

export default async function Home() {
  // All storefront data in one parallel round-trip — the initial HTML ships
  // with products/settings/config so client components render instantly
  // instead of waiting on a post-hydration fetch waterfall.
  const [content, initialProducts, initialSettings, initialCustomFlower] =
    await Promise.all([
      getSiteContent(),
      getStorefrontProducts(),
      getSettings(),
      getCustomFlowerConfig(),
    ]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <CartDrawer initialSettings={initialSettings} />
      <AccountDrawer />
      <CustomFlower initialConfig={initialCustomFlower} />
      <FlowerTestWizard />
      <AllProducts initialProducts={initialProducts} />

      <main className="flex-1">
        {/* Hero slideshow */}
        <Hero content={content.hero} />

        {/* WhatsApp ordering strip */}
        <WhatsappStrip text={content.whatsapp.text} phone={content.whatsapp.phone} />

        {/* Collections bento grid */}
        <Collections content={content.collections} />

        {/* Autumn collection — editorial split */}
        <FeatureSplit
          id="autumn"
          label={content.autumn.label}
          title={content.autumn.title}
          description={content.autumn.description}
          image={content.autumn.image}
          imageAlt={content.autumn.imageAlt}
        />

        {/* VIP — royal banner */}
        <VipBanner content={content.vip} />

        {/* Occasions */}
        <Occasions content={content.occasions} />

        {/* Beyond — Tehran & Isfahan delivery */}
        <Beyond content={content.beyond} />

        {/* Best sellers carousel */}
        <BestSellers initialProducts={initialProducts} />

        {/* Stores */}
        <Galleries content={content.galleries} />

        {/* Instagram journals */}
        <InstagramSection content={content.instagram} />
      </main>

      <Footer />
    </div>
  );
}
