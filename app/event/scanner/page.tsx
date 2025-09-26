"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";
import BarcodeScanner from "react-qr-barcode-scanner";

export default function StaffScannerPage() {
  const [mounted, setMounted] = useState(false);
  const [staffPassword, setStaffPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);

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
    if (isLoggedIn) {
      sessionStorage.setItem("staff_pw", staffPassword);
    } else {
      sessionStorage.removeItem("staff_pw");
    }
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

  const handleLogout = () => {
    setIsLoggedIn(false);
    setStaffPassword("");
    setScanning(false);
    sessionStorage.removeItem("staff_pw");
    toast.success("Logged out");
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
                    onClick={() => setScanning((s) => !s)}
                    className="bg-cyan-500"
                  >
                    {scanning ? "Stop Camera" : "Start Camera"}
                  </Button>
                  <Button onClick={handleLogout} variant="destructive">
                    Logout
                  </Button>
                </div>
              </div>
              {scanning ? (
                <div className="w-full h-96 bg-black flex items-center justify-center">
                  <BarcodeScanner
                    facingMode="environment"
                    onUpdate={(err, result) => {
                      if (result) onScan(result.getText());
                      else onError(err);
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
                <div className="mt-1 p-3 bg-gray-50">{lastScan ?? "—"}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
