"use client";

import { Button } from "@visyx/ui/button";
import { TextEffect } from "@visyx/ui/text-effect";
import { motion } from "framer-motion";
import { ArrowLeft, Compass } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background selection:bg-primary/30">

      <div className="z-10 flex flex-col items-center justify-center space-y-8 px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
          className="relative"
        >
     
          <h1 className="text-[10rem] font-bold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/40 sm:text-[16rem]">
            404
          </h1>
        </motion.div>

        <div className="max-w-[600px] space-y-4">
          <TextEffect
            as="h2"
            preset="fade-in-blur"
            per="word"
            className="text-2xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Not in Directory
          </TextEffect>
          <TextEffect
            as="p"
            preset="fade"
            per="line"
            delay={0.5}
            className="text-muted-foreground sm:text-xl"
          >
            The page you are looking for might have been removed, had its name
            changed, or is temporarily unavailable. Let&apos;s get you back on
            track.
          </TextEffect>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="pt-8"
        >
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full px-8 text-base font-medium shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Return to Dashboard
            </Link>
          </Button>
        </motion.div>
      </div>

    </div>
  );
}
