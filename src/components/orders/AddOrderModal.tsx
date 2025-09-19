import React, { useState } from 'react';
import { useOrder } from '../../contexts/OrderContext';
import { useData } from '../../contexts/DataContext';
import Modal from '../common/Modal';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProductId?: string;
}

export default function AddOrderModal({ isOpen, onClose, preselectedProductId }: AddOrderModalProps) {
  const { addOrder } = useOrder();
  const { products, getProductById } = useData();
  const [formData, setFormData] = useState({
    productId: preselectedProductId || '',
    quantity: 1,
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date.toISOString().split('T')[0];
    })(),
    status: 'pending' as const,
    notes: ''
  });

  const selectedProduct = formData.productId ? getProductById(formData.productId) : null;
  const totalPrice = selectedProduct ? formData.quantity * selectedProduct.salePrice : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || formData.quantity <= 0) {
      alert('Veuillez sélectionner un produit et saisir une quantité valide');
      return;
    }

    const product = getProductById(formData.productId);
    if (!product) {
      alert('Produit non trouvé');
      return;
    }
    
    await addOrder({
      productId: formData.productId,
      productName: product.name,
      quantity: formData.quantity,
      unitPrice: product.salePrice,
      totalPrice,
      orderDate: formData.orderDate,
      deliveryDate: formData.deliveryDate,
      status: formData.status,
      notes: formData.notes
    });
    
    setFormData({
      productId: preselectedProductId || '',
      quantity: 1,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toISOString().split('T')[0];
      })(),
      status: 'pending',
      notes: ''
    });
    
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle Commande" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Produit *
            </label>
            <select
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              required
              disabled={!!preselectedProductId}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
            >
              <option value="">Sélectionner un produit</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.salePrice.toLocaleString()} MAD ({product.unit})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantité *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="0.001"
              step="0.001"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
              placeholder="Quantité à commander"
            />
            {selectedProduct && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Unité: {selectedProduct.unit} • Stock actuel: {selectedProduct.stock.toFixed(3)}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prix unitaire (MAD)
            </label>
            <input
              type="number"
              value={selectedProduct?.salePrice || 0}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 transition-colors duration-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date de commande
            </label>
            <input
              type="date"
              name="orderDate"
              value={formData.orderDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date de livraison prévue
            </label>
            <input
              type="date"
              name="deliveryDate"
              value={formData.deliveryDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Statut initial
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
            >
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmée</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
              placeholder="Notes sur la commande..."
            />
          </div>
        </div>

        {/* Récapitulatif */}
        {selectedProduct && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 transition-colors duration-300">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📋 Récapitulatif de la commande</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>Produit:</strong> {selectedProduct.name}
                </p>
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>Catégorie:</strong> {selectedProduct.category}
                </p>
              </div>
              <div>
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>Quantité:</strong> {formData.quantity} {selectedProduct.unit}
                </p>
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>Total:</strong> {totalPrice.toLocaleString()} MAD
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200"
          >
            Créer Commande
          </button>
        </div>
      </form>
    </Modal>
  );
}