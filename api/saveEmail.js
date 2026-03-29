export default async function handler(req, res) {
  if (req.method === "POST") {
    const { email } = req.body;

    console.log("New Email:", email);

    return res.status(200).json({ success: true });
  }

  res.status(405).json({ message: "Method not allowed" });
}
