"use client";

import { useEffect, useState } from "react";
import { supabase, Registration } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
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
import { Copy, Eye, RefreshCw, X, MessageCircle, Search } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searchName, setSearchName] = useState("");
  const [searchRaffleNumber, setSearchRaffleNumber] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "status">("date");

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
      let query = supabase.from("registrations").select("*");

      if (sortBy === "date") {
        query = query.order("created_at", { ascending: false });
      } else {
        query = query
          .order("status", { ascending: true })
          .order("created_at", { ascending: false });
      }

      const { data, error } = await query;

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

  const handleVerify = async (registration: Registration) => {
    if (registration.status === "verified") return;

    try {
      // 1. Get the highest existing raffle number
      const { data: maxNumberData, error: maxError } = await supabase
        .from("registrations")
        .select("raffle_numbers")
        .not("raffle_numbers", "is", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (maxError) throw maxError;

      // 2. Determine starting number
      let nextNumber = 1;
      if (maxNumberData && maxNumberData.length > 0) {
        const lastNumbers = maxNumberData[0].raffle_numbers;
        const lastNumber = parseInt(lastNumbers.split("#").pop() || "0");
        nextNumber = Math.min(lastNumber + 1, 250);
      }

      // 3. Generate sequential numbers
      const numbers = [];
      for (let i = 0; i < registration.ticket_count; i++) {
        if (nextNumber > 250) {
          toast.error("Reached maximum raffle numbers (250)");
          return;
        }
        numbers.push(`#${nextNumber.toString().padStart(3, "0")}`);
        nextNumber++;
      }

      // 4. Update registration
      const { error } = await supabase
        .from("registrations")
        .update({
          status: "verified",
          raffle_numbers: numbers.join(", "),
          updated_at: new Date().toISOString(),
        })
        .eq("id", registration.id);

      if (error) throw error;

      toast.success(`Assigned numbers: ${numbers.join(", ")}`);
      fetchRegistrations();
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Failed to verify registration");
    }
  };

  const copyWhatsAppMessage = (registration: Registration) => {
    if (!registration.raffle_numbers || registration.status !== "verified") {
      toast.error("Please verify first");
      return;
    }

    const message = `Hey ${registration.name}, your registration for ${
      registration.ticket_count || 1
    } ticket(s) is verified! 🎉 Your raffle numbers are: ${
      registration.raffle_numbers
    }. Thanks for participating!`;

    navigator.clipboard
      .writeText(message)
      .then(() => toast.success("Message copied!"))
      .catch(() => toast.error("Failed to copy"));
  };

  const openWhatsAppChat = (registration: Registration) => {
    const phone = String(registration.phone || "").replace(/\D/g, "");
    window.open(`https://wa.me/91${phone}`, "_blank");
  };

  const openImage = (url: string) => {
    setPreviewUrl(url);
  };

  const closeImage = () => {
    setPreviewUrl(null);
  };

  const filteredRegistrations = registrations.filter((registration) => {
    // Filter by name
    const nameMatch = searchName
      ? registration.name.toLowerCase().includes(searchName.toLowerCase())
      : true;

    // Filter by raffle number
    let raffleMatch = true;
    if (searchRaffleNumber) {
      if (!registration.raffle_numbers) {
        raffleMatch = false;
      } else {
        // Remove # and leading zeros for more flexible searching
        const cleanSearch = searchRaffleNumber
          .replace(/#/g, "")
          .replace(/^0+/, "");

        const cleanRaffleNumbers = registration.raffle_numbers
          .split(", ")
          .map((num) => num.replace(/#/g, "").replace(/^0+/, ""));

        raffleMatch = cleanRaffleNumbers.some((num) =>
          num.includes(cleanSearch)
        );
      }
    }

    return nameMatch && raffleMatch;
  });

  const ticketSold = filteredRegistrations.reduce(
    (acc, r) => acc + (r.ticket_count || 0),
    0
  );
  const ticketRemaining = 250 - ticketSold;

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
    <div className="minh-screen md:mx-auto bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/">
              <Button variant="ghost" className="text-gray-600 bg-white">
                Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Manage event registrations</p>
          </div>
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />

            <Input
              type="text"
              placeholder="Search by name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-64"
            />

            <Input
              type="text"
              placeholder="Search by raffle number (e.g., #001)"
              value={searchRaffleNumber}
              onChange={(e) => setSearchRaffleNumber(e.target.value)}
              className="w-64"
            />

            <Button onClick={fetchRegistrations} disabled={isLoading}>
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Sorting Buttons */}
        <div className="flex">
          <div className="my-4 flex items-center">
            <Button
              variant={sortBy === "status" ? "default" : "outline"}
              onClick={() => {
                setSortBy("status");
                fetchRegistrations();
              }}
            >
              Sort by Status
            </Button>
          </div>

          <div className="flex justify-end items-center space-x-4 ml-auto">
            <Button>Total Raffle Ticket Sold - {ticketSold}</Button>
            <Button>Total Raffle Ticket Remaining - {ticketRemaining}</Button>
          </div>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Registrations ({filteredRegistrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading registrations...</p>
            </div>
          ) : filteredRegistrations.length === 0 ? (
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
                    <TableHead>Tickets</TableHead>
                    <TableHead>Raffle Numbers</TableHead>
                    <TableHead>Screenshot</TableHead>
                    <TableHead>Verify</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">
                        {registration.name}
                      </TableCell>
                      <TableCell>{registration.phone}</TableCell>
                      <TableCell>{registration.email}</TableCell>
                      <TableCell className="text-center">
                        {registration.ticket_count || 1}
                      </TableCell>
                      <TableCell>
                        {registration.raffle_numbers ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {registration.raffle_numbers
                              .split(", ")
                              .filter(Boolean)
                              .map((num, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {num}
                                </Badge>
                              ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </TableCell>
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
                        {new Date(registration.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyWhatsAppMessage(registration)}
                          disabled={
                            !registration.raffle_numbers ||
                            registration.status !== "verified"
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => openWhatsAppChat(registration)}
                          disabled={!registration.phone}
                          aria-label="Open WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
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
  );
}
