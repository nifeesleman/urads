import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AIDescriptionGeneratorProps {
  title: string;
  niches: string[];
  budget: string;
  requirements: string;
  onGenerated: (description: string) => void;
  disabled?: boolean;
}

export function AIDescriptionGenerator({
  title,
  niches,
  budget,
  requirements,
  onGenerated,
  disabled = false,
}: AIDescriptionGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a campaign title first");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-campaign-description`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            title,
            niches,
            budget,
            requirements,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate description");
      }

      onGenerated(data.description);
      toast.success("Description generated successfully!");
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate description"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={disabled || isGenerating || !title.trim()}
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Generate with AI
        </>
      )}
    </Button>
  );
}
