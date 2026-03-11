"use client";

import { useGetPromotionsQuery, useCreatePromotionMutation, useDeletePromotionMutation } from "@/store/api/promotionsApi";
import { useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";

export default function PromotionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetPromotionsQuery({ page });
  const [createPromotion] = useCreatePromotionMutation();
  const [deletePromotion] = useDeletePromotionMutation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", description: "", discountType: "PERCENTAGE", discountValue: 10, minFare: 50, maxDiscount: 100, validFrom: "", validTo: "", usageLimit: 100 });

  const promotions = data?.data?.data || [];

  const handleCreate = async () => {
    await createPromotion(form);
    setShowForm(false);
    setForm({ code: "", description: "", discountType: "PERCENTAGE", discountValue: 10, minFare: 50, maxDiscount: 100, validFrom: "", validTo: "", usageLimit: 100 });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 text-sm">
          <Plus className="w-4 h-4" /> Create Promotion
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">New Promotion</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="WELCOME50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="PERCENTAGE">Percentage</option>
                <option value="FLAT">Flat Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
              <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
              <input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
              <input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
              <input type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Get 50% off on your first ride" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreate} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-orange-600">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">Loading...</div>
        ) : promotions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">No promotions found</div>
        ) : (
          promotions.map((promo: any) => (
            <div key={promo.id} className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Tag className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{promo.code}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${promo.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {promo.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{promo.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {promo.discountType === "PERCENTAGE" ? `${promo.discountValue}% off` : `₹${promo.discountValue} off`}
                    {promo.maxDiscount && ` (max ₹${promo.maxDiscount})`}
                    {" • "}Used: {promo.usedCount || 0}/{promo.usageLimit}
                  </p>
                </div>
              </div>
              <button onClick={() => deletePromotion(promo.id)} className="p-2 hover:bg-red-50 rounded-lg" title="Delete">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
