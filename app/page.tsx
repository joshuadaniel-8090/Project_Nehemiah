"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronRight,
  Upload,
  CheckCircle,
  ArrowLeft,
  QrCode,
  Camera,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import QRCode from "react-qr-code";
import { Analytics } from "@vercel/analytics/next";

interface FormData {
  name: string;
  phone: string;
  email: string;
  paymentScreenshot: File | null;
  ticketCount: number;
}

export default function RegistrationPage() {
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    paymentScreenshot: null,
    ticketCount: 1,
  });
  const [ticketsRemaining, setTicketsRemaining] = useState(250);
  const TICKET_PRICE = 20;

  // Fetch remaining tickets on component mount
  useEffect(() => {
    fetchRemainingTickets();
  }, []);

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
      setTicketsRemaining(Math.max(0, 250 - totalSold));
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ""))) {
      toast.error("Please enter a valid 10-digit phone number");
      return false;
    }

    if (formData.ticketCount > ticketsRemaining) {
      toast.error(`Only ${ticketsRemaining} tickets remaining!`);
      return false;
    }

    if (
      typeof formData.ticketCount !== "number" ||
      formData.ticketCount < 1 ||
      formData.ticketCount > 10
    ) {
      toast.error("Please select between 1 and 10 tickets");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setShowPaymentPage(true);
    }
  };

  const handleBack = () => {
    setShowPaymentPage(false);
  };

  const uploadScreenshot = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = fileName;

      const { error } = await supabase.storage
        .from("payment-screenshots")
        .upload(filePath, file);

      if (error) {
        console.error("Upload error:", error);
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("payment-screenshots").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!formData.paymentScreenshot) {
      toast.error("Please upload a payment screenshot");
      return;
    }

    setIsLoading(true);

    try {
      const screenshotUrl = await uploadScreenshot(formData.paymentScreenshot);

      if (!screenshotUrl) {
        toast.error("Failed to upload screenshot. Please try again.");
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.from("registrations").insert({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        payment_screenshot_url: screenshotUrl,
        ticket_count: formData.ticketCount,
        status: "pending",
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Registration error:", error);
        toast.error("Failed to submit registration. Please try again.");
        setIsLoading(false);
        return;
      }

      setIsSubmitted(true);
      toast.success("Registration submitted successfully!");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const openUPILink = () => {
    const amount = formData.ticketCount * TICKET_PRICE;
    const upiLink = `upi://pay?pa=jjoshuadaniel1234@oksbi&pn=Event Registration&am=${amount}&cu=INR&tn=Event Registration Payment of ${amount}`;
    window.open(upiLink, "_blank");
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardContent className="text-center p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Registration Received!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for registering. You will receive an acknowledgment
              through WhatsApp.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Register Another Person
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Analytics />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  !showPaymentPage
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                1
              </div>
              <div
                className={`w-8 h-1 ${
                  showPaymentPage ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  showPaymentPage
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                2
              </div>
            </div>
          </div>

          {/* Form Container */}
          {!showPaymentPage ? (
            // Personal Details Page
            <Card className="shadow-lg">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Event Registration
                </CardTitle>
                <p className="text-gray-600">
                  {ticketsRemaining > 0
                    ? `${ticketsRemaining} tickets remaining`
                    : "All tickets sold out!"}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticketCount">Number of Tickets *</Label>
                  <div className="flex items-center">
                    <Input
                      id="ticketCount"
                      type="number"
                      min={1}
                      max={Math.min(10, ticketsRemaining)}
                      value={formData.ticketCount}
                      onChange={(e) => {
                        const value = Math.max(
                          1,
                          Math.min(
                            Math.min(10, ticketsRemaining),
                            Number(e.target.value) || 1
                          )
                        );
                        handleInputChange("ticketCount", value);
                      }}
                      className="w-full h-12 mx-2"
                    />
                    <Button
                      onClick={() => {
                        if (formData.ticketCount > 1) {
                          handleInputChange(
                            "ticketCount",
                            formData.ticketCount - 1
                          );
                        }
                      }}
                      className="h-12 mr-4 w-12 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
                      disabled={formData.ticketCount <= 1}
                    >
                      <Minus className="h-5 w-5" />
                    </Button>

                    <Button
                      onClick={() => {
                        if (
                          formData.ticketCount < Math.min(10, ticketsRemaining)
                        ) {
                          handleInputChange(
                            "ticketCount",
                            formData.ticketCount + 1
                          );
                        } else {
                          toast.info(
                            ticketsRemaining <= 0
                              ? "All tickets are sold out"
                              : `Only ${ticketsRemaining} tickets remaining`
                          );
                        }
                      }}
                      className="h-12 px-4 w-12 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
                      disabled={
                        formData.ticketCount >= Math.min(10, ticketsRemaining)
                      }
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {ticketsRemaining > 0
                      ? `You can buy up to ${Math.min(
                          10,
                          ticketsRemaining
                        )} tickets at once.`
                      : "All tickets have been sold."}
                  </p>
                </div>

                <Button
                  onClick={handleNext}
                  className="w-full h-12 text-lg"
                  disabled={ticketsRemaining <= 0}
                >
                  Next
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Payment Page
            <Card className="shadow-lg">
              <CardHeader className="text-center pb-4">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="absolute p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Payment
                </CardTitle>
                <p className="text-gray-600">Complete your registration</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* QR Code Section */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">
                    Scan to Pay ₹{formData.ticketCount * TICKET_PRICE}
                  </h3>
                  <div className="w-32 h-32 mx-auto">
                    <QRCode
                      value={`upi://pay?pa=jjoshuadaniel1234@oksbi&pn=Event Registration&am=${
                        formData.ticketCount * TICKET_PRICE
                      }&cu=INR&tn=Event Registration Payment of ${
                        formData.ticketCount * TICKET_PRICE
                      }`}
                      size={128}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Registration Fee: ₹{TICKET_PRICE} per ticket (Total: ₹
                  {formData.ticketCount * TICKET_PRICE})
                </p>

                {/* UPI Link Button */}
                <Button
                  onClick={openUPILink}
                  variant="outline"
                  className="w-full h-12 text-green-600 border-green-600 hover:bg-green-50"
                >
                  Pay with UPI App
                </Button>
                {/* File Upload */}
                <div className="flex items-center space-x-2">
                  <Input
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileChange(e.target.files?.[0] || null)
                    }
                    className="h-12 w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <Button
                    onClick={() => {
                      const input = document.getElementById(
                        "screenshot"
                      ) as HTMLInputElement;
                      input.capture = "environment";
                      input.click();
                    }}
                    className="h-12 w-12 text-gray-400 bg-whit rounded-full"
                  >
                    <Camera className="w-12 h-12 text-gray-400" />
                  </Button>
                </div>
                {formData.paymentScreenshot && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {formData.paymentScreenshot.name}
                  </p>
                )}
                {formData.paymentScreenshot && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      Preview your payment screenshot:
                    </p>
                    <div className="flex justify-center mt-2">
                      <Image
                        src={URL.createObjectURL(formData.paymentScreenshot)}
                        width={200}
                        height={200}
                        alt="Payment Screenshot Preview"
                        className="max-w-xs max-h-64 border rounded-lg shadow-md"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !formData.paymentScreenshot}
                  className="w-full h-12 text-lg"
                >
                  {isLoading ? "Submitting..." : "Complete Registration"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
