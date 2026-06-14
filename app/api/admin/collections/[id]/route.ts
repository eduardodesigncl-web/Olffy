import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import {
  getAdminCollection,
  updateAdminCollection,
  deleteAdminCollection,
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
    const collection = await getAdminCollection(
      normalizeShopifyGid("Collection", id),
    );
    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ collection });
  } catch (error) {
    console.error("Error fetching admin collection:", error);
    return NextResponse.json(
      { error: "Error fetching collection" },
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
    const collection = await updateAdminCollection({
      ...body,
      id: normalizeShopifyGid("Collection", id),
    });

    if (collection?.userErrors?.length > 0) {
      return NextResponse.json(
        { errors: collection.userErrors },
        { status: 400 },
      );
    }

    return NextResponse.json({ collection: collection.collection });
  } catch (error) {
    console.error("Error updating admin collection:", error);
    return NextResponse.json(
      { error: "Error updating collection" },
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
    const result = await deleteAdminCollection(
      normalizeShopifyGid("Collection", id),
    );

    if (result?.userErrors?.length > 0) {
      return NextResponse.json({ errors: result.userErrors }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      deletedCollectionId: result.deletedCollectionId,
    });
  } catch (error) {
    console.error("Error deleting admin collection:", error);
    return NextResponse.json(
      { error: "Error deleting collection" },
      { status: 500 },
    );
  }
}
