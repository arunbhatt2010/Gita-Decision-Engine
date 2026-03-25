const Razorpay = require("razorpay");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports = async function handler(req, res) {
  try {
    const order = await instance.orders.create({
      amount: 1900, // ₹19 = 1900 paise
      currency: "INR"
    });

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ error: "Order failed" });
  }
};
