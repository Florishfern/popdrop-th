import { getPresignedUrl, uploadFileToCloud } from "./sellerApi";

export interface UserProfile {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  cityState: string;
  postalCode: string;
  taxId: string;
  avatarUrl: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  kycStatus: "Unverified" | "Pending" | "Verified";
  totalSalesCount: number;
}

export interface UserAddress {
  id: string;
  name: string;
  phone: string;
  street: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

export interface CreditCardItem {
  id: string;
  cardNumberMasked: string; // e.g. "•••• •••• •••• 4242"
  last4: string;
  expiry: string;
  cardholderName: string;
  brand: "Visa" | "Mastercard";
  isDefault: boolean;
  token: string;
}

export interface BuyerTransactionItem {
  id: string;
  productName: string;
  price: number;
  status: "Unpaid" | "Processing" | "In Transit" | "Completed";
  date: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  imageUrl: string;
}

export interface SupportTicketPayload {
  topic: string;
  description: string;
  attachmentUrl?: string | null;
}

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("popdrop_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Fetch User Profile
 */
export async function getUserProfile(): Promise<UserProfile> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      firstName: "Michael",
      lastName: "Rodriguez",
      username: "PandaMon_35",
      email: "Rodriguez@gmail.com",
      phone: "(213) 555-1234",
      country: "United States of America",
      cityState: "California, USA",
      postalCode: "ERT 62574",
      taxId: "AS56417896",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=PandaMon",
      isEmailVerified: true,
      isPhoneVerified: false,
      kycStatus: "Unverified",
      totalSalesCount: 45, // < 100 for default locked view, can toggle to test
    };
  }

  const res = await fetch("/api/v1/user/profile", {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}

/**
 * Update User Profile
 */
export async function updateUserProfile(payload: Partial<UserProfile>): Promise<{ success: boolean; profile: UserProfile }> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { success: true, profile: payload as UserProfile };
  }

  const res = await fetch("/api/v1/user/profile", {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

/**
 * Upload Avatar to Cloud Storage (Presigned URL)
 */
export async function uploadAvatarImage(file: File, onProgress?: (percent: number) => void): Promise<string> {
  const { uploadUrl, publicUrl } = await getPresignedUrl(file.name, file.type);
  await uploadFileToCloud(uploadUrl, file, onProgress);
  
  // Save updated avatar URL to profile
  if (!USE_MOCK) {
    await updateUserProfile({ avatarUrl: publicUrl });
  }
  return publicUrl;
}

/**
 * Submit KYC ID Card Document
 */
export async function submitKYCDocument(file: File): Promise<{ success: boolean; message: string }> {
  const { uploadUrl, publicUrl } = await getPresignedUrl(file.name, file.type);
  await uploadFileToCloud(uploadUrl, file);

  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    return { success: true, message: "KYC Document submitted for review" };
  }

  const res = await fetch("/api/v1/verification/id-card", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ documentUrl: publicUrl }),
  });
  if (!res.ok) throw new Error("Failed to submit KYC document");
  return res.json();
}

/**
 * Send Email Verification Link
 */
export async function sendEmailVerificationLink(): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    return { success: true, message: "Verification link sent to your email" };
  }

  const res = await fetch("/api/v1/auth/send-email-verify", {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to send email verification");
  return res.json();
}

/**
 * Verify Phone OTP Code
 */
export async function verifyPhoneOTPCode(otp: string): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    if (otp === "123456" || otp.length === 6) {
      return { success: true, message: "Phone number verified successfully" };
    }
    throw new Error("Invalid OTP code");
  }

  const res = await fetch("/api/v1/auth/verify-phone-otp", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ otp }),
  });
  if (!res.ok) throw new Error("Failed to verify OTP");
  return res.json();
}

/**
 * Fetch Saved Addresses
 */
export async function getUserAddresses(): Promise<UserAddress[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return [
      {
        id: "addr_1",
        name: "Michael Rodriguez",
        phone: "081-234-5678",
        street: "99/1 ซอย สุขุมวิท 21 (อโศก)",
        subdistrict: "คลองเตยเหนือ",
        district: "วัฒนา",
        province: "กรุงเทพมหานคร",
        postalCode: "10110",
        isDefault: true,
      },
      {
        id: "addr_2",
        name: "Michael Rodriguez (Office)",
        phone: "02-999-8888",
        street: "55 อาคารออฟฟิศ ทาวเวอร์ ชั้น 18 ถนนพระราม 9",
        subdistrict: "ห้วยขวาง",
        district: "ห้วยขวาง",
        province: "กรุงเทพมหานคร",
        postalCode: "10310",
        isDefault: false,
      },
    ];
  }

  const res = await fetch("/api/v1/user/addresses", { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch addresses");
  return res.json();
}

/**
 * Add New Address
 */
export async function addUserAddress(payload: Omit<UserAddress, "id">): Promise<UserAddress> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    return { ...payload, id: `addr_${Date.now()}` };
  }

  const res = await fetch("/api/v1/user/addresses", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to add address");
  return res.json();
}

/**
 * Update / Set Default Address
 */
export async function updateUserAddress(id: string, payload: Partial<UserAddress>): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return { success: true };
  }

  const res = await fetch(`/api/v1/user/addresses/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update address");
  return res.json();
}

/**
 * Delete Address
 */
export async function deleteUserAddress(id: string): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return { success: true };
  }

  const res = await fetch(`/api/v1/user/addresses/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete address");
  return res.json();
}

/**
 * Add Credit Card (Tokenized Gateway Integration)
 */
export async function addCreditCardToken(cardData: {
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
}): Promise<CreditCardItem> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    const cleanNum = cardData.cardNumber.replace(/\s+/g, "");
    const last4 = cleanNum.slice(-4) || "4242";
    const brand = cleanNum.startsWith("5") ? "Mastercard" : "Visa";
    return {
      id: `card_${Date.now()}`,
      cardNumberMasked: `•••• •••• •••• ${last4}`,
      last4,
      expiry: cardData.expiry,
      cardholderName: cardData.cardholderName.toUpperCase(),
      brand,
      isDefault: false,
      token: `tok_${Math.random().toString(36).substring(2, 10)}`,
    };
  }

  const res = await fetch("/api/v1/payments/cards", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(cardData),
  });
  if (!res.ok) throw new Error("Failed to tokenize credit card");
  return res.json();
}

/**
 * Set Default Credit Card
 */
export async function setDefaultCreditCard(id: string): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return { success: true };
  }

  const res = await fetch(`/api/v1/payments/cards/${id}/default`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to set default credit card");
  return res.json();
}

/**
 * Fetch Buyer Transactions with Search & Filter
 */
export async function getBuyerTransactions(params?: {
  search?: string;
  status?: string;
}): Promise<BuyerTransactionItem[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    const items: BuyerTransactionItem[] = [
      {
        id: "INV_000082",
        productName: "Labubu Macaron Series",
        price: 4500,
        status: "Completed",
        date: "18 Apr, 2026 10:15 AM",
        carrier: "Kerry Express",
        trackingNumber: "KRY-88291039",
        imageUrl: "/images/hirono.png",
      },
      {
        id: "INV_000079",
        productName: "Hirono Little Mischief",
        price: 2800,
        status: "In Transit",
        date: "17 Apr, 2026 03:45 PM",
        carrier: "Flash Express",
        trackingNumber: "FLS-99120301",
        imageUrl: "/images/hirono.png",
      },
      {
        id: "INV_000076",
        productName: "Charizard Holographic Base Set",
        price: 25500,
        status: "Processing",
        date: "16 Apr, 2026 01:20 PM",
        carrier: null,
        trackingNumber: null,
        imageUrl: "/images/hirono.png",
      },
      {
        id: "INV_000072",
        productName: "Skullpanda City of Night",
        price: 3200,
        status: "Unpaid",
        date: "15 Apr, 2026 09:30 AM",
        carrier: null,
        trackingNumber: null,
        imageUrl: "/images/hirono.png",
      },
    ];

    let filtered = [...items];
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (item) => item.productName.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
      );
    }
    if (params?.status && params.status !== "All") {
      filtered = filtered.filter((item) => item.status === params.status);
    }
    return filtered;
  }

  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.status) query.append("status", params.status);

  const res = await fetch(`/api/v1/buyer/transactions?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch buyer transactions");
  return res.json();
}

/**
 * Submit Support Ticket
 */
export async function submitSupportTicket(payload: SupportTicketPayload): Promise<{ success: boolean; ticketId: string }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1000));
    return { success: true, ticketId: `TCK-${Math.floor(100000 + Math.random() * 900000)}` };
  }

  const res = await fetch("/api/v1/support/tickets", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to submit support ticket");
  return res.json();
}
