"use client";

import React from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QRCode from "react-qr-code";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

interface Registration {
  id: number;
  name: string;
  phone: string;
  ticket_count: number;
  raffle_numbers: string[];
  attendance_present: boolean;
  attendance_time: string | null;
}

export default function EventPage() {
  const [phone, setPhone] = useState("");
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [error, setError] = useState("");

  // Fetch user by phone
  const handleLogin = async () => {
    setError("");
    setRegistration(null);

    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("phone", phone)
      .maybeSingle(); // ✅ use maybeSingle instead of single()

    if (error) {
      const errorMsg = `Database error: ${error.message}`;
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!data) {
      const errorMsg =
        "This phone number is not registered. Please enter your correct phone number that has a valid ticket.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Ensure raffle_numbers is always an array
    const normalizedData: Registration = {
      ...data,
      raffle_numbers: Array.isArray(data.raffle_numbers)
        ? data.raffle_numbers
        : typeof data.raffle_numbers === "string"
        ? JSON.parse(data.raffle_numbers)
        : [],
    };

    setRegistration(normalizedData);
  };

  // Poll registration every 1s for auto-refresh
  useEffect(() => {
    if (!registration) return;

    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("id", registration.id)
        .single();

      if (error) {
        toast.error(`Database error: ${error.message}`);
        return;
      }

      if (data) {
        const normalizedData: Registration = {
          ...data,
          raffle_numbers: Array.isArray(data.raffle_numbers)
            ? data.raffle_numbers
            : typeof data.raffle_numbers === "string"
            ? JSON.parse(data.raffle_numbers)
            : [],
        };
        setRegistration(normalizedData);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [registration?.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center bg-black/90 justify-center p-6"
    >
      <Card className="w-full max-w-md mx-auto bg-black/40 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl">
        {!registration ? (
          <>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Event Check-in
              </CardTitle>
              <p className="text-gray-300 mt-2">
                Enter your phone number to view your ticket
              </p>
            </CardHeader>

            <CardContent className="space-y-6 text-gray-100">
              <div>
                <Label htmlFor="phone">
                  Phone Number <span className="text-cyan-400">*</span>
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="bg-black/30 text-gray-100 placeholder-gray-400 border border-white/20 focus:border-cyan-400 focus:ring-0"
                />
              </div>

              <Button
                onClick={handleLogin}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl"
              >
                View Ticket
              </Button>

              {/* {error && <p className="text-red-500 text-center">{error}</p>} */}
            </CardContent>
          </>
        ) : (
          <CardContent className="text-center py-4 space-y-6">
            <h1 className="text-4xl font-bold text-gray-100">
              🎟️ Project Nehemiah Ticket Details
            </h1>

            {/* QR Code */}
            {!registration.attendance_present ? (
              <div className="p-4 bg-white border border-white rounded-xl inline-block">
                <QRCode
                  value={`https://project-nehemiah.vercel.app/api/mark-attendance?id=${registration.id}`}
                  size={180}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <CheckCircle className="w-16 h-16 text-green-400 mb-2" />
                <p className="text-green-400 text-lg font-bold">
                  Attendance Registered
                </p>
              </div>
            )}

            {/* Ticket Info */}
            <div className="mt-4 space-y-2 text-gray-200">
              <p className="text-3xl py-6 text-cyan-400 font-semibold">
                {registration.name}
              </p>
              <p className="text-2xl py-4">
                Tickets:{" "}
                <span className="text-2xl font-bold text-cyan-400">
                  {registration.ticket_count}
                </span>
              </p>
              <p className="text-2xl py-4">
                Ticket Numbers:{" "}
                <span className="text-2xl text-cyan-400 font-bold">
                  {registration.raffle_numbers.length > 0
                    ? registration.raffle_numbers.join(", ")
                    : "N/A"}
                </span>
              </p>
            </div>

            {/* Status Banner */}
            <div
              className={`p-3 rounded-xl font-semibold text-sm ${
                registration.attendance_present
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {registration.attendance_present
                ? `✅ Attendance marked at ${
                    registration.attendance_time
                      ? new Date(registration.attendance_time).toLocaleString(
                          "en-IN",
                          {
                            timeZone: "Asia/Kolkata",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "Unknown time"
                  }`
                : "⚠️ Attendance not registered yet. Please show the qr code to the event staff."}
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}
