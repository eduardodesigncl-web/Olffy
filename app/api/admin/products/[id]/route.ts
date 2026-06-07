import { getAdminProduct, updateAdminProduct, deleteAdminProduct } from "lib/shopify/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const product = await getAdminProduct(params.id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error fetching admin product:", error);
    return NextResponse.json({ error: "Error fetching product" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const product = await updateAdminProduct({ id: params.id, ...body });
    
    if (product?.userErrors?.length > 0) {
      return NextResponse.json({ errors: product.userErrors }, { status: 400 });
    }

    return NextResponse.json({ product: product.product });
  } catch (error) {
    console.error("Error updating admin product:", error);
    return NextResponse.json({ error: "Error updating product" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await deleteAdminProduct(params.id);
    
    if (result?.userErrors?.length > 0) {
      return NextResponse.json({ errors: result.userErrors }, { status: 400 });
    }

    return NextResponse.json({ success: true, deletedProductId: result.deletedProductId });
  } catch (error) {
    console.error("Error deleting admin product:", error);
    return NextResponse.json({ error: "Error deleting product" }, { status: 500 });
  }
}
