import { getAdminCollection, updateAdminCollection, deleteAdminCollection } from "lib/shopify/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const collection = await getAdminCollection(id);
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }
    return NextResponse.json({ collection });
  } catch (error) {
    console.error("Error fetching admin collection:", error);
    return NextResponse.json({ error: "Error fetching collection" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const collection = await updateAdminCollection({ id, ...body });
    
    if (collection?.userErrors?.length > 0) {
      return NextResponse.json({ errors: collection.userErrors }, { status: 400 });
    }

    return NextResponse.json({ collection: collection.collection });
  } catch (error) {
    console.error("Error updating admin collection:", error);
    return NextResponse.json({ error: "Error updating collection" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await deleteAdminCollection(id);
    
    if (result?.userErrors?.length > 0) {
      return NextResponse.json({ errors: result.userErrors }, { status: 400 });
    }

    return NextResponse.json({ success: true, deletedCollectionId: result.deletedCollectionId });
  } catch (error) {
    console.error("Error deleting admin collection:", error);
    return NextResponse.json({ error: "Error deleting collection" }, { status: 500 });
  }
}
