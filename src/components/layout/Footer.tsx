import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, MessageCircle, ShieldCheck, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-brand-dark text-white pt-16 pb-12 border-t border-brand/40">
      <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8 pb-12 border-b border-white/10">
          {/* Column 1: Brand Story */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20">
                <Image
                  src="/images/logo.jpg"
                  alt="TheBloomingHer Logo"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div>
                <span className="font-display font-bold text-lg text-white tracking-tight">
                  TheBloomingHer
                </span>
                <p className="text-xs text-brand-accent">Care & Wellness</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed pr-0 sm:pr-6">
              A feminine wellness and lifestyle brand created to support women through every phase of their journey — from cycle care and menstrual relief to everyday comfort and natural self-care.
            </p>

            <div className="flex items-center gap-3 text-xs text-brand-light font-medium pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>100% Quality-Tested & Authentic Products</span>
            </div>
          </div>

          {/* Column 2: Shop Categories */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-white">
              Shop Categories
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/categories/feminine-care" className="hover:text-brand-accent transition-colors">
                  Feminine Care
                </Link>
              </li>
              <li>
                <Link href="/categories/everyday-essentials" className="hover:text-brand-accent transition-colors">
                  Everyday Essentials
                </Link>
              </li>
              <li>
                <Link href="/categories/wellness-body-care" className="hover:text-brand-accent transition-colors">
                  Wellness & Body Care
                </Link>
              </li>
              <li>
                <Link href="/categories/comfort-relaxation" className="hover:text-brand-accent transition-colors">
                  Comfort & Relaxation
                </Link>
              </li>
              <li>
                <Link href="/categories/beauty-self-care" className="hover:text-brand-accent transition-colors">
                  Beauty & Self-Care
                </Link>
              </li>
              <li>
                <Link href="/collections/under-10k-finds" className="text-emerald-400 font-medium hover:underline">
                  Under ₦10k Finds ✨
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Policies */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-white">
              Customer Care
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/faq" className="hover:text-brand-accent transition-colors">
                  Frequently Asked Questions (FAQ)
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-brand-accent transition-colors text-brand-accent font-medium">
                  Care & Wellness Blog 📚
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-brand-accent transition-colors">
                  About Our Brand
                </Link>
              </li>
              <li>
                <Link href="/policies/shipping" className="hover:text-brand-accent transition-colors">
                  Shipping & Lagos Delivery
                </Link>
              </li>
              <li>
                <Link href="/policies/returns" className="hover:text-brand-accent transition-colors">
                  Hygiene & Returns Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="hover:text-brand-accent transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/terms" className="hover:text-brand-accent transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-accent transition-colors">
                  Store Pickup & Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Verified Contact & Lagos Location */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-white">
              Get In Touch
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5" />
                <span className="text-xs leading-relaxed">
                  30 Clem Rd, Ifako-Ijaiye, Lagos 101232, Lagos, Nigeria
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-accent flex-shrink-0" />
                <a href="tel:+2348103641002" className="hover:text-white transition-colors">
                  +234 810 364 1002
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <a
                  href="https://wa.me/2348103641002"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline font-medium"
                >
                  Chat on WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-accent flex-shrink-0" />
                <a href="mailto:thebloomingherwellness@gmail.com" className="text-xs hover:text-white transition-colors break-all">
                  thebloomingherwellness@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Security */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400 text-center sm:text-left">
          <p>© {new Date().getFullYear()} TheBloomingHer Care & Wellness. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6">
            <span>Developed by <span className="font-medium text-white">xisco</span></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-brand-accent fill-brand-accent" /> for Women in Nigeria
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
