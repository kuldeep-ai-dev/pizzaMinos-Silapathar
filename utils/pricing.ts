// PRICING UTILITY FOR DISCOUNTS AND OFFERS

export interface Campaign {
    id: string;
    name: string;
    code?: string;
    type: 'percentage' | 'fixed';
    discount_value: number;
    target_type: 'all' | 'category' | 'item';
    target_id?: string;
    is_active: boolean;
    end_date?: string;
}

/**
 * Calculates the discounted price for a given menu item/variant.
 * Returns both the original and discounted price.
 */
export function calculateDiscountedPrice(
    originalPrice: string | number,
    item: { id: string; category: string },
    activeCampaigns: Campaign[]
) {
    const price = typeof originalPrice === 'string'
        ? parseFloat(originalPrice.replace(/[^\d.-]/g, ''))
        : originalPrice;

    if (isNaN(price)) return { original: originalPrice, discounted: originalPrice, appliedCampaign: null };

    // 1. Sort campaigns by scope specificity: item > category > all
    const sortedCampaigns = [...activeCampaigns]
        .filter(c => {
            const now = new Date();
            const isNotExpired = !c.end_date || new Date(c.end_date) > now;
            return c.is_active && isNotExpired && !c.code; // Only auto-applied campaigns here (no coupons)
        })
        .sort((a, b) => {
            const scopeOrder = { item: 0, category: 1, all: 2 };
            return scopeOrder[a.target_type] - scopeOrder[b.target_type];
        });

    // 2. Find the first matching campaign
    const match = sortedCampaigns.find(c => {
        if (c.target_type === 'all') return true;
        if (c.target_type === 'category' && c.target_id === item.category) return true;
        if (c.target_type === 'item' && c.target_id === item.id) return true;
        return false;
    });

    if (!match) return { original: price, discounted: price, appliedCampaign: null };

    // 3. Apply discount
    let discounted = price;
    if (match.type === 'percentage') {
        discounted = price - (price * (match.discount_value / 100));
    } else {
        discounted = Math.max(0, price - match.discount_value);
    }

    return {
        original: price,
        discounted: Math.round(discounted),
        appliedCampaign: match
    };
}

/**
 * Applies a coupon code to a total amount.
 */
export function applyCoupon(total: number, code: string, campaigns: Campaign[]) {
    const coupon = campaigns.find(c => c.code?.toUpperCase() === code.toUpperCase() && c.is_active);

    if (!coupon) return { error: "Invalid or expired coupon code." };

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
        discountAmount = total * (coupon.discount_value / 100);
    } else {
        discountAmount = coupon.discount_value;
    }

    return {
        discountAmount: Math.round(discountAmount),
        coupon
    };
}
