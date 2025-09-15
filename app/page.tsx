"use client";

import { motion } from "framer-motion";
import RegistrationForm from "@/components/RegistrationForm";
import { MapPin, Calendar, Clock, ChevronsDown } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

export default function ProjectNehemiahLanding() {
  const detailsRef = useRef<HTMLDivElement | null>(null);

  const scrollToDetails = () => {
    detailsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Global Background */}
      <Image
        src="/file.svg"
        alt="Church background"
        width={1920}
        height={1080}
        className="fixed inset-0 w-full h-full object-cover opacity-30 -z-10"
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 -z-10"></div>

      {/* Hero Section */}
      <div className="h-screen flex items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="px-6"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-lg md:text-xl text-cyan-300 tracking-widest uppercase mb-4"
          >
            Faith • Hope • Unity
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-lg"
          >
            Project Nehemiah
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="mt-6 text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed"
          >
            A divine mission to establish a Christian church by securing a
            building in a rural community bringing faith, hope and God’s love to
            those who need it most.
          </motion.p>
        </motion.div>
        <motion.button
          onClick={scrollToDetails}
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute lg:top-[65rem] top-[45rem] text-cyan-400 hover:text-cyan-300"
        >
          <ChevronsDown className="w-10 h-10" />
        </motion.button>
      </div>

      {/* Why This Project Matters */}
      <section ref={detailsRef} className="py-10 px-6 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative max-w-5xl w-full text-center rounded-3xl border border-white/20 
          bg-black/40 backdrop-blur-lg shadow-2xl overflow-hidden p-12"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-6">
            Why{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Project Nehemiah
            </span>
            ?
          </h2>
          <div className="mx-auto w-24 h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 rounded-full mb-8"></div>

          <p className="text-lg md:text-xl text-gray-200/90 leading-relaxed tracking-wide bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-lg">
            Many families in rural communities have no proper place to worship
            God.{" "}
            <span className="text-cyan-300 font-semibold">
              Project Nehemiah is not just about buying a building
            </span>
            ; it’s about transforming it into a house of prayer, a center of
            hope, unity and faith. Together, we can secure a sacred space where
            generations will gather to worship, grow and encounter God.
          </p>

          <motion.blockquote
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 1 }}
            className="mt-10 italic text-gray-300 text-lg md:text-xl font-light"
          >
            “So we built the wall and the entire wall was joined together up to
            half its height, for the people had a mind to work.”{" "}
            <span className="text-cyan-400 font-semibold">- Nehemiah 4:6</span>
          </motion.blockquote>
        </motion.div>
      </section>

      {/* Event Details */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row items-stretch justify-between 
    bg-black/40 backdrop-blur-lg rounded-3xl shadow-xl p-10 border border-white/20"
        >
          {/* Location */}
          <div className="flex-1 text-center">
            <MapPin className="mx-auto w-8 h-8 text-cyan-400 mb-2" />
            <h3 className="text-2xl font-bold text-cyan-400">Location</h3>
            <p className="mt-3 lg:w-[21rem] -ml-4 text-center text-gray-200 text-lg leading-relaxed">
              <span className="whitespace-nowrap">
                St. Thomas Mount International Center,
              </span>
              <br />
              St. Thomas Mount Hill Top, Chennai
            </p>
            <div className="my-3">
              <a
                href="https://maps.app.goo.gl/JXyBR5YQRNqb46JF6"
                className="my-8"
              >
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-md px-4">
                  Open in Maps
                </Button>
              </a>
            </div>
            {/* <div className="flex items-center justify-center mt-8">
              <a href="https://maps.app.goo.gl/JXyBR5YQRNqb46JF6">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-md px-4 mb-4">
                  Open in Maps
                </Button>
              </a>
            </div> */}
          </div>

          <div className="hidden md:flex items-center">
            <div className="w-px h-20 bg-gradient-to-b from-cyan-400 via-white to-cyan-400 animate-pulse mx-6 rounded-full"></div>
          </div>

          {/* Date */}
          <div className="flex-1 text-center">
            <Calendar className="mx-auto w-8 h-8 text-cyan-400 mb-2" />
            <h3 className="text-2xl font-bold text-cyan-400">Date</h3>
            <p className="mt-3 text-gray-200 text-lg leading-relaxed">
              October 12, 2025
            </p>
            <p className="text-gray-200 text-lg leading-relaxed">Sunday</p>
          </div>

          <div className="hidden md:flex items-center">
            <div className="w-px h-20 bg-gradient-to-b from-cyan-400 via-white to-cyan-400 animate-pulse mx-6 rounded-full"></div>
          </div>

          {/* Time */}
          <div className="flex-1 text-center">
            <Clock className="mx-auto w-8 h-8 text-cyan-400 mb-2" />
            <h3 className="text-2xl font-bold text-cyan-400">Time</h3>
            <p className="mt-3 text-gray-200 text-lg leading-relaxed">
              6:00 PM
            </p>
          </div>
        </motion.div>
      </section>

      {/* Call to Action */}
      <section className="py-10 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto bg-black/40 border border-white/20 backdrop-blur-lg px-10 py-14 rounded-3xl shadow-2xl"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
            Join the Mission
          </h2>

          <p className="text-lg md:text-xl text-gray-200 leading-relaxed tracking-wide">
            Be part of this{" "}
            <span className="text-cyan-300 font-semibold">divine journey</span>.
            Your support will help us secure and dedicate a building as a church
            a place for prayer, worship and peace, bringing hope and faith to
            generations yet to come.
          </p>
        </motion.div>
      </section>
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl mx-auto mb-32 px-6"
      >
        <RegistrationForm />
      </motion.section>
      {/* Footer */}
      <footer className="bg-black/80 py-6 text-center text-sm text-gray-500">
        Project Nehemiah. | Location: St. Thomas Mount, Chennai. | Event Date:
        Oct 12, 2025, | 6 PM.
      </footer>
    </div>
  );
}
