import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

let client;
if (!global._mongoClientPromise) {
  client = new MongoClient(process.env.MONGO_URI);
  global._mongoClientPromise = client.connect();
}
const clientPromise = global._mongoClientPromise;

export default async function handler(req, res) {
  const dbClient = await clientPromise;
  const db = dbClient.db("loginDB");
  const users = db.collection("adminUsers");

  if (req.method === "POST") {
    const { action, fullname, email, password } = req.body;

    if (action === "register") {
      if (!fullname || !email || !password)
        return res.status(400).json({ message: "All fields are required" });

      const existingUser = await users.findOne({ email });
      if (existingUser)
        return res.status(400).json({ message: "User already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);
      await users.insertOne({ fullname, email, password: hashedPassword });

      return res.json({ message: "Registered Successfully!" });
    }

    if (action === "login") {
      if (!email || !password)
        return res.status(400).json({ message: "All fields are required" });

      const user = await users.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: "Wrong password" });

      return res.json({ message: "Login Successful" });
    }

    return res.status(400).json({ message: "Invalid action" });
  }

  return res.status(404).json({ message: "Not Found" });
}
