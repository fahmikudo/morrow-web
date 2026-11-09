import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Avatar,
  Button,
  Description,
  Dropdown,
  Label,
  Separator,
  useTheme,
} from '@heroui/react';
import { Check, Monitor, Moon, Settings2, Sun } from 'lucide-react';
import { ProfileDialog } from '@/features/profile/ProfileDialog';
import { useProfile } from '@/features/profile/queries';
import { initials } from '@/lib/initials';

const THEME_OPTIONS = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
] as const;

/** Single-workspace app: the account menu, not a workspace switcher. */
export function AccountMenu() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme('system');
  const { data: profile } = useProfile();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <Dropdown>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Account and preferences"
          className="ml-0.5"
        >
          <Avatar className="size-6">
            <Avatar.Fallback>{initials(profile?.name ?? 'Morrow')}</Avatar.Fallback>
          </Avatar>
        </Button>

        <Dropdown.Popover placement="bottom end" className="min-w-64">
          <Dropdown.Menu
            onAction={(key) => {
              if (key === 'light' || key === 'dark' || key === 'system') {
                setTheme(key);
                return;
              }
              if (key === 'profile') setIsProfileOpen(true);
              if (key === 'settings') navigate('/settings');
            }}
          >
            <Dropdown.Item id="profile" textValue="Profile">
              <Avatar className="size-6">
                <Avatar.Fallback>{initials(profile?.name ?? 'Morrow')}</Avatar.Fallback>
              </Avatar>
              <Label>Profile</Label>
              <Description>{profile?.email ?? 'Local profile'}</Description>
            </Dropdown.Item>
            <Dropdown.Item id="settings" textValue="Settings">
              <Settings2 className="size-4 shrink-0 text-muted" aria-hidden />
              <Label>Settings</Label>
            </Dropdown.Item>
            <Separator />
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;

              return (
                <Dropdown.Item key={option.id} id={option.id} textValue={option.label}>
                  <Icon className="size-4 shrink-0 text-muted" aria-hidden />
                  <Label>{option.label}</Label>
                  {theme === option.id ? (
                    <Check className="ml-auto size-4 shrink-0 text-accent" aria-hidden />
                  ) : null}
                </Dropdown.Item>
              );
            })}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <ProfileDialog isOpen={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </>
  );
}
