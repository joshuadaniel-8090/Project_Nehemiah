"use client";

import { useEffect, useState } from "react";
import { supabase, Registration } from "@/lib/supabase";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Simple password protection
  const ADMIN_PASSWORD = "admin123";

  useEffect(() => {
    if (isAuthenticated) {
      fetchRegistrations();
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success("Access granted");
    } else {
      toast.error("Invalid password");
    }
  };

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load registrations");
        return;
      }

      setRegistrations(data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load registrations");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a unique 3-digit raffle number with leading zeros and a "#"
  const generateRaffleNumber = () => {
    const num = Math.floor(Math.random() * 250) + 1; // 1 to 250 inclusive
    return `#${num.toString().padStart(3, "0")}`;
  };

  const handleVerify = async (registration: Registration) => {
    if (registration.status === "verified") return;

    const raffleNumber = generateRaffleNumber();
    const { error } = await supabase
      .from("registrations")
      .update({
        status: "verified",
        raffle_number: raffleNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("id", registration.id);

    if (error) {
      toast.error("Failed to verify registration and assign raffle number");
      return;
    }

    toast.success("Registration verified and raffle number assigned!");
    fetchRegistrations();
  };

  const copyWhatsAppMessage = (registration: Registration) => {
    if (!registration.raffle_number || registration.status !== "verified") {
      toast.error("Please verify and assign a raffle number first");
      return;
    }

    const message = `Hey ${registration.name}, your registration is verified! 🎉 Your raffle number is ${registration.raffle_number}. Thanks for your participation.`;

    navigator.clipboard
      .writeText(message)
      .then(() => {
        toast.success("WhatsApp message copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy message");
      });
  };

  const openImage = (url: string) => {
    setPreviewUrl(url);
  };

  const closeImage = () => {
    setPreviewUrl(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
            <p className="text-gray-600">Enter password to continue</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              className="h-12"
            />
            <Button onClick={handleLogin} className="w-full h-12">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Manage event registrations</p>
          </div>
          <Button onClick={fetchRegistrations} disabled={isLoading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registrations ({registrations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading registrations...</p>
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No registrations found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Screenshot</TableHead>
                      <TableHead>Verify</TableHead>
                      <TableHead>Raffle #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell className="font-medium">
                          {registration.name}
                        </TableCell>
                        <TableCell>{registration.phone}</TableCell>
                        <TableCell>{registration.email}</TableCell>
                        <TableCell>
                          {registration.payment_screenshot_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openImage(registration.payment_screenshot_url!)
                              }
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                        {/* Checkbox for verification */}
                        <TableCell>
                          <Checkbox
                            checked={registration.status === "verified"}
                            disabled={registration.status === "verified"}
                            onCheckedChange={(checked) => {
                              if (checked) handleVerify(registration);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            placeholder="#000"
                            value={registration.raffle_number || ""}
                            readOnly
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              registration.status === "verified"
                                ? "default"
                                : registration.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {registration.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(
                            registration.created_at
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyWhatsAppMessage(registration)}
                            disabled={
                              !registration.raffle_number ||
                              registration.status !== "verified"
                            }
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Preview Modal */}
        {previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-4 shadow-lg max-w-xs w-full flex flex-col items-center relative">
              <Button
                onClick={closeImage}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </Button>
              <Image
                src={previewUrl || ""}
                alt="Payment Screenshot"
                width={384}
                height={384}
                className="max-w-full max-h-96 mb-4 rounded"
                style={{ objectFit: "contain" }}
              />

              <Button onClick={closeImage} className="w-full">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
