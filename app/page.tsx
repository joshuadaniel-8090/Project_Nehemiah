"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Upload, CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface FormData {
  name: string;
  phone: string;
  email: string;
  paymentScreenshot: File | null;
}

export default function RegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    paymentScreenshot: null,
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
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

    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
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
      // Upload screenshot
      const screenshotUrl = await uploadScreenshot(formData.paymentScreenshot);

      if (!screenshotUrl) {
        toast.error("Failed to upload screenshot. Please try again.");
        setIsLoading(false);
        return;
      }

      // Save registration
      const { error } = await supabase.from("registrations").insert({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        payment_screenshot_url: screenshotUrl,
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
    const upiLink =
      "upi://pay?pa=8072609214@superyes&pn=Event Registration&am=20&cu=INR&tn=Event Registration Payment";
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
              Thank you for registering. Your submission is under review and you&apos;ll be contacted soon.
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            <div
              className={`w-8 h-1 ${
                currentStep >= 2 ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
          </div>
        </div>

        {/* Form Container with Animation */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${(currentStep - 1) * 100}%)` }}
          >
            {/* Step 1: Personal Details */}
            <div className="w-full flex-shrink-0">
              <Card className="shadow-lg">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Event Registration
                  </CardTitle>
                  <p className="text-gray-600">
                    Enter your details to continue
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
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="h-12"
                    />
                  </div>

                  <Button onClick={handleNext} className="w-full h-12 text-lg">
                    Next
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Step 2: Payment */}
            <div className="w-full flex-shrink-0">
              <Card className="shadow-lg">
                <CardHeader className="text-center pb-4">
                  {currentStep === 2 && (
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      className="absolute left-4 top-4 p-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Payment
                  </CardTitle>
                  <p className="text-gray-600">Complete your registration</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* QR Code Section */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">
                      Scan to Pay ₹500
                    </h3>
                    <Image
                      src="/qr-code.png"
                      alt="GPay QR Code"
                      width={128}
                      height={128}
                      className="w-32 h-32 mx-auto"
                      priority
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Registration Fee: ₹20
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
                  <div className="space-y-2">
                    <Label htmlFor="screenshot">
                      Upload Payment Screenshot *
                    </Label>
                    <div className="relative">
                      <Input
                        id="screenshot"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileChange(e.target.files?.[0] || null)
                        }
                        className="h-12 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <Upload className="absolute right-3 top-3 w-6 h-6 text-gray-400" />
                    </div>
                    {formData.paymentScreenshot && (
                      <p className="text-sm text-green-600">
                        ✓ {formData.paymentScreenshot.name}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !formData.paymentScreenshot}
                    className="w-full h-12 text-lg"
                  >
                    {isLoading ? "Submitting..." : "Complete Registration"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
