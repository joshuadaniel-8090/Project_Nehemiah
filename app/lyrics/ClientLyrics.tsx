"use client";

import { useState } from "react";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import Image from "next/image";

const CustomHeading = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    {...props}
    className="text-2xl md:text-3xl w-full font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 my-6 text-center"
  >
    {props.children}
  </h2>
);

const CustomBold = (props: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    {...props}
    className="font-bold text-xl pb-5 block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 my-6 text-center"
  >
    {props.children}
  </span>
);

export default function ClientLyrics({
  mdxSource,
}: {
  mdxSource: MDXRemoteSerializeResult;
}) {
  const [fontSize, setFontSize] = useState(18);

  const CustomParagraph = (
    props: React.HTMLAttributes<HTMLParagraphElement>
  ) => (
    <p
      {...props}
      style={{ fontSize: `${fontSize}px` }}
      className="text-gray-200 text-base leading-relaxed my-4 whitespace-pre-line -ml-6"
    >
      {props.children}
    </p>
  );

  const CustomHr = () => <hr className="border-t border-white my-12" />;

  const components = {
    h2: CustomHeading,
    strong: CustomBold,
    p: CustomParagraph,
    hr: CustomHr,
  };

  return (
    <div className="min-h-screen bg-#121212] text-gray-100 px-6 py-12 relative">
      <Image
        src="/file.svg"
        alt="Church background"
        width={1920}
        height={1080}
        className="fixed inset-0 w-full h-full object-cover opacity-30 -z-10"
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 -z-10"></div>
      {/* Floating buttons */}
      <div className="fixed top-6 right-6 flex flex-col space-y-3 z-50">
        <button
          onClick={() => setFontSize((prev) => Math.min(prev + 2, 36))}
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl text-white
               bg-white/10 backdrop-blur-md border border-white/20
               shadow-lg  hover:scale-110 transition-transform duration-200"
        >
          +
        </button>

        <button
          onClick={() => setFontSize((prev) => Math.max(prev - 2, 12))}
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl text-white
               bg-white/10 backdrop-blur-md border border-white/20
               shadow-lg  hover:scale-110 transition-transform duration-200"
        >
          -
        </button>
      </div>

      <div className="max-w-5xl mx-auto backdrop-blur-lg bg-gradient-to-br from-black/0 to-gray-900/60 p-8 rounded-3xl border border-white/20 shadow-2xl">
        <article className="prose prose-invert prose-lg max-w-none leading-relaxed">
          <MDXRemote {...mdxSource} components={components} />
        </article>
      </div>
    </div>
  );
}
