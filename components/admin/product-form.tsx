"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminProduct } from "lib/shopify/admin-types";

type ProductFormProps = {
  initialData?: AdminProduct;
  isEdit?: boolean;
};

export function ProductForm({ initialData, isEdit }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Extraer el ID limpio si estamos editando
  const cleanId = initialData?.id ? initialData.id.split("/").pop() : "";

  // Estado del formulario
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    descriptionHtml: initialData?.descriptionHtml || "",
    status: initialData?.status || "ACTIVE",
    price: initialData?.variants?.edges?.[0]?.node?.price || "",
    inventoryQuantity: initialData?.variants?.edges?.[0]?.node?.inventoryQuantity || 0,
    tags: initialData?.tags?.join(", ") || "",
    imageUrl: initialData?.images?.edges?.[0]?.node?.url || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Construir el input para la API de Shopify
      const input: any = {
        title: formData.title,
        descriptionHtml: formData.descriptionHtml,
        status: formData.status,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      // Si es crear, agregamos el precio inicial (como variante por defecto)
      if (!isEdit && formData.price) {
        input.variants = [
          {
            price: formData.price,
            inventoryQuantities: [
              {
                availableQuantity: Number(formData.inventoryQuantity),
                // Aquí deberíamos pasar el locationId, pero por simplicidad de la API a veces 
                // es mejor manejar el inventario en una mutación separada o usar el default
              }
            ]
          }
        ];
      }

      const url = isEdit ? `/api/admin/products/${cleanId}` : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok || data.errors) {
        setError(data.errors?.[0]?.message || data.error || "Error al guardar el producto");
      } else {
        router.push("/admin/productos");
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
            {isEdit ? "Editar Producto" : "Nuevo Producto"}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Completa la información básica del producto.
          </p>
        </div>

        <div className="space-y-6 sm:space-y-5">
          <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Nombre del producto *
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

          <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
            <label htmlFor="descriptionHtml" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Descripción
            </label>
            <div className="mt-1 sm:col-span-2 sm:mt-0">
              <textarea
                id="descriptionHtml"
                name="descriptionHtml"
                rows={4}
                value={formData.descriptionHtml}
                onChange={handleChange}
                className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-olffy-purple focus:ring-olffy-purple sm:text-sm p-2 border"
              />
            </div>
          </div>

          <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Precio (CLP)
            </label>
            <div className="mt-1 sm:col-span-2 sm:mt-0">
              <input
                type="number"
                name="price"
                id="price"
                min="0"
                step="1"
                value={formData.price}
                onChange={handleChange}
                disabled={isEdit} // Por simplicidad, en MVP no editamos precio aquí (requiere mutar variante)
                className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-olffy-purple focus:ring-olffy-purple sm:max-w-xs sm:text-sm p-2 border disabled:bg-gray-100"
              />
              {isEdit && <p className="mt-1 text-xs text-gray-500">Para editar el precio, hazlo desde Shopify Admin.</p>}
            </div>
          </div>

          <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Estado
            </label>
            <div className="mt-1 sm:col-span-2 sm:mt-0">
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-olffy-purple focus:ring-olffy-purple sm:max-w-xs sm:text-sm p-2 border"
              >
                <option value="ACTIVE">Activo</option>
                <option value="DRAFT">Borrador</option>
                <option value="ARCHIVED">Archivado</option>
              </select>
            </div>
          </div>

          <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Etiquetas (separadas por coma)
            </label>
            <div className="mt-1 sm:col-span-2 sm:mt-0">
              <input
                type="text"
                name="tags"
                id="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="ej: favorito, nuevo, regalo"
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
            href="/admin/productos"
            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-olffy-purple focus:ring-offset-2"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center rounded-md border border-transparent bg-olffy-purple py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-olffy-ink focus:outline-none focus:ring-2 focus:ring-olffy-purple focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Producto"}
          </button>
        </div>
      </div>
    </form>
  );
}
