const Razorpay = require("razorpay");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports = async function handler(req, res) {
  try {
    const order = await instance.orders.create({
      amount: 1900,
      currency: "INR"
    });

    // 🔥 IMPORTANT FIX
    res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order failed" });
  }
};
