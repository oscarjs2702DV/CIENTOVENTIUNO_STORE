// Con estas unidades o menos se avisa que quedan pocas.
export const LOW_STOCK = 5

export const isLowStock = (product) => product.stock > 0 && product.stock <= LOW_STOCK

export const lowStockText = (n) => (n === 1 ? '¡Queda solo 1 unidad!' : `¡Quedan solo ${n} unidades!`)
