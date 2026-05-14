"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

type Props = {
  images: string[];
  title: string;
};

export default function ListingImageGallery({ images, title }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const selectedImage = images[selectedIndex];
  const hasMultipleImages = images.length > 1;

  function showPrevious() {
    setSelectedIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  }

  function showNext() {
    setSelectedIndex((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  }

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
    <section className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <div className="relative overflow-hidden rounded-2xl bg-slate-200">
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="block aspect-[4/3] w-full sm:aspect-[16/10]"
        >
        <img
          src={selectedImage}
          alt={title || "Listing image"}
          className="h-full w-full object-cover"
        />
        </button>

        <span className="absolute right-3 top-3 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-semibold text-white">
          {selectedIndex + 1} / {images.length}
        </span>

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-slate-800 shadow-sm hover:bg-white"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-slate-800 shadow-sm hover:bg-white"
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>

      {hasMultipleImages && (
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
            className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 sm:py-2"
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
