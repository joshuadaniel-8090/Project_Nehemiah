"use client";

import { useEffect, useState } from "react";
import { supabase, Registration } from "@/lib/supabase";
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
import { Copy, RefreshCw, MessageCircle, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { toPng } from "html-to-image";

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchRaffleNumber, setSearchRaffleNumber] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "status">("date");

  const ADMIN_PASSWORD = "#Admin@123";

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
      const { data: allTickets, error: lastError } = await supabase
        .from("registrations")
        .select("raffle_numbers");

      if (lastError) throw lastError;

      let lastNumber = 0;
      if (allTickets && allTickets.length > 0) {
        lastNumber = Math.max(
          ...allTickets.flatMap((row) => {
            if (!row.raffle_numbers) return [0];
            const arr = Array.isArray(row.raffle_numbers)
              ? row.raffle_numbers
              : String(row.raffle_numbers).split(", ");
            return arr.map((n: any) => parseInt(n, 10) || 0);
          })
        );
      }

      const ticketCount = registration.ticket_count || 1;
      const newTickets = Array.from(
        { length: ticketCount },
        (_, i) => lastNumber + i + 1
      ).map((n) => n.toString().padStart(3, "0"));

      const { error: updateError } = await supabase
        .from("registrations")
        .update({
          status: "verified",
          raffle_numbers: newTickets,
          updated_at: new Date().toISOString(),
        })
        .eq("id", registration.id);

      if (updateError) throw updateError;

      toast.success(
        `Assigned raffle numbers: ${newTickets.map((n) => `#${n}`).join(", ")}`
      );
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

    const message = `🎉 *Registration Verified!* 🎉

Hey *${registration.name}*,

Your registration for *${
      registration.ticket_count || 1
    }* ticket(s) has been successfully verified. ✅

🎟️ *Ticket Numbers:* ${
      Array.isArray(registration.raffle_numbers)
        ? registration.raffle_numbers.join(", ")
        : registration.raffle_numbers
    }

✨ Thanks for participating in *Project Nehemiah*!  
You can view your tickets here:  
🔗 https://project-nehemiah.vercel.app/view-ticket`;

    navigator.clipboard
      .writeText(message)
      .then(() => toast.success("Message copied!"))
      .catch(() => toast.error("Failed to copy"));
  };

  const openWhatsAppChat = (registration: Registration) => {
    const phone = String(registration.phone || "").replace(/\D/g, "");
    window.open(`https://wa.me/91${phone}`, "_blank");
  };

  const downloadAckImage = async (registration: Registration) => {
    if (!registration.raffle_numbers || registration.status !== "verified") {
      toast.error("Please verify first");
      return;
    }

    const node = document.getElementById(`ack-${registration.id}`);
    if (!node) return;

    try {
      const scale = 2; // make image sharper
      const dataUrl = await toPng(node, {
        cacheBust: true,
        width: node.scrollWidth * scale,
        height: node.scrollHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${node.scrollWidth}px`,
          height: `${node.scrollHeight}px`,
        },
      });

      const link = document.createElement("a");
      link.download = `${registration.name}-acknowledgement.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Acknowledgement image downloaded!");
    } catch (err) {
      console.error("Ack error:", err);
      toast.error("Failed to generate acknowledgement");
    }
  };

  const filteredRegistrations = registrations.filter((registration) => {
    const nameMatch = searchName
      ? registration.name?.toLowerCase().includes(searchName.toLowerCase())
      : true;

    let raffleMatch = true;
    if (searchRaffleNumber) {
      if (!registration.raffle_numbers) {
        raffleMatch = false;
      } else {
        const raffleArray = Array.isArray(registration.raffle_numbers)
          ? registration.raffle_numbers
          : String(registration.raffle_numbers)
              .split(",")
              .map((num) => num.trim())
              .filter(Boolean);

        const cleanSearch = String(searchRaffleNumber)
          .replace(/#/g, "")
          .replace(/^0+/, "");

        const cleanRaffleNumbers = raffleArray.map((num) =>
          String(num).replace(/#/g, "").replace(/^0+/, "")
        );

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
                    <TableHead>UPI Name</TableHead>
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
                            {(Array.isArray(registration.raffle_numbers)
                              ? registration.raffle_numbers
                              : String(registration.raffle_numbers).split(", ")
                            )
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
                        {registration.upi_name ? (
                          <span className="text-gray-800">
                            {registration.upi_name}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
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
                        <span className="font-bold text-red-500">
                          {new Date(registration.created_at).toLocaleString(
                            "en-IN",
                            {
                              timeZone: "Asia/Kolkata", // convert to IST
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false, // 24-hour format, set true if you want AM/PM
                            }
                          )}
                        </span>
                      </TableCell>

                      <TableCell className="space-x-2">
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
                          onClick={() => openWhatsAppChat(registration)}
                          disabled={!registration.phone}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadAckImage(registration)}
                          disabled={
                            !registration.raffle_numbers ||
                            registration.status !== "verified"
                          }
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>

                      {/* hidden but still renderable acknowledgement */}
                      <td
                        style={{
                          position: "absolute",
                          left: "-9999px",
                          top: "0",
                        }}
                      >
                        <div
                          id={`ack-${registration.id}`}
                          style={{
                            width: "600px",
                            height: "600px",
                            padding: "24px",
                            backgroundColor: "#fff",
                            border: "2px solid #000",
                            borderRadius: "12px",
                            fontFamily: "sans-serif",
                          }}
                        >
                          <h1
                            style={{
                              fontSize: "32px",
                              marginBottom: "140px",
                              textAlign: "center",
                              fontWeight: "bold",
                              color: "#0ea5e9",
                              textDecoration: "underline",
                              textUnderlineOffset: "8px",
                              textDecorationThickness: "4px",
                              textDecorationColor: "#22d3ee",
                            }}
                          >
                            🎟️ Event Ticket Acknowledgement
                          </h1>
                          <h2
                            style={{
                              fontSize: "24px",
                              fontWeight: "bold",
                              textAlign: "center",
                              color: "#22d3ee",
                              marginBottom: "20px",
                            }}
                          >
                            {registration.name}
                          </h2>
                          <p
                            style={{
                              textAlign: "center",
                              marginTop: "8px",
                              fontSize: "18px",
                            }}
                          >
                            Tickets Purchased:{" "}
                            <span
                              style={{ color: "#22d3ee", fontWeight: "bold" }}
                            >
                              {registration.ticket_count}
                            </span>
                          </p>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fill, minmax(100px, 1fr))",
                              gap: "12px",
                              marginTop: "20px",
                              justifyContent: "center",
                              textAlign: "center",
                            }}
                          >
                            {(Array.isArray(registration.raffle_numbers)
                              ? registration.raffle_numbers
                              : String(registration.raffle_numbers).split(", ")
                            )
                              .filter(Boolean)
                              .map((num, i) => (
                                <div
                                  key={i}
                                  style={{
                                    padding: "12px",
                                    border: "1px solid #ccc",
                                    borderRadius: "6px",
                                    textAlign: "center",
                                    fontSize: "20px",
                                    fontWeight: "600",
                                    background: "#f9f9f9",
                                  }}
                                >
                                  {num}
                                </div>
                              ))}
                          </div>
                          <p
                            style={{
                              textAlign: "center",
                              marginTop: "160px",
                              fontSize: "18px",
                              fontStyle: "italic",
                              color: "#555",
                              letterSpacing: "2px",
                              lineHeight: "1.2",
                            }}
                          >
                            Thanks for being a part of this event!
                          </p>
                        </div>
                      </td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
