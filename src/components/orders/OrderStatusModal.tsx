import React, { useState } from 'react';
import { useOrder, Order } from '../../contexts/OrderContext';
import { X, Package, CheckCircle, Clock, XCircle, Truck } from 'lucide-react';

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export default function OrderStatusModal({ isOpen, onClose, order }: OrderStatusModalProps) {
  const { updateOrderStatus } = useOrder();
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSave = async () => {
    await updateOrderStatus(order.id, selectedStatus, notes);
    onClose();
  };

  const statusOptions = [
    {
      value: 'pending',
      label: 'En attente',
      description: 'Commande créée, en attente de confirmation',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      value: 'confirmed',
      label: 'Confirmée',
      description: 'Commande confirmée, en cours de préparation',
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      value: 'delivered',
      label: 'Livrée',
      description: 'Commande livrée, stock mis à jour automatiquement',
      icon: Truck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      value: 'cancelled',
      label: 'Annulée',
      description: 'Commande annulée, stock restauré',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Statut de la Commande</h3>
                <p className="text-sm opacity-90">Commande {order.number}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Informations commande */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Informations</h4>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <p><strong>Produit:</strong> {order.productName}</p>
                  <p><strong>Quantité:</strong> {order.quantity}</p>
                  <p><strong>Total:</strong> {order.totalPrice.toLocaleString()} MAD</p>
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Choisir le nouveau statut
                </label>
                <div className="space-y-3">
                  {statusOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <label
                        key={option.value}
                        className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedStatus === option.value
                            ? `${option.borderColor} ${option.bgColor}`
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={option.value}
                          checked={selectedStatus === option.value}
                          onChange={(e) => setSelectedStatus(e.target.value as Order['status'])}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${option.bgColor}`}>
                          <Icon className={`w-5 h-5 ${option.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{option.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
                  placeholder="Commentaires sur le changement de statut..."
                />
              </div>

              {/* Avertissement pour livraison */}
              {selectedStatus === 'delivered' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Important :</strong> Marquer comme "Livrée" mettra automatiquement à jour le stock du produit.
                    </p>
                  </div>
                </div>
              )}

              {/* Avertissement pour annulation */}
              {selectedStatus === 'cancelled' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <strong>Attention :</strong> Annuler cette commande supprimera les statistiques de commande pour ce produit.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 mt-8">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
              >
                Mettre à jour
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}