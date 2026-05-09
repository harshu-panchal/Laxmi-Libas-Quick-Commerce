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

export const HotelCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm animate-pulse mb-4 flex flex-col md:flex-row gap-4 p-3">
    <div className="w-full md:w-48 h-36 bg-neutral-100 rounded-xl flex-shrink-0" />
    <div className="flex-1 flex flex-col justify-between py-1">
      <div className="space-y-2">
        <div className="h-5 bg-neutral-100 rounded w-2/3" />
        <div className="h-3 bg-neutral-50 rounded w-1/3" />
        <div className="h-4 bg-neutral-100 rounded w-1/2" />
      </div>
      <div className="flex justify-between items-end mt-4 md:mt-0">
        <div className="space-y-1">
          <div className="h-3 bg-neutral-50 rounded w-16" />
          <div className="h-5 bg-neutral-100 rounded w-24" />
        </div>
        <div className="w-24 h-9 bg-neutral-100 rounded-lg" />
      </div>
    </div>
  </div>
);

export const BusCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm animate-pulse mb-4 p-4">
    <div className="flex justify-between items-center mb-3">
      <div className="h-5 bg-neutral-100 rounded w-1/3" />
      <div className="h-5 bg-neutral-100 rounded w-24" />
    </div>
    <div className="grid grid-cols-3 gap-4 my-4">
      <div className="space-y-2">
        <div className="h-4 bg-neutral-100 rounded w-1/2" />
        <div className="h-3 bg-neutral-50 rounded w-2/3" />
      </div>
      <div className="flex flex-col items-center justify-center space-y-1">
        <div className="h-2 bg-neutral-100 rounded w-16" />
        <div className="h-1 bg-neutral-50 rounded w-24" />
      </div>
      <div className="text-right space-y-2">
        <div className="h-4 bg-neutral-100 rounded w-1/2 ml-auto" />
        <div className="h-3 bg-neutral-50 rounded w-2/3 ml-auto" />
      </div>
    </div>
    <div className="flex justify-between items-center border-t border-neutral-50 pt-3 mt-3">
      <div className="h-3 bg-neutral-50 rounded w-20" />
      <div className="w-28 h-9 bg-neutral-100 rounded-lg" />
    </div>
  </div>
);
