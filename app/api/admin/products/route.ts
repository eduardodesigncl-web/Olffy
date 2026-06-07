import { getAdminProducts, createAdminProduct } from "lib/shopify/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const products = await getAdminProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return NextResponse.json({ error: "Error fetching products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const product = await createAdminProduct(body);
    
    if (product?.userErrors?.length > 0) {
      return NextResponse.json({ errors: product.userErrors }, { status: 400 });
    }

    return NextResponse.json({ product: product.product });
  } catch (error) {
    console.error("Error creating admin product:", error);
    return NextResponse.json({ error: "Error creating product" }, { status: 500 });
  }
}
