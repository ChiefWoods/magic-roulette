"use client";

import { useSettings } from "@/providers/SettingsProvider";
import { useTheme } from "next-themes";
import { ReactNode, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Settings } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { capitalizeFirstLetter, cn } from "@/lib/utils";
import { toast } from "sonner";

const themeOptions = ["light", "dark", "system"];
const explorerOptions = ["solana-explorer", "solscan", "solanaFM", "orb"];
const priorityFeeOptions = ["low", "median", "high"];
const rpcTypeOptions = ["default", "custom"];

function ToggleGroupSingle({
  value,
  onValueChange,
  groupItems,
}: {
  value: any;
  onValueChange: (value: any) => void;
  groupItems: any[];
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => {
        if (val) onValueChange(val);
      }}
      className="justify-start"
      variant={"outline"}
      size={"sm"}
    >
      {groupItems.map((item) => (
        <ToggleGroupItem
          key={item}
          value={item}
          aria-label={item}
          className="cursor-pointer transition-colors"
        >
          {capitalizeFirstLetter(item)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function SettingsSection({
  header,
  children,
}: {
  header: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-base font-medium">{header}</h3>
      {children}
    </section>
  );
}

export function SettingsDropdown() {
  const { theme, setTheme } = useTheme();
  const {
    explorer,
    setExplorer,
    priorityFee,
    setPriorityFee,
    rpcType,
    setRpcType,
    customRpcUrl,
    setCustomRpcUrl,
  } = useSettings();
  const [tempCustomRpcUrl, setTempCustomRpcUrl] = useState(() => customRpcUrl);
  const [open, setOpen] = useState<boolean>(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className={cn("size-8 *:text-foreground cursor-pointer")}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-4" align="end">
        <div className="space-y-3">
          {/* Theme Section */}
          <SettingsSection header="Theme">
            <ToggleGroupSingle
              value={theme}
              onValueChange={setTheme}
              groupItems={themeOptions}
            />
          </SettingsSection>

          {/* Preferred Explorer Section */}
          <SettingsSection header="Preferred Explorer">
            <Select value={explorer} onValueChange={setExplorer}>
              <SelectTrigger className="min-w-[175px] cursor-pointer transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {explorerOptions.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    className={cn(
                      "cursor-pointer",
                      explorer === option && "font-medium"
                    )}
                  >
                    {option.split("-").map(capitalizeFirstLetter).join(" ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsSection>

          {/* Priority Fee Section */}
          <SettingsSection header="Priority Fee">
            <ToggleGroupSingle
              value={priorityFee}
              onValueChange={setPriorityFee}
              groupItems={priorityFeeOptions}
            />
          </SettingsSection>

          {/* RPC Section */}
          <SettingsSection header="RPC">
            <RadioGroup value={rpcType} onValueChange={setRpcType}>
              {rpcTypeOptions.map((option) => (
                <div
                  key={option}
                  className="flex w-fit cursor-pointer items-center space-x-2"
                >
                  <RadioGroupItem
                    value={option}
                    id={`rpc-${option}`}
                    className="cursor-pointer"
                  />
                  <Label htmlFor={`rpc-${option}`} className="cursor-pointer">
                    {capitalizeFirstLetter(option)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <div className="mt-3 flex items-center gap-2">
              <Input
                type="url"
                placeholder="Enter custom RPC URL"
                value={tempCustomRpcUrl}
                onChange={(e) => setTempCustomRpcUrl(e.target.value)}
                className="flex-1"
                disabled={rpcType !== "custom"}
              />
              <Button
                className="cursor-pointer"
                onClick={() => {
                  if (tempCustomRpcUrl !== "") {
                    try {
                      new URL(tempCustomRpcUrl);
                    } catch {
                      toast.error("Custom RPC URL not valid.");
                      return;
                    }
                  }

                  setCustomRpcUrl(tempCustomRpcUrl);
                  toast.message("Custom RPC URL saved.");
                }}
                size="sm"
                disabled={rpcType !== "custom"}
              >
                Save
              </Button>
            </div>
          </SettingsSection>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
