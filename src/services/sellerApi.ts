export interface SellerStats {
  totalBalance: number;
  totalIncome: number;
  tradingCardSales: number;
  artToySales: number;
  modelSales: number;
  currency: string;
}

export interface SellerOrder {
  id: string; // Could be transaction ID or product ID
  productId?: string;
  activity: string; // Product title
  type: string;     // Category
  imageUrl: string;
  price: number;
  status: string;
  date: string;
  carrier?: string;
  trackingNumber?: string;
  startTime?: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export interface CreateProductPayload {
  title: string;
  category: "Art Toy" | "Trading Card" | "Model";
  price: number;
  startTime: string;
  endTime: string;
  description: string;
  imageUrl: string;
}

const USE_MOCK = false;

// Helper for Auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("popdrop_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Fetch seller dashboard statistics
 */
export async function getSellerStats(timeframe: string = "Month"): Promise<SellerStats> {
  if (USE_MOCK) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      totalBalance: 689372.0,
      totalIncome: 1050000,
      tradingCardSales: 700000,
      artToySales: 950000,
      modelSales: 850000,
      currency: "THB",
    };
  }

  const res = await fetch(`/api/v1/seller/stats?timeframe=${timeframe}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch seller stats: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Request a withdrawal from seller balance
 */
export async function requestWithdrawal(amount: number): Promise<{ message: string }> {
  const res = await fetch("/api/v1/seller/withdraw", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ amount }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to process withdrawal request");
  }

  return res.json();
}

/**
 * Fetch seller orders / sales history
 */
export async function getSellerOrders(): Promise<SellerOrder[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return [
      {
        id: "INV_000076",
        activity: "Hirono Little Mischief",
        type: "Art Toy",
        imageUrl: "/images/hirono.png",
        price: 25500,
        status: "Completed",
        date: "17 Apr, 2026 03:45 PM",
        carrier: "Kerry Express",
        trackingNumber: "KRY-88291039",
      },
      {
        id: "INV_000075",
        activity: "Charizard Base Set Holo",
        type: "Trading Card",
        imageUrl: "/images/pokemon.png",
        price: 32750,
        status: "Pending",
        date: "15 Apr, 2026 11:30 AM",
      },
      {
        id: "INV_000074",
        activity: "Gundam RX-78-2 PG",
        type: "Model",
        imageUrl: "/images/gundum.png",
        price: 40200,
        status: "Completed",
        date: "15 Apr, 2026 12:00 PM",
        carrier: "Flash Express",
        trackingNumber: "TH-09218204",
      },
      {
        id: "INV_000073",
        activity: "Skullpanda Action Cut",
        type: "Art Toy",
        imageUrl: "/images/skull.png",
        price: 50200,
        status: "In Progress",
        date: "14 Apr, 2026 09:15 PM",
      },
      {
        id: "INV_000072",
        activity: "Mickey Mouse Vintage Holo",
        type: "Trading Card",
        imageUrl: "/images/mickey_card.avif",
        price: 15900,
        status: "Completed",
        date: "10 Apr, 2026 06:00 AM",
        carrier: "Thailand Post",
        trackingNumber: "EMS-4920194",
      },
    ];
  }

  const res = await fetch("/api/v1/seller/orders", {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch seller orders: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Delete a product before it goes live
 */
export async function deleteProduct(productId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/v1/seller/products/${productId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to delete product: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Update order tracking number
 */
export async function updateOrderTracking(
  orderId: string,
  carrier: string,
  trackingNumber: string
): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: true,
      message: `Tracking for ${orderId} updated to ${carrier} (${trackingNumber})`,
    };
  }

  const res = await fetch(`/api/v1/seller/orders/${orderId}/tracking`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ carrier, trackingNumber }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update tracking: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Request Presigned URL for Cloud Storage Upload (AWS S3 / Cloudflare R2)
 */
export async function getPresignedUrl(
  filename: string,
  fileType: string
): Promise<PresignedUrlResponse> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const randomKey = `uploads/${Date.now()}-${filename}`;
    return {
      uploadUrl: `/api/v1/upload/mock-cloud-s3?key=${randomKey}`,
      publicUrl: `/images/hirono.png`, // Fallback preview image
      key: randomKey,
    };
  }

  const res = await fetch("/api/v1/upload/presigned-url", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ filename, fileType }),
  });

  if (!res.ok) {
    throw new Error(`Failed to get presigned upload URL: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Upload file directly to Cloud Storage using Presigned URL with progress listener
 */
export async function uploadFileToCloud(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  if (USE_MOCK) {
    // Simulate progressive upload 0% -> 100%
    for (let p = 10; p <= 100; p += 20) {
      if (onProgress) onProgress(p);
      await new Promise((r) => setTimeout(r, 150));
    }
    return;
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Cloud upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during cloud upload"));
    xhr.send(file);
  });
}

/**
 * Submit new product listing
 */
export async function createProduct(
  payload: CreateProductPayload
): Promise<{ success: boolean; product: CreateProductPayload }> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      success: true,
      product: payload,
    };
  }

  const res = await fetch("/api/v1/seller/products", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    if (res.status === 403 && errorData?.missingRequirements) {
      const err = new Error(errorData.error || "Prerequisites missing");
      (err as any).missingRequirements = errorData.missingRequirements;
      throw err;
    }
    throw new Error(errorData?.message || errorData?.error || `Failed to create product: ${res.statusText}`);
  }

  return res.json();
}
