import type { BusinessProfile, BusinessReviewAggregate } from '@/types/business';
import type { Adiso } from '@/types';
import { buildLocalBusinessJsonLd } from '@/lib/business/seo';

interface BusinessJsonLdProps {
  profile: Partial<BusinessProfile>;
  products?: Adiso[];
  aggregate?: BusinessReviewAggregate | null;
}

export default function BusinessJsonLd({ profile, products = [], aggregate }: BusinessJsonLdProps) {
  const { localBusiness, products: productSchema, breadcrumb } = buildLocalBusinessJsonLd(
    profile,
    products,
    aggregate
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
    </>
  );
}
