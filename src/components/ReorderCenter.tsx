import React, { useState } from 'react';
import { SparePart, ReorderOrder } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  Truck, 
  IndianRupee, 
  Send, 
  Building2, 
  Calendar,
  AlertCircle,
  PackageCheck
} from 'lucide-react';

interface ReorderCenterProps {
  parts: SparePart[];
  orders: ReorderOrder[];
  onPlaceReorder: (part: SparePart, quantity: number) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: string) => Promise<void>;
}

export const ReorderCenter: React.FC<ReorderCenterProps> = ({
  parts,
  orders,
  onPlaceReorder,
  onUpdateOrderStatus,
}) => {
  const { permissions } = useAuth();
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [orderQuantity, setOrderQuantity] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter parts that need ordering (stock at or below minimum threshold)
  const needyParts = parts.filter(p => p.stockLeft <= p.minThreshold);
  const selectedPart = parts.find(p => p.id === selectedPartId) || needyParts[0] || parts[0];

  const handleCreatePO = async (part: SparePart, qty: number) => {
    if (!permissions.canReorder) return;
    setIsSubmitting(true);
    try {
      await onPlaceReorder(part, qty);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
            <PackageCheck className="h-3 w-3" /> Received
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
            <Truck className="h-3 w-3" /> Shipped
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/70 dark:text-amber-300">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Parts Orders
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
          View parts that are low in stock and track incoming orders.
        </p>
      </div>

      {/* Reorder Recommendation Queue */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Parts to Reorder ({needyParts.length})
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Items at or below the minimum stock limit
            </p>
          </div>
        </div>

        {needyParts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
            No parts need reordering right now. Stock levels are good.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {needyParts.map((part) => {
              const neededQty = Math.max(1, (part.minThreshold * 2) - part.stockLeft);
              const estCost = neededQty * part.unitCost;
              return (
                <div
                  key={part.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {part.partNumber}
                      </span>
                      <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                        {part.stockLeft === 0 ? 'Out of Stock' : `${part.stockLeft} Left`}
                      </span>
                    </div>

                    <h4 className="mt-1 text-sm font-bold text-slate-900 line-clamp-1 dark:text-white">
                      {part.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Location: {part.location || 'General Storage'}
                    </p>

                    <div className="mt-3 rounded-lg bg-white p-2.5 text-xs shadow-2xs dark:bg-slate-800">
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Suggested Order:</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          +{neededQty} units
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Unit Price:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹{part.unitCost.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Estimated Cost:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{estCost.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    {permissions.canReorder ? (
                      <button
                        onClick={() => handleCreatePO(part, neededQty)}
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Order {neededQty} Units</span>
                      </button>
                    ) : (
                      <div className="text-center text-[11px] text-slate-400">
                        Read-only access
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Purchase Orders Pipeline Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Orders & Shipments
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Track order status from approval to warehouse delivery
          </p>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-3 py-1.5 text-[11px] text-slate-500 sm:hidden dark:border-slate-800 dark:bg-slate-800/40">
            <span>Scroll horizontally to view all columns</span>
            <span className="text-slate-400">&rarr;</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
              <tr>
                <th className="py-2.5 px-3">Order Number</th>
                <th className="py-2.5 px-3">Item Details</th>
                <th className="py-2.5 px-3 text-center">Quantity</th>
                <th className="py-2.5 px-3">Total Cost (₹)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Ordered By</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                    {order.orderNumber}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{order.partName}</span>
                    <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">{order.partNumber}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                    {order.quantity}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    ₹{order.totalCost.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-500 dark:text-slate-400">
                    {order.orderedBy}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {permissions.canReorder && order.status !== 'received' && (
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'approved')}
                            className="rounded px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                          >
                            Approve
                          </button>
                        )}
                        {order.status === 'approved' && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'shipped')}
                            className="rounded px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                          >
                            Mark Shipped
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'received')}
                            className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                            title="Mark received and add to inventory"
                          >
                            Mark Received
                          </button>
                        )}
                      </div>
                    )}
                    {order.status === 'received' && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
};
