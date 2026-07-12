import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play } from "lucide-react";

interface NewsSpotlightProps {
  item: {
    id: string;
    title: string;
    body: string;
    media_url?: string | null;
    category?: string | null;
  };
}

export const NewsSpotlight: React.FC<NewsSpotlightProps> = ({ item }) => {
  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden mb-12 shadow-2xl group"
    >
      {item.media_url ? (
        <img
          src={item.media_url}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-start gap-4">
        {item.category && (
          <Badge
            variant="secondary"
            className="bg-primary text-primary-foreground border-none px-3 py-1 text-xs font-bold uppercase tracking-wider"
          >
            {item.category}
          </Badge>
        )}
        <h1 className="text-3xl md:text-4xl font-black text-white max-w-2xl leading-tight">
          {item.title}
        </h1>
        <p className="text-zinc-200 text-sm md:text-base max-w-xl line-clamp-2">{item.body}</p>
      </div>
    </motion.div>
  );
};
