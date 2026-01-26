/**
 * Campaign Filters Component
 * 
 * Filter controls for campaign discovery
 */

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { NICHES, BUDGET_RANGES, CampaignFilters as Filters } from "@/hooks/useCampaignDiscovery";

interface CampaignFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  totalCount: number;
  filteredCount: number;
}

export function CampaignFilters({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: CampaignFiltersProps) {
  const activeFiltersCount = 
    filters.niches.length + 
    (filters.budgetRange ? 1 : 0) + 
    (filters.deadlineRange ? 1 : 0);

  const handleNicheToggle = (niche: string) => {
    const newNiches = filters.niches.includes(niche)
      ? filters.niches.filter(n => n !== niche)
      : [...filters.niches, niche];
    
    onFiltersChange({ ...filters, niches: newNiches });
  };

  const handleBudgetChange = (value: string) => {
    if (value === "all") {
      onFiltersChange({ ...filters, budgetRange: null });
    } else {
      const range = BUDGET_RANGES.find(r => r.label === value);
      if (range) {
        onFiltersChange({ ...filters, budgetRange: { min: range.min, max: range.max } });
      }
    }
  };

  const handleDeadlineChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      deadlineRange: value === "all" ? null : value as "week" | "month" | "quarter" 
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      niches: [],
      budgetRange: null,
      deadlineRange: null,
      searchQuery: "",
    });
  };

  const getBudgetLabel = () => {
    if (!filters.budgetRange) return "All budgets";
    return BUDGET_RANGES.find(
      r => r.min === filters.budgetRange?.min && r.max === filters.budgetRange?.max
    )?.label || "All budgets";
  };

  const getDeadlineLabel = () => {
    switch (filters.deadlineRange) {
      case "week": return "This week";
      case "month": return "This month";
      case "quarter": return "This quarter";
      default: return "Any deadline";
    }
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search campaigns by title, description, or company..."
          value={filters.searchQuery}
          onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Niche filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              Niche
              {filters.niches.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {filters.niches.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium">Select niches</p>
              <div className="grid grid-cols-2 gap-2">
                {NICHES.map((niche) => (
                  <div key={niche} className="flex items-center space-x-2">
                    <Checkbox
                      id={`niche-${niche}`}
                      checked={filters.niches.includes(niche)}
                      onCheckedChange={() => handleNicheToggle(niche)}
                    />
                    <Label
                      htmlFor={`niche-${niche}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {niche}
                    </Label>
                  </div>
                ))}
              </div>
              {filters.niches.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => onFiltersChange({ ...filters, niches: [] })}
                >
                  Clear niches
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Budget filter */}
        <Select
          value={getBudgetLabel()}
          onValueChange={handleBudgetChange}
        >
          <SelectTrigger className="w-auto min-w-[140px] h-9">
            <SelectValue placeholder="Budget" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All budgets</SelectItem>
            {BUDGET_RANGES.map((range) => (
              <SelectItem key={range.label} value={range.label}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Deadline filter */}
        <Select
          value={filters.deadlineRange || "all"}
          onValueChange={handleDeadlineChange}
        >
          <SelectTrigger className="w-auto min-w-[140px] h-9">
            <SelectValue placeholder="Deadline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any deadline</SelectItem>
            <SelectItem value="week">This week</SelectItem>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="quarter">This quarter</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters button */}
        {(activeFiltersCount > 0 || filters.searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-1.5 text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" />
            Clear all
          </Button>
        )}

        {/* Results count */}
        <div className="ml-auto text-sm text-muted-foreground">
          Showing {filteredCount} of {totalCount} campaigns
        </div>
      </div>

      {/* Active filter badges */}
      {filters.niches.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.niches.map((niche) => (
            <Badge
              key={niche}
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
              onClick={() => handleNicheToggle(niche)}
            >
              {niche}
              <X className="w-3 h-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
