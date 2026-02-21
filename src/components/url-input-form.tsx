"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UrlInputFormProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

export function UrlInputForm({ onSubmit, disabled }: UrlInputFormProps) {
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">WordPress Migration Scanner</CardTitle>
        <CardDescription>
          Enter a WordPress site URL to discover its content types, taxonomies,
          and URL structure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={disabled}
            className="flex-1"
          />
          <Button type="submit" disabled={disabled || !url.trim()}>
            Scan
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
