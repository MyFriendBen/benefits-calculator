import { icons } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

const toPascalCase = (name: string) =>
  name.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');

export function Icon({ name, ...props }: IconProps) {
  const LucideIcon = icons[toPascalCase(name) as keyof typeof icons];

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in Lucide icons`);
    return null;
  }

  return <LucideIcon strokeWidth={1.5} {...props} />;
}
