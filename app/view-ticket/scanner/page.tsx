"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from "html5-qrcode";

export default function StaffScannerPage() {
  const [mounted, setMounted] = useState(false);
  const [staffPassword, setStaffPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);

  const html5QrRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedPw = sessionStorage.getItem("staff_pw");
      if (savedPw) {
        setStaffPassword(savedPw);
        setIsLoggedIn(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) sessionStorage.setItem("staff_pw", staffPassword);
    else sessionStorage.removeItem("staff_pw");
  }, [isLoggedIn, staffPassword]);

  if (!mounted) return null;

  const handleLogin = () => {
    if (!staffPassword.trim()) {
      toast.error("Enter staff password");
      return;
    }
    setIsLoggedIn(true);
    toast.success("Staff mode enabled. Ready to scan.");
  };

  const handleLogout = async () => {
    stopScanner();
    setIsLoggedIn(false);
    setStaffPassword("");
    setScanning(false);
    sessionStorage.removeItem("staff_pw");
    toast.success("Logged out");
  };

  const onScan = async (decodedText: string) => {
    if (!decodedText || decodedText === lastScan) return;
    setLastScan(decodedText);

    try {
      let idParam: string | null = null;
      try {
        const url = new URL(decodedText);
        idParam =
          url.searchParams.get("id") ||
          url.searchParams.get("ticketId") ||
          decodedText;
      } catch {
        idParam = decodedText;
      }

      if (!idParam) {
        toast.error("No valid ID found in QR");
        return;
      }

      // Fetch user name first
      const resUser = await fetch(
        `/api/mark-attendance?id=${encodeURIComponent(idParam)}&fetchName=true`,
        {
          headers: {
            "x-staff-secret": staffPassword.trim(), // ✅ send staff input
          },
        }
      );

      if (!resUser.ok) {
        const text = await resUser.text();
        console.error("API returned error:", text);
        toast.error(`Unable to fetch user info (${resUser.status})`);
        return;
      }

      const userData = await resUser.json();
      if (!userData?.name) {
        toast.error("API returned invalid data");
        return;
      }

      const confirmed = confirm(`Mark attendance for: ${userData.name}?`);
      if (!confirmed) return;

      setIsProcessing(true);

      const res = await fetch(
        `/api/mark-attendance?id=${encodeURIComponent(idParam)}`,
        {
          method: "GET",
          headers: {
            "x-staff-secret": staffPassword.trim(), // ✅ same header for marking
            "Content-Type": "application/json",
          },
        }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) toast.error(json?.error || `Failed (${res.status})`);
      else toast.success(json?.message || "Attendance marked successfully");
    } catch (err: any) {
      toast.error(err?.message || "Scan processing error");
    } finally {
      setIsProcessing(false);
    }
  };

  const startScanner = async () => {
    if (!Html5Qrcode.getCameras) {
      toast.error("Camera not supported on this device/browser");
      setCameraSupported(false);
      return;
    }
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        toast.error("No camera found");
        setCameraSupported(false);
        return;
      }

      const rearCamera =
        cameras.find((c) => c.label.toLowerCase().includes("back")) ||
        cameras[0];

      html5QrRef.current = new Html5Qrcode("reader");
      await html5QrRef.current.start(
        rearCamera.id,
        { fps: 10, qrbox: 300 } as Html5QrcodeCameraScanConfig,
        onScan,
        (err) => console.warn("QR scan error:", err)
      );

      setCameraSupported(true);
      setScanning(true);
    } catch (err) {
      console.error(err);
      toast.error("Camera permission denied or unavailable");
      setCameraSupported(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      await html5QrRef.current.stop().catch(() => {});
      html5QrRef.current.clear();
      html5QrRef.current = null;
      setScanning(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center p-4 bg-black/90"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Card className="w-full max-w-md sm:max-w-3xl mx-auto bg-gray-900 rounded-2xl shadow-xl">
        <CardHeader className="p-6 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <CardTitle className="text-3xl sm:text-2xl font-bold text-white">
              Staff Scanner
            </CardTitle>
            {isLoggedIn && (
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="px-3 py-1 text-sm ml-20"
              >
                Logout
              </Button>
            )}
          </div>
          <p className="text-gray-300 mt-2 text-sm sm:text-base">
            Log in with staff password and scan attendee QR codes to mark
            attendance.
          </p>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {!isLoggedIn ? (
            <div className="space-y-4">
              <Input
                placeholder="Enter staff password"
                type="password"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                className="w-full bg-gray-800 text-white placeholder-gray-400 border-gray-700"
              />
              <div className="flex flex-row justify-center gap-2">
                <Button
                  onClick={handleLogin}
                  className="bg-cyan-500 px-4 py-2 text-sm"
                >
                  Enable Scanner
                </Button>
                <Button
                  onClick={() => setStaffPassword("")}
                  variant="ghost"
                  className="px-4 py-2 text-sm text-gray-200 border border-gray-700"
                >
                  Clear
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!cameraSupported && (
                <p className="text-red-500 text-center mt-2">
                  Camera not supported or permission denied.
                </p>
              )}
              <div className="w-full h-[500px] sm:h-[650px] bg-black rounded-xl overflow-hidden relative">
                <div id="reader" className="w-full h-full" />
                {!scanning && (
                  <p className="absolute inset-0 flex items-center justify-center text-gray-400 text-center px-4">
                    Camera stopped. Click Start Camera to scan QR codes.
                  </p>
                )}
              </div>
              <div className="flex flex-row justify-center gap-3 mt-2">
                <Button
                  onClick={() => {
                    scanning ? stopScanner() : startScanner();
                  }}
                  className="bg-cyan-500 px-3 py-1 text-sm"
                >
                  {scanning ? "Stop Camera" : "Start Camera"}
                </Button>
              </div>
              <div className="mt-3">
                <p className="text-sm text-gray-300">Last scanned:</p>
                <div className="mt-1 p-3 bg-gray-800 text-white rounded-lg break-words">
                  {lastScan ?? "—"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx>{`
        #reader video,
        #reader canvas {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
      `}</style>
    </motion.div>
  );
}
