import { motion } from 'framer-motion';

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-xl p-3 border border-neutral-100 shadow-sm animate-pulse">
    <div className="aspect-square bg-neutral-100 rounded-lg mb-3" />
    <div className="h-4 bg-neutral-100 rounded w-3/4 mb-2" />
    <div className="h-3 bg-neutral-50 rounded w-1/2 mb-4" />
    <div className="flex justify-between items-center">
      <div className="h-5 bg-neutral-100 rounded w-1/3" />
      <div className="w-8 h-8 bg-neutral-100 rounded-lg" />
    </div>
  </div>
);

export const CategoryCardSkeleton = () => (
  <div className="flex flex-col items-center gap-2 animate-pulse">
    <div className="w-16 h-16 bg-neutral-100 rounded-full" />
    <div className="h-3 bg-neutral-50 rounded w-12" />
  </div>
);

export const SectionSkeleton = () => (
  <div className="py-6 px-4">
    <div className="h-6 bg-neutral-100 rounded w-1/4 mb-4" />
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
    </div>
  </div>
);
