export function generateWhatsAppOrderLink(productName: string, price: number, productUrl?: string): string {
  const phone = '2348103641002';
  const message = `Hello TheBloomingHer! 🌸\nI would like to order:\n\n*Product:* ${productName}\n*Price:* ₦${price.toLocaleString()}\n${productUrl ? `*Link:* ${productUrl}\n` : ''}\nPlease let me know how to proceed with payment and delivery. Thank you!`;
  
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function generateWhatsAppSupportLink(): string {
  const phone = '2348103641002';
  const message = `Hello TheBloomingHer! 🌸 I have a question about your products and delivery.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
