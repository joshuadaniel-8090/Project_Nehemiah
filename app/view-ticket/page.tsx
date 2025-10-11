"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QRCode from "react-qr-code";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import Image from "next/image";
import Confetti from "react-confetti";

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
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState<{ [id: number]: boolean }>({});

  const lastAttendanceStatus = useRef<{ [id: number]: boolean }>({});

  const handleLogin = async () => {
    setError("");
    setRegistrations([]);
    setShowSuccess({});

    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("phone", phone);

    if (error) {
      const msg = `Database error: ${error.message}`;
      toast.error(msg);
      setError(msg);
      return;
    }

    if (!data || data.length === 0) {
      const msg =
        "This phone number is not registered. Please enter your correct phone number that has a valid ticket.";
      toast.error(msg);
      setError(msg);
      return;
    }

    const verifiedTickets = data.filter((row) => row.status === "verified");

    if (verifiedTickets.length === 0) {
      const msg =
        "Your tickets are not yet verified. Please wait until they get approved.";
      toast.error(msg);
      setError(msg);
      return;
    }

    // Normalize raffle_numbers for each ticket
    const normalizedTickets: Registration[] = verifiedTickets.map((row) => ({
      ...row,
      raffle_numbers: Array.isArray(row.raffle_numbers)
        ? row.raffle_numbers
        : typeof row.raffle_numbers === "string"
        ? JSON.parse(row.raffle_numbers)
        : [],
    }));

    setRegistrations(normalizedTickets);

    // Initialize last attendance tracking
    normalizedTickets.forEach((t) => {
      lastAttendanceStatus.current[t.id] = t.attendance_present;
      setShowSuccess((prev) => ({ ...prev, [t.id]: false }));
    });
  };

  // Poll each ticket individually for attendance changes
  useEffect(() => {
    if (registrations.length === 0) return;

    const interval = setInterval(async () => {
      const updatedTickets = await Promise.all(
        registrations.map(async (reg) => {
          const { data, error } = await supabase
            .from("registrations")
            .select("*")
            .eq("id", reg.id)
            .single();

          if (error || !data) return reg;

          const normalized: Registration = {
            ...data,
            raffle_numbers: Array.isArray(data.raffle_numbers)
              ? data.raffle_numbers
              : typeof data.raffle_numbers === "string"
              ? JSON.parse(data.raffle_numbers)
              : [],
          };

          if (
            normalized.attendance_present &&
            !lastAttendanceStatus.current[normalized.id]
          ) {
            lastAttendanceStatus.current[normalized.id] = true;
            setShowSuccess((prev) => ({ ...prev, [normalized.id]: true }));
            toast.success(
              `🎉 Attendance marked for ticket ${normalized.raffle_numbers.join(
                ", "
              )}`
            );

            // Hide success after 7 seconds
            setTimeout(() => {
              setShowSuccess((prev) => ({ ...prev, [normalized.id]: false }));
            }, 7000);
          }

          return normalized;
        })
      );

      setRegistrations(updatedTickets);
    }, 1000);

    return () => clearInterval(interval);
  }, [registrations]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen flex flex-col items-center justify-center p-6 gap-6"
    >
      {/* Background image */}
      <Image
        src="/file.svg"
        alt="Church background"
        width={1920}
        height={1080}
        className="fixed inset-0 w-full h-full object-cover opacity-30 -z-10"
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 -z-10"></div>

      {/* Input card */}
      {registrations.length === 0 && (
        <Card className="relative z-10 w-full max-w-md mx-auto bg-black/50 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl text-gray-100">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              View Your Ticket
            </CardTitle>
            <p className="text-gray-300 mt-2">
              Enter your phone number to view your tickets
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
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
            <div className="flex justify-center mt-6">
              <Button
                onClick={handleLogin}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-full px-8 py-3 text-lg font-semibold shadow-lg transform transition-all duration-300 hover:scale-105"
              >
                View Tickets
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Display each ticket */}
      {registrations.map((reg) => (
        <Card
          key={reg.id}
          className="relative z-10 w-full max-w-md mx-auto bg-black/50 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl text-gray-100"
        >
          <CardContent className="text-center py-6 space-y-6">
            <h1 className="text-3xl font-bold text-gray-100">
              🎟️ Ticket Details
            </h1>

            {/* Status Banner */}
            <div
              className={`p-4 rounded-xl font-semibold text-lg shadow-md ${
                reg.attendance_present
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {reg.attendance_present
                ? `✅ Attendance marked at ${
                    reg.attendance_time
                      ? new Date(reg.attendance_time).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Unknown time"
                  }`
                : "⚠️ Attendance not registered yet. Please show the QR code to the event staff."}
            </div>

            {/* QR Code or Success Check */}
            {!reg.attendance_present ? (
              <div className="p-4 bg-white border border-white/20 rounded-xl inline-block shadow-lg">
                <QRCode
                  value={`https://project-nehemiah.vercel.app/api/mark-attendance?id=${reg.id}`}
                  size={200}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <CheckCircle className="w-20 h-20 text-green-400 mb-2" />
                <p className="text-green-400 text-xl font-bold">
                  Attendance Registered
                </p>
              </div>
            )}

            {/* Ticket Info */}
            <div className="relative mt-6 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl border border-slate-700 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.15),transparent_60%)]"></div>

              <p className="relative text-center text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-lg tracking-wide">
                {reg.name}
              </p>

              <div className="relative mt-6 flex flex-col gap-6">
                <div className="flex flex-col items-center justify-center bg-slate-800/60 rounded-xl py-5 backdrop-blur-md border border-slate-700 hover:border-cyan-400 transition">
                  <p className="text-gray-400 text-sm uppercase tracking-widest">
                    Total Tickets
                  </p>
                  <p className="text-3xl font-bold text-cyan-400 mt-1 drop-shadow-md">
                    {reg.ticket_count}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center bg-slate-800/60 rounded-xl py-5 backdrop-blur-md border border-slate-700 hover:border-cyan-400 transition">
                  <p className="text-gray-400 text-sm uppercase tracking-widest">
                    Ticket Numbers
                  </p>
                  <p className="text-2xl font-semibold text-cyan-300 mt-1 text-center leading-relaxed break-words">
                    {reg.raffle_numbers.length > 0
                      ? reg.raffle_numbers.join(", ")
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* 🎉 Success Overlay */}
            <AnimatePresence>
              {showSuccess[reg.id] && (
                <motion.div
                  className="fixed inset-0 flex flex-col items-center justify-center bg-black/80 z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Confetti numberOfPieces={250} recycle={false} />
                  <motion.div
                    className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                  >
                    <motion.div
                      className="text-green-500 text-6xl mb-4"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      ✅
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-2">
                      Attendance Registered!
                    </h2>
                    <p className="text-gray-600">
                      Thanks for coming. Please enjoy the concert 🎉
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}
