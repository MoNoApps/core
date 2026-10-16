import type { LucideIcon } from "lucide-react";
import {
  Database,
  Box,
  CheckSquare,
  Users,
  Shield,
  UserCheck,
  Folder,
  FileText,
  Layers,
  Tag,
  Settings,
  Key,
  Lock,
  Mail,
  Server,
} from "lucide-react";
import config from "../config";
import type { ResourceConfig } from "../types/index";

export const DEFAULT_RESOURCE_ICON: LucideIcon = Database;

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  database: Database,
  box: Box,
  "check-square": CheckSquare,
  checksquare: CheckSquare,
  users: Users,
  shield: Shield,
  "user-check": UserCheck,
  usercheck: UserCheck,
  folder: Folder,
  "file-text": FileText,
  filetext: FileText,
  layers: Layers,
  tag: Tag,
  settings: Settings,
  key: Key,
  lock: Lock,
  mail: Mail,
  server: Server,
};

/**
 * Resolves the icon for a resource strictly from its config rule.
 * Avoids guessing programmatically: if no icon is defined in config or unrecognized, returns the default icon.
 */
export function getResourceIcon(resourceName: string): LucideIcon {
  const resourceConfig: ResourceConfig | undefined = (
    config.resources as Record<string, ResourceConfig> | undefined
  )?.[resourceName];

  const iconKey = resourceConfig?.icon?.trim().toLowerCase();
  if (iconKey && ICON_REGISTRY[iconKey]) {
    return ICON_REGISTRY[iconKey];
  }

  return DEFAULT_RESOURCE_ICON;
}
