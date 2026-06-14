import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import {
  getAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from "lib/shopify/admin";
import { normalizeShopifyGid } from "lib/shopify/gid";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await getAdminApiUnauthorizedResponse();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const product = await getAdminProduct(normalizeShopifyGid("Product", id));
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error fetching admin product:", error);
    return NextResponse.json(
      { error: "Error fetching product" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await getAdminApiUnauthorizedResponse();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const body = await request.json();
    const product = await updateAdminProduct({
      ...body,
      id: normalizeShopifyGid("Product", id),
    });

    if (product?.userErrors?.length > 0) {
      return NextResponse.json({ errors: product.userErrors }, { status: 400 });
    }

    return NextResponse.json({ product: product.product });
  } catch (error) {
    console.error("Error updating admin product:", error);
    return NextResponse.json(
      { error: "Error updating product" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await getAdminApiUnauthorizedResponse();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const result = await deleteAdminProduct(normalizeShopifyGid("Product", id));

    if (result?.userErrors?.length > 0) {
      return NextResponse.json({ errors: result.userErrors }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      deletedProductId: result.deletedProductId,
    });
  } catch (error) {
    console.error("Error deleting admin product:", error);
    return NextResponse.json(
      { error: "Error deleting product" },
      { status: 500 },
    );
  }
}
