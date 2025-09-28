"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronRight,
  CheckCircle,
  ArrowLeft,
  Plus,
  Minus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import QRCode from "react-qr-code";
import { motion } from "framer-motion";

interface FormData {
  name: string;
  phone: string;
  email: string;
  paymentScreenshot: File | null;
  ticketCount: number;
  upiName: string;
}

const MAX_TICKETS = 250;
const TICKET_PRICE = 500;

export default function RegistrationForm() {
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    paymentScreenshot: null,
    upiName: "",
    ticketCount: 1,
  });
  const [ticketsRemaining, setTicketsRemaining] = useState(MAX_TICKETS);
  const [showUPIAlert, setShowUPIAlert] = useState(false);

  useEffect(() => {
    const fetchRemainingTickets = async () => {
      try {
        const { data, error } = await supabase
          .from("registrations")
          .select("ticket_count");
        if (error) throw error;
        const totalSold = data.reduce(
          (sum, reg) => sum + (reg.ticket_count || 0),
          0
        );
        setTicketsRemaining(Math.max(0, MAX_TICKETS - totalSold));
      } catch (err) {
        console.error("Error fetching tickets:", err);
      }
    };
    fetchRemainingTickets();
  }, []);

  useEffect(() => {
    if (showPaymentPage) {
      setShowUPIAlert(true);
    }
  }, [showPaymentPage]);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, paymentScreenshot: file }));
  };

  const validateStep1 = () => {
    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.email.trim()
    ) {
      toast.error("Please fill in all required fields");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      toast.error("Please enter a valid 10-digit phone number");
      return false;
    }
    if (formData.ticketCount > ticketsRemaining) {
      toast.error(`Only ${ticketsRemaining} tickets remaining!`);
      return false;
    }
    return true;
  };

  const uploadScreenshot = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const { error } = await supabase.storage
        .from("payment-screenshots")
        .upload(fileName, file);
      if (error) return null;
      const { data } = supabase.storage
        .from("payment-screenshots")
        .getPublicUrl(fileName);
      return data.publicUrl;
    } catch {
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!formData.upiName || formData.upiName.trim() === "") {
      toast.error("Please enter your UPI name");
      return;
    }

    setIsLoading(true);

    try {
      let screenshotUrl = null;

      if (formData.paymentScreenshot) {
        screenshotUrl = await uploadScreenshot(formData.paymentScreenshot);
        if (!screenshotUrl) throw new Error("Screenshot upload failed");
      }

      const { error } = await supabase.from("registrations").insert({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        upi_name: formData.upiName,
        payment_screenshot_url: screenshotUrl,
        ticket_count: formData.ticketCount,
        status: "pending",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Registration submitted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const amount = formData.ticketCount * TICKET_PRICE;

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-md mx-auto bg-black/40 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl">
          <CardContent className="text-center p-8">
            <CheckCircle className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-100 mb-2">
              Registration Received!
            </h2>
            <p className="text-gray-300 mb-4">
              Thank you for registering. Your details and payment have been
              submitted successfully.
            </p>
            <p className="text-gray-400 mb-6 text-sm">
              Please note: All registrations are carefully monitored by our
              volunteer team. Your confirmation and raffle number will be sent
              to you on WhatsApp once your payment is verified. This may take a
              little time — we appreciate your patience.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Register Another Person
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-xl mx-auto space-y-8"
    >
      {/* UPI Alert */}
      {showUPIAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/90 border border-cyan-400 rounded-2xl p-6 max-w-sm text-center shadow-xl relative">
            <button
              onClick={() => setShowUPIAlert(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-cyan-400 mb-3">
              Important Note
            </h2>
            <p className="text-gray-200 mb-4">
              Please make sure to enter your{" "}
              <span className="text-cyan-300 font-semibold">UPI Name/ID</span>{" "}
              before submitting the form. This helps us verify your payment
              quickly.
            </p>
            <Button
              onClick={() => setShowUPIAlert(false)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 
               text-white rounded-full px-8 py-3 text-lg font-semibold shadow-lg 
               transform transition-all duration-300 hover:scale-105"
            >
              Got it
            </Button>
          </div>
        </div>
      )}

      {/* Payment Confirmation Popup */}
      {showConfirmPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/90 border border-cyan-400 rounded-2xl p-6 max-w-sm text-center shadow-xl relative">
            <button
              onClick={() => setShowConfirmPopup(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-cyan-400 mb-3">
              Confirm Your Payment
            </h2>
            <p className="text-gray-200 mb-4">
              Did you complete the UPI payment of{" "}
              <span className="text-cyan-300 font-semibold">₹{amount}</span>?
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  setShowConfirmPopup(false);
                  handleSubmit();
                }}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl"
              >
                Yes, I Paid
              </Button>
              <Button
                onClick={() => setShowConfirmPopup(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white rounded-xl"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      {!showPaymentPage ? (
        // Step 1: Registration Details
        <Card className="bg-black/40 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Event Registration
            </CardTitle>
            <p className="text-gray-300 mt-2">
              {ticketsRemaining > 0 ? (
                <>
                  <span className="text-red-500 font-semibold">
                    {ticketsRemaining}
                  </span>{" "}
                  tickets remaining
                </>
              ) : (
                "All tickets sold out!"
              )}
            </p>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-100">
            <div>
              <Label htmlFor="name">
                Full Name <span className="text-cyan-400">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your full name"
                className="bg-black/30 text-gray-100 placeholder-gray-400 border border-white/20 focus:border-cyan-400 focus:ring-0"
              />
            </div>

            <div>
              <Label htmlFor="phone">
                Phone Number <span className="text-cyan-400">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter your phone number"
                className="bg-black/30 text-gray-100 placeholder-gray-400 border border-white/20 focus:border-cyan-400 focus:ring-0"
              />
            </div>

            <div>
              <Label htmlFor="email">
                Email <span className="text-cyan-400">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email address"
                className="bg-black/30 text-gray-100 placeholder-gray-400 border border-white/20 focus:border-cyan-400 focus:ring-0"
              />
            </div>

            <div>
              <Label className="text-gray-100">
                Number of Tickets {""}
                <span className="text-cyan-400">* </span>
                <span className="text-sm font-bold text-gray-400">
                  (₹{TICKET_PRICE} each)
                </span>
              </Label>
              <p className="text-sm text-gray-400">
                Please note that tickets are required for all children
                attending.
              </p>
              <div className="flex items-center space-x-3 mt-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="bg-black/30 border border-white/20 hover:border-cyan-400 rounded-xl"
                  onClick={() =>
                    handleInputChange(
                      "ticketCount",
                      Math.max(1, formData.ticketCount - 1)
                    )
                  }
                >
                  <Minus className="w-5 h-5 text-cyan-400" />
                </Button>

                <Input
                  type="number"
                  value={formData.ticketCount}
                  onChange={(e) =>
                    handleInputChange(
                      "ticketCount",
                      Math.min(10, Number(e.target.value))
                    )
                  }
                  className="w-24 text-center bg-black/30 text-gray-100 placeholder-gray-400 border border-white/20 focus:border-cyan-400 focus:ring-0 rounded-xl"
                  placeholder="1"
                />

                <Button
                  size="icon"
                  variant="ghost"
                  className="bg-black/30 border border-white/20 hover:border-cyan-400 rounded-xl"
                  onClick={() =>
                    handleInputChange(
                      "ticketCount",
                      Math.min(10, formData.ticketCount + 1)
                    )
                  }
                >
                  <Plus className="w-5 h-5 text-cyan-400" />
                </Button>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <Button
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 
               text-white rounded-full px-8 py-3 text-lg font-semibold shadow-lg 
               transform transition-all duration-300 hover:scale-105 flex items-center"
                onClick={() => validateStep1() && setShowPaymentPage(true)}
              >
                Proceed to Pay (₹{formData.ticketCount * TICKET_PRICE})
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Step 2: Payment Page
        <Card className="bg-black/40 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl">
          <CardHeader className="text-center pb-4 relative">
            <Button
              variant="ghost"
              onClick={() => setShowPaymentPage(false)}
              className="absolute left-4 top-4 text-cyan-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg">
              {/* Instructions */}
              <div className="mb-6 text-gray-300 text-left text-sm md:text-base leading-relaxed bg-black/30 border border-white/10 rounded-xl p-4">
                <p className="mb-2 font-medium text-cyan-300">How to Pay</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-200">
                  <li>Take a screenshot of the QR code below.</li>
                  <li>Open your UPI app (PhonePe, Google Pay, Paytm, etc.).</li>
                  <li>
                    Choose{" "}
                    <span className="font-semibold text-cyan-400">
                      “Scan QR”
                    </span>{" "}
                    option.
                  </li>
                  <li>
                    Select{" "}
                    <span className="font-semibold text-cyan-400">
                      “Upload from Gallery”
                    </span>{" "}
                    and pick the screenshot.
                  </li>
                  <li>
                    Confirm and complete the payment of{" "}
                    <span className="font-semibold text-cyan-400">
                      ₹{amount}
                    </span>
                    .
                  </li>
                </ol>
              </div>

              {/* QR Code Section */}
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-200">
                Scan to Pay
                <span className="text-cyan-400"> ₹{amount}</span>
              </h3>

              <div className="p-4 bg-white border border-white rounded-xl">
                <QRCode
                  value={`upi://pay?pa=shajanjacques@oksbi&pn=Event+Registration&am=${amount}&cu=INR&tn=${encodeURIComponent(
                    `Event Registration of ₹${amount}`
                  )}`}
                  size={160}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="upiName"
                className="block text-gray-200 mb-2 font-medium"
              >
                UPI Name <span className="text-cyan-400">*</span>
              </label>
              <Input
                id="upiName"
                type="text"
                value={formData.upiName || ""}
                onChange={(e) => handleInputChange("upiName", e.target.value)}
                placeholder="Enter your UPI account name"
                className="w-full bg-black/30 border border-white/20 text-gray-100 placeholder-gray-400 rounded-xl"
              />
            </div>

            <div className="flex justify-center mt-8">
              <Button
                onClick={() => setShowConfirmPopup(true)}
                disabled={isLoading || !formData.upiName.trim()}
                className={`bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 
      text-white rounded-full px-8 py-3 text-lg font-semibold shadow-lg 
      transform transition-all duration-300 hover:scale-105 flex items-center justify-center ${
        isLoading || !formData.upiName.trim()
          ? "bg-gray-500 cursor-not-allowed"
          : "bg-cyan-500 hover:bg-cyan-600"
      }`}
              >
                {isLoading ? "Submitting..." : "Complete Registration"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
