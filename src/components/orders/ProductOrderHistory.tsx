import React from 'react';
import { useOrder } from '../../contexts/OrderContext';
import { 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle, 
  Package,
  Calendar,
  FileText,
  Activity
} from 'lucide-react';

interface ProductOrderHistoryProps {
  productId: string;
  productName: string;
}

export default function ProductOrderHistory({ productId, productName }: ProductOrderHistoryProps) {
  const { getOrderHistory } = useOrder();
  const history = getOrderHistory(productId);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'delivered':
        return <Truck className="w-4 h-4 text-emerald-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'modified':
        return <FileText className="w-4 h-4 text-amber-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created':
        return 'Commande créée';
      case 'confirmed':
        return 'Commande confirmée';
      case 'delivered':
        return 'Commande livrée';
      case 'cancelled':
        return 'Commande annulée';
      case 'modified':
        return 'Commande modifiée';
      default:
        return 'Action inconnue';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'text-blue-600';
      case 'confirmed':
        return 'text-green-600';
      case 'delivered':
        return 'text-emerald-600';
      case 'cancelled':
        return 'text-red-600';
      case 'modified':
        return 'text-amber-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Historique des Commandes</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{productName}</p>
        </div>
      </div>

      {history.length > 0 ? (
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div key={entry.id} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <div className="flex-shrink-0">
                {getActionIcon(entry.action)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`font-medium ${getActionColor(entry.action)}`}>
                    {getActionLabel(entry.action)}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(entry.timestamp).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  <p>Quantité: {entry.quantity}</p>
                  {entry.previousStatus && entry.newStatus && (
                    <p>Statut: {entry.previousStatus} → {entry.newStatus}</p>
                  )}
                  {entry.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                      "{entry.notes}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">Aucun historique de commande</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            L'historique apparaîtra après la première commande
          </p>
        </div>
      )}
    </div>
  );
}