// Deja las variantes de un producto siempre con la misma forma:
// [{ colorName, color, images[] }], aunque el producto no tenga variantes.
export function normalizeVariants(product) {
  if (!product.variants || product.variants.length === 0) {
    const fallbackImages = (product.images && product.images.length > 0)
      ? product.images
      : (product.image ? [product.image] : [])
    return [{ colorName: 'Único', color: '#1a1a1a', images: fallbackImages }]
  }
  return product.variants.map((v) => ({
    colorName: v.colorName || v.name || 'Único',
    color: v.color || '#1a1a1a',
    images: (v.images && v.images.length > 0)
      ? v.images
      : (v.image ? [v.image] : (product.image ? [product.image] : [])),
  }))
}
