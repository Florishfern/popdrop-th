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

    const products = await prisma.product.findMany({
      where: {
        sellerId: userId,
      },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
        transaction: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const orders = products.map((p) => {
      // Find primary image
      let imageUrl = "/images/placeholder.png";
      if (p.images && p.images.length > 0) {
        imageUrl = p.images[0].imageUrl;
      }

      // Map status
      let mappedStatus = "Draft";
      if (p.transaction) {
        if (p.transaction.status === "PENDING") {
          mappedStatus = "Pending";
        } else if (p.transaction.status === "SHIPPED") {
          mappedStatus = "In Progress";
        } else if (p.transaction.status === "DELIVERED") {
          mappedStatus = "Completed";
        }
      } else {
        if (p.status === "LIVE") {
          mappedStatus = "Live";
        } else if (p.status === "ENDED") {
          mappedStatus = "Ended";
        } else {
          mappedStatus = "Draft";
        }
      }

      // Format date (startTime) e.g., "17 Apr, 2026 03:45 PM"
      let formattedDate = "";
      if (p.startTime) {
        const dateObj = new Date(p.startTime);
        
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
        id: p.transaction ? p.transaction.id : p.id,
        productId: p.id,
        activity: p.title,
        type: p.category,
        imageUrl: imageUrl,
        price: p.transaction ? p.transaction.amount : p.currentPrice,
        status: mappedStatus,
        date: formattedDate,
        carrier: p.transaction?.carrier || undefined,
        trackingNumber: p.transaction?.trackingNumber || undefined,
        startTime: p.startTime.toISOString(),
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
