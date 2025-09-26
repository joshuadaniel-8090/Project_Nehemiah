"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import QRCode from "react-qr-code";

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
      .single();

    if (error) {
      setError(`Database error: ${error.message}`);
      return;
    }
    if (!data) {
      setError("No registration found for this phone number.");
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

    // Automatically mark attendance
    markAttendance(normalizedData.id);
  };

  // Poll registration every 1 second to auto-refresh attendance
  useEffect(() => {
    if (!registration) return;

    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("id", registration.id)
        .single();

      if (!error && data) {
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

  // Real-time subscription for attendance updates (optional)
  useEffect(() => {
    if (!registration) return;

    const channel = supabase
      .channel(`attendance-${registration.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "registrations",
          filter: `id=eq.${registration.id}`,
        },
        (payload) => {
          setRegistration((prev) =>
            prev ? { ...prev, ...payload.new } : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [registration?.id]);

  // Call API to mark attendance
  const markAttendance = async (id: number) => {
    try {
      const res = await fetch(`/api/mark-attendance?id=${id}`, {
        method: "GET",
      });
      if (!res.ok) {
        setError("Failed to mark attendance");
      }
      // UI will auto-update via polling or real-time subscription
    } catch (err) {
      setError("Network error while marking attendance");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      {!registration ? (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-center">Event Check-in</h1>
          <input
            type="text"
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            View Ticket
          </button>
          {error && <p className="text-red-500 text-center">{error}</p>}
        </div>
      ) : (
        <div className="space-y-6 text-center">
          <h1 className="text-2xl font-bold">🎟️ Your Ticket</h1>

          {/* QR Code */}
          {!registration.attendance_present ? (
            <QRCode
              value={`https://project-nehemiah.vercel.app/api/mark-attendance?id=${registration.id}`}
              size={180}
            />
          ) : (
            <p className="text-green-600 text-xl font-bold">
              ✅ Attendance Registered
            </p>
          )}

          {/* Ticket Info */}
          <div className="mt-4 space-y-2">
            <p className="text-lg font-semibold">{registration.name}</p>
            <p>
              Tickets:{" "}
              <span className="font-bold">{registration.ticket_count}</span>
            </p>
            <p>Ticket Numbers: {registration.raffle_numbers.join(", ")}</p>
          </div>

          {/* Banner */}
          <div
            className={`p-3 rounded font-semibold ${
              registration.attendance_present
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {registration.attendance_present
              ? `Attendance marked at ${registration.attendance_time}`
              : "⚠️ Attendance not registered yet"}
          </div>
        </div>
      )}
    </div>
  );
}
