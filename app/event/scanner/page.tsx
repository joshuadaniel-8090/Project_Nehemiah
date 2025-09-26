"use client";

import React, { useEffect, useState } from "react";
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function StaffScannerPage() {
  const [mounted, setMounted] = useState(false);
  const [staffPassword, setStaffPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const [scannerInstance, setScannerInstance] =
    useState<Html5QrcodeScanner | null>(null);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<
    { id: string; label: string }[]
  >([]);

  // Mount & session restore
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

  const handleLogout = () => {
    setIsLoggedIn(false);
    setStaffPassword("");
    setScanning(false);
    stopScanner();
    sessionStorage.removeItem("staff_pw");
    toast.success("Logged out");
  };

  const stopScanner = () => {
    if (scannerInstance) {
      scannerInstance.clear().catch(console.error);
      setScannerInstance(null);
    }
  };

  const startScanner = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Camera not supported on this device/browser");
      setCameraSupported(false);
      return;
    }

    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        setAvailableCameras(devices.map((d) => ({ id: d.id, label: d.label })));
        setCameraId(devices[0].id); // default to first camera
      } else {
        toast.error("No cameras found");
        setCameraSupported(false);
        return;
      }

      const scanner = new Html5QrcodeScanner("qr-reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      }, false);

      scanner.render(
        async (decodedText) => {
          if (!decodedText || decodedText === lastScan) return;
          setLastScan(decodedText);
          const confirmed = confirm(`Mark attendance for ID: ${decodedText}?`);
          if (!confirmed) return;

          setIsProcessing(true);
          try {
            const res = await fetch(
              `/api/mark-attendance?id=${encodeURIComponent(decodedText)}`,
              {
                method: "GET",
                headers: {
                  "x-staff-secret": staffPassword,
                  "Content-Type": "application/json",
                },
              }
            );
            const json = await res.json().catch(() => ({}));
            if (!res.ok) toast.error(json?.error || `Failed (${res.status})`);
            else
              toast.success(json?.message || "Attendance marked successfully");
          } catch (err: any) {
            toast.error(err?.message || "Scan processing error");
          } finally {
            setIsProcessing(false);
          }
        },
        (errorMessage) => {
          console.error("QR scan error:", errorMessage);
        }
      );
      setScannerInstance(scanner);
      setScanning(true);
    } catch (err) {
      console.error(err);
      toast.error("Camera permission denied or not available");
      setCameraSupported(false);
    }
  };

  const switchCamera = () => {
    if (availableCameras.length < 2) return;
    const currentIndex = availableCameras.findIndex((c) => c.id === cameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    setCameraId(availableCameras[nextIndex].id);
    stopScanner();
    setTimeout(startScanner, 200); // restart scanner with new camera
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
                  <Button onClick={scanning ? stopScanner : startScanner}>
                    {scanning ? "Stop Camera" : "Start Camera"}
                  </Button>
                  {availableCameras.length > 1 && (
                    <Button onClick={switchCamera}>Switch Camera</Button>
                  )}
                  <Button onClick={handleLogout} variant="destructive">
                    Logout
                  </Button>
                </div>
              </div>
              <div
                id="qr-reader"
                className="w-full h-96 bg-black flex items-center justify-center mt-4"
              ></div>
              <div className="mt-3">
                <p className="text-sm text-gray-600">Last scanned:</p>
                <div className="mt-1 p-3 bg-gray-50">{lastScan ?? "—"}</div>
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
