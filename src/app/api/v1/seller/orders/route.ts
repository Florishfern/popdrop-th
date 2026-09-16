import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const transactions = await prisma.transaction.findMany({
      where: {
        sellerId: userId,
      },
      include: {
        product: {
          select: {
            title: true,
            category: true,
            images: {
              orderBy: { sortOrder: "asc" },
            },
            startTime: true,
          }
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const orders = transactions.map((t) => {
      // Find primary image or use a default
      let imageUrl = "/images/placeholder.png";
      if (t.product.images && t.product.images.length > 0) {
        imageUrl = t.product.images[0].imageUrl;
      }

      // Map status
      let mappedStatus = "Pending";
      if (t.status === "SHIPPED") {
        mappedStatus = "In Progress";
      } else if (t.status === "DELIVERED") {
        mappedStatus = "Completed";
      }

      // Format date (startTime) e.g., "17 Apr, 2026 03:45 PM"
      let formattedDate = "";
      if (t.product.startTime) {
        const dateObj = new Date(t.product.startTime);
        
        const day = dateObj.getDate();
        const month = dateObj.toLocaleString("en-US", { month: "short" });
        const year = dateObj.getFullYear();
        
        let hours = dateObj.getHours();
        const minutes = dateObj.getMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const strHours = hours.toString().padStart(2, "0");
        
        formattedDate = `${day} ${month}, ${year} ${strHours}:${minutes} ${ampm}`;
      }

      return {
        id: t.id,
        activity: t.product.title,
        type: t.product.category,
        imageUrl: imageUrl,
        price: t.amount,
        status: mappedStatus,
        date: formattedDate,
        carrier: t.carrier || undefined,
        trackingNumber: t.trackingNumber || undefined,
      };
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Seller Orders Error:", error);
    return NextResponse.json(
      { message: "Failed to load orders" },
      { status: 500 }
    );
  }
}
