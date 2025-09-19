import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useOrder } from '../../contexts/OrderContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';
import ProductOrderHistory from '../orders/ProductOrderHistory';
import AddOrderModal from '../orders/AddOrderModal';
import OrderStatusModal from '../orders/OrderStatusModal';
import { Plus, Search, Edit, Trash2, AlertTriangle, Package, ShoppingCart, History, TrendingUp, Eye } from 'lucide-react';

export default function ProductsList() {
  const { t } = useLanguage();
  const { products, deleteProduct } = useData();
  const { orders, getProductOrderStats, updateOrderStatus } = useOrder();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<string | null>(null);
  const [orderStatusModal, setOrderStatusModal] = useState<string | null>(null);

  // Calculer le stock restant basé sur les commandes livrées
  const getProductStockInfo = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return { remainingStock: 0, deliveredQuantity: 0 };

    const deliveredQuantity = orders
      .filter(order => order.productId === productId && order.status === 'delivered')
      .reduce((sum, order) => sum + order.quantity, 0);
    
    const remainingStock = Math.max(0, product.stock - deliveredQuantity);
    
    return { remainingStock, deliveredQuantity };
  };

  const getStatusBadge = (product: typeof products[0]) => {
    const stockInfo = getProductStockInfo(product.id);
    if (stockInfo.remainingStock <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Rupture
        </span>
      );
    }
    if (stockInfo.remainingStock <= product.minStock) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Stock Faible
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        En Stock
      </span>
    );
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      deleteProduct(id);
    }
  };

  const handleEditProduct = (id: string) => {
    setEditingProduct(id);
  };

  const handleAddOrder = (productId: string) => {
    setSelectedProductForOrder(productId);
    setIsAddOrderModalOpen(true);
  };

  const handleViewHistory = (productId: string) => {
    setViewingHistory(productId);
  };

  const handleOrderStatusClick = (orderId: string) => {
    setOrderStatusModal(orderId);
  };

  return (
    <>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('products')}</h1>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Produit</span>
        </button>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Rechercher par nom, SKU ou catégorie..."
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Produits Total</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {orders.filter(o => o.status !== 'cancelled').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Commandes Actives</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Prix Achat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Prix Vente HT
                </th>
              
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stock Initial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Commandes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stock Restant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.map((product) => {
                const orderStats = getProductOrderStats(product.id);
                const stockInfo = getProductStockInfo(product.id);
                const productOrders = orders.filter(o => o.productId === product.id && o.status !== 'cancelled');
                
                return (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{product.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900 dark:text-white">{product.purchasePrice.toLocaleString()} MAD</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {product.salePrice.toLocaleString()} MAD
                  </td>
                 
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {product.stock.toFixed(3)} {product.unit || 'unité'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Min: {product.minStock.toFixed(3)} {product.unit || 'unité'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {orderStats.totalOrders} commande{orderStats.totalOrders > 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {orderStats.totalQuantity.toFixed(3)} {product.unit || 'unité'}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {orderStats.totalValue.toLocaleString()} MAD
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${
                        stockInfo.remainingStock <= product.minStock ? 'text-red-600' : 'text-gray-900 dark:text-white'
                      }`}>
                        {stockInfo.remainingStock.toFixed(3)} {product.unit || 'unité'}
                      </span>
                      {stockInfo.remainingStock <= product.minStock && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    {stockInfo.remainingStock <= 0 && (
                      <div className="text-xs text-red-600 dark:text-red-400 font-medium">Rupture de stock</div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Livré: {stockInfo.deliveredQuantity.toFixed(3)} {product.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(product)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleAddOrder(product.id)}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                        title="Nouvelle commande"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleViewHistory(product.id)}
                        className="text-purple-600 hover:text-purple-700 transition-colors"
                        title="Historique"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditProduct(product.id)}
                        className="text-amber-600 hover:text-amber-700 transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Aucun produit trouvé</p>
          </div>
        )}
      </div>

      {/* Commandes actives par produit */}
      {filteredProducts.some(p => getProductOrderStats(p.id).totalOrders > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Commandes Actives</span>
          </h3>
          
          <div className="space-y-4">
            {orders.filter(order => order.status !== 'cancelled').map((order) => {
              const product = products.find(p => p.id === order.productId);
              if (!product) return null;
              
              return (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      order.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/30' :
                      order.status === 'confirmed' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      'bg-yellow-100 dark:bg-yellow-900/30'
                    }`}>
                      {order.status === 'delivered' ? (
                        <Truck className="w-5 h-5 text-green-600" />
                      ) : order.status === 'confirmed' ? (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {order.number} - {product.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {order.quantity} {product.unit} • {order.totalPrice.toLocaleString()} MAD
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status === 'delivered' ? 'Livrée' :
                       order.status === 'confirmed' ? 'Confirmée' : 'En attente'}
                    </span>
                    <button
                      onClick={() => handleOrderStatusClick(order.id)}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                      title="Changer statut"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      {editingProduct && (
        <EditProductModal
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          product={products.find(p => p.id === editingProduct)!}
        />
      )}
      </div>
      {/* Modal nouvelle commande */}
      <AddOrderModal 
        isOpen={isAddOrderModalOpen} 
        onClose={() => {
          setIsAddOrderModalOpen(false);
          setSelectedProductForOrder(null);
        }}
        preselectedProductId={selectedProductForOrder || undefined}
      />

      {/* Modal historique */}
      {viewingHistory && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
            <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Historique des Commandes
                </h3>
                <button
                  onClick={() => setViewingHistory(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <ProductOrderHistory 
                  productId={viewingHistory}
                  productName={products.find(p => p.id === viewingHistory)?.name || 'Produit'}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal statut commande */}
      {orderStatusModal && (
        <OrderStatusModal
          isOpen={!!orderStatusModal}
          onClose={() => setOrderStatusModal(null)}
          order={orders.find(o => o.id === orderStatusModal)!}
        />
      )}
    </>
  );
}