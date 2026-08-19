const Coupon = require('./Coupon');

describe('Coupon model helpers', () => {
  it('caps percentage discounts at maxDiscount', () => {
    const coupon = new Coupon({
      code: 'SAVE50',
      discountType: 'percentage',
      discountValue: 50,
      maxDiscount: 1000,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    expect(coupon.calculateDiscount(10000)).toBe(1000);
  });

  it('never discounts more than the booking amount', () => {
    const coupon = new Coupon({
      code: 'FLAT500',
      discountType: 'flat',
      discountValue: 500,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    expect(coupon.calculateDiscount(300)).toBe(300);
  });
});
