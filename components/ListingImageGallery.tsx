"use client";

import { useState } from "react";

type Props = {
  images: string[];
  title: string;
};

export default function ListingImageGallery({ images, title }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const selectedImage = images[selectedIndex];

  if (images.length === 0) {
    return (
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex aspect-[16/10] items-center justify-center bg-slate-200 text-sm text-slate-500">
          No listing photos saved yet
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <button
        type="button"
        onClick={() => setIsLightboxOpen(true)}
        className="block aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-200"
      >
        <img
          src={selectedImage}
          alt={title || "Listing image"}
          className="h-full w-full object-cover"
        />
      </button>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`h-16 w-20 flex-none overflow-hidden rounded-lg border ${
                selectedIndex === index
                  ? "border-slate-900"
                  : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <img
                src={image}
                alt={`${title || "Listing image"} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900"
          >
            Close
          </button>
          <img
            src={selectedImage}
            alt={title || "Listing image"}
            className="max-h-[88vh] max-w-full rounded-2xl object-contain"
          />
        </div>
      )}
    </section>
  );
}
