export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[50vh]">
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-olffy-purple mb-4"></div>
        <p className="text-gray-500 font-medium">
          Cargando datos de Shopify...
        </p>
      </div>
    </div>
  );
}
