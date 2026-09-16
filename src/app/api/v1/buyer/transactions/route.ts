import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const status = searchParams.get("status") || "All";

    const userId = session.user.id;

    // We fetch transactions where buyerId = userId
    const userTransactions = await prisma.transaction.findMany({
      where: {
        buyerId: userId,
      },
      include: {
        product: {
          select: {
            title: true,
            images: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const transactions = userTransactions.map((t) => {
      let imageUrl = "/images/placeholder.png";
      if (t.product.images && t.product.images.length > 0) {
        imageUrl = t.product.images[0].imageUrl;
      }

      // Map status
      // DB: PENDING -> UI: Unpaid (or Processing if we simplify)
      // Actually, PENDING means paid but waiting for shipment, let's map it based on UI options:
      // PENDING -> Processing (To Ship)
      // SHIPPED -> In Transit
      // DELIVERED -> Completed
      let mappedStatus = "Unpaid";
      if (t.status === "PENDING") {
        mappedStatus = "Processing"; // To Ship
      } else if (t.status === "SHIPPED") {
        mappedStatus = "In Transit";
      } else if (t.status === "DELIVERED") {
        mappedStatus = "Completed";
      } else if (t.status === "PAID") {
        mappedStatus = "Processing";
      }

      // Format date (createdAt of the transaction, which is when they bought it)
      const dateObj = new Date(t.createdAt);
      const day = dateObj.getDate();
      const month = dateObj.toLocaleString("en-US", { month: "short" });
      const year = dateObj.getFullYear();
      let hours = dateObj.getHours();
      const minutes = dateObj.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strHours = hours.toString().padStart(2, "0");
      const formattedDate = `${day} ${month}, ${year} ${strHours}:${minutes} ${ampm}`;

      return {
        id: t.id,
        productName: t.product.title,
        price: t.amount,
        status: mappedStatus,
        date: formattedDate,
        carrier: t.carrier || null,
        trackingNumber: t.trackingNumber || null,
        imageUrl: imageUrl,
      };
    });

    let filtered = [...transactions];
    if (search) {
      filtered = filtered.filter(
        (item) => item.productName.toLowerCase().includes(search) || item.id.toLowerCase().includes(search)
      );
    }
    if (status && status !== "All") {
      filtered = filtered.filter((item) => item.status === status);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Buyer Transactions Error:", error);
    return NextResponse.json(
      { message: "Failed to load transactions" },
      { status: 500 }
    );
  }
}
