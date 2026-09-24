'use client';

import { useState } from 'react';
import { IconX, IconShoppingCart, IconHeart, IconShare, IconMinus, IconPlus } from '@/components/Icons';
import type { CatalogProduct } from '@/types/catalog';

interface ProductModalProps {
    product: CatalogProduct;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart?: (product: CatalogProduct, quantity: number) => void;
    whatsappNumber?: string;
    businessName?: string;
}

export default function ProductModal({
    product,
    isOpen,
    onClose,
    onAddToCart,
    whatsappNumber,
    businessName
}: ProductModalProps) {
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);

    if (!isOpen) return null;

    const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
    const allImages = product.images.length > 0 ? product.images : [primaryImage].filter(Boolean);

    const handleWhatsAppOrder = () => {
        if (!whatsappNumber) return;

        const message = `Hola! Me interesa este producto de ${businessName}:

📦 ${product.title}
💰 Precio: S/ ${product.price?.toFixed(2)}
📊 Cantidad: ${quantity}
💵 Total: S/ ${((product.price || 0) * quantity).toFixed(2)}

${product.description ? `\n📝 ${product.description}\n` : ''}
¿Está disponible?`;

        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        onClose();
    };

    const handleAddToCart = () => {
        if (onAddToCart) {
            onAddToCart(product, quantity);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                    >
                        <IconX size={24} />
                    </button>

                    <div className="flex flex-col md:flex-row">
                        {/* Images Section */}
                        <div className="md:w-1/2 bg-gray-100 p-6">
                            {/* Main Image */}
                            <div className="aspect-square rounded-2xl overflow-hidden bg-white mb-4">
                                {allImages[selectedImage] ? (
                                    <img
                                        src={allImages[selectedImage].url}
                                        alt={product.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <IconShoppingCart size={64} />
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Gallery */}
                            {allImages.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto">
                                    {allImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(idx)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx
                                                ? 'border-blue-500 scale-105'
                                                : 'border-transparent hover:border-gray-300'
                                                }`}
                                        >
                                            <img
                                                src={img.url}
                                                alt={`${product.title} - ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="md:w-1/2 p-6 md:p-8 overflow-y-auto max-h-[90vh]">
                            {/* Category Badge */}
                            {product.category && (
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-3">
                                    {product.category}
                                </span>
                            )}

                            {/* Title */}
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">
                                {product.title}
                            </h2>

                            {/* Price */}
                            {product.price && (
                                <div className="mb-6">
                                    {product.compare_at_price && product.compare_at_price > product.price && (
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-lg text-gray-400 line-through">
                                                S/ {product.compare_at_price.toFixed(2)}
                                            </span>
                                            <span className="px-2 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                                                -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                                            </span>
                                        </div>
                                    )}
                                    <div className="text-4xl font-black text-blue-600">
                                        S/ {product.price.toFixed(2)}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {product.description && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-700 mb-2">Descripción</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Attributes */}
                            {product.attributes && (Array.isArray(product.attributes) ? product.attributes.length > 0 : Object.keys(product.attributes).length > 0) && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-700 mb-2">Características</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(Array.isArray(product.attributes)
                                            ? product.attributes
                                            : Object.entries(product.attributes).map(([name, value]) => ({ name, value }))
                                        ).map((attr, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500">{attr.name}:</span>
                                                <span className="font-medium text-gray-900">{String(attr.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stock Status */}
                            {product.stock_status && (
                                <div className="mb-6">
                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${product.stock_status === 'in_stock'
                                        ? 'bg-green-100 text-green-700'
                                        : product.stock_status === 'low_stock'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                        {product.stock_status === 'in_stock' && '✓ En stock'}
                                        {product.stock_status === 'low_stock' && '⚠️ Pocas unidades'}
                                        {product.stock_status === 'out_of_stock' && '✕ Agotado'}
                                    </span>
                                </div>
                            )}

                            {/* Quantity Selector */}
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-gray-700 mb-2">Cantidad</h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        <IconMinus size={20} />
                                    </button>
                                    <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        <IconPlus size={20} />
                                    </button>
                                </div>
                                {product.price && (
                                    <p className="text-sm text-gray-500 mt-2">
                                        Total: <span className="font-bold text-gray-900">S/ {(product.price * quantity).toFixed(2)}</span>
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                {whatsappNumber && (
                                    <button
                                        onClick={handleWhatsAppOrder}
                                        className="w-full px-6 py-4 bg-[var(--bs-color-social-whatsapp)] hover:bg-[var(--bs-color-social-whatsappDark)] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        Pedir por WhatsApp
                                    </button>
                                )}

                                {onAddToCart && (
                                    <button
                                        onClick={handleAddToCart}
                                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
                                    >
                                        <IconShoppingCart size={20} />
                                        Añadir al Carrito
                                    </button>
                                )}

                                {/* Secondary Actions */}
                                <div className="flex gap-2">
                                    <button className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                                        <IconHeart size={18} />
                                        Guardar
                                    </button>
                                    <button className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                                        <IconShare size={18} />
                                        Compartir
                                    </button>
                                </div>
                            </div>

                            {/* Tags */}
                            {product.tags && product.tags.length > 0 && (
                                <div className="mt-6 pt-6 border-t">
                                    <div className="flex flex-wrap gap-2">
                                        {product.tags.map((tag, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
