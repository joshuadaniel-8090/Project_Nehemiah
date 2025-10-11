// import { Metadata } from "next";
// import { MDXRemote } from "next-mdx-remote/rsc";
// import fs from "fs";
// import path from "path";

// // Custom components with correct props typing
// const CustomHeading = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
//   <h2
//     {...props}
//     className="text-3xl md:text-base w-full font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 my-6 text-center"
//   >
//     {props.children}
//   </h2>
// );

// const CustomBold = (props: React.HTMLAttributes<HTMLSpanElement>) => (
//   <span {...props} className="font-bold text-2xl pb-5 block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 my-6 text-center">
//     {props.children}
//   </span>
// );

// const CustomParagraph = (props: React.HTMLAttributes<HTMLParagraphElement>) => (
//   <p
//     {...props}
//     className="text-gray-200 text-base leading-relaxed my-4 whitespace-pre-line -ml-6"
//   >
//     {props.children}
//   </p>
// );
// // Map MDX elements to custom components
// const components = {
//   h2: CustomHeading,
//   strong: CustomBold,
//   p: CustomParagraph,
// };

// export const metadata: Metadata = {
//   title: "Lyrics | Worship Night",
//   description: "All songs and lyrics for tomorrow’s event",
// };

// export default async function LyricsPage() {
//   const filePath = path.join(process.cwd(), "app/lyrics/lyrics.mdx");
//   const fileContent = fs.readFileSync(filePath, "utf8");

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-gray-100 px- py-12">
//       <div className="max-w-5xl mx-auto backdrop-blur-md bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl">
//         <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-center mb-10">
//           Worship Night Lyrics
//         </h1>

//         <article className="prose prose-invert prose-lg max-w-none leading-relaxed">
//           <MDXRemote source={fileContent} components={components} />
//         </article>
//       </div>
//     </div>
//   );
// }


// app/lyrics/page.tsx
import fs from "fs";
import path from "path";
import { serialize } from "next-mdx-remote/serialize";
import ClientLyrics from "./ClientLyrics";

export default async function LyricsPage() {
  const filePath = path.join(process.cwd(), "app/lyrics/lyrics.mdx");
  const mdxSource = fs.readFileSync(filePath, "utf8");

  const mdxSerialized = await serialize(mdxSource); // async is fine here

  return <ClientLyrics mdxSource={mdxSerialized} />;
}
