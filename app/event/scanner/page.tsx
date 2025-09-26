"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";

// TypeScript: declare module to avoid missing types
declare module "react-qr-scanner";

// Dynamic import to prevent SSR
const QrReader = dynamic(() => import("react-qr-scanner"), { ssr: false });

export default function StaffScannerPage() {
  const [mounted, setMounted] = useState(false); // prevent hydration errors
  const [staffPassword, setStaffPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);

  useEffect(() => {
    setMounted(true); // mark component mounted
    if (typeof window !== "undefined") {
      const savedPw = sessionStorage.getItem("staff_pw");
      if (savedPw) {
        setStaffPassword(savedPw);
        setIsLoggedIn(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      sessionStorage.setItem("staff_pw", staffPassword);
    } else {
      sessionStorage.removeItem("staff_pw");
    }
  }, [isLoggedIn, staffPassword]);

  if (!mounted) return null; // avoid hydration mismatch

  const handleLogin = () => {
    if (!staffPassword.trim()) {
      toast.error("Enter staff password");
      return;
    }
    setIsLoggedIn(true);
    toast.success("Staff mode enabled. Ready to scan.");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setStaffPassword("");
    setScanning(false);
    sessionStorage.removeItem("staff_pw");
    toast.success("Logged out");
  };

  const requestCameraPermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Camera not supported on this device/browser");
      setCameraSupported(false);
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraSupported(true);
    } catch (err) {
      console.error(err);
      toast.error("Camera permission denied or not available");
      setCameraSupported(false);
    }
  };

  const onScan = async (data: string | null) => {
    if (!data || data === lastScan) return;
    setLastScan(data);

    try {
      let idParam: string | null = null;
      try {
        const url = new URL(data);
        idParam =
          url.searchParams.get("id") ||
          url.searchParams.get("ticketId") ||
          data;
      } catch {
        idParam = data;
      }

      if (!idParam) {
        toast.error("No valid ID found in QR");
        return;
      }

      const confirmed = confirm(`Mark attendance for ID: ${idParam}?`);
      if (!confirmed) return;

      setIsProcessing(true);
      const res = await fetch(
        `/api/mark-attendance?id=${encodeURIComponent(idParam)}`,
        {
          method: "GET",
          headers: {
            "x-staff-secret": staffPassword,
            "Content-Type": "application/json",
          },
        }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error || `Failed (${res.status})`);
      } else {
        toast.success(json?.message || "Attendance marked successfully");
      }
    } catch (err: any) {
      toast.error(err?.message || "Scan processing error");
    } finally {
      setIsProcessing(false);
    }
  };

  const onError = (err: any) => {
    console.error(err);
    toast.error("Camera error: " + (err?.message || String(err)));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-6 bg-gray-50"
    >
      <Card className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-lg">
        <CardHeader className="p-6">
          <CardTitle className="text-2xl font-bold">Staff Scanner</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Log in with staff password and scan attendee QR codes to mark
            attendance.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          {!isLoggedIn ? (
            <div className="space-y-4">
              <Input
                placeholder="Enter staff password"
                type="password"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex gap-3">
                <Button onClick={handleLogin} className="bg-cyan-500">
                  Enable Scanner
                </Button>
                <Button onClick={() => setStaffPassword("")} variant="ghost">
                  Clear
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Staff mode enabled</p>
                  <p className="text-xs text-gray-500">
                    Keep this page open while scanning
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      await requestCameraPermission();
                      setScanning((s) => !s);
                    }}
                  >
                    {scanning ? "Stop Camera" : "Start Camera"}
                  </Button>
                  <Button onClick={handleLogout} variant="destructive">
                    Logout
                  </Button>
                </div>
              </div>

              {!cameraSupported && (
                <p className="text-red-500 text-center mt-2">
                  Camera not supported or permission denied.
                </p>
              )}

              {scanning && cameraSupported ? (
                <div className="w-full h-96 bg-black flex items-center justify-center">
                  <QrReader
                    delay={500}
                    style={{ width: "100%", height: "100%" }}
                    videoStyle={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    constraints={{ facingMode: { exact: "environment" } }} // rear camera
                    onScan={(data) => {
                      if (data) onScan(data);
                    }}
                    onError={(err) => {
                      console.error(err);
                      toast.error(
                        "Camera error: " + (err?.message || String(err))
                      );
                    }}
                  />
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center">
                  <p className="text-gray-500">
                    Camera stopped. Click Start Camera to scan QR codes.
                  </p>
                </div>
              )}

              <div className="mt-3">
                <p className="text-sm text-gray-600">Last scanned:</p>
                <div className="mt-1 p-3 bg-gray-50 rounded">
                  {lastScan ?? "—"}
                </div>
              </div>

              <div className="mt-4">
                <small className="text-xs text-gray-500">
                  Notes: The scanner expects the QR to contain a URL with an
                  `id` query parameter or the raw ticket id/token. Scanning
                  outside this page (e.g., Google Lens) will not mark
                  attendance.
                </small>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
