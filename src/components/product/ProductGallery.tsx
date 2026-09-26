'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn } from 'lucide-react';
import { ProductImage } from '@/types';
import { analytics } from '@/lib/analytics/events';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const touchStartX = useRef<number | null>(null);

  const displayImages =
    images.length > 0
      ? images
      : [
          {
            id: 'img-default',
            product_id: 'default',
            url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg',
            alt_text: productName,
            display_order: 1,
            is_primary: true,
          },
        ];

  const currentImage = displayImages[selectedIndex] || displayImages[0];

  const handleSelectImage = (index: number) => {
    setSelectedIndex(index);
    analytics.track('product_image_view', {
      productName,
      imageIndex: index,
    });
  };

  const handleNext = () => {
    const nextIdx = (selectedIndex + 1) % displayImages.length;
    handleSelectImage(nextIdx);
  };

  const handlePrev = () => {
    const prevIdx = (selectedIndex - 1 + displayImages.length) % displayImages.length;
    handleSelectImage(prevIdx);
  };

  // Keyboard navigation for fullscreen and gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, displayImages.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <div className="flex flex-col gap-4 select-none">
      {/* Main Image Container */}
      <div
        className="group relative aspect-square w-full rounded-3xl overflow-hidden bg-surface-muted border border-border shadow-subtle cursor-crosshair"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={currentImage.url}
          alt={currentImage.alt_text || productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          className={`object-cover transition-transform duration-200 ${
            isZoomed ? 'scale-150 origin-center pointer-events-none' : 'scale-100'
          }`}
          style={
            isZoomed
              ? {
                  transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                }
              : undefined
          }
        />

        {/* Navigation Arrows for Mobile & Desktop Hover */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={e => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md text-text-main hover:bg-white flex items-center justify-center shadow-md transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={e => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md text-text-main hover:bg-white flex items-center justify-center shadow-md transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Fullscreen Expand Button */}
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute bottom-3 right-3 p-2.5 rounded-full bg-white/80 backdrop-blur-md text-text-main hover:text-brand hover:bg-white shadow-md transition-all z-10"
          aria-label="View fullscreen image"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Image Counter Badge */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium font-sans z-10">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {displayImages.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => handleSelectImage(idx)}
              className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-surface-muted border-2 flex-shrink-0 transition-all ${
                selectedIndex === idx
                  ? 'border-brand shadow-sm ring-2 ring-brand/20 scale-[0.98]'
                  : 'border-border/60 hover:border-brand/40 opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={img.url}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal Lightbox */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
            aria-label="Close fullscreen gallery"
          >
            <X className="w-6 h-6" />
          </button>

          {displayImages.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
                aria-label="Next image"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}

          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <Image
              src={currentImage.url}
              alt={currentImage.alt_text || productName}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
            {selectedIndex + 1} of {displayImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
