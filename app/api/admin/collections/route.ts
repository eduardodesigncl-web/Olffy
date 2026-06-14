import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import { getAdminCollections, createAdminCollection } from "lib/shopify/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const unauthorized = await getAdminApiUnauthorizedResponse();
  if (unauthorized) return unauthorized;

  try {
    const collections = await getAdminCollections();
    return NextResponse.json({ collections });
  } catch (error) {
    console.error("Error fetching admin collections:", error);
    return NextResponse.json(
      { error: "Error fetching collections" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await getAdminApiUnauthorizedResponse();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const collection = await createAdminCollection(body);

    if (collection?.userErrors?.length > 0) {
      return NextResponse.json(
        { errors: collection.userErrors },
        { status: 400 },
      );
    }

    return NextResponse.json({ collection: collection.collection });
  } catch (error) {
    console.error("Error creating admin collection:", error);
    return NextResponse.json(
      { error: "Error creating collection" },
      { status: 500 },
    );
  }
}
