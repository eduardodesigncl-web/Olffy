"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminCollection } from "lib/shopify/admin-types";

type CollectionFormProps = {
  initialData?: AdminCollection;
  isEdit?: boolean;
};

export function CollectionForm({ initialData, isEdit }: CollectionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const cleanId = initialData?.id ? initialData.id.split("/").pop() : "";

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const input = {
        title: formData.title,
      };

      const url = isEdit ? `/api/admin/collections/${cleanId}` : "/api/admin/collections";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok || data.errors) {
        setError(data.errors?.[0]?.message || data.error || "Error al guardar la colección");
      } else {
        router.push("/admin/colecciones");
        router.refresh();
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
      <div className="space-y-6 sm:space-y-5">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {isEdit ? "Editar Colección" : "Nueva Colección"}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Crea o edita categorías de productos.
          </p>
        </div>

        <div className="space-y-6 sm:space-y-5">
          <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Título de la colección *
            </label>
            <div className="mt-1 sm:col-span-2 sm:mt-0">
              <input
                type="text"
                name="title"
                id="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-olffy-purple focus:ring-olffy-purple sm:max-w-xs sm:text-sm p-2 border"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 p-4 rounded-md border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="pt-5">
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/colecciones"
            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-olffy-purple focus:ring-offset-2"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center rounded-md border border-transparent bg-olffy-purple py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-olffy-ink focus:outline-none focus:ring-2 focus:ring-olffy-purple focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Colección"}
          </button>
        </div>
      </div>
    </form>
  );
}
