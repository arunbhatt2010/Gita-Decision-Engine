import Razorpay from "razorpay";

export const config = {
  runtime: "nodejs"
};

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export default async function handler(req, res) {
  try {
    const order = await instance.orders.create({
      amount: 1900,
      currency: "INR"
    });

    res.status(200).json({
      id: order.id,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {
    console.error("RAZORPAY ERROR:", err);
    res.status(500).json({ error: "Order failed" });
  }
}
