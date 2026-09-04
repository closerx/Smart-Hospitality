import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { sendOTPEmail } from "./server/emailService";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route to dispatch OTP verification emails
  app.post("/api/send-otp", async (req, res) => {
    try {
      const { email, otp, fullName } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ success: false, error: "Email and OTP are required" });
      }

      const result = await sendOTPEmail({ to: email, otp, fullName });
      return res.json(result);
    } catch (err: any) {
      console.error("API /api/send-otp error:", err);
      return res.status(500).json({ 
        success: false, 
        error: err?.message || "Failed to send OTP email" 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

