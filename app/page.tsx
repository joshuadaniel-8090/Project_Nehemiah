"use client";

import { motion } from "framer-motion";
import RegistrationForm from "@/components/RegistrationForm";
import { MapPin, Calendar, Clock, ChevronsDown } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Analytics } from "@vercel/analytics/next";
import { useRouter } from "next/navigation";

export default function ProjectNehemiahLanding() {
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const scrollToDetails = () => {
    detailsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Analytics />
    </>
  );
}
